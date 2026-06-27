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
        className="rounded-lg bg-emerald-600 px-4 py-2 font-medium text-white hover:bg-emerald-700"
      >
        Cetak Struk
      </button>
      <Link href="/kasir" className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-gray-600 hover:bg-gray-50">
        Transaksi Baru
      </Link>
    </div>
  );
}
