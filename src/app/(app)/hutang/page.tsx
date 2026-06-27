import Link from "next/link";
import { db } from "@/lib/db";
import { formatBaliDateTime } from "@/lib/datetime";
import { bayarHutang } from "./actions";

function formatRupiah(value: number) {
  return new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }).format(value);
}

export default async function HutangPage() {
  const sales = await db.sale.findMany({
    where: { paymentType: "hutang" },
    include: { debtPayments: true },
    orderBy: { createdAt: "desc" },
  });

  const withSisa = sales.map((s) => {
    const sudahDibayar = s.paid + s.debtPayments.reduce((sum, p) => sum + p.amount, 0);
    return { sale: s, sudahDibayar, sisa: s.total - sudahDibayar };
  });

  const belumLunas = withSisa.filter((s) => s.sisa > 0);
  const lunas = withSisa.filter((s) => s.sisa <= 0);
  const totalPiutang = belumLunas.reduce((sum, s) => sum + s.sisa, 0);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Hutang Pelanggan</h1>
        <p className="text-sm text-gray-500">
          Total piutang belum lunas: <span className="font-semibold text-red-600">{formatRupiah(totalPiutang)}</span>
        </p>
      </div>

      <div className="overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-gray-500">
            <tr>
              <th className="px-3 py-2 text-left font-medium">Invoice</th>
              <th className="px-3 py-2 text-left font-medium">Tanggal</th>
              <th className="px-3 py-2 text-left font-medium">Pelanggan</th>
              <th className="px-3 py-2 text-right font-medium">Total</th>
              <th className="px-3 py-2 text-right font-medium">Sisa</th>
              <th className="px-3 py-2 text-left font-medium">Bayar Sebagian/Lunas</th>
            </tr>
          </thead>
          <tbody>
            {belumLunas.map(({ sale, sisa }) => (
              <tr key={sale.id} className="border-t border-gray-100 text-gray-700">
                <td className="px-3 py-2">
                  <Link href={`/struk/${sale.id}`} className="text-emerald-600 hover:text-emerald-700">{sale.invoiceNo}</Link>
                </td>
                <td className="px-3 py-2 text-gray-500">{formatBaliDateTime(sale.createdAt)}</td>
                <td className="px-3 py-2 text-gray-900">{sale.customerName ?? "-"}</td>
                <td className="px-3 py-2 text-right">{formatRupiah(sale.total)}</td>
                <td className="px-3 py-2 text-right font-medium text-red-600">{formatRupiah(sisa)}</td>
                <td className="px-3 py-2">
                  <form action={bayarHutang} className="flex flex-wrap items-center gap-2">
                    <input type="hidden" name="saleId" value={sale.id} />
                    <input
                      name="amount"
                      type="number"
                      min={1}
                      max={sisa}
                      defaultValue={sisa}
                      required
                      className="w-28 rounded-md border border-gray-300 bg-white px-2 py-1 text-right text-gray-900"
                    />
                    <select name="method" className="rounded-md border border-gray-300 bg-white px-2 py-1 text-gray-700">
                      <option value="cash">Cash</option>
                      <option value="qris">QRIS</option>
                      <option value="transfer">Transfer</option>
                      <option value="debit">Debit</option>
                    </select>
                    <button type="submit" className="rounded-md bg-emerald-600 px-3 py-1 font-medium text-white hover:bg-emerald-700">
                      Bayar
                    </button>
                  </form>
                </td>
              </tr>
            ))}
            {belumLunas.length === 0 && (
              <tr>
                <td colSpan={6} className="px-3 py-6 text-center text-gray-400">Tidak ada hutang yang belum lunas. 🎉</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {lunas.length > 0 && (
        <div>
          <h2 className="mb-2 text-lg font-semibold text-gray-900">Riwayat Lunas</h2>
          <div className="overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 text-gray-500">
                <tr>
                  <th className="px-3 py-2 text-left font-medium">Invoice</th>
                  <th className="px-3 py-2 text-left font-medium">Tanggal</th>
                  <th className="px-3 py-2 text-left font-medium">Pelanggan</th>
                  <th className="px-3 py-2 text-right font-medium">Total</th>
                </tr>
              </thead>
              <tbody>
                {lunas.map(({ sale }) => (
                  <tr key={sale.id} className="border-t border-gray-100 text-gray-700">
                    <td className="px-3 py-2">
                      <Link href={`/struk/${sale.id}`} className="text-emerald-600 hover:text-emerald-700">{sale.invoiceNo}</Link>
                    </td>
                    <td className="px-3 py-2 text-gray-500">{formatBaliDateTime(sale.createdAt)}</td>
                    <td className="px-3 py-2 text-gray-900">{sale.customerName ?? "-"}</td>
                    <td className="px-3 py-2 text-right">{formatRupiah(sale.total)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
