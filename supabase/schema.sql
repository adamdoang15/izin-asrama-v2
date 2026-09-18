-- Izin Asrama V2
-- Aman untuk database baru. Jika Anda sudah memakai schema V1, lihat migration.sql.

create table if not exists public.users (
  id bigint generated always as identity primary key,
  username text unique not null,
  password_hash text not null,
  name text not null,
  role text not null check (role in ('SANTRI', 'PENGURUS')),
  kamar text,
  is_active boolean not null default true,
  is_blacklisted boolean not null default false,
  blacklist_reason text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.izin (
  id bigint generated always as identity primary key,
  user_id bigint not null references public.users(id) on delete restrict,
  jenis_izin text not null default 'HARIAN' check (jenis_izin in ('HARIAN','MENGINAP','REKREASI','KELUARGA','DARURAT')),
  alasan text not null,
  tujuan text not null,
  tanggal_keluar timestamptz not null,
  perkiraan_kembali timestamptz not null,
  status text not null default 'MENUNGGU' check (status in ('MENUNGGU','DISETUJUI','DITOLAK','SEDANG_KELUAR','SUDAH_KEMBALI','TIDAK_JADI')),
  catatan_admin text,
  approved_by bigint references public.users(id) on delete set null,
  approved_at timestamptz,
  returned_at timestamptz,
  return_status text check (return_status is null or return_status in ('TEPAT_WAKTU','TERLAMBAT')),
  late_minutes integer check (late_minutes is null or late_minutes >= 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint izin_waktu_valid check (perkiraan_kembali > tanggal_keluar)
);

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
create index if not exists idx_izin_user on public.izin(user_id);
create index if not exists idx_izin_status on public.izin(status);
create index if not exists idx_izin_keluar on public.izin(tanggal_keluar);
create index if not exists idx_izin_created on public.izin(created_at desc);
create index if not exists idx_izin_logs_izin on public.izin_logs(izin_id, created_at desc);

alter table public.users enable row level security;
alter table public.izin enable row level security;
alter table public.izin_logs enable row level security;

create index if not exists idx_izin_active_schedule on public.izin(status, tanggal_keluar);
