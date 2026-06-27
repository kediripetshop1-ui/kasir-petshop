import { after } from "next/server";
import { isOwner, verifySignature } from "@/lib/wa";
import { handleIncoming } from "@/lib/wa-commands";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** Verifikasi webhook saat setup di Meta (hub.challenge). */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const mode = searchParams.get("hub.mode");
  const token = searchParams.get("hub.verify_token");
  const challenge = searchParams.get("hub.challenge");

  if (mode === "subscribe" && token === process.env.WA_VERIFY_TOKEN) {
    return new Response(challenge ?? "", { status: 200 });
  }
  return new Response("Forbidden", { status: 403 });
}

/** Terima notifikasi pesan dari WhatsApp. Balas 200 cepat, proses di after(). */
export async function POST(request: Request) {
  const rawBody = await request.text();

  if (!verifySignature(rawBody, request.headers.get("x-hub-signature-256"))) {
    return new Response("Invalid signature", { status: 401 });
  }

  let payload: WebhookPayload;
  try {
    payload = JSON.parse(rawBody);
  } catch {
    return new Response("Bad request", { status: 400 });
  }

  const messages = extractMessages(payload);

  // Proses setelah respons terkirim — hindari timeout & retry dari Meta.
  after(async () => {
    for (const m of messages) {
      // Allowlist: hanya nomor owner yang dilayani. Nomor lain diabaikan diam-diam.
      if (!isOwner(m.from)) {
        console.warn("[wa] pesan dari nomor non-owner diabaikan:", m.from);
        continue;
      }
      await handleIncoming(m);
    }
  });

  return new Response("EVENT_RECEIVED", { status: 200 });
}

type WebhookPayload = {
  entry?: {
    changes?: {
      value?: {
        messages?: {
          from: string;
          type: string;
          text?: { body: string };
          image?: { id: string };
        }[];
      };
    }[];
  }[];
};

function extractMessages(payload: WebhookPayload) {
  const out: { from: string; type: string; text?: string; imageId?: string }[] = [];
  for (const entry of payload.entry ?? []) {
    for (const change of entry.changes ?? []) {
      for (const m of change.value?.messages ?? []) {
        out.push({
          from: m.from,
          type: m.type,
          text: m.text?.body,
          imageId: m.image?.id,
        });
      }
    }
  }
  return out;
}
