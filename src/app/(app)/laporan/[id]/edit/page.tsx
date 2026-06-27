import { notFound } from "next/navigation";
import Link from "next/link";
import { db } from "@/lib/db";
import { updateSale } from "../../actions";

function formatRupiah(value: number) {
  return new Intl.NumberFormat("id-ID", { maximumFractionDigits: 0 }).format(value);
}

export default async function EditSalePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const sale = await db.sale.findUnique({
    where: { id },
    include: { items: { include: { product: true } }, debtPayments: true },
  });
  if (!sale) notFound();

  const sudahDilunasi = sale.debtPayments.length > 0;

  return (
    <div className="mx-auto max-w-lg space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Edit Transaksi {sale.invoiceNo}</h1>
        <p className="text-sm text-gray-500">Hanya metode bayar, diskon, jumlah bayar & nama pelanggan yang bisa diubah di sini.</p>
      </div>

      <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
        <p className="mb-2 text-sm font-medium text-gray-900">Barang dibeli (tidak bisa diedit)</p>
        <ul className="space-y-1 text-sm text-gray-600">
          {sale.items.map((item) => (
            <li key={item.id} className="flex justify-between">
              <span>{item.product.name} x{item.qty}</span>
              <span>Rp{formatRupiah(item.subtotal)}</span>
            </li>
          ))}
        </ul>
        <p className="mt-2 border-t border-gray-100 pt-2 text-right text-sm text-gray-500">Subtotal: Rp{formatRupiah(sale.subtotal)}</p>
      </div>

      {sudahDilunasi && (
        <p className="rounded-lg bg-amber-50 px-3 py-2 text-sm text-amber-700">
          Transaksi ini sudah punya riwayat pelunasan hutang, jadi metode bayar tidak bisa diubah dari "Hutang".
        </p>
      )}

      <form action={updateSale.bind(null, sale.id)} className="space-y-4 rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
        <div>
          <label className="mb-1 block text-sm text-gray-600">Metode Bayar</label>
          <select
            name="paymentType"
            defaultValue={sale.paymentType}
            disabled={sudahDilunasi}
            className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-gray-900 outline-none focus:border-emerald-500 disabled:opacity-60"
          >
            <option value="cash">Cash</option>
            <option value="qris">QRIS</option>
            <option value="transfer">Transfer</option>
            <option value="debit">Debit</option>
            <option value="hutang">Hutang</option>
          </select>
        </div>

        <div>
          <label className="mb-1 block text-sm text-gray-600">Nama Pelanggan (untuk Hutang)</label>
          <input
            name="customerName"
            defaultValue={sale.customerName ?? ""}
            className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-gray-900 outline-none focus:border-emerald-500"
          />
        </div>

        <div>
          <label className="mb-1 block text-sm text-gray-600">Diskon</label>
          <input
            name="discount"
            type="number"
            min={0}
            defaultValue={sale.discount}
            className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-gray-900 outline-none focus:border-emerald-500"
          />
        </div>

        <div>
          <label className="mb-1 block text-sm text-gray-600">Jumlah Bayar (kosongkan/0 jika Hutang)</label>
          <input
            name="paid"
            type="number"
            min={0}
            defaultValue={sale.paid}
            className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-gray-900 outline-none focus:border-emerald-500"
          />
        </div>

        <div className="flex gap-2">
          <button type="submit" className="flex-1 rounded-lg bg-emerald-600 px-3 py-2 font-medium text-white hover:bg-emerald-700">
            Simpan Perubahan
          </button>
          <Link href="/laporan" className="flex-1 rounded-lg border border-gray-300 px-3 py-2 text-center font-medium text-gray-600 hover:bg-gray-50">
            Batal
          </Link>
        </div>
      </form>
    </div>
  );
}
