import { db } from "@/lib/db";
import { sendText, downloadMedia } from "@/lib/wa";
import { extractNota, type NotaItem } from "@/lib/ocr";
import { getDailyReport, formatDailyReportText, getLowStockText } from "@/lib/reports";
import { getBaliDateKey } from "@/lib/datetime";
import { productDisplayName } from "@/lib/product";

const PENDING_TTL_MIN = 30;

const HELP = `*Bot Kediri Petshop* 🐾
Perintah yang tersedia:
• *laporan* — laporan penjualan hari ini
• *laporan kemarin* — laporan kemarin
• *laporan 2026-06-25* — laporan tanggal tertentu
• *stok* — daftar stok menipis
• *Kirim foto nota* — update stok otomatis (perlu konfirmasi)
  Balas *YA* untuk simpan, *BATAL* untuk batal.`;

/** Entry point: proses satu pesan masuk dari nomor owner, kirim balasan via WA. */
export async function handleIncoming(msg: {
  from: string;
  type: string;
  text?: string;
  imageId?: string;
}): Promise<void> {
  try {
    if (msg.type === "image" && msg.imageId) {
      await handleImage(msg.from, msg.imageId);
      return;
    }
    if (msg.type === "text" && msg.text != null) {
      await handleText(msg.from, msg.text);
      return;
    }
    await sendText(msg.from, "Maaf, jenis pesan ini belum didukung.\n\n" + HELP);
  } catch (e) {
    console.error("[wa-commands] error:", e);
    await sendText(msg.from, "⚠️ Terjadi kesalahan saat memproses pesan. Coba lagi nanti.").catch(() => {});
  }
}

async function handleText(from: string, raw: string): Promise<void> {
  const text = raw.trim().toLowerCase();

  if (text === "ya" || text === "y" || text === "iya") {
    await confirmPending(from);
    return;
  }
  if (text === "batal" || text === "cancel" || text === "no" || text === "n") {
    await db.waPending.deleteMany({ where: { waNumber: from } });
    await sendText(from, "❌ Dibatalkan. Stok tidak diubah.");
    return;
  }

  if (text.startsWith("laporan")) {
    const arg = text.replace("laporan", "").trim();
    let dateKey: string | undefined;
    if (arg === "kemarin") {
      dateKey = getBaliDateKey(new Date(Date.now() - 24 * 60 * 60 * 1000));
    } else if (/^\d{4}-\d{2}-\d{2}$/.test(arg)) {
      dateKey = arg;
    }
    const report = await getDailyReport(dateKey);
    await sendText(from, formatDailyReportText(report));
    return;
  }

  if (text === "stok" || text.startsWith("stok")) {
    await sendText(from, await getLowStockText());
    return;
  }

  await sendText(from, HELP);
}

