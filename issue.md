# Fitur: Validasi Radius Lokasi saat Absensi Kepulangan Santri

## Latar Belakang

Saat ini, santri menandai dirinya sudah kembali ke asrama cukup dengan menekan tombol **"Saya sudah kembali"** (`ReturnIzinButton` → server action `tandaiKembaliAction` di `src/app/santri/actions.ts`). Tidak ada pengecekan apakah santri benar-benar sedang berada di lokasi asrama saat menekan tombol tersebut, sehingga santri bisa saja menandai "sudah kembali" padahal masih di luar.

## Tujuan

Menambahkan validasi lokasi (geofencing) sehingga aksi "Saya sudah kembali" **hanya berhasil jika posisi GPS santri berada dalam radius tertentu dari lokasi asrama**. Di luar radius tersebut, sistem harus menolak dan memberi pesan yang jelas.

## Ide Alur Kerja (High Level)

1. **Konfigurasi lokasi & radius asrama**
   - Tentukan titik koordinat asrama (latitude & longitude) dan radius toleransi dalam meter.
   - Untuk versi awal, cukup simpan sebagai environment variable (mengikuti pola `src/lib/env.ts`). Membuat UI pengaturan untuk pengurus bisa dilakukan belakangan sebagai peningkatan (lihat bagian "Opsional").

2. **Ambil lokasi perangkat santri di sisi client**
   - Saat tombol "Saya sudah kembali" ditekan, minta lokasi perangkat menggunakan Geolocation API bawaan browser, sebelum form benar-benar dikirim ke server.
   - Sertakan latitude & longitude tersebut sebagai data tambahan pada submit ke server action `tandaiKembaliAction`.
   - Tangani dengan pesan yang ramah untuk kondisi: izin lokasi ditolak pengguna, browser/device tidak mendukung geolocation, atau proses pengambilan lokasi gagal/timeout.

3. **Validasi jarak di sisi server (wajib, jangan hanya andalkan client)**
   - Di alur `tandaiKembaliAction` (atau layer service terkait di `izin.service.ts`), hitung jarak antara koordinat yang dikirim santri dengan koordinat asrama.
   - Bandingkan hasilnya dengan radius yang dikonfigurasi.
   - Jika berada di luar radius → tolak proses, kembalikan pesan error yang informatif (misalnya menyebutkan bahwa lokasi berada di luar jangkauan asrama).
   - Jika di dalam radius → lanjutkan proses seperti sekarang (update status ke `SUDAH_KEMBALI`, catat `izin_logs`, kirim notifikasi, dst).

4. **Audit trail (disarankan)**
   - Simpan koordinat dan/atau jarak yang tercatat saat santri menekan tombol kembali, sebagai kolom tambahan pada tabel `izin` atau `izin_logs`. Ini berguna bagi pengurus untuk verifikasi manual jika ada keraguan di kemudian hari.

5. **Pengalaman pengguna (UX)**
   - Tampilkan status "sedang mengambil lokasi..." selagi menunggu GPS.
   - Beri pesan yang jelas dan tidak teknis saat lokasi ditolak, tidak akurat, atau di luar radius.
   - Perhatikan bahwa Geolocation API browser mensyaratkan koneksi HTTPS di production (Vercel sudah otomatis HTTPS, tapi perlu diperhatikan saat pengujian lokal).

## Bagian Kode yang Relevan (referensi awal, tidak wajib diikuti persis)

- `src/components/ReturnIzinButton.tsx` — komponen tombol "Saya sudah kembali", tempat menambahkan logic pengambilan lokasi sebelum submit.
- `src/app/santri/actions.ts` (`tandaiKembaliAction`) — tempat paling tepat untuk menambahkan validasi radius sebelum data disimpan.
- `src/services/izin.service.ts` (`markIzinReturned`) — mungkin perlu disesuaikan agar bisa menerima & menyimpan data lokasi tambahan.
- `supabase/schema.sql` dan `supabase/migration.sql` — tempat menambahkan kolom baru pada tabel `izin`/`izin_logs`, atau tabel pengaturan baru bila diperlukan.
- `src/lib/env.ts` — tempat menambahkan environment variable untuk lokasi asrama & radius jika memakai pendekatan env var.

## Kriteria Selesai (Acceptance Criteria)

- [ ] Santri tidak bisa berhasil menandai "sudah kembali" jika posisi GPS berada di luar radius yang ditentukan.
- [ ] Validasi radius dilakukan di server, bukan hanya di sisi client.
- [ ] Ada pesan error yang jelas untuk kasus: izin lokasi ditolak, lokasi gagal diambil, dan lokasi di luar radius.
- [ ] Lokasi asrama & radius dapat dikonfigurasi tanpa mengubah logic inti (minimal lewat environment variable).
- [ ] Alur "sudah kembali" yang sudah ada (update status, log, notifikasi ke pengurus) tetap berjalan normal ketika santri berada dalam radius.

## Di Luar Cakupan (Non-goals)

- Tidak melakukan tracking lokasi santri secara real-time/berkelanjutan, hanya saat menekan tombol kembali.
- Tidak menerapkan validasi radius pada saat pengajuan izin keluar, hanya pada saat konfirmasi kepulangan.

## Peningkatan Selanjutnya (Opsional, Tidak Wajib di Iterasi Pertama)

- Halaman pengaturan untuk pengurus agar bisa mengubah lokasi asrama & radius toleransi langsung dari UI, tanpa perlu mengubah environment variable atau deploy ulang.