import Link from "next/link";
import { db } from "@/lib/db";
import { formatBaliDateTime } from "@/lib/datetime";
import { getDailyReport } from "@/lib/reports";
import KirimWaButton from "./kirim-wa-button";
import DeleteSaleButton from "./delete-sale-button";

function formatRupiah(value: number) {
  return new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }).format(value);
}

function paymentLabel(method: string) {
  if (method === "qris") return "QRIS";
  if (method === "transfer") return "Transfer";
  if (method === "debit") return "Debit";
  if (method === "hutang") return "Hutang";
  return "Cash";
}

export default async function LaporanPage() {
  const [sales, report] = await Promise.all([
    db.sale.findMany({
      orderBy: { createdAt: "desc" },
      take: 50,
      include: { items: true },
    }),
    getDailyReport(),
  ]);

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Laporan Penjualan</h1>
          <p className="text-sm text-gray-500">
            Pemasukan hari ini: <span className="font-semibold text-emerald-600">{formatRupiah(report.totalPemasukan)}</span>
            {" · "}Pengeluaran: <span className="font-semibold text-red-600">{formatRupiah(report.totalPengeluaran)}</span>
            {report.totalHutangBaru > 0 && (
              <>
                {" · "}Hutang baru: <span className="font-semibold text-amber-600">{formatRupiah(report.totalHutangBaru)}</span>
              </>
            )}
          </p>
        </div>
        <div className="flex items-start gap-2">
          <KirimWaButton />
          <Link
            href="/laporan-cetak"
            target="_blank"
            className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700"
          >
            Cetak Laporan Harian
          </Link>
        </div>
      </div>

      <div>
        <h2 className="mb-2 text-lg font-semibold text-gray-900">Ringkasan Tutup Shift (Hari Ini)</h2>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
            <p className="text-sm text-gray-500">Cash</p>
            <p className="mt-1 text-xl font-bold text-gray-900">{formatRupiah(report.ringkasan.cash.total)}</p>
            <p className="text-xs text-gray-400">{report.ringkasan.cash.count} transaksi</p>
          </div>
          <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
            <p className="text-sm text-gray-500">QRIS</p>
            <p className="mt-1 text-xl font-bold text-gray-900">{formatRupiah(report.ringkasan.qris.total)}</p>
            <p className="text-xs text-gray-400">{report.ringkasan.qris.count} transaksi</p>
          </div>
          <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
            <p className="text-sm text-gray-500">Transfer</p>
            <p className="mt-1 text-xl font-bold text-gray-900">{formatRupiah(report.ringkasan.transfer.total)}</p>
            <p className="text-xs text-gray-400">{report.ringkasan.transfer.count} transaksi</p>
          </div>
          <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
            <p className="text-sm text-gray-500">Debit</p>
            <p className="mt-1 text-xl font-bold text-gray-900">{formatRupiah(report.ringkasan.debit.total)}</p>
            <p className="text-xs text-gray-400">{report.ringkasan.debit.count} transaksi</p>
          </div>
        </div>
        {report.totalPelunasanHutang > 0 && (
          <p className="mt-2 text-sm text-gray-500">
            Termasuk pelunasan hutang hari ini: <span className="font-medium text-emerald-600">{formatRupiah(report.totalPelunasanHutang)}</span>{" "}
            (<Link href="/hutang" className="text-emerald-600 hover:underline">lihat detail</Link>)
          </p>
        )}
      </div>

      <div className="overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-gray-500">
            <tr>
              <th className="px-3 py-2 text-left font-medium">Invoice</th>
              <th className="px-3 py-2 text-left font-medium">Waktu</th>
              <th className="px-3 py-2 text-left font-medium">Kasir</th>
              <th className="px-3 py-2 text-left font-medium">Metode</th>
              <th className="px-3 py-2 text-right font-medium">Item</th>
              <th className="px-3 py-2 text-right font-medium">Total</th>
              <th className="px-3 py-2"></th>
            </tr>
          </thead>
          <tbody>
            {sales.map((s) => (
              <tr key={s.id} className="border-t border-gray-100 text-gray-700">
                <td className="px-3 py-2">{s.invoiceNo}</td>
                <td className="px-3 py-2 text-gray-500">{formatBaliDateTime(s.createdAt)}</td>
                <td className="px-3 py-2 text-gray-900">{s.cashierName}</td>
                <td className="px-3 py-2">{paymentLabel(s.paymentType)}</td>
                <td className="px-3 py-2 text-right">{s.items.length}</td>
                <td className="px-3 py-2 text-right">{formatRupiah(s.total)}</td>
                <td className="px-3 py-2 text-right">
                  <div className="flex justify-end gap-3">
                    <Link href={`/struk/${s.id}`} className="text-emerald-600 hover:text-emerald-700">Struk</Link>
                    <Link href={`/laporan/${s.id}/edit`} className="text-blue-600 hover:text-blue-700">Edit</Link>
                    <DeleteSaleButton saleId={s.id} invoiceNo={s.invoiceNo} />
                  </div>
                </td>
              </tr>
            ))}
            {sales.length === 0 && (
              <tr>
                <td colSpan={7} className="px-3 py-6 text-center text-gray-400">Belum ada transaksi.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
