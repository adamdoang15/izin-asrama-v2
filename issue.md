# Planning: Fitur Ganti Kata Sandi Sendiri (Santri)

## Latar Belakang

Saat ini, kata sandi santri hanya bisa direset oleh pengurus lewat halaman `kelola-akun` (`updateAccountAction`), tanpa perlu tahu password lama. Perlu ditambahkan fitur agar santri (dan idealnya juga pengurus) bisa mengganti kata sandi mereka sendiri secara mandiri, tanpa melibatkan admin setiap kali.

Fitur ini berbeda dari reset password oleh admin: karena dilakukan sendiri oleh pemilik akun, **wajib memverifikasi password lama** terlebih dahulu sebelum password baru diterapkan, sebagai lapisan keamanan.

---

## Task 1: Halaman/Section "Pengaturan Akun"

**Tujuan:** Menyediakan tempat bagi pengguna yang sudah login (santri maupun pengurus) untuk mengelola akunnya sendiri, dimulai dari ganti kata sandi.

**Yang perlu dilakukan:**
- Buat halaman baru khusus untuk pengaturan akun pribadi (misalnya `/pengaturan`), terpisah dari halaman `kelola-akun` yang memang khusus untuk pengurus mengelola akun orang lain.
- Halaman ini hanya bisa diakses oleh pengguna yang sudah login (mengikuti pola proteksi yang sudah ada untuk halaman `beranda`).
- Sediakan form sederhana berisi: password lama, password baru, dan konfirmasi password baru.
- Tambahkan link/menu ke halaman ini dari tempat yang mudah dijangkau pengguna yang sudah login (misalnya dari halaman `beranda`).

**File/area relevan (referensi, tidak wajib diikuti persis):**
- Folder rute baru `src/app/pengaturan/` (ikuti pola proteksi & struktur `src/app/beranda/`).
- `src/lib/auth.ts` — untuk memastikan hanya pengguna yang login yang bisa akses.

**Kriteria selesai:**
- [ ] Ada halaman pengaturan akun yang hanya bisa diakses saat sudah login.
- [ ] Formulir ganti kata sandi tersedia dan mudah ditemukan dari halaman utama pengguna.

---

## Task 2: Logic Ganti Kata Sandi (Server-side)

**Tujuan:** Memastikan proses ganti kata sandi aman — hanya berhasil jika pengguna benar-benar tahu kata sandi lamanya.

**Yang perlu dilakukan:**
- Buat server action baru khusus untuk ganti kata sandi sendiri (terpisah dari `updateAccountAction` milik admin, karena aturan validasinya berbeda).
- Alur validasi:
  1. Ambil data pengguna yang sedang login dari sesi (bukan dari input form, supaya tidak bisa mengganti password akun orang lain).
  2. Cocokkan password lama yang diinput dengan `password_hash` yang tersimpan.
  3. Jika tidak cocok, tolak dengan pesan error yang jelas.
  4. Jika cocok, validasi password baru (minimal panjang karakter, sebaiknya samakan aturannya dengan yang sudah dipakai di `kelola-akun`), lalu simpan sebagai hash baru menggunakan mekanisme hashing yang sama seperti sekarang (`bcrypt`).
- Setelah berhasil, tampilkan konfirmasi sukses ke pengguna.

**File/area relevan (referensi, tidak wajib diikuti persis):**
- `src/app/pengaturan/actions.ts` (baru) — logic server action ganti password.
- `src/services/user.service.ts` (`updateUser`) — bisa dipakai ulang untuk menyimpan `password_hash` baru.
- `src/app/kelola-akun/actions.ts` — jadikan referensi pola validasi & hashing password yang sudah ada.

**Kriteria selesai:**
- [ ] Password baru hanya bisa disimpan jika password lama yang diinput benar.
- [ ] Pengguna tidak bisa mengganti password akun lain (hanya password milik sesi yang sedang login).
- [ ] Ada pesan error yang jelas untuk kasus: password lama salah, password baru terlalu pendek, atau konfirmasi password tidak cocok.
- [ ] Ada pesan sukses setelah password berhasil diganti.

---

## Di Luar Cakupan (Non-goals)

- Tidak membuat fitur "lupa password" (self-service reset tanpa tahu password lama) pada iterasi ini — itu tetap ditangani lewat reset oleh pengurus di `kelola-akun`.
- Tidak mengubah field profil lain (nama, kamar, dsb) pada iterasi ini — fokus hanya pada ganti kata sandi.
- Tidak menambahkan fitur "logout dari semua perangkat" setelah ganti password pada iterasi ini.