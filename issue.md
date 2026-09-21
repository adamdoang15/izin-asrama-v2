# Fitur: Ekspor Laporan Izin ke Excel (.xlsx)

Status: `TODO`
Tipe: `feature`
Estimasi: 4–6 jam kerja
Level: Junior / cocok dikerjakan AI model murah (instruksi dibuat sedetail mungkin, ikuti urutan langkah, jangan lompat)

---

## 1. Latar Belakang

Saat ini data pengajuan izin (`izin`) hanya bisa dilihat lewat dashboard petugas di `/beranda` (lihat `src/app/beranda/page.tsx`), dengan pagination 20 data/halaman dan filter status + pencarian nama. Petugas/admin asrama butuh cara untuk **mengunduh rekap data izin dalam format Excel** untuk keperluan laporan bulanan ke pimpinan/yayasan, arsip, atau dianalisis lebih lanjut di luar aplikasi.

## 2. Tujuan

Petugas (role `PENGURUS`) dapat menekan tombol "Ekspor Excel" di dashboard, memilih rentang tanggal (dan opsional filter status/jenis izin), lalu file `.xlsx` otomatis terunduh berisi seluruh data izin yang sesuai filter.

## 3. Cakupan

**Termasuk (in scope):**
- Tombol/form ekspor di halaman `/beranda` (khusus tampilan `BerandaPengurus`).
- Filter: rentang tanggal (`tanggal_keluar`), status (opsional), jenis izin (opsional).
- File Excel berisi seluruh baris yang cocok filter (tidak dibatasi 20 data seperti pagination di UI).
- Proteksi akses: hanya user dengan role `PENGURUS` yang bisa mengakses endpoint ekspor.

**Tidak termasuk (out of scope) — jangan dikerjakan dulu:**
- Ekspor ke PDF.
- Ekspor terjadwal otomatis (cron/email).
- Ekspor untuk role `SANTRI` (santri tidak butuh fitur ini).
- Styling Excel yang rumit (logo, warna per-baris kondisional, dll). Cukup header bold + lebar kolom rapi.

## 4. Dependensi Baru

Gunakan library **`exceljs`** (lebih mudah untuk styling header & lebar kolom dibanding `xlsx`/SheetJS mentah, dan tidak butuh binary tambahan).

```bash
npm install exceljs
```

Tidak perlu `@types/exceljs` terpisah, package ini sudah menyertakan tipe TypeScript-nya sendiri.

## 5. Langkah Implementasi (ikuti urutan ini)

### Langkah 1 — Tambah fungsi pengambilan data tanpa pagination

Buka `src/services/izin.service.ts`. Fungsi `fetchPagedIzin` yang sudah ada **jangan diubah** (dipakai di UI biasa). Tambahkan fungsi baru khusus ekspor di file yang sama, misalnya `fetchIzinForExport`:

```ts
export interface IzinExportFilter {
  startDateISO?: string; // batas awal tanggal_keluar (inklusif)
  endDateISO?: string;   // batas akhir tanggal_keluar (eksklusif)
  status?: StatusIzin;
  jenisIzin?: JenisIzin;
}

export async function fetchIzinForExport(
  filter: IzinExportFilter
): Promise<IzinRowWithUserJoin[]> {
  let query = supabase
    .from("izin")
    .select("*, users!izin_user_id_fkey(name, kamar), approved_by_user:users!izin_approved_by_fkey(name)")
    .order("tanggal_keluar", { ascending: false });

  if (filter.startDateISO) query = query.gte("tanggal_keluar", filter.startDateISO);
  if (filter.endDateISO) query = query.lt("tanggal_keluar", filter.endDateISO);
  if (filter.status) query = query.eq("status", filter.status);
  if (filter.jenisIzin) query = query.eq("jenis_izin", filter.jenisIzin);

  const { data, error } = await query;
  if (error) {
    console.error("Gagal mengambil data izin untuk ekspor:", error.message);
    return [];
  }
  return (data ?? []) as unknown as IzinRowWithUserJoin[];
}
```

