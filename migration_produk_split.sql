-- Jalankan di Supabase SQL Editor.
ALTER TABLE "Product" ADD COLUMN IF NOT EXISTS "brand" TEXT;
ALTER TABLE "Product" ADD COLUMN IF NOT EXISTS "weight" TEXT;
ALTER TABLE "Product" ADD COLUMN IF NOT EXISTS "keyword" TEXT;
