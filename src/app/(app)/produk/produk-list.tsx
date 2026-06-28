"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { productDisplayName } from "@/lib/product";
import { deleteProduct } from "./actions";

type Product = {
  id: string;
  sku: string;
  brand: string | null;
  name: string;
  weight: string | null;
  keyword: string | null;
  unit: string;
  sellPrice: number;
  stock: number;
  category: { name: string } | null;
};

function formatRupiah(value: number) {
  return new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }).format(value);
}

export default function ProdukList({ products, lowStockThreshold }: { products: Product[]; lowStockThreshold: number }) {
  const [query, setQuery] = useState("");
  const router = useRouter();
  const [, startTransition] = useTransition();

  function handleDelete(p: Product) {
    if (!confirm(`Hapus ${productDisplayName(p)}?`)) return;
    startTransition(async () => {
      await deleteProduct(p.id);
      router.refresh();
    });
  }

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return products;
    return products.filter((p) =>
      [p.sku, p.brand, p.name, p.weight, p.keyword, p.category?.name]
        .filter(Boolean)
        .some((field) => field!.toLowerCase().includes(q))
    );
  }, [query, products]);

  return (
    <div className="space-y-3">
      <input
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Cari produk: barcode, brand, nama, berat, atau keyword..."
        className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-gray-900 outline-none focus:border-emerald-500"
      />

      <div className="overflow-x-auto rounded-lg border border-gray-200 bg-white shadow-sm">
        <table className="w-full min-w-[900px] text-sm">
          <thead className="bg-gray-50 text-gray-500">
            <tr>
              <th className="px-3 py-2 text-left font-medium">Barcode</th>
              <th className="px-3 py-2 text-left font-medium">Brand</th>
              <th className="px-3 py-2 text-left font-medium">Nama Produk</th>
              <th className="px-3 py-2 text-left font-medium">Berat</th>
              <th className="px-3 py-2 text-left font-medium">Kategori</th>
              <th className="px-3 py-2 text-left font-medium">Satuan</th>
              <th className="px-3 py-2 text-right font-medium">Harga Jual</th>
              <th className="px-3 py-2 text-right font-medium">Stok</th>
              <th className="px-3 py-2"></th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((p) => (
              <tr key={p.id} className="border-t border-gray-100 text-gray-700">
                <td className="px-3 py-2">{p.sku}</td>
                <td className="px-3 py-2 text-gray-500">{p.brand ?? "-"}</td>
                <td className="px-3 py-2 text-gray-900">{p.name}</td>
                <td className="px-3 py-2 text-gray-500">{p.weight ?? "-"}</td>
                <td className="px-3 py-2 text-gray-500">{p.category?.name ?? "-"}</td>
                <td className="px-3 py-2 text-gray-500">{p.unit}</td>
                <td className="px-3 py-2 text-right">{formatRupiah(p.sellPrice)}</td>
                <td className={`px-3 py-2 text-right ${p.stock <= lowStockThreshold ? "text-red-600 font-medium" : ""}`}>
                  {p.stock} {p.unit}
                </td>
                <td className="px-3 py-2 text-right">
                  <button onClick={() => handleDelete(p)} className="text-red-500 hover:text-red-600">
                    Hapus
                  </button>
                </td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr>
                <td colSpan={9} className="px-3 py-6 text-center text-gray-400">
                  {products.length === 0 ? "Belum ada produk." : "Tidak ada produk yang cocok dengan pencarian."}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
