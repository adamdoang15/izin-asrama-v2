# Planning: Halaman SOP/Panduan Perizinan Asrama

## Latar Belakang

Halaman publik ("/") saat ini hanya menampilkan statistik izin, belum ada penjelasan alur/prosedur perizinan untuk santri maupun wali santri. Perlu dibuatkan halaman panduan (SOP) terpisah, plus teaser singkat di halaman "/" yang mengarahkan ke halaman tersebut.

Catatan: **tidak perlu memasukkan informasi kontak** (nomor telepon/WA pengurus, dsb) pada iterasi ini.

---

## Task 1: Halaman Panduan/SOP Baru

**Tujuan:** Menyediakan halaman publik (tanpa login) yang menjelaskan alur dan aturan perizinan asrama secara lengkap, supaya santri dan wali santri paham prosesnya tanpa perlu bertanya langsung ke pengurus.

**Yang perlu dilakukan:**
- Buat halaman baru dengan rute tersendiri (misal `/panduan`), terpisah dari halaman statistik "/", karena sifat kontennya berbeda (teks prosedural panjang vs ringkasan angka).
- Susun isi panduan secara garis besar mencakup:
  1. Alur pengajuan izin dari awal sampai akhir (mengajukan → menunggu persetujuan → disetujui/ditolak → keluar asrama → kembali), termasuk penjelasan singkat kenapa ada permintaan izin lokasi saat menandai kepulangan.
  2. Jenis-jenis izin yang tersedia dan gambaran kapan masing-masing dipakai.
  3. Ketentuan waktu kepulangan dan konsekuensi jika terlambat.
  4. Pertanyaan umum (FAQ) seputar hal-hal yang sering membingungkan pengguna (misal soal izin akses lokasi, atau lupa menandai kembali).
- Gunakan gaya penulisan yang mudah dipahami orang awam (bukan istilah teknis sistem), karena target pembacanya termasuk wali santri.
- Pastikan halaman ini bisa diakses tanpa login, konsisten dengan sifat halaman publik lain di aplikasi.

**File/area relevan (referensi, tidak wajib diikuti persis):**
- Folder rute baru di `src/app/panduan/` (mengikuti pola halaman publik `src/app/page.tsx`).
- `src/components/PublicNav.tsx` — tambahkan link navigasi ke halaman panduan ini, terlihat baik oleh pengunjung yang belum maupun sudah login.

**Kriteria selesai:**
- [ ] Ada halaman panduan yang bisa diakses tanpa login.
- [ ] Isi panduan mencakup alur izin, jenis izin, ketentuan waktu, dan FAQ dasar.
- [ ] Link ke halaman panduan tersedia di navigasi publik.
- [ ] Tidak ada informasi kontak yang ditampilkan pada halaman ini.

---

## Task 2: Teaser Singkat di Halaman "/"

**Tujuan:** Memberi pengunjung halaman statistik ("/") gambaran singkat soal alur perizinan, tanpa membuat halaman tersebut penuh dengan teks panjang.

**Yang perlu dilakukan:**
- Tambahkan satu bagian ringkas (beberapa poin saja, bukan penjelasan lengkap) di halaman "/" yang merangkum inti alur perizinan.
- Sertakan tombol/link yang mengarah ke halaman panduan lengkap (`/panduan`) hasil Task 1.
- Pastikan section ini tidak mengganggu tata letak statistik yang sudah ada, ditempatkan secara wajar (misal di bagian bawah halaman).

**File relevan:** `src/app/page.tsx` (dan/atau komponen baru untuk section ini bila dianggap perlu dipisah agar rapi).

**Kriteria selesai:**
- [ ] Ada section ringkas di halaman "/" yang mengarahkan pengunjung ke halaman panduan lengkap.
- [ ] Section ini tidak mengubah/merusak tampilan statistik yang sudah ada.

---

## Di Luar Cakupan (Non-goals)

- Tidak menampilkan informasi kontak (telepon/WA/email pengurus) di halaman panduan maupun teaser.
- Tidak membuat fitur pencarian/filter di dalam halaman panduan pada iterasi ini.
- Tidak membuat sistem manajemen konten (CMS) untuk mengedit isi panduan lewat UI — cukup konten statis di kode terlebih dahulu.