-- Jalankan di Supabase SQL Editor.

ALTER TABLE "Product" ADD COLUMN IF NOT EXISTS "archived" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "Sale" ADD COLUMN IF NOT EXISTS "customerName" TEXT;

CREATE TABLE IF NOT EXISTS "DebtPayment" (
  "id"        TEXT NOT NULL PRIMARY KEY,
  "saleId"    TEXT NOT NULL,
  "amount"    INTEGER NOT NULL,
  "method"    TEXT NOT NULL DEFAULT 'cash',
  "note"      TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "DebtPayment_saleId_fkey" FOREIGN KEY ("saleId") REFERENCES "Sale"("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

CREATE INDEX IF NOT EXISTS "DebtPayment_saleId_idx" ON "DebtPayment"("saleId");
