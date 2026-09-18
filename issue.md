# Perencanaan Fitur Blacklist Santri (Issue/Task)

Dokumen ini berisi detail perencanaan untuk mengimplementasikan fitur **Blacklist** pada aplikasi Izin Asrama. Fitur ini memungkinkan `PENGURUS` untuk mem-blacklist `SANTRI` yang menyalahi aturan, sehingga santri tersebut tidak dapat mengajukan izin baru sampai status blacklist-nya dicabut.

Silakan ikuti langkah-langkah di bawah ini secara berurutan.

---

## 1. Update Skema Database (Supabase)
Kita perlu menambahkan penanda di tabel `users` untuk mengetahui apakah santri tersebut sedang diblacklist atau tidak, beserta alasannya.

**Tugas:**
- Buat file migrasi baru (atau tambahkan di `supabase/schema.sql` jika ini masih tahap development) untuk mengubah tabel `users`:
  ```sql
  ALTER TABLE public.users 
  ADD COLUMN is_blacklisted boolean NOT NULL DEFAULT false,
  ADD COLUMN blacklist_reason text;
  ```
- Jalankan migrasi atau push perubahan schema ini ke database Supabase.

---

## 2. Update Type Definitions (TypeScript)
Agar TypeScript tidak error, kita perlu meng-update tipe data terkait tabel `users`.

**Tugas:**
- Update file `src/types/database.types.ts` (jika di-generate otomatis, jalankan ulang perintah generate dari Supabase CLI, atau tambahkan manual di interface `users` bagian `Row`, `Insert`, dan `Update`).
- Update interface/type `UserRow` (biasanya di `src/lib/types.ts` atau file sejenis) dengan menambahkan:
  ```typescript
  is_blacklisted: boolean;
  blacklist_reason: string | null;
  ```

---

## 3. Update Services (Backend Logic)
Kita perlu membuat fungsi untuk mengatur status blacklist dan mencegah pengajuan izin bagi santri yang diblacklist.

**Tugas di `src/services/user.service.ts`:**
- Buat fungsi baru untuk toggle status blacklist:
  ```typescript
  export async function toggleBlacklistStatus(id: number, isBlacklisted: boolean, reason: string | null): Promise<{ error?: string }> {
    const payload = {
      is_blacklisted: isBlacklisted,
      blacklist_reason: isBlacklisted ? reason : null,
      updated_at: new Date().toISOString()
    };
    
    const { error } = await supabase
      .from("users")
      .update(payload)
      .eq("id", id);
      
    if (error) return { error: `Gagal mengubah status blacklist: ${error.message}` };
    return {};
  }
  ```

**Tugas di `src/services/izin.service.ts`:**
- Cari fungsi yang menangani pembuatan izin baru (misalnya `createIzin` atau `ajukanIzin`).
- Sebelum proses insert data izin ke database, tambahkan validasi untuk mengecek status `is_blacklisted` dari user tersebut.
- Jika `is_blacklisted === true`, batalkan proses dan kembalikan error message: `"Anda sedang diblacklist dan tidak dapat mengajukan izin. Alasan: [blacklist_reason]"`.

---

## 4. Update Server Actions / API Routes
Untuk menghubungkan UI dengan Service, kita butuh Server Action (karena aplikasi ini menggunakan Next.js App Router).

**Tugas:**
- Buat Server Action (misal di `src/app/actions/user.actions.ts` atau tempat yang relevan) yang akan memanggil `toggleBlacklistStatus`.
- Pastikan di dalam Server Action tersebut ada pengecekan otorisasi (authorization check) bahwa **hanya user dengan role `PENGURUS`** yang boleh menjalankan fungsi ini.

---

## 5. Update UI untuk PENGURUS (Manajemen User/Santri)
Pengurus membutuhkan antarmuka untuk mem-blacklist dan mencabut blacklist.

**Tugas:**
- Buka halaman tempat Pengurus melihat daftar santri (mungkin di `src/app/pengaturan/page.tsx` atau halaman khusus manajemen santri).
- Tambahkan indikator visual (misal: badge warna merah bertuliskan "Blacklisted") di samping nama santri jika `is_blacklisted` bernilai `true`.
- Tambahkan tombol "Blacklist" (jika belum diblacklist) dan tombol "Cabut Blacklist" (jika sudah diblacklist) pada *action menu* tiap santri.
- Ketika tombol "Blacklist" diklik, munculkan Modal/Dialog untuk meminta input `alasan` (wajib diisi).
- Panggil Server Action yang sudah dibuat pada langkah #4.
- Jangan lupa lakukan revalidate/refresh halaman (contoh: `revalidatePath('/pengaturan')`) setelah action berhasil.

---

## 6. Update UI untuk SANTRI (Dashboard / Form Pengajuan)
Santri yang diblacklist harus diberi tahu secara visual agar mereka tidak kebingungan mengapa mereka tidak bisa mengajukan izin.

**Tugas:**
- Di Dashboard Santri atau halaman form "Ajukan Izin Baru":
- Cek status user yang sedang login.
- Jika `is_blacklisted` bernilai `true`:
  1. Tampilkan banner/alert warna merah (danger) di bagian atas halaman yang memberitahu bahwa mereka sedang diblacklist, beserta alasannya (`blacklist_reason`).
  2. *Disable* (nonaktifkan) tombol form pengajuan izin atau sembunyikan form-nya sama sekali agar mereka tidak bisa berinteraksi dengan form tersebut.

---

## Catatan Tambahan (Checklist Testing)
Setelah selesai mengimplementasikan, pastikan melakukan tes berikut:
- [ ] Login sebagai PENGURUS -> Berhasil mem-blacklist seorang santri (dengan alasan).
- [ ] UI Pengurus menampilkan status Blacklist yang sesuai.
- [ ] Login sebagai SANTRI yang diblacklist -> Muncul peringatan dan form pengajuan izin tidak bisa digunakan.
- [ ] (Testing Backend) Coba paksa hit/submit API pembuatan izin pakai akun santri yang diblacklist -> Harusnya ditolak oleh backend (Service).
- [ ] Login sebagai PENGURUS -> Berhasil mencabut blacklist santri tersebut.
- [ ] Login kembali sebagai SANTRI tersebut -> Form pengajuan izin bisa digunakan kembali secara normal.
