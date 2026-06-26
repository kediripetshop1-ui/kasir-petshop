"use client";

import { useEffect } from "react";
import Link from "next/link";

export default function PrintButton() {
  useEffect(() => {
    const t = setTimeout(() => window.print(), 300);
    return () => clearTimeout(t);
  }, []);

  return (
    <div className="mb-4 flex gap-2 print:hidden">
      <button
        onClick={() => window.print()}
        className="rounded-lg bg-emerald-600 px-4 py-2 font-medium text-white hover:bg-emerald-500"
      >
        Cetak Struk
      </button>
      <Link href="/kasir" className="rounded-lg border border-neutral-700 px-4 py-2 text-neutral-300 hover:bg-neutral-800">
        Transaksi Baru
      </Link>
    </div>
  );
}
