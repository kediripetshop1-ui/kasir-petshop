"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { sendText, normalizeNumber } from "@/lib/wa";
import { getDailyReport, formatDailyReportText } from "@/lib/reports";

type PaymentMethod = "cash" | "qris" | "transfer" | "debit" | "hutang";

/**
 * Hapus transaksi penjualan: stok dikembalikan, log stok & pelunasan hutang
 * terkait ikut dihapus. Untuk membatalkan transaksi yang salah input.
 */
export async function deleteSale(saleId: string) {
  const user = await getCurrentUser();
  if (!user) throw new Error("Tidak terautentikasi");

  const sale = await db.sale.findUnique({ where: { id: saleId }, include: { items: true } });
  if (!sale) return;

  await db.$transaction(async (tx) => {
    for (const item of sale.items) {
      await tx.product.update({
        where: { id: item.productId },
        data: { stock: { increment: item.qty } },
      });
    }
    await tx.stockLog.deleteMany({ where: { reason: "penjualan", note: sale.invoiceNo } });
    await tx.debtPayment.deleteMany({ where: { saleId } });
    await tx.saleItem.deleteMany({ where: { saleId } });
    await tx.sale.delete({ where: { id: saleId } });
  });

  revalidatePath("/laporan");
  revalidatePath("/laporan-cetak");
  revalidatePath("/produk");
  revalidatePath("/kasir");
  revalidatePath("/hutang");
}

/**
 * Edit data transaksi (metode bayar, diskon, jumlah bayar, nama pelanggan).
 * Item/qty barang tidak bisa diedit di sini — hapus & buat ulang transaksinya
 * lewat Kasir kalau barangnya yang salah.
 */
export async function updateSale(saleId: string, formData: FormData) {
  const user = await getCurrentUser();
  if (!user) throw new Error("Tidak terautentikasi");

  const sale = await db.sale.findUnique({ where: { id: saleId }, include: { debtPayments: true } });
  if (!sale) throw new Error("Transaksi tidak ditemukan");

  const paymentType = String(formData.get("paymentType") ?? "cash") as PaymentMethod;
  const discount = Number(formData.get("discount") ?? 0);
  const customerName = String(formData.get("customerName") ?? "").trim() || null;
  let paid = Number(formData.get("paid") ?? 0);

  if (sale.debtPayments.length > 0 && paymentType !== "hutang") {
    throw new Error("Tidak bisa ubah metode bayar karena sudah ada pelunasan hutang tercatat. Hapus pelunasannya dulu di halaman Hutang.");
  }
  if (paymentType === "hutang" && !customerName) {
    throw new Error("Nama pelanggan wajib diisi untuk transaksi hutang");
  }

  const total = Math.max(sale.subtotal - discount, 0);
  if (paymentType === "hutang") {
    paid = 0;
  } else if (paid < total) {
    throw new Error("Pembayaran kurang dari total");
  }
  const change = Math.max(paid - total, 0);

  await db.sale.update({
    where: { id: saleId },
    data: { paymentType, discount, total, paid, change, customerName },
  });

  revalidatePath("/laporan");
  revalidatePath("/laporan-cetak");
  revalidatePath("/hutang");
  redirect("/laporan");
}

/** Kirim laporan harian hari ini ke semua nomor owner via WhatsApp. */
export async function kirimLaporanWA(): Promise<{ ok: boolean; message: string }> {
  const user = await getCurrentUser();
  if (!user) return { ok: false, message: "Tidak terautentikasi." };

  const numbers = (process.env.WA_OWNER_NUMBERS || "")
    .split(",")
    .map((s) => normalizeNumber(s.trim()))
    .filter(Boolean);

  if (numbers.length === 0) {
    return { ok: false, message: "WA_OWNER_NUMBERS belum diset di environment." };
  }

  const report = await getDailyReport();
  const text = formatDailyReportText(report);

  const results = await Promise.allSettled(numbers.map((n) => sendText(n, text)));
  const sukses = results.filter((r) => r.status === "fulfilled").length;
  const gagal = results.length - sukses;

  if (sukses === 0) return { ok: false, message: "Gagal mengirim ke semua nomor. Cek token/koneksi WA." };
  return { ok: true, message: `Laporan terkirim ke ${sukses} nomor${gagal ? `, ${gagal} gagal` : ""}.` };
}
