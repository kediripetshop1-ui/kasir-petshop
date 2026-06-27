"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { deleteSale } from "./actions";

export default function DeleteSaleButton({ saleId, invoiceNo }: { saleId: string; invoiceNo: string }) {
  const [pending, startTransition] = useTransition();
  const router = useRouter();

  function handleClick() {
    if (!confirm(`Hapus transaksi ${invoiceNo}? Stok barang akan dikembalikan. Aksi ini tidak bisa dibatalkan.`)) return;
    startTransition(async () => {
      await deleteSale(saleId);
      router.refresh();
    });
  }

  return (
    <button onClick={handleClick} disabled={pending} className="text-red-500 hover:text-red-600 disabled:opacity-50">
      {pending ? "..." : "Hapus"}
    </button>
  );
}
