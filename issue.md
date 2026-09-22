# [Feature] Ganti Istilah "Santri" Menjadi "Gelara" (Teks Tampilan Saja)

**Tipe:** Text/Copy change
**Estimasi:** 30–60 menit
**Project:** izin-asrama-v5 (Next.js 16 App Router + Tailwind CSS v4 + TypeScript)


---

## 1. Ringkasan

Beberapa teks yang tampil ke pengguna di aplikasi masih memakai kata **"Santri"**, padahal istilah yang sudah dipakai konsisten di hampir seluruh aplikasi (halaman Panduan SOP, halaman Kelola Akun, form tambah akun, dst) adalah **"Gelara"**. Tugas ini merapikan sisa-sisa teks yang belum konsisten tersebut.

## 2. PENTING — Baca Bagian Ini Dulu Sebelum Mulai (Batasan Scope)

Ini bagian paling penting di dokumen ini.

**JANGAN** melakukan "cari-ganti" (find & replace) kata "santri" secara membabi-buta ke seluruh kode. Kalau itu dilakukan, aplikasi akan rusak. Sudah dicek satu-per-satu ke seluruh project, dan kata "santri" ternyata juga dipakai untuk hal-hal yang **bukan teks tampilan**, yaitu:

- **Nilai asli di database**: kolom `role` di tabel `users` memakai `check (role in ('SANTRI', 'PENGURUS'))`. Ini data logic untuk cek hak akses (akun Gelara vs akun Pengurus/Mentor), bukan teks yang dibaca user. Dipakai di banyak file lewat perbandingan seperti `role === "SANTRI"`.
- **Nama variabel, fungsi, dan tipe TypeScript internal**, contoh: `IzinWithSantri`, `getRiwayatIzinSantri`, `BerandaSantri`, `totalSantri`, `nama_santri`, `santriName`.
- **Nama folder/route**: `src/app/santri/actions.ts` — ini kumpulan server action untuk proses pengajuan/pengembalian izin, bukan halaman yang dilihat user, jadi bukan "teks tampilan".
- **Data contoh (seed)** di `scripts/seed.mjs` (username demo `santri1`, `santri2`).
- **Dokumentasi developer** di `README.md`.

Kalau salah satu hal di atas ikut diubah, kemungkinan besar aplikasi akan **error saat build** (TypeScript type mismatch, karena tipe `"SANTRI" | "PENGURUS"` dipakai di banyak file dan harus sama persis dengan nilai di database) atau fitur login/filter akun jadi rusak (karena data yang sudah tersimpan di database masih `'SANTRI'`, bukan `'GELARA'`).

**Tugas ini HANYA mengubah teks yang betul-betul dibaca/dilihat pengguna di layar aplikasi (atau di file Excel hasil unduhan), bukan kode logic di baliknya.**

Kabar baiknya: setelah dicek satu-per-satu ke seluruh project, hampir seluruh teks yang tampil ke user **sudah benar** memakai kata "Gelara" (misalnya di halaman `/panduan`, halaman `/kelola-akun`, form tambah akun). Yang tersisa hanya **4 titik** yang masih "bocor" memakai kata "Santri" pada teks yang tampil ke user. Daftar lengkapnya ada di bagian 4 — tidak perlu mencari sendiri, tinggal diterapkan.

## 3. Definisi Selesai (Acceptance Criteria)

- [ ] 4 titik teks pada bagian 4 sudah diubah dari "Santri" menjadi "Gelara", mengikuti huruf besar/kecil sesuai konteks kalimat masing-masing.
- [ ] Tidak ada satu pun nama variabel, fungsi, tipe, kolom/nilai database, atau nama folder/route yang ikut berubah.
- [ ] `npm run build` (atau minimal `npm run lint`) tetap sukses tanpa error baru.
- [ ] Login, kelola akun (tambah/ubah/blacklist akun Gelara), dan export laporan tetap berjalan normal seperti sebelum perubahan.
- [ ] Verifikasi dengan `grep` di bagian 6 menghasilkan output sesuai yang diharapkan (tidak kurang, tidak lebih).

## 4. Daftar Perubahan (Sudah Ditemukan — Tinggal Diterapkan)

Ini **satu-satunya 4 perubahan** yang perlu dilakukan. Buka setiap file, cari baris persis seperti di bawah, lalu ganti sesuai instruksi. Jangan ubah baris lain di sekitarnya.

### 4.1 `src/components/AccountRow.tsx`

Tombol untuk memblokir akun, muncul di halaman `/kelola-akun` (hanya terlihat oleh Pengurus/Mentor saat mengelola akun Gelara yang belum di-blacklist).

Cari baris ini:

```tsx
                        >
                          Blacklist Santri
                        </button>
```

Ganti kata di dalam tombolnya:

```tsx
                        >
                          Blacklist Gelara
                        </button>
```

### 4.2 `src/components/StatsLanding.tsx`

Kalimat penjelasan pada kartu "Alur & SOP Perizinan Asrama" di halaman landing publik (`/`).

Cari:

```tsx
                Pelajari alur pengajuan izin, kategori izin, dan ketentuan validasi radius kepulangan santri.
```

Ganti menjadi:

```tsx
                Pelajari alur pengajuan izin, kategori izin, dan ketentuan validasi radius kepulangan gelara.
```

### 4.3 `src/app/santri/actions.ts`

