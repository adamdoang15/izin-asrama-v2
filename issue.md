# Rencana Implementasi: Penambahan Status Sakit (S) dan Izin (I) pada Monitoring Daily Activity

## Konteks
Saat ini, pengurus (mentor) hanya dapat melihat aktivitas dengan status "A" (Alpha / Pelanggaran) pada halaman Dashboard Monitoring Daily Activity. Namun, data di spreadsheet juga mencakup status "S" (Sakit) dan "I" (Izin) yang perlu dimonitor oleh pengurus secara harian.

## Tujuan
Menambahkan data aktivitas dengan status "S" (Sakit) dan "I" (Izin) ke dalam tampilan pengurus (dashboard daily activity) agar dapat dipantau bersamaan dengan data Alpha (A).

## Langkah-langkah Implementasi

### 1. Update Types / Interface Data
**Target File:** `src/services/daily-activity.service.ts`
- **`AbsentActivityRecord`**: Tambahkan properti `status` agar UI bisa membedakan tipe absen.
  ```typescript
  export interface AbsentActivityRecord {
    id: string;
    tanggal: string;
    tanggalFormatted: string;
    hari: string;
    namaGelara: string;
    aktivitas: string;
    status: ActivityStatus; // <-- Tambahan
  }
  ```
- **`GelaraSummary`**: Tambahkan total hitungan mingguan dan bulanan untuk Sakit dan Izin, melengkapi jumlah A.
  ```typescript
  export interface GelaraSummary {
    // ... properti existing (progress, jumlahA, dll) ...
    jumlahSMingguan: number;
    jumlahSBulanan: number;
    jumlahIMingguan: number;
    jumlahIBulanan: number;
  }
  ```

### 2. Update Logika Pengambilan Data (Service)
**Target File:** `src/services/daily-activity.service.ts`
- **Di dalam fungsi `getDailyActivityData`:**
  - Saat me-looping `allGelaraNames` untuk membentuk `gelaraSummaries` (sekitar baris 708-720), hitung `jumlahSBulanan`, `jumlahIBulanan`, `jumlahSMingguan`, dan `jumlahIMingguan` menggunakan filter `status === "S"` dan `status === "I"`.
  - Pada blok inisialisasi `absentRecordsRaw` (sekitar baris 736), ubah kondisinya agar menangkap A, S, dan I:
    ```typescript
    // Dari:
    let absentRecordsRaw = records.filter((r) => r.status === "A");
    
    // Menjadi:
    let absentRecordsRaw = records.filter((r) => ["A", "S", "I"].includes(r.status));
    ```
  - Pada saat melakukan mapping data dari `absentRecordsRaw` ke tipe `AbsentActivityRecord` (sekitar baris 762), pastikan data `status: r.status` juga di-return.

### 3. Update Komponen Tampilan (UI)
**Target File 1:** `src/components/DailyActivityClient.tsx`
- Cari bagian statis yang hanya menyebut "Alpha (A)" atau "Kegiatan A" dan ubah menjadi deskripsi yang lebih general, misal: "Ketidakhadiran (A/S/I)".
- Pada saat nge-render list ketidakhadiran, render warna badge secara dinamis bergantung pada nilai `item.status`. Gunakan styling Tailwind yang sesuai:
  - `A` (Alpha) -> Gunakan warna default merah/clay.
  - `S` (Sakit) -> Gunakan warna oranye/kuning.
  - `I` (Izin) -> Gunakan warna biru.
- Tambahkan tampilan jumlah ringkasan S dan I di bagian summary pengurus.

**Target File 2:** `src/components/DailyActivityTable.tsx`
- Update copy/teks yang hardcoded "Menampilkan pelanggaran ketidakhadiran (status A)..." menjadi "A, S, dan I".
- Di tabel daftar kegiatan tidak diikuti, tampilkan status S dan I dengan indikator warna yang relevan agar pengurus bisa sekilas melihat alasan ketidakhadiran (dibandingkan hanya menampilkan badge statis "Status A").

## Catatan Tambahan (Penting!)
- **Rumus Persentase Progress Kehadiran:** Saat ini rumus kehadiran menggunakan logika `((Total - Jumlah A) / Total) * 100`. Secara default, S dan I dianggap kehadiran "sah" yang tidak mengurangi persentase, jadi pastikan perhitungan ini **TIDAK DIUBAH**. S dan I hanya akan muncul di bagian monitoring (daftar absen).
