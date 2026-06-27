"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";

export async function addExpense(formData: FormData) {
  const user = await getCurrentUser();
  if (!user) throw new Error("Tidak terautentikasi");

  const amount = Number(formData.get("amount") ?? 0);
  const note = String(formData.get("note") ?? "").trim() || null;

  if (amount <= 0) return;

  await db.expense.create({
    data: { amount, note, cashierName: user.name },
  });

  revalidatePath("/pengeluaran");
  revalidatePath("/laporan");
}

export async function deleteExpense(id: string) {
  await db.expense.delete({ where: { id } });
  revalidatePath("/pengeluaran");
  revalidatePath("/laporan");
}