Nilai cadangan (fallback) untuk nama pengguna, dipakai saat menyusun teks notifikasi push "*... telah kembali ke asrama*" — hanya terpakai kalau nama akun kosong/tidak diketahui.

Cari:

```ts
    session.user.name ?? "Santri",
```

Ganti menjadi:

```ts
    session.user.name ?? "Gelara",
```

Catatan: **jangan** mengganti nama file atau folder (`santri/actions.ts`). Path file ini bagian dari struktur routing internal, bukan teks yang tampil ke user.

### 4.4 `src/lib/excel.ts`

Judul kolom pada file Excel yang diunduh Pengurus/Mentor saat export laporan izin — ini teks yang dilihat langsung oleh user saat membuka file Excel-nya.

Cari:

```ts
    { header: "Nama Santri", key: "nama_santri", width: 22 },
```

Ganti **hanya bagian `header`**. Biarkan `key: "nama_santri"` tetap sama persis — itu nama kolom data internal (dipetakan dari tipe `IzinWithSantri`), bukan teks yang tampil:

```ts
    { header: "Nama Gelara", key: "nama_santri", width: 22 },
```

## 5. Tahapan Pengerjaan

1. Baca bagian 2 (Batasan Scope) sampai benar-benar paham — ini kunci supaya tidak salah mengubah bagian yang seharusnya tidak disentuh.
2. Buka satu per satu dari 4 file pada bagian 4, terapkan perubahan persis seperti instruksinya.
3. Jalankan perintah verifikasi di bagian 6, cocokkan hasilnya dengan yang diharapkan.
4. Jalankan `npm run build` (atau `npm run lint`) untuk memastikan tidak ada error baru.
5. Jalankan `npm run dev`, lalu cek manual sesuai checklist di bagian 7.

## 6. Cara Verifikasi (Sebelum & Sesudah)

Jalankan perintah ini di root folder project:

```bash
grep -rni "santri" src/ scripts/ README.md
```

**Sebelum** perubahan, perintah ini menampilkan cukup banyak baris — termasuk banyak yang memang **harus tetap ada** karena bukan bagian dari tugas ini.

**Sesudah** perubahan, baris-baris berikut **harus tetap muncul** di hasil grep (artinya tidak sengaja ikut terhapus — ini semua memang tidak boleh diubah):

- Semua kemunculan `SANTRI` huruf besar (nilai role database) di file: `database.types.ts`, `next-auth.d.ts`, `auth.config.ts`, `kelola-akun/actions.ts`, `kelola-akun/page.tsx`, `AccountRow.tsx`, `AccountForm.tsx`, `app/page.tsx`, `izin.service.ts`.
- Semua identifier kode seperti `IzinWithSantri`, `getRiwayatIzinSantri`, `BerandaSantri`, `totalSantri`, `nama_santri`, `santriName`.
- Path `src/app/santri/actions.ts` dan import `@/app/santri/actions` di komponen lain.
- Isi `scripts/seed.mjs` dan `README.md`.

Sebaliknya, 4 baris berikut **harus sudah tidak muncul lagi** (karena sudah diganti menjadi "Gelara"):

- `Blacklist Santri`
- `kepulangan santri.`
- `?? "Santri"`
- `header: "Nama Santri"`

Kalau hasil grep sesuai dua daftar di atas, perubahan sudah tepat sasaran — tidak kurang, tidak berlebihan.

## 7. Checklist Pengujian Manual

- [ ] Login sebagai Pengurus/Mentor → buka `/kelola-akun` → cari akun Gelara yang belum di-blacklist → tombolnya sekarang bertuliskan **"Blacklist Gelara"**.
- [ ] Buka halaman landing `/` (tanpa perlu login) → scroll ke kartu "Alur & SOP Perizinan Asrama" → kalimat di bawah judul berakhir dengan **"...kepulangan gelara."**
- [ ] Login sebagai Pengurus/Mentor → export laporan izin ke Excel → buka file-nya → judul kolom nama sekarang **"Nama Gelara"**, bukan "Nama Santri".
- [ ] Baca ulang baris di `src/app/santri/actions.ts` (fallback nama) — pastikan sudah `"Gelara"`. Sulit ditest lewat UI langsung karena hanya muncul kalau nama akun kosong (kasus jarang), cukup dicek lewat kode.
- [ ] `npm run build` sukses tanpa error baru.

## 8. Di Luar Cakupan (Sengaja TIDAK Dikerjakan di Tugas Ini)

- Mengganti nilai `'SANTRI'` di database (kolom `role` tabel `users`) menjadi `'GELARA'`. Ini pekerjaan terpisah yang jauh lebih besar dan berisiko — butuh migrasi database (`ALTER TABLE`, update `check constraint`, update data yang sudah ada), plus update semua logic yang membandingkan nilai role di banyak file sekaligus. Kalau suatu saat memang ingin dilakukan, buat issue terpisah, jangan digabung dengan tugas teks ini.
- Mengganti nama route/folder `src/app/santri/` menjadi `src/app/gelara/`.
- Mengganti nama variabel, fungsi, atau tipe TypeScript internal (`IzinWithSantri`, `getRiwayatIzinSantri`, `BerandaSantri`, `totalSantri`, `nama_santri`, `santriName`, dst).
- Mengganti username akun contoh di `scripts/seed.mjs` (`santri1`, `santri2`).
- Mengubah `README.md` atau komentar kode untuk developer.