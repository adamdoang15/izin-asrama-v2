# [UI/UX] Optimasi Desain Responsif Mobile Halaman Login

## 1. Ringkasan Masalah & Sasaran
Tampilan halaman login pada desktop/laptop sudah rapi dengan split-layout (hero kiri, form kanan). Namun, saat dibuka di perangkat mobile (HP), terdapat beberapa kendala UX:
- **Hero Mengambil Ruang Terlalu Banyak**: Panel hero dengan foto asrama terlalu tinggi (`min-h-[340px]`), akibatnya form login terdorong jauh ke bawah dan pengguna harus scroll panjang hanya untuk melihat input username/password.
- **Padding Terlalu Boros di Layar Sempit**: Padding mobile (`p-8`) memakan ruang horizontal layar HP secara berlebihan.
- **Susunan Vertikal Canggung**: Teks copyright hero berada di tengah-tengah (terjepit di antara hero dan form login).
- **Isu Auto-Zoom iOS**: Ukuran font input `text-sm` (14px) berpotensi memicu zoom-in otomatis yang mengganggu pada browser iOS Safari saat fokus ke input.

**Sasaran**: Menjaga estetika desktop yang sudah disukai, sekaligus mengoptimalkan tampilan mobile menjadi **mobile-first login card** yang ringkas, di mana form login langsung terlihat (*near-the-fold*), nyaman diakses satu tangan, dan tetap berestetika *glassmorphism*.

---

## 2. Solusi Desain Mobile (Frontend & UI/UX Principles)

### A. Transformasi Panel Hero pada Mobile
- Ubah hero di layar mobile menjadi **compact header banner** (tinggi proporsional `h-36 sm:h-44 md:h-auto md:min-h-[580px]`):
  - Foto asrama tetap tampil sebagai identitas visual dengan dark/glass overlay.
  - Sembunyikan elemen sekunder yang memakan tempat vertikal di HP (deskripsi panjang dan copyright hero di-`hidden md:block`).
  - Judul sambutan dibuat adaptif (`text-xl sm:text-2xl md:text-4xl`) agar tidak mendominasi layar.

### B. Optimasi Formulir Login pada Mobile
- Form login langsung berada dalam pandangan pertama pengguna (*above/near the fold*).
- Sesuaikan padding kontainer: `p-5 sm:p-8 md:p-12` agar area sentuh tetap lega tanpa membuang ruang layar kecil.
- Spacing form lebih proporsional (`space-y-4` di mobile, `space-y-5` di desktop).
- Ukuran font input diset `text-base md:text-sm` (16px di HP) untuk mematikan auto-zoom bawaan iOS Safari.
- Target sentuh tombol dan field tetap memenuhi standar aksesibilitas minimum (min 44px).

### C. Konsistensi Glassmorphism & Penataan Footer
- Pertahankan kartu kaca `.glass-panel` dengan radius adaptif (`rounded-2xl md:rounded-3xl`).
- Pindahkan copyright di bagian paling bawah kartu agar hanya muncul di akhir halaman.

---

## 3. Prinsip Pengerjaan (/ponytail - Simplicity First)
> *Senior dev advice: Cukup mainkan utility breakpoint Tailwind (sm:, md:) pada satu file JSX. Jangan ubah struktur logika, jangan tambah package baru.*

- **Single File Edit**: Seluruh perbaikan hanya dilakukan di `src/app/login/page.tsx`.
- **Zero New Dependencies**: Tidak memerlukan library CSS tambahan atau package pihak ketiga.
- **Zero Logic Alterations**: Logika `useActionState`, `loginAction`, `state.error`, dan `pending` tetap utuh.

---

## 4. Tahapan Implementasi (High-Level Steps)

### Langkah 1: Audit & Refactor Wrapper Halaman
- Buka file `src/app/login/page.tsx`.
- Sesuaikan padding pembungkus luar (`main`): `p-3 sm:p-6 md:p-10`.
- Sesuaikan radius kartu utama: `rounded-2xl sm:rounded-3xl`.

### Langkah 2: Buat Panel Hero Adaptif untuk Layar Kecil
- Pada kontainer hero (sisi kiri), ganti `min-h-[340px]` menjadi tinggi adaptif: `h-36 sm:h-44 md:h-auto md:min-h-[580px]`.
- Di layar mobile:
  - Perkecil padding hero: `p-5 sm:p-8 md:p-12`.
  - Sembunyikan teks deskripsi panjang dan copyright hero (`hidden md:block`).
  - Atur judul sambutan agar ringkas dan adaptif (`text-xl sm:text-2xl md:text-4xl`).

### Langkah 3: Optimasi Form Login & Input Touch Target
- Pada kontainer form login (sisi kanan), sesuaikan padding: `p-5 sm:p-8 md:p-12`.
- Atur font input menjadi `text-base md:text-sm` agar ramah mobile dan bebas auto-zoom iOS.
- Tempatkan copyright di bagian bawah formulir (setelah link kembali) sehingga alur pembacaan alami dari atas ke bawah.

### Langkah 4: Uji Coba Responsivitas & Build
- Gunakan responsive inspect di browser pada preset HP (360px, 375px iPhone, 390px, tablet 768px, desktop 1024px+).
- Pastikan form login langsung terlihat tanpa perlu scroll jauh di HP.
- Pastikan tidak ada regresi pada tampilan desktop.
- Jalankan verifikasi build: `bun run build`.

---

## 5. Kriteria Selesai (Definition of Done)
- [x] Tampilan halaman login rapi, seimbang, dan proporsional di layar HP (360px - 414px).
- [x] Form login (username, password, tombol masuk) langsung terlihat di layar pertama (*near-the-fold*) tanpa scroll berlebih.
- [x] Input field menggunakan ukuran minimal 16px (`text-base`) di mobile untuk mencegah auto-zoom iOS Safari.
- [x] Tampilan desktop tetap mempertahankan split-layout modern tanpa ada regresi visual.
- [x] Efek glassmorphism (`.glass-panel`, backdrop-blur, subtle border) tetap terjaga konsisten di semua layar.
- [x] Tidak ada dependensi baru yang ditambahkan ke `package.json`.
- [x] Build proyek lolos 100% tanpa error (`bun run build`).

---

## 6. Hal yang DILARANG Dilakukan (Guardrails)
- ❌ Dilarang memecah form menjadi modal dialog atau wizard multi-langkah.
- ❌ Dilarang mengubah nama atribut input `username` dan `password` atau logika server action.
- ❌ Dilarang menginstal library responsive / icon eksternal.
- ❌ Dilarang menghapus asset foto asrama sepenuhnya di mobile (tetap tampil sebagai header banner ringkas).
