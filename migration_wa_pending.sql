-- Jalankan di Supabase SQL Editor untuk menambah tabel antrian konfirmasi WhatsApp.
CREATE TABLE IF NOT EXISTS "WaPending" (
  "id"        TEXT NOT NULL PRIMARY KEY,
  "waNumber"  TEXT NOT NULL,
  "payload"   TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "expiresAt" TIMESTAMP(3) NOT NULL
);

CREATE UNIQUE INDEX IF NOT EXISTS "WaPending_waNumber_key" ON "WaPending"("waNumber");
