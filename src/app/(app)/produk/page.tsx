import { db } from "@/lib/db";
import { LOW_STOCK_THRESHOLD } from "@/lib/reports";
import { productDisplayName } from "@/lib/product";
import { createProduct } from "./actions";
import ProdukList from "./produk-list";

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
          Tips: isi Barcode dengan nomor di kemasan produk supaya bisa langsung di-scan di halaman Kasir. Brand, Nama, Berat,
          dan Keyword dipisah agar produk lebih mudah dicari.
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
                <span>{productDisplayName(p)}</span>
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
        <input name="sku" placeholder="Barcode" required className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-gray-900 outline-none focus:border-emerald-500" />
        <input name="brand" placeholder="Brand (mis. Royal Canin)" className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-gray-900 outline-none focus:border-emerald-500" />
        <input name="name" placeholder="Nama produk (mis. Adult)" required className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-gray-900 outline-none focus:border-emerald-500" />
        <input name="weight" placeholder="Berat (mis. 1kg)" className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-gray-900 outline-none focus:border-emerald-500" />
        <select name="categoryId" className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-gray-900 outline-none focus:border-emerald-500">
          <option value="">Tanpa kategori</option>
          {categories.map((c) => (
            <option key={c.id} value={c.id}>{c.name}</option>
          ))}
        </select>
        <input name="unit" placeholder="Satuan (pcs/dus)" defaultValue="pcs" className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-gray-900 outline-none focus:border-emerald-500" />
        <input name="costPrice" type="number" placeholder="Harga beli" className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-gray-900 outline-none focus:border-emerald-500" />
        <input name="sellPrice" type="number" placeholder="Harga jual" required className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-gray-900 outline-none focus:border-emerald-500" />
        <input name="stock" type="number" placeholder="Stok awal" defaultValue={0} className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-gray-900 outline-none focus:border-emerald-500" />
        <input name="keyword" placeholder="Keyword pencarian (opsional, pisah koma)" className="col-span-2 rounded-lg border border-gray-300 bg-white px-3 py-2 text-gray-900 outline-none focus:border-emerald-500 md:col-span-3" />
        <button type="submit" className="rounded-lg bg-emerald-600 px-3 py-2 font-medium text-white hover:bg-emerald-700">
          Tambah Produk
        </button>
      </form>

      <ProdukList products={products} lowStockThreshold={LOW_STOCK_THRESHOLD} />
    </div>
  );
}
