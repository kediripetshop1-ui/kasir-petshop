"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";

export async function createProduct(formData: FormData) {
  const name = String(formData.get("name") ?? "").trim();
  const sku = String(formData.get("sku") ?? "").trim();
  const brand = String(formData.get("brand") ?? "").trim() || null;
  const weight = String(formData.get("weight") ?? "").trim() || null;
  const keyword = String(formData.get("keyword") ?? "").trim() || null;
  const categoryId = String(formData.get("categoryId") ?? "") || null;
  const unit = String(formData.get("unit") ?? "pcs");
  const costPrice = Number(formData.get("costPrice") ?? 0);
  const sellPrice = Number(formData.get("sellPrice") ?? 0);
  const stock = Number(formData.get("stock") ?? 0);

  if (!name || !sku || !sellPrice) return;

  await db.product.create({
    data: { name, sku, brand, weight, keyword, categoryId, unit, costPrice, sellPrice, stock },
  });

  revalidatePath("/produk");
}

/**
 * Produk tidak benar-benar dihapus dari database karena terhubung ke riwayat
 * transaksi/stok masuk — menghapusnya akan merusak laporan lama. Sebagai
 * gantinya produk ditandai "archived" sehingga hilang dari daftar & kasir
 * tapi riwayat penjualannya tetap aman.
 */
export async function deleteProduct(id: string) {
  await db.product.update({ where: { id }, data: { archived: true } });
  revalidatePath("/produk");
  revalidatePath("/kasir");
}
