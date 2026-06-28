import { db } from "@/lib/db";
import { formatBaliDate, getBaliDayRange, getBaliDateKey } from "@/lib/datetime";

/** Ambang stok menipis berlaku sama untuk semua produk (tidak per-produk lagi). */
export const LOW_STOCK_THRESHOLD = 5;

function rp(value: number) {
  return "Rp" + new Intl.NumberFormat("id-ID", { maximumFractionDigits: 0 }).format(value);
}

export type DailyReport = {
  dateKey: string;
  tanggal: string;
  ringkasan: Record<"cash" | "qris" | "transfer" | "debit", { count: number; total: number }>;
  totalPemasukan: number;
  totalModal: number;
  totalPengeluaran: number;
  untungBersih: number;
  totalItemTerjual: number;
  jumlahTransaksi: number;
  totalHutangBaru: number;
  totalPelunasanHutang: number;
};

/**
 * Hitung laporan harian (zona WITA). Default hari ini.
 * Transaksi "hutang" tidak dihitung sebagai pemasukan saat penjualan (uang belum masuk),
 * tapi modal/stok sudah keluar sehingga tetap mengurangi untung bersih hari itu.
 * Pelunasan hutang (DebtPayment) dihitung sebagai pemasukan pada hari pelunasan terjadi,
 * sesuai metode bayar yang dipakai saat melunasi — meski transaksi aslinya di hari lain.
 */
export async function getDailyReport(dateKey?: string): Promise<DailyReport> {
  const { start, end } = getBaliDayRange(dateKey);

  const [sales, expenses, debtPayments] = await Promise.all([
    db.sale.findMany({
      where: { createdAt: { gte: start, lte: end } },
      include: { items: { include: { product: true } } },
    }),
    db.expense.findMany({ where: { createdAt: { gte: start, lte: end } } }),
    db.debtPayment.findMany({ where: { createdAt: { gte: start, lte: end } } }),
  ]);

  const ringkasan = {
    cash: { count: 0, total: 0 },
    qris: { count: 0, total: 0 },
    transfer: { count: 0, total: 0 },
    debit: { count: 0, total: 0 },
  };

  let totalPemasukan = 0;
  let totalModal = 0;
  let totalItemTerjual = 0;
  let totalHutangBaru = 0;

  for (const sale of sales) {
    for (const item of sale.items) {
      totalItemTerjual += item.qty;
      totalModal += item.product.costPrice * item.qty;
    }

    if (sale.paymentType === "hutang") {
      totalHutangBaru += sale.total;
      continue;
    }

    const key = (sale.paymentType in ringkasan ? sale.paymentType : "cash") as keyof typeof ringkasan;
    ringkasan[key].count += 1;
    ringkasan[key].total += sale.total;
    totalPemasukan += sale.total;
  }

  let totalPelunasanHutang = 0;
  for (const payment of debtPayments) {
    const key = (payment.method in ringkasan ? payment.method : "cash") as keyof typeof ringkasan;
    ringkasan[key].count += 1;
    ringkasan[key].total += payment.amount;
    totalPemasukan += payment.amount;
    totalPelunasanHutang += payment.amount;
  }

  const totalPengeluaran = expenses.reduce((sum, e) => sum + e.amount, 0);

  return {
    dateKey: dateKey ?? getBaliDateKey(new Date()),
    tanggal: formatBaliDate(start),
    ringkasan,
    totalPemasukan,
    totalModal,
    totalPengeluaran,
    untungBersih: totalPemasukan - totalModal - totalPengeluaran,
    totalItemTerjual,
    jumlahTransaksi: sales.length,
    totalHutangBaru,
    totalPelunasanHutang,
  };
}

/** Format laporan harian jadi teks WhatsApp. */
export function formatDailyReportText(r: DailyReport): string {
  return [
    `*LAPORAN HARIAN — Kediri Petshop*`,
    `${r.tanggal}`,
    ``,
    `Cash     : ${rp(r.ringkasan.cash.total)} (${r.ringkasan.cash.count}x)`,
    `QRIS     : ${rp(r.ringkasan.qris.total)} (${r.ringkasan.qris.count}x)`,
    `Transfer : ${rp(r.ringkasan.transfer.total)} (${r.ringkasan.transfer.count}x)`,
    `Debit    : ${rp(r.ringkasan.debit.total)} (${r.ringkasan.debit.count}x)`,
    ``,
    `*Pemasukan*   : ${rp(r.totalPemasukan)}`,
    `Modal         : ${rp(r.totalModal)}`,
    `Pengeluaran   : ${rp(r.totalPengeluaran)}`,
    `*UNTUNG BERSIH*: ${rp(r.untungBersih)}`,
    ``,
    `Item terjual  : ${r.totalItemTerjual} pcs`,
    `Transaksi     : ${r.jumlahTransaksi}`,
    ...(r.totalHutangBaru > 0 ? [`Hutang baru   : ${rp(r.totalHutangBaru)}`] : []),
    ...(r.totalPelunasanHutang > 0 ? [`Pelunasan hutang: ${rp(r.totalPelunasanHutang)}`] : []),
  ].join("\n");
}

/** Daftar produk stok menipis (stock <= LOW_STOCK_THRESHOLD). */
export async function getLowStockText(): Promise<string> {
  const products = await db.product.findMany({ where: { archived: false }, orderBy: { stock: "asc" } });
  const low = products.filter((p) => p.stock <= LOW_STOCK_THRESHOLD);
  if (low.length === 0) return "✅ Semua stok aman, tidak ada yang menipis.";
  const lines = low.map((p) => `• ${p.name} — sisa ${p.stock} ${p.unit}`);
  return `*STOK MENIPIS* (${low.length} produk, sisa ≤ ${LOW_STOCK_THRESHOLD})\n` + lines.join("\n");
}
