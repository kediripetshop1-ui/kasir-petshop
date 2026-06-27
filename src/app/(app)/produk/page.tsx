import { db } from "@/lib/db";
import { createProduct, deleteProduct } from "./actions";

function formatRupiah(value: number) {
  return new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }).format(value);
}

export default async function ProdukPage() {
  const [products, categories] = await Promise.all([
    db.product.findMany({ include: { category: true }, orderBy: { name: "asc" } }),
    db.category.findMany({ orderBy: { name: "asc" } }),
  ]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Produk</h1>
        <p className="text-sm text-neutral-400">
          Tips: isi kolom SKU dengan nomor barcode produk (lihat di kemasan) supaya bisa langsung di-scan di halaman Kasir.
        </p>
      </div>

      <form
        action={createProduct}
        className="grid grid-cols-2 gap-3 rounded-xl border border-neutral-800 bg-neutral-900 p-4 md:grid-cols-4"
      >
        <input name="sku" placeholder="SKU / No. Barcode" required className="rounded-lg border border-neutral-700 bg-neutral-800 px-3 py-2 text-white" />
        <input name="name" placeholder="Nama produk" required className="col-span-2 rounded-lg border border-neutral-700 bg-neutral-800 px-3 py-2 text-white" />
        <select name="categoryId" className="rounded-lg border border-neutral-700 bg-neutral-800 px-3 py-2 text-white">
          <option value="">Tanpa kategori</option>
          {categories.map((c) => (
            <option key={c.id} value={c.id}>{c.name}</option>
          ))}
        </select>
        <input name="unit" placeholder="Satuan (pcs/kg)" defaultValue="pcs" className="rounded-lg border border-neutral-700 bg-neutral-800 px-3 py-2 text-white" />
        <input name="costPrice" type="number" placeholder="Harga beli" className="rounded-lg border border-neutral-700 bg-neutral-800 px-3 py-2 text-white" />
        <input name="sellPrice" type="number" placeholder="Harga jual" required className="rounded-lg border border-neutral-700 bg-neutral-800 px-3 py-2 text-white" />
        <input name="stock" type="number" placeholder="Stok awal" defaultValue={0} className="rounded-lg border border-neutral-700 bg-neutral-800 px-3 py-2 text-white" />
        <input name="minStock" type="number" placeholder="Stok minimum" defaultValue={0} className="rounded-lg border border-neutral-700 bg-neutral-800 px-3 py-2 text-white" />
        <button type="submit" className="col-span-2 rounded-lg bg-emerald-600 px-3 py-2 font-medium text-white hover:bg-emerald-500 md:col-span-1">
          Tambah Produk
        </button>
      </form>

      <div className="overflow-hidden rounded-xl border border-neutral-800">
        <table className="w-full text-sm">
          <thead className="bg-neutral-900 text-neutral-400">
            <tr>
              <th className="px-3 py-2 text-left">SKU</th>
              <th className="px-3 py-2 text-left">Nama</th>
              <th className="px-3 py-2 text-left">Kategori</th>
              <th className="px-3 py-2 text-right">Harga Jual</th>
              <th className="px-3 py-2 text-right">Stok</th>
              <th className="px-3 py-2"></th>
            </tr>
          </thead>
          <tbody>
            {products.map((p) => (
              <tr key={p.id} className="border-t border-neutral-800 text-neutral-200">
                <td className="px-3 py-2">{p.sku}</td>
                <td className="px-3 py-2">{p.name}</td>
                <td className="px-3 py-2 text-neutral-400">{p.category?.name ?? "-"}</td>
                <td className="px-3 py-2 text-right">{formatRupiah(p.sellPrice)}</td>
                <td className={`px-3 py-2 text-right ${p.stock <= p.minStock ? "text-red-400" : ""}`}>{p.stock} {p.unit}</td>
                <td className="px-3 py-2 text-right">
                  <form action={async () => { "use server"; await deleteProduct(p.id); }}>
                    <button type="submit" className="text-red-400 hover:text-red-300">Hapus</button>
                  </form>
                </td>
              </tr>
            ))}
            {products.length === 0 && (
              <tr>
                <td colSpan={6} className="px-3 py-6 text-center text-neutral-500">Belum ada produk.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
