"use client";

import { useState, useTransition } from "react";
import { kirimLaporanWA } from "./actions";

export default function KirimWaButton() {
  const [pending, startTransition] = useTransition();
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);

  function handleClick() {
    setMsg(null);
    startTransition(async () => {
      const res = await kirimLaporanWA();
      setMsg({ ok: res.ok, text: res.message });
    });
  }

  return (
    <div className="flex flex-col items-end gap-1">
      <button
        type="button"
        onClick={handleClick}
        disabled={pending}
        className="rounded-lg border border-emerald-600 px-4 py-2 text-sm font-medium text-emerald-700 hover:bg-emerald-50 disabled:opacity-50"
      >
        {pending ? "Mengirim..." : "Kirim Laporan ke WA"}
      </button>
      {msg && (
        <span className={`text-xs ${msg.ok ? "text-emerald-600" : "text-red-600"}`}>{msg.text}</span>
      )}
    </div>
  );
}
