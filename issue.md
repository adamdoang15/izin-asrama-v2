# Bug: Gagal Absen Kembali karena Lokasi GPS Meleset/Timeout di Asrama

## Kejadian Nyata (untuk konteks)
Seorang Gelara sudah berada di asrama tapi tidak bisa menekan "Saya sudah
kembali":
- Lewat data seluler → ditolak, sistem membaca jaraknya **1039 meter**
  dari asrama (jelas salah, dia ada di lokasi yang sama).
- Dicoba lagi pakai WiFi asrama → malah **timeout**, tidak dapat lokasi
  sama sekali.
- Google Maps di HP yang sama menunjukkan lokasi akurat di asrama.

## Akar Masalah
Bukan salah radius atau titik koordinat asrama — ini soal cara sistem
meminta lokasi ke browser (`src/components/ReturnIzinButton.tsx`,
fungsi `navigator.geolocation.getCurrentPosition`):

1. **Sekali tembak, batas waktu pendek.** Hanya minta 1 kali lokasi dengan
   `timeout: 10000` (10 detik) dan `maximumAge: 0` (tidak boleh pakai hasil
   lama). Di dalam gedung beton, GPS satelit sering butuh lebih dari 10
   detik untuk "kunci" sinyal.
2. **Kalau GPS lambat, browser boleh mengganti ke sumber lain yang lebih
   cepat tapi kasar** — triangulasi menara seluler atau database lokasi
   WiFi. Di area yang jarang "dipetakan" (seperti WiFi internal
   pesantren), hasilnya bisa meleset ratusan meter sampai beberapa
   kilometer. Ini yang menjelaskan angka 1039 meter.
3. **Kalau sumber cepat itu tidak tersedia** (contoh: pas pindah ke WiFi
   asrama yang belum dikenal Google, dan sinyal seluler ikut lemah/mati),
   browser tidak dapat jawaban apa pun dalam 10 detik → **timeout**.
4. **`accuracy` yang dikirim browser tidak pernah dicek.** Setiap hasil
   lokasi sebenarnya disertai radius ketidakpastian (meter), tapi sistem
   saat ini (`src/app/santri/actions.ts`, fungsi `tandaiKembaliAction`)
   langsung memakai lat/lng apa adanya tanpa melihat seberapa bisa
   dipercaya angka itu.
5. **Percobaan yang gagal tidak tercatat di mana pun.** `markIzinReturned`
   (yang menulis ke tabel `izin_logs`) hanya dipanggil kalau validasi
   jarak lolos — jadi kalau gagal, tidak ada jejak untuk didiagnosis
   selain pesan error yang sempat dilihat pengguna saat itu juga.
6. **Tidak ada jalan keluar manual.** Pengurus tidak punya cara menandai
   seseorang "sudah kembali" secara manual untuk kasus force-majeure
   seperti ini (`src/app/admin/actions.ts` belum punya action seperti
   itu).

## Tujuan Perbaikan
- Beri kesempatan lebih besar untuk mendapat lokasi yang benar-benar
  akurat sebelum menyerah ke sumber yang kasar.
- Kalau lokasi yang didapat tetap tidak bisa dipercaya, beri tahu
  pengguna dengan jelas apa yang harus dilakukan — bukan sekadar
  "gagal"/"timeout".
- Simpan jejak setiap percobaan gagal supaya kasus serupa ke depan bisa
  didiagnosis dari data, bukan nebak-nebak dari cerita.
- Sediakan jalan keluar manual untuk Pengurus di kasus yang memang tidak
  bisa diselesaikan lewat GPS (gedung terlalu menghalangi, dll).

## Di Luar Cakupan (dan alasannya)
- **Menaikkan radius toleransi** bukan solusi — kalau radius diperbesar
  sampai bisa menampung kasus seperti 1039m, geofence-nya jadi nyaris
  tidak berguna untuk mendeteksi orang yang memang belum kembali.
- Tidak mengganti metode geolocation ke pihak ketiga (mis. layanan lokasi
  berbayar) — cukup memaksimalkan API geolocation browser yang sudah ada
  dengan lebih baik.

