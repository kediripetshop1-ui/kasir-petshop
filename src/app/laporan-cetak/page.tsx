import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { formatBaliDate, formatBaliDateTime, getBaliDayRange } from "@/lib/datetime";
import PrintButton from "@/app/struk/[id]/print-button";

function formatRupiah(value: number) {
  return new Intl.NumberFormat("id-ID", { maximumFractionDigits: 0 }).format(value);
}

export default async function LaporanCetakPage({
  searchParams,
}: {
  searchParams: Promise<{ date?: string }>;
}) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const { date } = await searchParams;
  const { start, end } = getBaliDayRange(date);

  const [sales, expenses] = await Promise.all([
    db.sale.findMany({
      where: { createdAt: { gte: start, lte: end } },
      include: { items: { include: { product: true } } },
      orderBy: { createdAt: "asc" },
    }),
    db.expense.findMany({
      where: { createdAt: { gte: start, lte: end } },
    }),
  ]);

  const ringkasan = {
    cash: { count: 0, total: 0 },
    qris: { count: 0, total: 0 },
    transfer: { count: 0, total: 0 },
    debit: { count: 0, total: 0 },
  };

  let totalPemasukan = 0;
  let totalModal = 0;
  let totalItemTerjual = 0;

  for (const sale of sales) {
    const key = (sale.paymentType in ringkasan ? sale.paymentType : "cash") as keyof typeof ringkasan;
    ringkasan[key].count += 1;
    ringkasan[key].total += sale.total;
    totalPemasukan += sale.total;

    for (const item of sale.items) {
      totalItemTerjual += item.qty;
      totalModal += item.product.costPrice * item.qty;
    }
  }

  const totalPengeluaran = expenses.reduce((sum, e) => sum + e.amount, 0);
  const untungBersih = totalPemasukan - totalModal - totalPengeluaran;

  return (
    <div className="flex min-h-screen flex-col items-center bg-gray-100 py-8 print:bg-white print:py-0">
      <PrintButton />
      <div
        id="struk"
        className="w-[80mm] bg-white px-3 py-4 text-black shadow-sm print:shadow-none"
        style={{ fontFamily: "'Courier New', monospace", fontSize: "12px" }}
      >
        <div className="text-center">
          <p className="text-base font-bold">Kediri Petshop</p>
          <p>Jl. Kediri No.31B, Tuban, Kec. Kuta,</p>
          <p>Kabupaten Badung, Bali 80361</p>
        </div>
        <div className="my-2 border-t border-dashed border-black" />
        <p className="text-center font-bold">LAPORAN PENJUALAN HARIAN</p>
        <p className="text-center">{formatBaliDate(start)}</p>
        <div className="my-2 border-t border-dashed border-black" />

        <div className="flex justify-between">
          <span>Cash</span>
          <span>{formatRupiah(ringkasan.cash.total)} ({ringkasan.cash.count})</span>
        </div>
        <div className="flex justify-between">
          <span>QRIS</span>
          <span>{formatRupiah(ringkasan.qris.total)} ({ringkasan.qris.count})</span>
        </div>
        <div className="flex justify-between">
          <span>Transfer</span>
          <span>{formatRupiah(ringkasan.transfer.total)} ({ringkasan.transfer.count})</span>
        </div>
        <div className="flex justify-between">
          <span>Debit</span>
          <span>{formatRupiah(ringkasan.debit.total)} ({ringkasan.debit.count})</span>
        </div>

        <div className="my-2 border-t border-dashed border-black" />
        <div className="flex justify-between font-bold">
          <span>TOTAL PEMASUKAN</span>
          <span>{formatRupiah(totalPemasukan)}</span>
        </div>
        <div className="flex justify-between">
          <span>Total Modal</span>
          <span>{formatRupiah(totalModal)}</span>
        </div>
        <div className="flex justify-between">
          <span>Total Pengeluaran</span>
          <span>{formatRupiah(totalPengeluaran)}</span>
        </div>
        <div className="flex justify-between font-bold">
          <span>UNTUNG BERSIH</span>
          <span>{formatRupiah(untungBersih)}</span>
        </div>
        <div className="flex justify-between">
          <span>Item Terjual</span>
          <span>{totalItemTerjual} pcs</span>
        </div>
        <div className="flex justify-between">
          <span>Jumlah Transaksi</span>
          <span>{sales.length}</span>
        </div>

        <div className="my-2 border-t border-dashed border-black" />
        <p className="text-center">Dicetak: {formatBaliDateTime(new Date())} WITA</p>
      </div>
    </div>
  );
}
