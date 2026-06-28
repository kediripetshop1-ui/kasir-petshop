import { db } from "@/lib/db";
import { LOW_STOCK_THRESHOLD } from "@/lib/reports";
import { createProduct, deleteProduct } from "./actions";

function formatRupiah(value: number) {
  return new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }).format(value);
}

export default async function ProdukPage() {
  const [products, categories] = await Promise.all([
    db.product.findMany({ where: { archived: false }, include: { category: true }, orderBy: { name: "asc" } }),
    db.category.findMany({ orderBy: { name: "asc" } }),
  ]);

  const perluRestok = products.filter((p) => p.stock <= LOW_STOCK_THRESHOLD).sort((a, b) => a.stock - b.stock);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Produk</h1>
        <p className="text-sm text-gray-500">
          Tips: isi kolom SKU dengan nomor barcode produk (lihat di kemasan) supaya bisa langsung di-scan di halaman Kasir.
        </p>
      </div>

      {perluRestok.length > 0 && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-4">
          <h2 className="mb-2 font-semibold text-red-700">
            ⚠️ Perlu Direstok (sisa ≤ {LOW_STOCK_THRESHOLD}) — {perluRestok.length} produk
          </h2>
          <ul className="grid grid-cols-1 gap-1 text-sm text-red-700 sm:grid-cols-2 lg:grid-cols-3">
            {perluRestok.map((p) => (
              <li key={p.id} className="flex justify-between rounded-md bg-white px-3 py-1.5 shadow-sm">
                <span>{p.name}</span>
                <span className="font-semibold">{p.stock} {p.unit}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      <form
        action={createProduct}
        className="grid grid-cols-2 gap-3 rounded-lg border border-gray-200 bg-white p-4 shadow-sm md:grid-cols-4"
      >
        <input name="sku" placeholder="SKU / No. Barcode" required className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-gray-900 outline-none focus:border-emerald-500" />
        <input name="name" placeholder="Nama produk" required className="col-span-2 rounded-lg border border-gray-300 bg-white px-3 py-2 text-gray-900 outline-none focus:border-emerald-500" />
        <select name="categoryId" className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-gray-900 outline-none focus:border-emerald-500">
          <option value="">Tanpa kategori</option>
          {categories.map((c) => (
            <option key={c.id} value={c.id}>{c.name}</option>
          ))}
        </select>
        <input name="unit" placeholder="Satuan (pcs/kg)" defaultValue="pcs" className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-gray-900 outline-none focus:border-emerald-500" />
        <input name="costPrice" type="number" placeholder="Harga beli" className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-gray-900 outline-none focus:border-emerald-500" />
        <input name="sellPrice" type="number" placeholder="Harga jual" required className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-gray-900 outline-none focus:border-emerald-500" />
        <input name="stock" type="number" placeholder="Stok awal" defaultValue={0} className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-gray-900 outline-none focus:border-emerald-500" />
        <button type="submit" className="col-span-2 rounded-lg bg-emerald-600 px-3 py-2 font-medium text-white hover:bg-emerald-700 md:col-span-1">
          Tambah Produk
        </button>
      </form>

      <div className="overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-gray-500">
            <tr>
              <th className="px-3 py-2 text-left font-medium">SKU</th>
              <th className="px-3 py-2 text-left font-medium">Nama</th>
              <th className="px-3 py-2 text-left font-medium">Kategori</th>
              <th className="px-3 py-2 text-right font-medium">Harga Jual</th>
              <th className="px-3 py-2 text-right font-medium">Stok</th>
              <th className="px-3 py-2"></th>
            </tr>
          </thead>
          <tbody>
            {products.map((p) => (
              <tr key={p.id} className="border-t border-gray-100 text-gray-700">
                <td className="px-3 py-2">{p.sku}</td>
                <td className="px-3 py-2 text-gray-900">{p.name}</td>
                <td className="px-3 py-2 text-gray-500">{p.category?.name ?? "-"}</td>
                <td className="px-3 py-2 text-right">{formatRupiah(p.sellPrice)}</td>
                <td className={`px-3 py-2 text-right ${p.stock <= LOW_STOCK_THRESHOLD ? "text-red-600 font-medium" : ""}`}>{p.stock} {p.unit}</td>
                <td className="px-3 py-2 text-right">
                  <form action={async () => { "use server"; await deleteProduct(p.id); }}>
                    <button type="submit" className="text-red-500 hover:text-red-600">Hapus</button>
                  </form>
                </td>
              </tr>
            ))}
            {products.length === 0 && (
              <tr>
                <td colSpan={6} className="px-3 py-6 text-center text-gray-400">Belum ada produk.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
