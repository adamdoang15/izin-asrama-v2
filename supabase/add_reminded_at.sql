-- Migration: Tambah kolom reminded_at ke tabel izin
-- Jalankan di Supabase SQL Editor
-- Fungsi: menandai bahwa notifikasi "10 menit lagi" sudah dikirim untuk izin tertentu

ALTER TABLE izin
  ADD COLUMN IF NOT EXISTS reminded_at TIMESTAMPTZ DEFAULT NULL;

-- Index opsional untuk mempercepat query cron (filter status + reminded_at IS NULL)
CREATE INDEX IF NOT EXISTS idx_izin_reminder
  ON izin (status, perkiraan_kembali)
  WHERE reminded_at IS NULL;
