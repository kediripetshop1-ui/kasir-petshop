"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { checkout } from "./actions";

type Product = {
  id: string;
  sku: string;
  name: string;
  unit: string;
  sellPrice: number;
  stock: number;
};

type CartLine = { product: Product; qty: number };

function formatRupiah(value: number) {
  return new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }).format(value);
}

export default function PosClient({ products }: { products: Product[] }) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [cart, setCart] = useState<CartLine[]>([]);
  const [discount, setDiscount] = useState(0);
  const [paid, setPaid] = useState(0);
  const [paymentMethod, setPaymentMethod] = useState<"cash" | "qris" | "transfer">("cash");
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return products;
    return products.filter((p) => p.name.toLowerCase().includes(q) || p.sku.toLowerCase().includes(q));
  }, [query, products]);

  const subtotal = cart.reduce((sum, line) => sum + line.product.sellPrice * line.qty, 0);
  const total = Math.max(subtotal - discount, 0);
  const change = paid - total;

  function addToCart(product: Product) {
    setCart((prev) => {
      const existing = prev.find((l) => l.product.id === product.id);
      if (existing) {
        if (existing.qty >= product.stock) return prev;
        return prev.map((l) => (l.product.id === product.id ? { ...l, qty: l.qty + 1 } : l));
      }
      return [...prev, { product, qty: 1 }];
    });
  }

  function updateQty(productId: string, qty: number) {
    setCart((prev) =>
      prev
        .map((l) => (l.product.id === productId ? { ...l, qty: Math.max(0, Math.min(qty, l.product.stock)) } : l))
        .filter((l) => l.qty > 0)
    );
  }

  function removeLine(productId: string) {
    setCart((prev) => prev.filter((l) => l.product.id !== productId));
  }

  function handleCheckout() {
    setError(null);
    startTransition(async () => {
      try {
        const saleId = await checkout(
          cart.map((l) => ({ productId: l.product.id, qty: l.qty })),
          paid,
          discount,
          paymentMethod
        );
        router.push(`/struk/${saleId}`);
      } catch (e) {
        setError(e instanceof Error ? e.message : "Gagal memproses transaksi");
      }
    });
  }

  function selectPaymentMethod(method: "cash" | "qris" | "transfer") {
    setPaymentMethod(method);
    if (method !== "cash") {
      setPaid(total);
    }
  }

  return (
    <div className="grid h-full grid-cols-1 gap-6 lg:grid-cols-[1fr_380px]">
      <div>
        <h1 className="mb-4 text-2xl font-bold text-white">Kasir</h1>
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Cari produk (nama / SKU)..."
          className="mb-4 w-full rounded-lg border border-neutral-700 bg-neutral-900 px-3 py-2 text-white outline-none focus:border-emerald-500"
        />
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
          {filtered.map((product) => (
            <button
              key={product.id}
              onClick={() => addToCart(product)}
              className="flex flex-col rounded-xl border border-neutral-800 bg-neutral-900 p-3 text-left transition hover:border-emerald-600"
            >
              <span className="text-sm font-medium text-white">{product.name}</span>
              <span className="mt-1 text-xs text-neutral-500">{product.sku} · stok {product.stock} {product.unit}</span>
              <span className="mt-2 text-sm font-semibold text-emerald-400">{formatRupiah(product.sellPrice)}</span>
            </button>
          ))}
          {filtered.length === 0 && <p className="col-span-full text-neutral-500">Produk tidak ditemukan.</p>}
        </div>
      </div>

      <div className="flex flex-col rounded-xl border border-neutral-800 bg-neutral-900 p-4">
        <h2 className="mb-3 text-lg font-semibold text-white">Keranjang</h2>
        <div className="flex-1 space-y-2 overflow-y-auto">
          {cart.map((line) => (
            <div key={line.product.id} className="flex items-center justify-between gap-2 rounded-lg bg-neutral-800 px-3 py-2">
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm text-white">{line.product.name}</p>
                <p className="text-xs text-neutral-400">{formatRupiah(line.product.sellPrice)}</p>
              </div>
              <input
                type="number"
                value={line.qty}
                min={0}
                max={line.product.stock}
                onChange={(e) => updateQty(line.product.id, Number(e.target.value))}
                className="w-16 rounded-md border border-neutral-700 bg-neutral-900 px-2 py-1 text-center text-white"
              />
              <button onClick={() => removeLine(line.product.id)} className="text-red-400 hover:text-red-300">
                ✕
              </button>
            </div>
          ))}
          {cart.length === 0 && <p className="text-sm text-neutral-500">Keranjang masih kosong.</p>}
        </div>

        <div className="mt-4 space-y-2 border-t border-neutral-800 pt-3 text-sm">
          <div className="flex justify-between text-neutral-300">
            <span>Subtotal</span>
            <span>{formatRupiah(subtotal)}</span>
          </div>
          <div className="flex items-center justify-between text-neutral-300">
            <span>Diskon</span>
            <input
              type="number"
              value={discount}
              min={0}
              onChange={(e) => setDiscount(Number(e.target.value))}
              className="w-28 rounded-md border border-neutral-700 bg-neutral-900 px-2 py-1 text-right text-white"
            />
          </div>
          <div className="flex justify-between text-base font-semibold text-white">
            <span>Total</span>
            <span>{formatRupiah(total)}</span>
          </div>

          <div>
            <p className="mb-1 text-neutral-300">Metode Bayar</p>
            <div className="grid grid-cols-3 gap-2">
              {(
                [
                  { value: "cash", label: "Cash" },
                  { value: "qris", label: "QRIS" },
                  { value: "transfer", label: "Transfer" },
                ] as const
              ).map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => selectPaymentMethod(opt.value)}
                  className={`rounded-lg border px-2 py-2 text-sm font-medium transition ${
                    paymentMethod === opt.value
                      ? "border-emerald-600 bg-emerald-600 text-white"
                      : "border-neutral-700 bg-neutral-800 text-neutral-300 hover:border-neutral-500"
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          <div className="flex items-center justify-between text-neutral-300">
            <span>Bayar</span>
            <div className="flex items-center gap-2">
              {paymentMethod === "cash" && (
                <button
                  onClick={() => setPaid(total)}
                  className="rounded-md border border-neutral-700 bg-neutral-800 px-2 py-1 text-xs text-neutral-300 hover:border-emerald-600 hover:text-white"
                >
                  Uang Pas
                </button>
              )}
              <input
                id="paid-input"
                type="number"
                value={paid}
                min={0}
                disabled={paymentMethod !== "cash"}
                onChange={(e) => setPaid(Number(e.target.value))}
                className="w-28 rounded-md border border-neutral-700 bg-neutral-900 px-2 py-1 text-right text-white disabled:opacity-60"
              />
            </div>
          </div>
          <div className="flex justify-between text-neutral-300">
            <span>Kembalian</span>
            <span className={change < 0 ? "text-red-400" : "text-emerald-400"}>{formatRupiah(Math.max(change, 0))}</span>
          </div>
        </div>

        {error && <p className="mt-3 rounded-lg bg-red-950 px-3 py-2 text-sm text-red-300">{error}</p>}

        <button
          onClick={handleCheckout}
          disabled={pending || cart.length === 0 || paid < total}
          className="mt-4 w-full rounded-lg bg-emerald-600 px-3 py-3 font-semibold text-white transition hover:bg-emerald-500 disabled:opacity-50"
        >
          {pending ? "Memproses..." : "Bayar & Cetak Struk"}
        </button>
      </div>
    </div>
  );
}
