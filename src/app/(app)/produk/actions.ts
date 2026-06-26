"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";

export async function createProduct(formData: FormData) {
  const name = String(formData.get("name") ?? "").trim();
  const sku = String(formData.get("sku") ?? "").trim();
  const categoryId = String(formData.get("categoryId") ?? "") || null;
  const unit = String(formData.get("unit") ?? "pcs");
  const costPrice = Number(formData.get("costPrice") ?? 0);
  const sellPrice = Number(formData.get("sellPrice") ?? 0);
  const stock = Number(formData.get("stock") ?? 0);
  const minStock = Number(formData.get("minStock") ?? 0);

  if (!name || !sku || !sellPrice) return;

  await db.product.create({
    data: { name, sku, categoryId, unit, costPrice, sellPrice, stock, minStock },
  });

  revalidatePath("/produk");
}

export async function deleteProduct(id: string) {
  await db.product.delete({ where: { id } });
  revalidatePath("/produk");
}