Catatan:
- Pakai pola join yang **sama persis** dengan `fetchPagedIzin` (sudah ada di file itu) supaya konsisten.
- Jangan gunakan `.range()` di sini karena ekspor butuh SEMUA data yang cocok filter, bukan satu halaman saja.
- Kalau nanti data izin sudah sangat banyak (>10.000 baris) dan Supabase membatasi hasil query, itu boleh jadi task terpisah (lihat bagian "Catatan tambahan" di bawah). Untuk versi awal ini, tidak perlu dipikirkan.

### Langkah 2 — Buat util pembuat file Excel

Buat file baru `src/lib/excel.ts`:

```ts
import ExcelJS from "exceljs";
import type { IzinRowWithUserJoin } from "@/lib/types";
import { JENIS_IZIN_LABEL } from "@/lib/types";
import { formatTanggalWaktu } from "@/lib/format";

export async function buildLaporanIzinExcel(
  rows: IzinRowWithUserJoin[]
): Promise<Buffer> {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = "Izin Asrama";
  workbook.created = new Date();

  const sheet = workbook.addWorksheet("Laporan Izin");

  sheet.columns = [
    { header: "No", key: "no", width: 5 },
    { header: "Nama Santri", key: "nama_santri", width: 22 },
    { header: "Kamar", key: "kamar", width: 12 },
    { header: "Jenis Izin", key: "jenis_izin", width: 16 },
    { header: "Tujuan", key: "tujuan", width: 28 },
    { header: "Alasan", key: "alasan", width: 30 },
    { header: "Tanggal Keluar", key: "tanggal_keluar", width: 22 },
    { header: "Perkiraan Kembali", key: "perkiraan_kembali", width: 22 },
    { header: "Status", key: "status", width: 16 },
    { header: "Disetujui Oleh", key: "approved_by", width: 20 },
    { header: "Waktu Disetujui", key: "approved_at", width: 22 },
    { header: "Waktu Kembali", key: "returned_at", width: 22 },
    { header: "Status Kembali", key: "return_status", width: 16 },
    { header: "Terlambat (menit)", key: "late_minutes", width: 16 },
    { header: "Catatan Petugas", key: "catatan_admin", width: 30 },
  ];

  // Header bold + background abu-abu tipis
  sheet.getRow(1).font = { bold: true };
  sheet.getRow(1).fill = {
    type: "pattern",
    pattern: "solid",
    fgColor: { argb: "FFEFEFEF" },
  };

  rows.forEach((row, index) => {
    sheet.addRow({
      no: index + 1,
      nama_santri: row.users?.name ?? "Tidak diketahui",
      kamar: row.users?.kamar ?? "-",
      jenis_izin: JENIS_IZIN_LABEL[row.jenis_izin],
      tujuan: row.tujuan,
      alasan: row.alasan,
      tanggal_keluar: formatTanggalWaktu(row.tanggal_keluar),
      perkiraan_kembali: formatTanggalWaktu(row.perkiraan_kembali),
      status: row.status.replaceAll("_", " "),
      approved_by: row.approved_by_user?.name ?? "-",
      approved_at: formatTanggalWaktu(row.approved_at),
      returned_at: formatTanggalWaktu(row.returned_at),
      return_status: row.return_status ?? "-",
      late_minutes: row.late_minutes ?? "-",
      catatan_admin: row.catatan_admin ?? "-",
    });
  });

  sheet.autoFilter = { from: "A1", to: "O1" };

  const arrayBuffer = await workbook.xlsx.writeBuffer();
  return Buffer.from(arrayBuffer);
}
```

Penjelasan untuk yang belum familiar dengan ExcelJS:
- `sheet.columns` mendefinisikan header, key data, dan lebar kolom sekaligus.
- `sheet.addRow({...})` menambah baris berdasarkan `key` yang cocok dengan `sheet.columns`.
- `workbook.xlsx.writeBuffer()` mengembalikan file Excel dalam bentuk binary buffer, yang nanti dikirim sebagai response HTTP.
- Pakai ulang `formatTanggalWaktu` dari `src/lib/format.ts` supaya format tanggal di Excel **konsisten dengan tampilan di web** (timezone WIB).