async function handleImage(from: string, imageId: string): Promise<void> {
  await sendText(from, "📸 Nota diterima, sedang membaca...");

  const { buffer, mime } = await downloadMedia(imageId);
  const nota = await extractNota(buffer, mime);

  if (nota.items.length === 0) {
    await sendText(from, "Tidak ada barang yang terbaca dari nota. Coba foto lebih jelas ya.");
    return;
  }

  // Cocokkan tiap item nota dengan produk yang ada.
  const products = await db.product.findMany({ where: { archived: false } });
  const matched: { productId: string; nama: string; qty: number; hargaSatuan: number | null }[] = [];
  const unmatched: NotaItem[] = [];

  for (const item of nota.items) {
    const p = matchProduct(item.nama, products);
    if (p) matched.push({ productId: p.id, nama: productDisplayName(p), qty: item.qty, hargaSatuan: item.hargaSatuan });
    else unmatched.push(item);
  }

  if (matched.length === 0) {
    const lines = unmatched.map((i) => `• ${i.nama} (${i.qty})`).join("\n");
    await sendText(
      from,
      `Barang terbaca tapi belum ada di daftar produk:\n${lines}\n\nTambahkan dulu produknya di aplikasi, lalu kirim ulang notanya.`,
    );
    return;
  }

  // Simpan pending untuk konfirmasi.
  const expiresAt = new Date(Date.now() + PENDING_TTL_MIN * 60 * 1000);
  await db.waPending.upsert({
    where: { waNumber: from },
    create: { waNumber: from, payload: JSON.stringify({ items: matched }), expiresAt },
    update: { payload: JSON.stringify({ items: matched }), expiresAt, createdAt: new Date() },
  });

  const lines = matched.map(
    (m) => `• ${m.nama} +${m.qty}${m.hargaSatuan ? ` (modal ${m.hargaSatuan})` : ""}`,
  );
  let reply = `*Konfirmasi Stok Masuk*\n${lines.join("\n")}`;
  if (unmatched.length > 0) {
    reply += `\n\n_Tidak dikenali (dilewati):_\n` + unmatched.map((i) => `• ${i.nama} (${i.qty})`).join("\n");
  }
  reply += `\n\nBalas *YA* untuk simpan, atau *BATAL*.`;
  await sendText(from, reply);
}

async function confirmPending(from: string): Promise<void> {
  const pending = await db.waPending.findUnique({ where: { waNumber: from } });
  if (!pending) {
    await sendText(from, "Tidak ada antrian konfirmasi. Kirim foto nota dulu ya.");
    return;
  }
  if (pending.expiresAt < new Date()) {
    await db.waPending.delete({ where: { waNumber: from } }).catch(() => {});
    await sendText(from, "Konfirmasi sudah kedaluwarsa. Kirim ulang foto notanya.");
    return;
  }

  const { items } = JSON.parse(pending.payload) as {
    items: { productId: string; nama: string; qty: number; hargaSatuan: number | null }[];
  };

  await db.$transaction([
    ...items.flatMap((it) => [
      db.product.update({
        where: { id: it.productId },
        data: {
          stock: { increment: it.qty },
          ...(it.hargaSatuan ? { costPrice: it.hargaSatuan } : {}),
        },
      }),
      db.stockLog.create({
        data: { productId: it.productId, change: it.qty, reason: "nota_masuk", note: "via WhatsApp" },
      }),
    ]),
    db.waPending.delete({ where: { waNumber: from } }),
  ]);

  const lines = items.map((it) => `• ${it.nama} +${it.qty}`);
  await sendText(from, `✅ Stok diperbarui:\n${lines.join("\n")}`);
}

type MatchableProduct = { id: string; name: string; sku: string; brand: string | null; weight: string | null };

/** Pencocokan sederhana nama nota → produk (case-insensitive, token overlap, mempertimbangkan brand+berat). */
function matchProduct(notaName: string, products: MatchableProduct[]): MatchableProduct | null {
  const norm = (s: string) => s.toLowerCase().replace(/[^a-z0-9\s]/g, " ").replace(/\s+/g, " ").trim();
  const target = norm(notaName);
  if (!target) return null;
  const targetTokens = target.split(" ").filter((t) => t.length >= 3);

  let best: MatchableProduct | null = null;
  let bestScore = 0;

  for (const p of products) {
    const pn = norm(productDisplayName(p));
    if (p.sku.toLowerCase() === notaName.toLowerCase().trim()) return p;
    let score = 0;
    if (pn === target) score = 100;
    else if (pn.includes(target) || target.includes(pn)) score = 80;
    else {
      const pTokens = pn.split(" ");
      const overlap = targetTokens.filter((t) => pTokens.some((pt) => pt.includes(t) || t.includes(pt)));
      score = overlap.length === 0 ? 0 : (overlap.length / Math.max(targetTokens.length, 1)) * 70;
    }
    if (score > bestScore) {
      bestScore = score;
      best = p;
    }
  }

  return bestScore >= 50 ? best : null;
}
