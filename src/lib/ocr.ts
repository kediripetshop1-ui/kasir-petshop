const GEMINI_MODEL = process.env.GEMINI_MODEL || "gemini-2.5-flash";

export type NotaItem = {
  nama: string;
  qty: number;
  hargaSatuan: number | null; // harga modal per unit jika terbaca
};

export type NotaResult = {
  items: NotaItem[];
  catatan: string | null;
};

const PROMPT = `Kamu adalah asisten kasir petshop. Baca foto NOTA PEMBELIAN BARANG (stok masuk) ini.
Ambil daftar barang yang dibeli beserta jumlah (qty) dan harga satuan (harga modal per unit) jika ada.
Jawab HANYA dengan JSON valid, tanpa teks lain, tanpa markdown, dengan bentuk:
{"items":[{"nama":"string","qty":number,"hargaSatuan":number|null}],"catatan":"string|null"}
Aturan:
- "nama": nama barang apa adanya dari nota.
- "qty": jumlah unit (integer). Jika tidak jelas, isi 1.
- "hargaSatuan": harga modal per 1 unit dalam Rupiah (integer, tanpa titik/koma). Jika hanya ada total, bagi dengan qty. Jika tidak terbaca, null.
- "catatan": ringkasan singkat (mis. nama supplier/tanggal) atau null.
- Abaikan baris total, pajak, ongkir, dan diskon dari daftar items.`;

/** Ekstrak item dari foto nota memakai Gemini vision (tier gratis). */
export async function extractNota(imageBuffer: Buffer, mime: string): Promise<NotaResult> {
  const key = process.env.GEMINI_API_KEY;
  if (!key) throw new Error("GEMINI_API_KEY belum diset");

  const url = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${key}`;
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      contents: [
        {
          parts: [
            { text: PROMPT },
            { inline_data: { mime_type: mime || "image/jpeg", data: imageBuffer.toString("base64") } },
          ],
        },
      ],
      generationConfig: { temperature: 0, responseMimeType: "application/json" },
    }),
  });

  if (!res.ok) {
    const err = await res.text();
    console.error("[ocr] Gemini gagal:", res.status, err);
    throw new Error(`OCR gagal: ${res.status}`);
  }

  const data = (await res.json()) as {
    candidates?: { content?: { parts?: { text?: string }[] } }[];
  };
  const text = data.candidates?.[0]?.content?.parts?.[0]?.text ?? "";
  const parsed = parseJson(text);

  const items: NotaItem[] = Array.isArray(parsed?.items)
    ? parsed.items
        .map((it: Record<string, unknown>) => ({
          nama: String(it?.nama ?? "").trim(),
          qty: Math.max(1, Math.round(Number(it?.qty) || 1)),
          hargaSatuan:
            it?.hargaSatuan == null || isNaN(Number(it.hargaSatuan))
              ? null
              : Math.round(Number(it.hargaSatuan)),
        }))
        .filter((it: NotaItem) => it.nama.length > 0)
    : [];

  return { items, catatan: parsed?.catatan ? String(parsed.catatan) : null };
}

function parseJson(text: string): { items?: Record<string, unknown>[]; catatan?: unknown } {
  try {
    return JSON.parse(text);
  } catch {
    // fallback: ambil blok {...} pertama
    const m = text.match(/\{[\s\S]*\}/);
    if (m) {
      try {
        return JSON.parse(m[0]);
      } catch {
        /* ignore */
      }
    }
    return {};
  }
}