### Langkah 3 — Buat Route Handler untuk endpoint download

Buat file baru `src/app/api/laporan/export/route.ts`:

```ts
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { fetchIzinForExport } from "@/services/izin.service";
import { buildLaporanIzinExcel } from "@/lib/excel";
import { wibInputToISOString } from "@/lib/format";
import type { StatusIzin, JenisIzin } from "@/lib/types";

export async function GET(request: NextRequest) {
  const session = await auth();
  if (!session?.user || session.user.role !== "PENGURUS") {
    return NextResponse.json({ error: "Tidak diizinkan." }, { status: 403 });
  }

  const { searchParams } = new URL(request.url);
  const startDate = searchParams.get("start"); // format: YYYY-MM-DD
  const endDate = searchParams.get("end");     // format: YYYY-MM-DD
  const status = searchParams.get("status") as StatusIzin | null;
  const jenisIzin = searchParams.get("jenis") as JenisIzin | null;

  const rows = await fetchIzinForExport({
    startDateISO: startDate ? wibInputToISOString(`${startDate}T00:00`) ?? undefined : undefined,
    endDateISO: endDate ? wibInputToISOString(`${endDate}T23:59`) ?? undefined : undefined,
    status: status ?? undefined,
    jenisIzin: jenisIzin ?? undefined,
  });

  const buffer = await buildLaporanIzinExcel(rows);
  const filename = `laporan-izin-${startDate ?? "semua"}-${endDate ?? "semua"}.xlsx`;

  return new NextResponse(buffer, {
    status: 200,
    headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": `attachment; filename="${filename}"`,
    },
  });
}
```

Catatan penting:
- **Jangan** buat ini sebagai Server Action (`"use server"`). Server Action tidak cocok untuk mengembalikan file binary untuk didownload browser — gunakan Route Handler (`route.ts`) seperti contoh di atas.
- Endpoint ini hanya `GET` karena sifatnya mengambil/mengunduh data, bukan mengubah data.
- Pengecekan role **wajib** ada di server (jangan cuma disembunyikan di UI), karena endpoint ini bisa diakses langsung lewat URL.

### Langkah 4 — Tambah UI form filter + tombol ekspor

Buat komponen baru `src/components/ExportLaporanForm.tsx`:

```tsx
"use client";

export default function ExportLaporanForm() {
  return (
    <form
      method="get"
      action="/api/laporan/export"
      target="_blank"
      className="flex flex-wrap items-end gap-2 rounded-md border border-line bg-paper-raised p-3"
    >
      <div className="space-y-1">
        <label className="block text-xs font-medium" htmlFor="export-start">Dari tanggal</label>
        <input id="export-start" type="date" name="start" className="rounded-md border border-line px-2 py-1.5 text-sm" />
      </div>
      <div className="space-y-1">
        <label className="block text-xs font-medium" htmlFor="export-end">Sampai tanggal</label>
        <input id="export-end" type="date" name="end" className="rounded-md border border-line px-2 py-1.5 text-sm" />
      </div>
      <div className="space-y-1">
        <label className="block text-xs font-medium" htmlFor="export-status">Status</label>
        <select id="export-status" name="status" className="rounded-md border border-line px-2 py-1.5 text-sm">
          <option value="">Semua status</option>
          <option value="MENUNGGU">Menunggu</option>
          <option value="DISETUJUI">Disetujui</option>
          <option value="SEDANG_KELUAR">Sedang keluar</option>
          <option value="SUDAH_KEMBALI">Sudah kembali</option>
          <option value="DITOLAK">Ditolak</option>
        </select>
      </div>
      <button type="submit" className="rounded-md bg-teal px-4 py-2 text-sm font-medium text-paper-raised">
        Ekspor Excel
      </button>
    </form>
  );
}
```

