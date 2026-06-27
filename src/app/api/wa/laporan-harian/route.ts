import { sendText, normalizeNumber } from "@/lib/wa";
import { getDailyReport, formatDailyReportText, getLowStockText } from "@/lib/reports";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Dipanggil oleh Vercel Cron sekali sehari untuk kirim laporan harian + stok menipis
 * ke semua nomor owner. Vercel otomatis mengirim header Authorization: Bearer CRON_SECRET.
 */
export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET;
  if (secret) {
    const auth = request.headers.get("authorization");
    if (auth !== `Bearer ${secret}`) {
      return new Response("Unauthorized", { status: 401 });
    }
  }

  const numbers = (process.env.WA_OWNER_NUMBERS || "")
    .split(",")
    .map((s) => normalizeNumber(s.trim()))
    .filter(Boolean);

  if (numbers.length === 0) {
    return Response.json({ ok: false, message: "WA_OWNER_NUMBERS belum diset" });
  }

  const [report, lowStock] = await Promise.all([getDailyReport(), getLowStockText()]);
  const text = formatDailyReportText(report) + "\n\n" + lowStock;

  const results = await Promise.allSettled(numbers.map((n) => sendText(n, text)));
  const sukses = results.filter((r) => r.status === "fulfilled").length;

  return Response.json({ ok: sukses > 0, terkirim: sukses, total: numbers.length });
}
