# Issue: Fitur Web Push Notification untuk Sistem Perizinan

## Latar Belakang
Saat ini sistem "Izin Asrama" tidak memiliki notifikasi *real-time*. Pengurus asrama harus melakukan *refresh* halaman untuk melihat apakah ada pengajuan izin baru dari santri. Sebaliknya, santri juga harus mengecek secara manual apakah izin mereka sudah disetujui atau ditolak.

## Objektif (Tugas Anda)
Sebagai developer, Anda ditugaskan untuk mengimplementasikan fitur **Web Push Notification**. Notifikasi ini akan muncul di perangkat pengguna (baik *mobile* maupun *desktop*) pada kondisi berikut:
1. **Pengajuan Baru**: Saat santri mengajukan izin, sistem harus mengirimkan notifikasi ke semua akun Pengurus (Mentor).
2. **Perubahan Status**: Saat pengurus menyetujui (`DISETUJUI`) atau menolak (`DITOLAK`) izin, sistem harus mengirimkan notifikasi kepada santri yang mengajukan izin tersebut.

Pendekatan yang akan digunakan adalah standar Web Push API (Service Worker) dipadukan dengan pustaka `web-push` di sisi *backend* (Next.js Server Actions), dan menyimpan data *subscription* di Supabase.

---

## 🛠️ Tahapan Implementasi (Step-by-Step)

Harap kerjakan secara berurutan dan perhatikan instruksi di setiap tahap.

### Tahap 1: Setup Skema Database (Supabase)
Sistem perlu menyimpan data *subscription* dari browser setiap pengguna agar server tahu ke mana notifikasi harus dikirim.

1. **Buat Tabel Baru di Supabase**:
   Buat tabel bernama `push_subscriptions` dengan kolom berikut (bisa jalankan via SQL Editor di dashboard Supabase):
   ```sql
   create table public.push_subscriptions (
     id bigint generated always as identity primary key,
     user_id bigint not null references public.users(id) on delete cascade,
     endpoint text not null,
     auth text not null,
     p256dh text not null,
     created_at timestamptz not null default now(),
     unique(endpoint)
   );
   ```
2. **Regenerate TypeScript Types**:
   Jalankan perintah `npx supabase gen types typescript --project-id "ID_PROJECT" > src/types/database.types.ts` untuk memperbarui tipe data.

### Tahap 2: Persiapan VAPID Keys & Environment Variables
Web Push API membutuhkan sepasang kunci kriptografi (VAPID keys) untuk keamanan.

1. Install *library* `web-push` di server:
   ```bash
   npm install web-push
   npm install -D @types/web-push
   ```
2. *Generate* VAPID keys menggunakan perintah:
   ```bash
   npx web-push generate-vapid-keys
   ```
3. Tambahkan hasil *generate* ke dalam file `.env.local`:
   ```env
   NEXT_PUBLIC_VAPID_PUBLIC_KEY="<hasil_public_key>"
   VAPID_PRIVATE_KEY="<hasil_private_key>"
   ```
4. Update `src/lib/env.ts` untuk memvalidasi kedua *environment variable* baru tersebut. Ingat bahwa `NEXT_PUBLIC_VAPID_PUBLIC_KEY` harus terekspos ke klien.

### Tahap 3: Pembuatan Service Worker
Browser membutuhkan Service Worker yang berjalan di *background* untuk menerima notifikasi saat website tertutup.

1. Buat file `public/sw.js` (JavaScript murni, bukan TypeScript).
2. Isi file dengan *event listener* `push` yang akan menampilkan notifikasi. Contoh:
   ```javascript
   self.addEventListener('push', function (event) {
     const data = event.data ? event.data.json() : {};
     const title = data.title || 'Notifikasi Izin Asrama';
     const options = {
       body: data.body || 'Anda memiliki pesan baru.',
       icon: '/icon.png', // Opsional, tambahkan icon jika ada
       badge: '/badge.png', // Opsional
       data: data.url || '/'
     };
     event.waitUntil(self.registration.showNotification(title, options));
   });

   self.addEventListener('notificationclick', function(event) {
     event.notification.close();
     event.waitUntil(clients.openWindow(event.notification.data));
   });
   ```

