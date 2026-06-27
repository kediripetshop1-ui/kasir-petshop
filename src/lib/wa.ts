import crypto from "node:crypto";

const GRAPH_VERSION = process.env.WA_GRAPH_VERSION || "v21.0";
const BASE = `https://graph.facebook.com/${GRAPH_VERSION}`;

function token() {
  const t = process.env.WA_ACCESS_TOKEN;
  if (!t) throw new Error("WA_ACCESS_TOKEN belum diset");
  return t;
}

function phoneNumberId() {
  const id = process.env.WA_PHONE_NUMBER_ID;
  if (!id) throw new Error("WA_PHONE_NUMBER_ID belum diset");
  return id;
}

/** Normalisasi nomor ke format internasional tanpa "+" (mis. 6281234567890). */
export function normalizeNumber(raw: string): string {
  let n = raw.replace(/[^\d]/g, "");
  if (n.startsWith("0")) n = "62" + n.slice(1);
  if (n.startsWith("8")) n = "62" + n;
  return n;
}

/** Cek apakah nomor termasuk allowlist owner (env WA_OWNER_NUMBERS, dipisah koma). */
export function isOwner(from: string): boolean {
  const list = (process.env.WA_OWNER_NUMBERS || "")
    .split(",")
    .map((s) => normalizeNumber(s.trim()))
    .filter(Boolean);
  return list.includes(normalizeNumber(from));
}

/** Kirim pesan teks ke nomor WA. */
export async function sendText(to: string, body: string): Promise<void> {
  const res = await fetch(`${BASE}/${phoneNumberId()}/messages`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token()}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      messaging_product: "whatsapp",
      to: normalizeNumber(to),
      type: "text",
      text: { preview_url: false, body: body.slice(0, 4096) },
    }),
  });
  if (!res.ok) {
    const err = await res.text();
    console.error("[wa] sendText gagal:", res.status, err);
    throw new Error(`WA sendText gagal: ${res.status}`);
  }
}

/** Ambil URL unduhan media dari media ID, lalu unduh sebagai Buffer + mime. */
export async function downloadMedia(mediaId: string): Promise<{ buffer: Buffer; mime: string }> {
  const metaRes = await fetch(`${BASE}/${mediaId}`, {
    headers: { Authorization: `Bearer ${token()}` },
  });
  if (!metaRes.ok) throw new Error(`WA media meta gagal: ${metaRes.status}`);
  const meta = (await metaRes.json()) as { url: string; mime_type: string };

  const binRes = await fetch(meta.url, {
    headers: { Authorization: `Bearer ${token()}` },
  });
  if (!binRes.ok) throw new Error(`WA media unduh gagal: ${binRes.status}`);
  const buffer = Buffer.from(await binRes.arrayBuffer());
  return { buffer, mime: meta.mime_type };
}

/**
 * Verifikasi signature webhook Meta (X-Hub-Signature-256).
 * Jika WA_APP_SECRET tidak diset, verifikasi dilewati (return true).
 */
export function verifySignature(rawBody: string, signatureHeader: string | null): boolean {
  const secret = process.env.WA_APP_SECRET;
  if (!secret) return true;
  if (!signatureHeader) return false;
  const expected =
    "sha256=" + crypto.createHmac("sha256", secret).update(rawBody).digest("hex");
  try {
    return crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(signatureHeader));
  } catch {
    return false;
  }
}
