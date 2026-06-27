import { db } from "@/lib/db";
import { formatBaliDateTime, getBaliDayRange } from "@/lib/datetime";
import { addExpense, deleteExpense } from "./actions";

function formatRupiah(value: number) {
  return new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }).format(value);
}

export default async function PengeluaranPage() {
  const { start, end } = getBaliDayRange();

  const [expensesHariIni, expenses] = await Promise.all([
    db.expense.findMany({ where: { createdAt: { gte: start, lte: end } } }),
    db.expense.findMany({ orderBy: { createdAt: "desc" }, take: 50 }),
  ]);

  const totalHariIni = expensesHariIni.reduce((sum, e) => sum + e.amount, 0);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Pengeluaran</h1>
        <p className="text-sm text-gray-500">
          Total pengeluaran hari ini: <span className="font-semibold text-red-600">{formatRupiah(totalHariIni)}</span>
        </p>
      </div>

      <form action={addExpense} className="grid grid-cols-1 gap-3 rounded-lg border border-gray-200 bg-white p-4 shadow-sm md:grid-cols-4">
        <input
          name="amount"
          type="number"
          min={1}
          placeholder="Jumlah pengeluaran"
          required
          className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-gray-900 outline-none focus:border-emerald-500 md:col-span-1"
        />
        <input
          name="note"
          placeholder="Catatan (opsional, misal: beli plastik)"
          className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-gray-900 outline-none focus:border-emerald-500 md:col-span-2"
        />
        <button type="submit" className="rounded-lg bg-emerald-600 px-3 py-2 font-medium text-white hover:bg-emerald-700">
          Tambah Pengeluaran
        </button>
      </form>

      <div className="overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-gray-500">
            <tr>
              <th className="px-3 py-2 text-left font-medium">Waktu</th>
              <th className="px-3 py-2 text-left font-medium">Catatan</th>
              <th className="px-3 py-2 text-left font-medium">Dicatat oleh</th>
              <th className="px-3 py-2 text-right font-medium">Jumlah</th>
              <th className="px-3 py-2"></th>
            </tr>
          </thead>
          <tbody>
            {expenses.map((e) => (
              <tr key={e.id} className="border-t border-gray-100 text-gray-700">
                <td className="px-3 py-2 text-gray-500">{formatBaliDateTime(e.createdAt)}</td>
                <td className="px-3 py-2 text-gray-900">{e.note ?? "-"}</td>
                <td className="px-3 py-2 text-gray-500">{e.cashierName}</td>
                <td className="px-3 py-2 text-right text-red-600">{formatRupiah(e.amount)}</td>
                <td className="px-3 py-2 text-right">
                  <form action={async () => { "use server"; await deleteExpense(e.id); }}>
                    <button type="submit" className="text-red-500 hover:text-red-600">Hapus</button>
                  </form>
                </td>
              </tr>
            ))}
            {expenses.length === 0 && (
              <tr>
                <td colSpan={5} className="px-3 py-6 text-center text-gray-400">Belum ada pengeluaran.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
