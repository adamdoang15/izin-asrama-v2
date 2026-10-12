-- Migrasi: Tambah kolom kelas pada tabel users
alter table public.users add column if not exists kelas text;
