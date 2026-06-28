import { db } from "@/lib/db";
import { productDisplayName } from "@/lib/product";
import { addStock } from "./actions";

export default async function StokMasukPage() {
  const [products, logs] = await Promise.all([
    db.product.findMany({ where: { archived: false }, orderBy: { name: "asc" } }),
    db.stockLog.findMany({
      where: { reason: "nota_masuk" },
      include: { product: true },
      orderBy: { createdAt: "desc" },
      take: 20,
    }),
  ]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Stok Masuk</h1>
        <p className="text-sm text-gray-500">
          Input manual untuk sekarang. Fase berikutnya: foto nota otomatis dibaca AI/OCR.
        </p>
      </div>

      <form action={addStock} className="grid grid-cols-1 gap-3 rounded-lg border border-gray-200 bg-white p-4 shadow-sm md:grid-cols-4">
        <select name="productId" required className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-gray-900 outline-none focus:border-emerald-500 md:col-span-2">
          <option value="">Pilih produk</option>
          {products.map((p) => (
            <option key={p.id} value={p.id}>{productDisplayName(p)} ({p.sku})</option>
          ))}
        </select>
        <input name="qty" type="number" min={1} placeholder="Jumlah masuk" required className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-gray-900 outline-none focus:border-emerald-500" />
        <input name="note" placeholder="Catatan / no. nota (opsional)" className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-gray-900 outline-none focus:border-emerald-500" />
        <button type="submit" className="rounded-lg bg-emerald-600 px-3 py-2 font-medium text-white hover:bg-emerald-700 md:col-span-4">
          Tambah Stok
        </button>
      </form>

      <div>
        <h2 className="mb-2 text-lg font-semibold text-gray-900">Riwayat Stok Masuk</h2>
        <div className="overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-gray-500">
              <tr>
                <th className="px-3 py-2 text-left font-medium">Waktu</th>
                <th className="px-3 py-2 text-left font-medium">Produk</th>
                <th className="px-3 py-2 text-right font-medium">Jumlah</th>
                <th className="px-3 py-2 text-left font-medium">Catatan</th>
              </tr>
            </thead>
            <tbody>
              {logs.map((log) => (
                <tr key={log.id} className="border-t border-gray-100 text-gray-700">
                  <td className="px-3 py-2 text-gray-500">{log.createdAt.toLocaleString("id-ID")}</td>
                  <td className="px-3 py-2 text-gray-900">{productDisplayName(log.product)}</td>
                  <td className="px-3 py-2 text-right text-emerald-600">+{log.change}</td>
                  <td className="px-3 py-2 text-gray-500">{log.note ?? "-"}</td>
                </tr>
              ))}
              {logs.length === 0 && (
                <tr>
                  <td colSpan={4} className="px-3 py-6 text-center text-gray-400">Belum ada riwayat.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
