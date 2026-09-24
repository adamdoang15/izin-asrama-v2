-- MIGRASI DARI Izin Asrama V1 -> V2
-- Jalankan SATU KALI di Supabase SQL Editor jika database lama sudah berisi users/izin.
-- Backup database terlebih dahulu.

alter table public.users add column if not exists is_active boolean not null default true;
alter table public.users add column if not exists updated_at timestamptz not null default now();

alter table public.izin add column if not exists jenis_izin text not null default 'HARIAN';
alter table public.izin add column if not exists approved_at timestamptz;
alter table public.izin add column if not exists returned_at timestamptz;
alter table public.izin add column if not exists updated_at timestamptz not null default now();

-- V1 hanya mengenal tiga status. Constraint lama harus dilepas sebelum status V2 dimasukkan.
do $$
declare r record;
begin
  for r in select conname from pg_constraint where conrelid = 'public.izin'::regclass and contype = 'c' and pg_get_constraintdef(oid) ilike '%status%' loop
    execute format('alter table public.izin drop constraint if exists %I', r.conname);
  end loop;
end $$;

alter table public.izin add constraint izin_status_v2 check (status in ('MENUNGGU','DISETUJUI','DITOLAK','SEDANG_KELUAR','SUDAH_KEMBALI','TIDAK_JADI'));
alter table public.izin add constraint izin_jenis_v2 check (jenis_izin in ('HARIAN','MENGINAP','REKREASI','KELUARGA','DARURAT'));
alter table public.izin add constraint izin_waktu_valid check (perkiraan_kembali > tanggal_keluar);

-- Penting: histori izin tidak lagi ikut terhapus ketika akun diarsipkan.
alter table public.izin drop constraint if exists izin_user_id_fkey;
alter table public.izin add constraint izin_user_id_fkey foreign key (user_id) references public.users(id) on delete restrict;

create table if not exists public.izin_logs (
  id bigint generated always as identity primary key,
  izin_id bigint not null references public.izin(id) on delete cascade,
  actor_id bigint references public.users(id) on delete set null,
  action text not null,
  old_status text,
  new_status text,
  catatan text,
  created_at timestamptz not null default now()
);

create index if not exists idx_users_role_active on public.users(role, is_active);
create index if not exists idx_izin_status on public.izin(status);
create index if not exists idx_izin_keluar on public.izin(tanggal_keluar);
create index if not exists idx_izin_logs_izin on public.izin_logs(izin_id, created_at desc);

alter table public.users enable row level security;
alter table public.izin enable row level security;
alter table public.izin_logs enable row level security;

-- Perubahan alur V3: kepulangan dicatat oleh Gelara, bukan petugas.
alter table public.izin add column if not exists return_status text;
alter table public.izin add column if not exists late_minutes integer;

-- Validasi nilai status kepulangan.
do $$
declare r record;
begin
  for r in select conname from pg_constraint where conrelid = 'public.izin'::regclass and contype = 'c' and pg_get_constraintdef(oid) ilike '%return_status%' loop
    execute format('alter table public.izin drop constraint if exists %I', r.conname);
  end loop;
end $$;

alter table public.izin add constraint izin_return_status_valid
  check (return_status is null or return_status in ('TEPAT_WAKTU','TERLAMBAT'));

alter table public.izin add constraint izin_late_minutes_valid
  check (late_minutes is null or late_minutes >= 0);

create index if not exists idx_izin_active_schedule on public.izin(status, tanggal_keluar);

-- Perubahan alur V4: Fitur blacklist santri
alter table public.users add column if not exists is_blacklisted boolean not null default false;
alter table public.users add column if not exists blacklist_reason text;

-- Perubahan alur V5: Fitur "Minta Revisi" (pengurus menandai, gelara yang merevisi)
alter table public.izin_logs add column if not exists data_sebelum jsonb;
alter table public.izin_logs add column if not exists data_sesudah jsonb;

-- Constraint status lama harus dilepas dulu sebelum status baru ditambahkan,
-- sama seperti pola yang dipakai waktu migrasi V1 -> V2 di atas.
do $$
declare r record;
begin
  for r in select conname from pg_constraint where conrelid = 'public.izin'::regclass and contype = 'c' and pg_get_constraintdef(oid) ilike '%status%' and pg_get_constraintdef(oid) ilike '%MENUNGGU%' loop
    execute format('alter table public.izin drop constraint if exists %I', r.conname);
  end loop;
end $$;

alter table public.izin add constraint izin_status_v5
  check (status in ('MENUNGGU','PERLU_REVISI','DISETUJUI','DITOLAK','SEDANG_KELUAR','SUDAH_KEMBALI','TIDAK_JADI'));

-- Perubahan alur V6: Fitur Edit & Hapus pengajuan izin oleh pengurus
alter table public.izin add column if not exists deleted_by bigint references public.users(id) on delete set null;
alter table public.izin add column if not exists deleted_at timestamptz;

-- Sama seperti pola migrasi status sebelumnya: lepas dulu constraint lama.
do $$
declare r record;
begin
  for r in select conname from pg_constraint where conrelid = 'public.izin'::regclass and contype = 'c' and pg_get_constraintdef(oid) ilike '%status%' and pg_get_constraintdef(oid) ilike '%MENUNGGU%' loop
    execute format('alter table public.izin drop constraint if exists %I', r.conname);
  end loop;
end $$;

alter table public.izin add constraint izin_status_v6
  check (status in ('MENUNGGU','PERLU_REVISI','DISETUJUI','DITOLAK','SEDANG_KELUAR','SUDAH_KEMBALI','TIDAK_JADI','DIHAPUS'));

-- Perubahan alur V7: Tanggal Berakhir (Expiry Date) pada Fitur Blacklist
alter table public.users add column if not exists blacklist_until date;
alter table public.users add column if not exists blacklisted_at timestamptz;



