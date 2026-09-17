# Planning: Perbaikan Halaman Publik ("/")

## Latar Belakang

Dari hasil review UI/UX dan keamanan pada halaman publik ("/" — `PublicNav` + `StatsLanding`), ada 4 perbaikan yang perlu dikerjakan: caching data, kerapian tampilan grid statistik di layar kecil, metadata SEO & `robots.txt`, serta security headers dasar untuk aplikasi.

Catatan: penyebutan "gelara" untuk santri di halaman publik **bukan typo**, itu istilah resmi yang dipakai di asrama ini. Jangan diubah — fokus perbaikan grid ini murni pada tata letak (layout), bukan teks/istilah.

---

## Task 1: Caching (Revalidate) Halaman Publik

**Masalah:** Halaman publik menjalankan query ke database setiap kali ada yang membuka "/", padahal halaman ini bisa diakses siapa saja tanpa login/rate limit — berisiko membebani database secara tidak perlu (termasuk dari bot/crawler).

**Yang perlu dilakukan:**
- Tambahkan mekanisme caching berbasis waktu (revalidate/ISR) pada halaman publik, sehingga query ke database tidak berjalan di setiap kunjungan, melainkan disegarkan secara berkala.
- Tentukan durasi cache yang wajar — cukup singkat agar statistik tetap terasa "hidup", tapi cukup panjang untuk mengurangi beban database secara signifikan (didiskusikan/diputuskan saat implementasi, tidak harus presisi di awal).

**File relevan:** `src/app/page.tsx`

**Kriteria selesai:**
- [ ] Halaman publik tidak lagi query database di setiap request; ada mekanisme revalidate yang jelas.
- [ ] Statistik yang ditampilkan tetap wajar (tidak basi berlebihan) untuk kebutuhan pemantauan publik.

---

## Task 2: Perbaikan Grid Statistik di Mobile

**Masalah:** Ada 5 kartu statistik (`Total izin`, `Disetujui`, `Sedang keluar`, `Sudah kembali`, `Ditolak`) yang disusun dalam grid 2 kolom di layar mobile. Karena 5 tidak habis dibagi 2, satu kartu ("Ditolak") jadi sendirian di baris terakhir dan terlihat tidak rapi.

**Yang perlu dilakukan:**
- Sesuaikan susunan kolom grid untuk berbagai ukuran layar (mobile, tablet, desktop) supaya kartu-kartu tersusun rapi dan seimbang, tanpa ada kartu yang "menggantung" sendirian.
- Pastikan tampilan tetap enak dilihat di ukuran layar yang umum dipakai (HP kecil s/d desktop lebar).
- Tidak perlu mengubah konten, urutan, atau istilah pada kartu — murni penyesuaian layout.

**File relevan:** `src/components/StatsLanding.tsx`

**Kriteria selesai:**
- [ ] Tidak ada kartu statistik yang berdiri sendiri di baris terakhir pada ukuran layar mobile umum.
- [ ] Layout tetap terlihat rapi di ukuran layar mobile, tablet, dan desktop.

---

## Task 3: Metadata SEO + robots.txt

**Masalah:** Halaman publik saat ini hanya memakai metadata umum dari layout utama aplikasi (title/description generik untuk seluruh app), belum ada metadata khusus untuk halaman ini. Belum ada juga keputusan/konfigurasi eksplisit soal apakah halaman ini boleh diindeks mesin pencari.

**Yang perlu dilakukan:**
- Tambahkan metadata yang lebih spesifik untuk halaman publik ini (judul, deskripsi, dan gambar/preview bila relevan), supaya tampil lebih informatif saat dibagikan lewat link (mis. ke wali santri lewat chat/WhatsApp).
- Tentukan keputusan: apakah halaman ini memang ingin bisa ditemukan lewat mesin pencari (Google, dsb) atau tidak.
- Berdasarkan keputusan itu, tambahkan `robots.txt` (dan `sitemap` bila memang ingin diindeks) yang sesuai.

**File relevan:** `src/app/page.tsx` / `src/app/layout.tsx`, serta file `robots.txt`/`sitemap` baru di `src/app/`.

**Kriteria selesai:**
- [ ] Halaman publik punya metadata sendiri yang relevan (bukan cuma warisan dari layout global).
- [ ] Ada keputusan eksplisit soal indexing, dituangkan dalam `robots.txt` (dan `sitemap` bila perlu).

---

## Task 4: Security Headers

**Masalah:** Konfigurasi Next.js (`next.config.ts`) belum mengatur HTTP security headers dasar untuk aplikasi (mis. pencegahan clickjacking, MIME sniffing, kebijakan referrer, dsb).

**Yang perlu dilakukan:**
- Tambahkan konfigurasi HTTP security headers standar di level aplikasi (bukan hanya untuk halaman publik, tapi berlaku ke seluruh situs), mengikuti praktik umum untuk aplikasi Next.js.
- Pastikan penambahan header ini tidak mengganggu fungsi yang sudah ada (login, push notification, dsb) — perlu dicoba/diuji setelah ditambahkan.

**File relevan:** `next.config.ts`

**Kriteria selesai:**
- [ ] Ada security headers dasar yang aktif di seluruh aplikasi.
- [ ] Fitur-fitur yang sudah berjalan (login, notifikasi push, dsb) tetap berfungsi normal setelah header ditambahkan.

---

## Di Luar Cakupan (Non-goals)

- Tidak mengubah istilah/penyebutan yang sudah sesuai dengan konteks asrama (mis. "gelara").
- Tidak membuat sistem caching yang kompleks (mis. cache layer terpisah/Redis) — cukup memanfaatkan mekanisme bawaan Next.js.
- Tidak mengubah desain visual/konten statistik secara keseluruhan, hanya menyesuaikan layout grid yang bermasalah.