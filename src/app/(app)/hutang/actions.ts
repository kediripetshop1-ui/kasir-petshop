"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";

type PaymentMethod = "cash" | "qris" | "transfer" | "debit";

/** Catat pelunasan (sebagian/penuh) untuk satu transaksi hutang. */
export async function bayarHutang(formData: FormData) {
  const user = await getCurrentUser();
  if (!user) throw new Error("Tidak terautentikasi");

  const saleId = String(formData.get("saleId") ?? "");
  const amount = Number(formData.get("amount") ?? 0);
  const method = String(formData.get("method") ?? "cash") as PaymentMethod;
  const note = String(formData.get("note") ?? "").trim() || null;

  if (!saleId || amount <= 0) return;

  const sale = await db.sale.findUnique({
    where: { id: saleId },
    include: { debtPayments: true },
  });
  if (!sale || sale.paymentType !== "hutang") return;

  const sudahDibayar = sale.paid + sale.debtPayments.reduce((sum, p) => sum + p.amount, 0);
  const sisa = sale.total - sudahDibayar;
  if (sisa <= 0) return;

  const jumlahBayar = Math.min(amount, sisa);

  await db.debtPayment.create({
    data: { saleId, amount: jumlahBayar, method, note },
  });

  revalidatePath("/hutang");
  revalidatePath("/laporan");
}
