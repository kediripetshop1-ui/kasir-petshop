import Link from "next/link";
import { db } from "@/lib/db";

function formatRupiah(value: number) {
  return new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }).format(value);
}

export default async function LaporanPage() {
  const sales = await db.sale.findMany({
    orderBy: { createdAt: "desc" },
    take: 50,
    include: { items: true },
  });

  const totalHariIni = sales
    .filter((s) => s.createdAt.toDateString() === new Date().toDateString())
    .reduce((sum, s) => sum + s.total, 0);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Laporan Penjualan</h1>
        <p className="text-sm text-neutral-400">Total hari ini: <span className="font-semibold text-emerald-400">{formatRupiah(totalHariIni)}</span></p>
      </div>

      <div className="overflow-hidden rounded-xl border border-neutral-800">
        <table className="w-full text-sm">
          <thead className="bg-neutral-900 text-neutral-400">
            <tr>
              <th className="px-3 py-2 text-left">Invoice</th>
              <th className="px-3 py-2 text-left">Waktu</th>
              <th className="px-3 py-2 text-left">Kasir</th>
              <th className="px-3 py-2 text-right">Item</th>
              <th className="px-3 py-2 text-right">Total</th>
              <th className="px-3 py-2"></th>
            </tr>
          </thead>
          <tbody>
            {sales.map((s) => (
              <tr key={s.id} className="border-t border-neutral-800 text-neutral-200">
                <td className="px-3 py-2">{s.invoiceNo}</td>
                <td className="px-3 py-2 text-neutral-400">{s.createdAt.toLocaleString("id-ID")}</td>
                <td className="px-3 py-2">{s.cashierName}</td>
                <td className="px-3 py-2 text-right">{s.items.length}</td>
                <td className="px-3 py-2 text-right">{formatRupiah(s.total)}</td>
                <td className="px-3 py-2 text-right">
                  <Link href={`/struk/${s.id}`} className="text-emerald-400 hover:text-emerald-300">Lihat Struk</Link>
                </td>
              </tr>
            ))}
            {sales.length === 0 && (
              <tr>
                <td colSpan={6} className="px-3 py-6 text-center text-neutral-500">Belum ada transaksi.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
