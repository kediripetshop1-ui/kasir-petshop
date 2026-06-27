import { db } from "@/lib/db";
import { formatBaliDate, getBaliDayRange, getBaliDateKey } from "@/lib/datetime";

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
};

/** Hitung laporan harian (zona WITA). Default hari ini. */
export async function getDailyReport(dateKey?: string): Promise<DailyReport> {
  const { start, end } = getBaliDayRange(dateKey);

  const [sales, expenses] = await Promise.all([
    db.sale.findMany({
      where: { createdAt: { gte: start, lte: end } },
      include: { items: { include: { product: true } } },
    }),
    db.expense.findMany({ where: { createdAt: { gte: start, lte: end } } }),
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

  for (const sale of sales) {
    const key = (sale.paymentType in ringkasan ? sale.paymentType : "cash") as keyof typeof ringkasan;
    ringkasan[key].count += 1;
    ringkasan[key].total += sale.total;
    totalPemasukan += sale.total;
    for (const item of sale.items) {
      totalItemTerjual += item.qty;
      totalModal += item.product.costPrice * item.qty;
    }
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
  ].join("\n");
}

/** Daftar produk stok menipis (stock <= minStock). */
export async function getLowStockText(): Promise<string> {
  const products = await db.product.findMany({ orderBy: { stock: "asc" } });
  const low = products.filter((p) => p.minStock > 0 && p.stock <= p.minStock);
  if (low.length === 0) return "✅ Semua stok aman, tidak ada yang menipis.";
  const lines = low.map((p) => `• ${p.name} — sisa ${p.stock} ${p.unit} (min ${p.minStock})`);
  return `*STOK MENIPIS* (${low.length} produk)\n` + lines.join("\n");
}
