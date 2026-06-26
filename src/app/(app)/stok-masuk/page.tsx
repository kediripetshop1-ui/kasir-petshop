import { db } from "@/lib/db";
import { addStock } from "./actions";

export default async function StokMasukPage() {
  const [products, logs] = await Promise.all([
    db.product.findMany({ orderBy: { name: "asc" } }),
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
        <h1 className="text-2xl font-bold text-white">Stok Masuk</h1>
        <p className="text-sm text-neutral-400">
          Input manual untuk sekarang. Fase berikutnya: foto nota otomatis dibaca AI/OCR.
        </p>
      </div>

      <form action={addStock} className="grid grid-cols-1 gap-3 rounded-xl border border-neutral-800 bg-neutral-900 p-4 md:grid-cols-4">
        <select name="productId" required className="rounded-lg border border-neutral-700 bg-neutral-800 px-3 py-2 text-white md:col-span-2">
          <option value="">Pilih produk</option>
          {products.map((p) => (
            <option key={p.id} value={p.id}>{p.name} ({p.sku})</option>
          ))}
        </select>
        <input name="qty" type="number" min={1} placeholder="Jumlah masuk" required className="rounded-lg border border-neutral-700 bg-neutral-800 px-3 py-2 text-white" />
        <input name="note" placeholder="Catatan / no. nota (opsional)" className="rounded-lg border border-neutral-700 bg-neutral-800 px-3 py-2 text-white" />
        <button type="submit" className="rounded-lg bg-emerald-600 px-3 py-2 font-medium text-white hover:bg-emerald-500 md:col-span-4">
          Tambah Stok
        </button>
      </form>

      <div>
        <h2 className="mb-2 text-lg font-semibold text-white">Riwayat Stok Masuk</h2>
        <div className="overflow-hidden rounded-xl border border-neutral-800">
          <table className="w-full text-sm">
            <thead className="bg-neutral-900 text-neutral-400">
              <tr>
                <th className="px-3 py-2 text-left">Waktu</th>
                <th className="px-3 py-2 text-left">Produk</th>
                <th className="px-3 py-2 text-right">Jumlah</th>
                <th className="px-3 py-2 text-left">Catatan</th>
              </tr>
            </thead>
            <tbody>
              {logs.map((log) => (
                <tr key={log.id} className="border-t border-neutral-800 text-neutral-200">
                  <td className="px-3 py-2 text-neutral-400">{log.createdAt.toLocaleString("id-ID")}</td>
                  <td className="px-3 py-2">{log.product.name}</td>
                  <td className="px-3 py-2 text-right text-emerald-400">+{log.change}</td>
                  <td className="px-3 py-2 text-neutral-400">{log.note ?? "-"}</td>
                </tr>
              ))}
              {logs.length === 0 && (
                <tr>
                  <td colSpan={4} className="px-3 py-6 text-center text-neutral-500">Belum ada riwayat.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