### Tahap 4: Logika Backend (Services & Actions)

1. **Buat `src/services/notification.service.ts`**:
   - Buat fungsi `saveSubscription(userId, subscriptionData)` yang menyimpan data `endpoint`, `keys.auth`, dan `keys.p256dh` ke tabel `push_subscriptions` menggunakan klien Supabase.
   - Buat fungsi `sendNotificationToUser(userId, payload)` yang bertugas mengambil data *subscription* milik user tertentu dari database, menginisiasi `web-push` (dengan `webpush.setVapidDetails`), lalu mengirimkan notifikasi via `webpush.sendNotification`.
   - Buat fungsi `sendNotificationToPengurus(payload)` yang mengambil semua *subscription* dari user dengan role `PENGURUS` dan memanggil `webpush.sendNotification` untuk masing-masing pengurus.

2. **Buat Server Actions (`src/app/actions/notification.ts`)**:
   - Buat sebuah action untuk dipanggil dari *client-side* saat browser berhasil men-*generate* subscription. Action ini bertugas mengambil session user saat ini (`auth()`), lalu meneruskan datanya ke `saveSubscription`.

### Tahap 5: Implementasi Client-Side (Meminta Izin Browser)

1. Buat komponen baru, misalnya `src/components/PushNotificationManager.tsx`.
2. Di dalam komponen ini (berjalan sebagai `"use client"`), gunakan `useEffect` untuk:
   - Mendaftarkan Service Worker (`navigator.serviceWorker.register('/sw.js')`).
   - Meminta izin notifikasi dari pengguna (`Notification.requestPermission()`).
   - Jika diizinkan, lakukan *subscribe* (`serviceWorkerRegistration.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: "NEXT_PUBLIC_VAPID_PUBLIC_KEY" })`).
   - Kirim hasil *subscribe* tersebut ke server melalui Server Action yang dibuat di Tahap 4.
3. Sisipkan komponen `<PushNotificationManager />` ini di dalam layout utama (`src/app/layout.tsx` atau `src/app/beranda/layout.tsx`) agar berjalan otomatis saat pengguna *login*.

### Tahap 6: Trigger Notifikasi (Integrasi ke Izin Service)

1. **Trigger Pengajuan Baru**:
   Buka file `src/services/izin.service.ts`. Di dalam fungsi `createIzin`, setelah izin berhasil di-insert ke database, panggil fungsi `sendNotificationToPengurus` (dari tahap 4) dengan pesan seperti: *"Pengajuan baru dari [Nama Santri]"*.
2. **Trigger Persetujuan / Penolakan**:
   Buka file `src/services/izin.service.ts`. Di dalam fungsi `approveIzin` dan `rejectIzin`, setelah status diupdate di database, panggil fungsi `sendNotificationToUser(izin.user_id, ...)` dengan pesan *"Pengajuan izin Anda telah disetujui/ditolak"*.

---

## 📝 Catatan Khusus untuk Developer
*   **Progressive Enhancement**: Pastikan website tetap berfungsi normal meskipun browser pengguna tidak mendukung Web Push Notification (misalnya di Safari versi lama) atau pengguna menolak memberikan izin. Tangani *error* `pushManager` dengan *graceful* (jangan sampai aplikasi *crash*).
*   **Keamanan**: VAPID Private Key tidak boleh bocor ke *client-side*. Gunakan selalu Server Actions / Route Handlers untuk proses pengiriman (`webpush.sendNotification`).
*   **Format Pesan**: Untuk mempermudah, usahakan *payload* notifikasi selalu berupa objek JSON stringified yang konsisten (mengandung `title`, `body`, dan `url`).
