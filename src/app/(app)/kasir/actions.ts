"use server";

import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";

type CartItem = { productId: string; qty: number };

function generateInvoiceNo() {
  const now = new Date();
  const pad = (n: number) => String(n).padStart(2, "0");
  const date = pad(now.getDate());
  const month = pad(now.getMonth() + 1);
  const year = now.getFullYear();
  const hour = pad(now.getHours());
  const minute = pad(now.getMinutes());
  const second = pad(now.getSeconds());
  return `INV${date}${month}${year}${hour}${minute}${second}`;
}

type PaymentMethod = "cash" | "qris" | "transfer";

export async function checkout(items: CartItem[], paid: number, discount: number, paymentType: PaymentMethod = "cash") {
  const user = await getCurrentUser();
  if (!user) throw new Error("Tidak terautentikasi");
  if (items.length === 0) throw new Error("Keranjang kosong");

  const products = await db.product.findMany({
    where: { id: { in: items.map((i) => i.productId) } },
  });

  const productMap = new Map(products.map((p) => [p.id, p]));

  let subtotal = 0;
  const lineItems = items.map((item) => {
    const product = productMap.get(item.productId);
    if (!product) throw new Error("Produk tidak ditemukan");
    if (product.stock < item.qty) throw new Error(`Stok ${product.name} tidak cukup`);
    const lineSubtotal = product.sellPrice * item.qty;
    subtotal += lineSubtotal;
    return { product, qty: item.qty, price: product.sellPrice, subtotal: lineSubtotal };
  });

  const total = Math.max(subtotal - discount, 0);
  if (paid < total) throw new Error("Pembayaran kurang dari total");
  const change = paid - total;

  const invoiceNo = generateInvoiceNo();

  const sale = await db.$transaction(async (tx) => {
    const created = await tx.sale.create({
      data: {
        invoiceNo,
        cashierName: user.name,
        subtotal,
        discount,
        total,
        paid,
        change,
        paymentType,
        items: {
          create: lineItems.map((li) => ({
            productId: li.product.id,
            qty: li.qty,
            price: li.price,
            subtotal: li.subtotal,
          })),
        },
      },
    });

    for (const li of lineItems) {
      await tx.product.update({
        where: { id: li.product.id },
        data: { stock: { decrement: li.qty } },
      });
      await tx.stockLog.create({
        data: {
          productId: li.product.id,
          change: -li.qty,
          reason: "penjualan",
          note: invoiceNo,
        },
      });
    }

    return created;
  });

  return sale.id;
}
