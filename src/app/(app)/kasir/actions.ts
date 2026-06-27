"use server";

import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { getBaliDateTimeParts } from "@/lib/datetime";

type CartItem = { productId: string; qty: number };

function generateInvoiceNo() {
  const p = getBaliDateTimeParts(new Date());
  return `INV${p.date}${p.month}${p.year}${p.hour}${p.minute}${p.second}`;
}

type PaymentMethod = "cash" | "qris" | "transfer" | "debit" | "hutang";

export async function checkout(
  items: CartItem[],
  paid: number,
  discount: number,
  paymentType: PaymentMethod = "cash",
  customerName?: string
) {
  const user = await getCurrentUser();
  if (!user) throw new Error("Tidak terautentikasi");
  if (items.length === 0) throw new Error("Keranjang kosong");
  if (paymentType === "hutang" && !customerName?.trim()) {
    throw new Error("Nama pelanggan wajib diisi untuk transaksi hutang");
  }

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
  // Transaksi hutang: belum ada uang masuk sama sekali, dilunasi belakangan via halaman Hutang.
  const isHutang = paymentType === "hutang";
  if (!isHutang && paid < total) throw new Error("Pembayaran kurang dari total");
  const actualPaid = isHutang ? 0 : paid;
  const change = actualPaid - total;

  const invoiceNo = generateInvoiceNo();

  const sale = await db.$transaction(async (tx) => {
    const created = await tx.sale.create({
      data: {
        invoiceNo,
        cashierName: user.name,
        customerName: customerName?.trim() || null,
        subtotal,
        discount,
        total,
        paid: actualPaid,
        change: Math.max(change, 0),
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
