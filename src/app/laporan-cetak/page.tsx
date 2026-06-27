import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { formatBaliDateTime } from "@/lib/datetime";
import { getDailyReport } from "@/lib/reports";
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
  const r = await getDailyReport(date);
  const { ringkasan, totalPemasukan, totalModal, totalPengeluaran, untungBersih, totalItemTerjual, jumlahTransaksi, totalHutangBaru, totalPelunasanHutang } = r;

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
        <p className="text-center">{r.tanggal}</p>
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
          <span>{jumlahTransaksi}</span>
        </div>
        {totalHutangBaru > 0 && (
          <div className="flex justify-between">
            <span>Hutang Baru</span>
            <span>{formatRupiah(totalHutangBaru)}</span>
          </div>
        )}
        {totalPelunasanHutang > 0 && (
          <div className="flex justify-between">
            <span>Pelunasan Hutang</span>
            <span>{formatRupiah(totalPelunasanHutang)}</span>
          </div>
        )}

        <div className="my-2 border-t border-dashed border-black" />
        <p className="text-center">Dicetak: {formatBaliDateTime(new Date())} WITA</p>
      </div>
    </div>
  );
}
