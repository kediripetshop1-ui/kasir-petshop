"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";

export async function addStock(formData: FormData) {
  const productId = String(formData.get("productId") ?? "");
  const qty = Number(formData.get("qty") ?? 0);
  const note = String(formData.get("note") ?? "").trim() || null;

  if (!productId || qty <= 0) return;

  await db.$transaction([
    db.product.update({ where: { id: productId }, data: { stock: { increment: qty } } }),
    db.stockLog.create({ data: { productId, change: qty, reason: "nota_masuk", note } }),
  ]);

  revalidatePath("/stok-masuk");
  revalidatePath("/produk");
}
