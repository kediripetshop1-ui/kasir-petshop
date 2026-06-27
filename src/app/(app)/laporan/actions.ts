"use server";

import { getCurrentUser } from "@/lib/auth";
import { sendText, normalizeNumber } from "@/lib/wa";
import { getDailyReport, formatDailyReportText } from "@/lib/reports";

/** Kirim laporan harian hari ini ke semua nomor owner via WhatsApp. */
export async function kirimLaporanWA(): Promise<{ ok: boolean; message: string }> {
  const user = await getCurrentUser();
  if (!user) return { ok: false, message: "Tidak terautentikasi." };

  const numbers = (process.env.WA_OWNER_NUMBERS || "")
    .split(",")
    .map((s) => normalizeNumber(s.trim()))
    .filter(Boolean);

  if (numbers.length === 0) {
    return { ok: false, message: "WA_OWNER_NUMBERS belum diset di environment." };
  }

  const report = await getDailyReport();
  const text = formatDailyReportText(report);

  const results = await Promise.allSettled(numbers.map((n) => sendText(n, text)));
  const sukses = results.filter((r) => r.status === "fulfilled").length;
  const gagal = results.length - sukses;

  if (sukses === 0) return { ok: false, message: "Gagal mengirim ke semua nomor. Cek token/koneksi WA." };
  return { ok: true, message: `Laporan terkirim ke ${sukses} nomor${gagal ? `, ${gagal} gagal` : ""}.` };
}