## Rencana Perubahan

### Fase 1 — Perpanjang waktu tunggu & beri status yang jelas ke pengguna
**File:** `src/components/ReturnIzinButton.tsx`
Naikkan `timeout` dari 10 detik ke kisaran 20–30 detik, dan ubah teks
tombol/status supaya pengguna tahu sistem sedang berusaha ("Mencari
sinyal GPS, mohon tunggu..." bukan cuma spinner polos), supaya tidak
terasa seperti aplikasi hang.

### Fase 2 — Pantau lokasi berkala, bukan sekali tembak
**File:** `src/components/ReturnIzinButton.tsx`
Ganti `getCurrentPosition` (sekali panggil) dengan `watchPosition`
(mengamati beberapa hasil berturut-turut dalam suatu jangka waktu), lalu
pilih hasil dengan nilai `accuracy` terbaik yang didapat sebelum batas
waktu habis — bukan otomatis memakai hasil pertama yang datang. Ini
pendekatan yang dipakai aplikasi seperti Google Maps untuk "menyempurnakan"
titik lokasi.

### Fase 3 — Validasi tingkat akurasi di server
**File:** `src/lib/geo.ts`, `src/app/santri/actions.ts`,
`src/components/ReturnIzinButton.tsx`
- Kirim nilai `accuracy` dari client bersama `latitude`/`longitude` yang
  sudah ada.
- Di `tandaiKembaliAction`, kalau `accuracy` terlalu buruk (perlu
  ditentukan ambang batas yang wajar, misal lebih kasar dari radius
  asrama itu sendiri), tolak dengan pesan yang actionable — contoh:
  "Sinyal GPS kurang akurat (~X meter). Coba dekat jendela atau area
  terbuka, lalu coba lagi." — bukan pesan jarak yang membingungkan seperti
  sekarang.

### Fase 4 — Catat percobaan yang gagal
**File:** `src/app/santri/actions.ts`, `src/services/izin.service.ts`
Setiap kali validasi lokasi gagal (jarak maupun akurasi), simpan 1 baris
ke tabel `izin_logs` yang sudah ada (pola yang sama seperti dipakai
`markIzinReturned` — kolom `action`, `catatan` berisi lat/lng/accuracy/
jarak). Tidak perlu tabel baru, cukup manfaatkan struktur log yang sudah
ada dengan `action` baru misalnya `'GAGAL_VALIDASI_LOKASI'`.

### Fase 5 — Tombol override manual untuk Pengurus
**File:** `src/app/admin/actions.ts`, `src/services/izin.service.ts`,
halaman/komponen daftar izin Pengurus
Tambahkan action baru mengikuti pola action admin yang sudah ada (contoh
`hapusIzinAction`/`editIzinAction`): wajib isi alasan/catatan, panggil
`requireAdmin()`, lalu tandai izin sebagai `SUDAH_KEMBALI` tanpa syarat
GPS — dicatat jelas di `izin_logs` bahwa ini kepulangan yang ditandai
manual oleh Pengurus beserta alasannya, supaya tetap bisa diaudit.

## Kriteria Penerimaan
- [x] Di kondisi sinyal lemah, sistem tidak langsung menyerah dalam 10
      detik — ada percobaan lebih dari sekali dengan indikasi progres ke
      pengguna.
- [x] Lokasi dengan `accuracy` buruk tidak langsung dianggap valid/tidak
      valid begitu saja — pengguna mendapat pesan yang menjelaskan apa
      yang perlu dilakukan.
- [x] Setiap percobaan gagal (jarak maupun akurasi) tercatat di
      `izin_logs` dengan data lokasi & akurasi yang cukup untuk
      didiagnosis nanti tanpa perlu bertanya langsung ke pengguna.
- [x] Pengurus punya cara menandai kepulangan secara manual untuk kasus
      yang tidak terselesaikan lewat GPS, dengan alasan yang wajib diisi
      dan tercatat di log.
- [x] Kasus di latar belakang (1039m lewat data seluler, timeout lewat
      WiFi) bisa diselesaikan lewat salah satu jalur di atas kalau
      terulang.