# Izin Asrama V2

Sistem perizinan keluar lingkungan asrama berbasis Next.js, NextAuth Credentials, Supabase PostgreSQL, Zod, dan bcrypt.

## Perbaikan V2

- Jenis izin: harian, menginap, rekreasi, keluarga, darurat.
- Status operasional: menunggu, disetujui, ditolak, sedang keluar, sudah kembali.
- Petugas dapat menandai santri keluar dan kembali.
- Audit trail pada `izin_logs`.
- Akun dinonaktifkan/diaktifkan, bukan dihapus, sehingga histori izin aman.
- Validasi bentrok jadwal izin.
- Dashboard petugas dengan ringkasan status dan daftar izin hari ini.
- Pencarian nama, filter status, dan pagination riwayat.
- Password di form akun tidak ditampilkan sebagai teks biasa.
- Akun demo tidak ditampilkan di halaman login production.

## Instalasi dari nol

1. Buat project Supabase.
2. Buka SQL Editor Supabase dan jalankan `supabase/schema.sql`.
3. Salin `.env.example` menjadi `.env.local`.
4. Isi `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, dan `AUTH_SECRET`.
5. Jalankan:

```bash
npm install
npm run seed
npm run dev
```

Buka `http://localhost:3000`.

## Jika database lama V1 sudah ada

JANGAN menjalankan `schema.sql` untuk menghapus/mengganti data lama. Jalankan `supabase/migration.sql` satu kali di SQL Editor, lalu jalankan:

```bash
npm install
npm run seed
npm run dev
```

`seed` tidak akan menambah akun demo jika tabel `users` sudah berisi akun.

## Akun demo untuk instalasi baru

- Petugas: `pengurus` / `pengurus123`
- Santri: `santri1` / `santri123`
- Santri: `santri2` / `santri123`

Ganti password demo setelah instalasi. Untuk production, jangan bagikan kredensial demo.

## Deploy ke Vercel

Tambahkan environment variables yang sama di Vercel. Jangan pernah menaruh `SUPABASE_SERVICE_ROLE_KEY` di variable `NEXT_PUBLIC_*` atau file yang dikirim ke browser.

Build lokal:

```bash
npm run build
```

## Alur izin V3

- Gelara mengajukan izin seperti biasa.
- Pengurus/mentor hanya menyetujui atau menolak pengajuan.
- Setelah disetujui, sistem akan otomatis memindahkan status `DISETUJUI` menjadi `SEDANG_KELUAR` ketika `tanggal_keluar` tercapai. Sinkronisasi dilakukan saat dashboard dibuka/di-refresh atau saat aksi terkait dijalankan.
- Gelara menekan `Saya sudah kembali` ketika tiba di asrama.
- Sistem mencatat `returned_at`, `return_status` (`TEPAT_WAKTU`/`TERLAMBAT`), dan `late_minutes`.
- Nama mentor/pengurus yang menyetujui dan waktu persetujuan ditampilkan pada riwayat.

### Database

Jika database Supabase Anda sudah memakai versi sebelumnya, jalankan `supabase/migration.sql` di Supabase SQL Editor satu kali.

Untuk database baru, gunakan `supabase/schema.sql`.
