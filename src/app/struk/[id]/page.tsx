import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import PrintButton from "./print-button";

function formatRupiah(value: number) {
  return new Intl.NumberFormat("id-ID", { maximumFractionDigits: 0 }).format(value);
}

export default async function StrukPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const sale = await db.sale.findUnique({
    where: { id },
    include: { items: { include: { product: true } } },
  });

  if (!sale) notFound();

  return (
    <div className="flex min-h-screen flex-col items-center bg-neutral-950 py-8 print:bg-white print:py-0">
      <PrintButton />
      <div
        id="struk"
        className="w-[80mm] bg-white px-3 py-4 text-black"
        style={{ fontFamily: "'Courier New', monospace", fontSize: "12px" }}
      >
        <div className="text-center">
          <p className="text-base font-bold">Kediri Petshop</p>
          <p>Jl. Kediri No.31B, Tuban, Kec. Kuta,</p>
          <p>Kabupaten Badung, Bali 80361</p>
          <p>{new Date(sale.createdAt).toLocaleString("id-ID")}</p>
        </div>
        <div className="my-2 border-t border-dashed border-black" />
        <p>No. Invoice: {sale.invoiceNo}</p>
        <p>Kasir: {sale.cashierName}</p>
        <div className="my-2 border-t border-dashed border-black" />

        {sale.items.map((item) => (
          <div key={item.id} className="mb-1">
            <p>{item.product.name}</p>
            <div className="flex justify-between">
              <span>{item.qty} x {formatRupiah(item.price)}</span>
              <span>{formatRupiah(item.subtotal)}</span>
            </div>
          </div>
        ))}

        <div className="my-2 border-t border-dashed border-black" />
        <div className="flex justify-between">
          <span>Subtotal</span>
          <span>{formatRupiah(sale.subtotal)}</span>
        </div>
        {sale.discount > 0 && (
          <div className="flex justify-between">
            <span>Diskon</span>
            <span>-{formatRupiah(sale.discount)}</span>
          </div>
        )}
        <div className="flex justify-between font-bold">
          <span>TOTAL</span>
          <span>{formatRupiah(sale.total)}</span>
        </div>
        <div className="flex justify-between">
          <span>Bayar</span>
          <span>{formatRupiah(sale.paid)}</span>
        </div>
        <div className="flex justify-between">
          <span>Kembali</span>
          <span>{formatRupiah(sale.change)}</span>
        </div>

        <div className="my-2 border-t border-dashed border-black" />
        <p className="text-center">Terima kasih telah berbelanja!</p>
        <p className="text-center">Barang yang sudah dibeli tidak dapat ditukar.</p>
      </div>
    </div>
  );
}