Kenapa pakai `<form method="get" action="...">` biasa (bukan `fetch` + `useActionState` seperti form lain di project ini)? Karena ini murni request `GET` untuk **download file**, browser akan otomatis membuka/menyimpan file dari response. Tidak perlu JavaScript tambahan atau state management.

Lalu import dan taruh komponen ini di `src/app/beranda/page.tsx`, di dalam fungsi `BerandaPengurus`, tepat di bawah bagian judul "Dashboard petugas" (di bagian `<section>` pertama, sebelum atau sesudah blok `Stat`). Tambahkan import:

```ts
import ExportLaporanForm from "@/components/ExportLaporanForm";
```

### Langkah 5 — Jalankan & tes manual

1. `npm install` lalu `npm run dev`.
2. Login sebagai `pengurus` (lihat akun demo di `README.md`).
3. Buka `/beranda`, pastikan form ekspor muncul.
4. Coba klik "Ekspor Excel" tanpa filter apapun → file `.xlsx` harus terunduh berisi semua data izin.
5. Coba isi filter tanggal saja → jumlah baris di Excel harus sesuai dengan izin yang `tanggal_keluar`-nya ada di rentang tersebut.
6. Coba filter status → hanya baris dengan status itu yang muncul.
7. Buka file Excel dengan Excel/Google Sheets/LibreOffice, cek:
   - Header baris pertama bold dan ada semua 15 kolom.
   - Tidak ada kolom yang datanya `undefined` atau `null` (harus tampil `-` sebagai gantinya).
   - Tanggal terbaca dengan format yang sama seperti di halaman web (WIB).
8. Logout, coba akses langsung `http://localhost:3000/api/laporan/export` tanpa login → harus dapat response error 403, **bukan** file Excel.
9. Login sebagai `santri1` (role SANTRI), coba akses URL yang sama → harus tetap 403.

## 6. Kriteria Selesai (Acceptance Criteria)

- [ ] Dependency `exceljs` tertambah di `package.json`.
- [ ] Fungsi `fetchIzinForExport` ada di `src/services/izin.service.ts` dan mendukung filter tanggal, status, jenis izin.
- [ ] Util `buildLaporanIzinExcel` ada di `src/lib/excel.ts`, menghasilkan file `.xlsx` yang valid dan bisa dibuka.
- [ ] Endpoint `GET /api/laporan/export` ada, mengembalikan file Excel dengan header `Content-Disposition: attachment`.
- [ ] Endpoint menolak akses (403) untuk user yang belum login atau bukan role `PENGURUS`.
- [ ] Ada UI (form filter + tombol) di dashboard petugas (`/beranda`) untuk memicu ekspor.
- [ ] Semua langkah di bagian "Tes manual" di atas sudah dicoba dan lolos.
- [ ] Tidak ada perubahan pada fungsi/behaviour yang sudah ada sebelumnya (`fetchPagedIzin`, tampilan dashboard, dsb).

## 7. Catatan Tambahan / Hal yang Perlu Diperhatikan

- **Jangan** menambahkan kolom baru ke tabel `izin` di database untuk fitur ini — semua data yang dibutuhkan sudah ada di skema saat ini (`supabase/schema.sql`).
- **Jangan** mengubah `fetchPagedIzin` yang sudah ada — buat fungsi baru seperti dicontohkan, supaya tidak merusak fitur pagination yang sudah berjalan.
- Kalau ke depan jumlah data izin sangat besar (misalnya puluhan ribu baris) dan proses ekspor jadi lambat/timeout, solusinya adalah generate file secara streaming atau proses di background job — tapi itu **di luar cakupan** issue ini, jangan dikerjakan sekarang.
- Ikuti gaya kode yang sudah ada di project ini (bahasa Indonesia untuk nama variabel domain seperti `tujuan`, `alasan`, `jenis_izin`; bahasa Inggris untuk hal teknis generik seperti `filter`, `buffer`, `request`).
- Jika ada keraguan soal format tanggal/timezone, selalu rujuk ke `src/lib/format.ts` — semua tanggal di aplikasi ini menggunakan WIB (Asia/Jakarta), bukan UTC.