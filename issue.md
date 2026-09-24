# Fitur: Edit & Hapus Pengajuan Izin oleh Pengurus (Perbaikan Kesalahan Pasca-Persetujuan)

> **Petunjuk untuk implementer:** dokumen ini ditulis serinci mungkin — nama file, nama fungsi, dan potongan kode sudah disiapkan supaya tinggal disalin dan disesuaikan sedikit. Ikuti urutan langkah di Bagian 8 dari atas ke bawah. Kalau ada bagian yang tidak jelas, JANGAN menebak — tanyakan dulu sebelum lanjut, terutama untuk hal yang menyangkut keamanan (siapa boleh akses apa).

## 1. Latar belakang

Saat ini di `/beranda` (dashboard pengurus), pengajuan izin yang statusnya masih `MENUNGGU` bisa diproses lewat tiga tombol: **Setujui**, **Tolak**, **Minta Revisi** (lihat `src/components/AdminIzinRow.tsx` dan `src/app/admin/actions.ts`).

Masalahnya: begitu sebuah pengajuan sudah diproses — apalagi sudah `DISETUJUI`, atau bahkan sudah `SEDANG_KELUAR` — **tidak ada cara sama sekali** untuk membetulkan data yang ternyata salah (contoh: pengurus salah klik "Setujui" untuk tanggal yang salah, atau gelara memberi data yang keliru tapi baru ketahuan setelah disetujui) atau membatalkan pengajuan yang seharusnya tidak pernah ada. Fitur "Minta Revisi" yang sudah ada **tidak bisa dipakai** untuk kasus ini karena Minta Revisi cuma berlaku untuk status `MENUNGGU`.

## 2. Tujuan fitur

Menambahkan dua tombol baru khusus pengurus di setiap baris pengajuan izin (`AdminIzinRow.tsx`), yang muncul **di status apa pun** (bukan cuma `MENUNGGU`):

- **Edit data** — pengurus langsung mengubah `jenis_izin`, `tujuan`, `alasan`, `tanggal_keluar`, `perkiraan_kembali` tanpa mengubah status pengajuan.
- **Hapus pengajuan** — pengurus menyembunyikan pengajuan dari semua daftar aktif (soft delete, datanya tetap tersimpan untuk audit, tidak benar-benar dihapus dari database).

## 3. Perbedaan dengan fitur "Minta Revisi" yang sudah ada — WAJIB DIBACA

Supaya tidak bingung dan tidak sampai menghapus/mengubah fitur lama, ini tabel pembandingnya:

| | Minta Revisi (sudah ada) | Edit (fitur baru ini) | Hapus (fitur baru ini) |
|---|---|---|---|
| Berlaku di status | Hanya `MENUNGGU` | Semua status kecuali `DIHAPUS` | Semua status kecuali `DIHAPUS` |
| Siapa yang mengubah data | **Gelara sendiri** (pengurus cuma kasih catatan) | **Pengurus langsung** | Tidak ada perubahan data, cuma status berubah jadi `DIHAPUS` |
| Status berubah jadi | `PERLU_REVISI` → balik ke `MENUNGGU` | **Tetap sama seperti sebelumnya** (tidak berubah) | `DIHAPUS` |
| Kegunaan | Typo/kesalahan kecil sebelum diproses | Kesalahan yang baru ketahuan setelah pengajuan diproses, butuh perbaikan cepat | Pengajuan yang seharusnya tidak pernah ada / salah total |

**Jangan hapus atau ubah alur Minta Revisi yang sudah ada.** Fitur baru ini berdampingan, bukan pengganti. Dulu prinsipnya "pengurus tidak boleh mengedit data gelara secara langsung" (lihat dokumen desain Minta Revisi sebelumnya) — fitur ini **sengaja mengubah** prinsip itu untuk kasus koreksi pasca-persetujuan, dengan syarat: **setiap Edit/Hapus WAJIB disertai alasan tertulis dan tercatat penuh di `izin_logs`** (siapa, kapan, data sebelum/sesudah) supaya tetap akuntabel. Jangan sampai ada Edit/Hapus tanpa log.

## 4. Aktor

| Aktor | Bisa apa |
|---|---|
| **Pengurus** | Melihat pengajuan apa pun (kecuali yang sudah `DIHAPUS`), klik "Edit data" untuk mengubah field pengajuan langsung (wajib isi alasan perubahan), atau klik "Hapus pengajuan" untuk soft-delete (wajib isi alasan). |
| **Gelara (santri)** | Menerima notifikasi push kalau pengajuannya diedit/dihapus pengurus. Pengajuan yang sudah `DIHAPUS` tidak lagi muncul di riwayat gelara. |

## 5. Lingkup (scope)

**Termasuk:**
- Status baru pada tabel `izin`: `DIHAPUS`.
- Kolom baru pada tabel `izin`: `deleted_by`, `deleted_at`.
- Tombol "Edit data" & "Hapus pengajuan" di `AdminIzinRow.tsx`, muncul untuk semua status kecuali `DIHAPUS`.
- Form edit berisi field yang sama seperti form pengajuan (`jenis_izin`, `tujuan`, `alasan`, `tanggal_keluar`, `perkiraan_kembali`) + satu field wajib baru: **"Alasan perubahan"** (untuk log audit, bukan untuk mengubah `catatan_admin`).
- Form hapus berisi satu field wajib: **"Alasan penghapusan"**.
- Notifikasi push ke gelara pemilik izin setiap kali diedit atau dihapus pengurus.
- Pengajuan yang `DIHAPUS` disembunyikan dari: riwayat gelara (`getRiwayatIzinSantri`) dan daftar default pengurus (`fetchPagedIzin` tanpa filter status).
- Pengurus tetap bisa **melihat kembali** pengajuan yang sudah dihapus dengan memilih filter status "Dihapus" di dashboard (untuk transparansi/audit) — tapi tanpa tombol aksi apa pun di situ.
- Semua kejadian Edit & Hapus tercatat di `izin_logs` (`action = 'EDIT_PENGURUS'` / `'HAPUS_PENGURUS'`).

**Tidak termasuk (di luar scope, jangan dikerjakan):**
- Form Edit **tidak mengubah status** pengajuan. Kalau butuh ubah status, itu tugas tombol Setujui/Tolak/Minta Revisi yang sudah ada.
- **Tidak ada fitur "pulihkan" (undo delete)** di iterasi ini. Kalau salah hapus, untuk sementara perbaikannya manual lewat Supabase SQL Editor (`update izin set status = ... where id = ...`).
- **Jangan pakai status `TIDAK_JADI`** yang sudah ada di `schema.sql`/`ExportLaporanForm.tsx`. Status itu sudah dicadangkan untuk fitur lain (kemungkinan santri membatalkan pengajuan sendiri) dan sampai sekarang belum dipakai kode manapun. Fitur ini pakai status baru `DIHAPUS` supaya tidak tercampur semantiknya.
- Ekspor laporan Excel (`/api/laporan/export`) **tidak diubah** — kalau pengurus ekspor "semua status" tanpa filter, baris berstatus `DIHAPUS` tetap ikut ter-ekspor. Ini disengaja untuk kebutuhan audit lengkap, **bukan bug yang perlu diperbaiki**.
- Rekalkulasi otomatis `late_minutes`/`return_status` ketika pengurus meng-edit `perkiraan_kembali` pada pengajuan yang sudah `SUDAH_KEMBALI` — di luar scope, cukup catat sebagai known limitation (lihat Bagian 9).

## 6. Alur end-to-end

**Edit:**
1. Pengurus buka `/beranda`, cari pengajuan yang datanya salah (status apa saja), klik "Edit data".
2. Muncul form terisi otomatis dengan data yang sekarang tersimpan, plus satu textarea wajib "Alasan perubahan".
3. Pengurus perbaiki field yang salah, isi alasan, klik "Simpan perubahan".
4. Server action `editIzinAction` memvalidasi data, memanggil `editIzinByPengurus` di service layer, yang meng-update data izin (status TIDAK berubah) dan mencatat `izin_logs` dengan snapshot `data_sebelum`/`data_sesudah`.
5. Gelara pemilik izin menerima notifikasi push berisi alasan perubahan.

**Hapus:**
1. Pengurus klik "Hapus pengajuan" pada baris yang mau dihapus.
2. Muncul konfirmasi + textarea wajib "Alasan penghapusan".
3. Pengurus isi alasan, klik "Hapus permanen dari daftar".
4. Server action `hapusIzinAction` memanggil `deleteIzinByPengurus`, yang mengubah `status` jadi `DIHAPUS`, mengisi `deleted_by`/`deleted_at`, dan mencatat `izin_logs` dengan `action = 'HAPUS_PENGURUS'`.
5. Gelara pemilik izin menerima notifikasi push berisi alasan penghapusan.
6. Pengajuan itu langsung hilang dari daftar aktif pengurus dan dari riwayat gelara, tapi masih bisa dilihat pengurus lewat filter status "Dihapus".

## 7. Perubahan database

### 7.1 `supabase/schema.sql`

Cari baris definisi kolom `status` di tabel `izin`:

```sql
status text not null default 'MENUNGGU' check (status in ('MENUNGGU','PERLU_REVISI','DISETUJUI','DITOLAK','SEDANG_KELUAR','SUDAH_KEMBALI','TIDAK_JADI')),
```

Ubah jadi (tambahkan `'DIHAPUS'`):

```sql
status text not null default 'MENUNGGU' check (status in ('MENUNGGU','PERLU_REVISI','DISETUJUI','DITOLAK','SEDANG_KELUAR','SUDAH_KEMBALI','TIDAK_JADI','DIHAPUS')),
```

Cari baris `late_minutes integer check (...)`, lalu tambahkan dua kolom baru tepat di bawahnya (sebelum `created_at`):

```sql
late_minutes integer check (late_minutes is null or late_minutes >= 0),
deleted_by bigint references public.users(id) on delete set null,
deleted_at timestamptz,
created_at timestamptz not null default now(),
```

### 7.2 `supabase/migration.sql`

Tambahkan section baru di paling bawah file (setelah bagian "V5"):

```sql
-- Perubahan alur V6: Fitur Edit & Hapus pengajuan izin oleh pengurus
alter table public.izin add column if not exists deleted_by bigint references public.users(id) on delete set null;
alter table public.izin add column if not exists deleted_at timestamptz;

-- Sama seperti pola migrasi status sebelumnya: lepas dulu constraint lama.
do $$
declare r record;
begin
  for r in select conname from pg_constraint where conrelid = 'public.izin'::regclass and contype = 'c' and pg_get_constraintdef(oid) ilike '%status%' and pg_get_constraintdef(oid) ilike '%MENUNGGU%' loop
    execute format('alter table public.izin drop constraint if exists %I', r.conname);
  end loop;
end $$;

alter table public.izin add constraint izin_status_v6
  check (status in ('MENUNGGU','PERLU_REVISI','DISETUJUI','DITOLAK','SEDANG_KELUAR','SUDAH_KEMBALI','TIDAK_JADI','DIHAPUS'));
```

### 7.3 `src/types/database.types.ts`

File ini **ditulis manual** (tidak di-generate otomatis di repo ini), jadi harus diedit tangan. Di dalam definisi tabel `izin`, untuk ketiga bagian `Row`, `Insert`, dan `Update`:

1. Ganti setiap kemunculan union status:
   ```ts
   "MENUNGGU" | "PERLU_REVISI" | "DISETUJUI" | "DITOLAK" | "SEDANG_KELUAR" | "SUDAH_KEMBALI" | "TIDAK_JADI"
   ```
   menjadi:
   ```ts
   "MENUNGGU" | "PERLU_REVISI" | "DISETUJUI" | "DITOLAK" | "SEDANG_KELUAR" | "SUDAH_KEMBALI" | "TIDAK_JADI" | "DIHAPUS"
   ```
2. Tambahkan dua field baru setelah `late_minutes`:
   - Di `Row`: `deleted_by: number | null` dan `deleted_at: string | null`
   - Di `Insert` dan `Update`: `deleted_by?: number | null` dan `deleted_at?: string | null`

## 8. Langkah implementasi (ikuti urutan ini)

### 8.1 `src/services/izin.service.ts` — logic utama

Tambahkan fungsi baru ini di file yang sama (jangan hapus fungsi yang sudah ada):

```ts
export async function getIzinFullById(id: number) {
  const { data, error } = await supabase
    .from("izin")
    .select("id, user_id, status, jenis_izin, alasan, tujuan, tanggal_keluar, perkiraan_kembali")
    .eq("id", id)
    .maybeSingle();

  if (error || !data) return null;
  return data;
}

export interface EditIzinInput {
  jenis_izin: JenisIzin;
  alasan: string;
  tujuan: string;
  tanggal_keluar: string;
  perkiraan_kembali: string;
}

export async function editIzinByPengurus(
  id: number,
  actorId: number,
  catatanPerubahan: string,
  input: EditIzinInput
): Promise<{ error?: string }> {
  const before = await getIzinFullById(id);
  if (!before) return { error: "Pengajuan tidak ditemukan." };
  if (before.status === "DIHAPUS") return { error: "Pengajuan ini sudah dihapus, tidak bisa diedit." };

  const now = new Date().toISOString();

  const { error } = await supabase
    .from("izin")
    .update({
      jenis_izin: input.jenis_izin,
      alasan: input.alasan,
      tujuan: input.tujuan,
      tanggal_keluar: input.tanggal_keluar,
      perkiraan_kembali: input.perkiraan_kembali,
      updated_at: now,
    })
    .eq("id", id)
    .neq("status", "DIHAPUS"); // jaga-jaga race condition, sama seperti pola approveIzin

  if (error) return { error: `Gagal menyimpan perubahan: ${error.message}` };

  await supabase.from("izin_logs").insert({
    izin_id: id,
    actor_id: actorId,
    action: "EDIT_PENGURUS",
    old_status: before.status,
    new_status: before.status, // status tidak berubah
    catatan: catatanPerubahan,
    data_sebelum: {
      jenis_izin: before.jenis_izin,
      alasan: before.alasan,
      tujuan: before.tujuan,
      tanggal_keluar: before.tanggal_keluar,
      perkiraan_kembali: before.perkiraan_kembali,
    },
    data_sesudah: {
      jenis_izin: input.jenis_izin,
      alasan: input.alasan,
      tujuan: input.tujuan,
      tanggal_keluar: input.tanggal_keluar,
      perkiraan_kembali: input.perkiraan_kembali,
    },
  });

  await sendNotificationToUser(before.user_id, {
    title: "Data Pengajuan Izin Diperbarui Petugas",
    body: `Petugas memperbarui data pengajuan izin Anda. Alasan: ${catatanPerubahan}`,
    url: "/beranda",
  }).catch((err) => console.error("Gagal mengirim notifikasi edit oleh pengurus:", err));

  return {};
}

export async function deleteIzinByPengurus(
  id: number,
  actorId: number,
  alasanHapus: string
): Promise<{ error?: string }> {
  const before = await getIzinFullById(id);
  if (!before) return { error: "Pengajuan tidak ditemukan." };
  if (before.status === "DIHAPUS") return { error: "Pengajuan ini sudah dihapus sebelumnya." };

  const now = new Date().toISOString();

  const { error } = await supabase
    .from("izin")
    .update({
      status: "DIHAPUS",
      catatan_admin: alasanHapus,
      deleted_by: actorId,
      deleted_at: now,
      updated_at: now,
    })
    .eq("id", id)
    .neq("status", "DIHAPUS"); // jaga-jaga race condition (klik dobel / dua tab)

  if (error) return { error: `Gagal menghapus pengajuan: ${error.message}` };

  await supabase.from("izin_logs").insert({
    izin_id: id,
    actor_id: actorId,
    action: "HAPUS_PENGURUS",
    old_status: before.status,
    new_status: "DIHAPUS",
    catatan: alasanHapus,
  });

  await sendNotificationToUser(before.user_id, {
    title: "Pengajuan Izin Dihapus Petugas",
    body: `Petugas menghapus pengajuan izin Anda. Alasan: ${alasanHapus}`,
    url: "/beranda",
  }).catch((err) => console.error("Gagal mengirim notifikasi hapus oleh pengurus:", err));

  return {};
}
```

Lalu **ubah** dua fungsi yang sudah ada supaya pengajuan berstatus `DIHAPUS` tersembunyi dari tampilan normal:

Cari fungsi `getRiwayatIzinSantri`, tambahkan `.neq("status", "DIHAPUS")` sebelum `.order(...)`:

```ts
export async function getRiwayatIzinSantri(userId: number): Promise<IzinRowWithUserJoin[]> {
  const { data, error } = await supabase
    .from("izin")
    .select("*, approved_by_user:users!izin_approved_by_fkey(name)")
    .eq("user_id", userId)
    .neq("status", "DIHAPUS")
    .order("created_at", { ascending: false })
    .limit(50);
  // ...sisanya tidak berubah
```

Cari fungsi `fetchPagedIzin`, ubah blok `if (status) query = query.eq("status", status);` menjadi:

```ts
  if (status) {
    query = query.eq("status", status);
  } else {
    query = query.neq("status", "DIHAPUS");
  }
```

Ini penting: kalau pengurus **tidak** memilih filter status apa pun, pengajuan yang dihapus otomatis disembunyikan. Tapi kalau pengurus memilih filter status = "Dihapus", justru yang tampil hanya yang dihapus (untuk audit).

> Fungsi `getIzinKeluarHariIni` dan `getIzinCounts` **tidak perlu diubah** — keduanya sudah otomatis mengecualikan `DIHAPUS` (yang pertama karena whitelist status, yang kedua karena `DIHAPUS` tidak ada di object `counts`).

### 8.2 `src/app/admin/actions.ts` — server actions

Tambahkan di bagian atas file (dekat schema lain), sebelum action yang sudah ada:

```ts
const jenisIzinSchema = z.enum(["HARIAN", "MENGINAP", "REKREASI", "KELUARGA", "DARURAT"]);

const editIzinSchema = z.object({
  id: idSchema,
  jenis_izin: jenisIzinSchema,
  tujuan: z.string().trim().min(3, "Tujuan wajib diisi."),
  alasan: z.string().trim().min(5, "Alasan wajib diisi, minimal 5 karakter."),
  tanggal_keluar: z.string().min(1, "Tanggal keluar wajib diisi."),
  perkiraan_kembali: z.string().min(1, "Perkiraan kembali wajib diisi."),
  catatan_perubahan: z.string().trim().min(3, "Alasan perubahan wajib diisi, minimal 3 karakter."),
});

const hapusIzinSchema = z.object({
  id: idSchema,
  alasan: z.string().trim().min(3, "Alasan penghapusan wajib diisi."),
});
```

Tambahkan import di paling atas file:

```ts
import { wibInputToISOString } from "@/lib/format";
import { editIzinByPengurus, deleteIzinByPengurus } from "@/services/izin.service";
```

(Gabungkan dengan import `getCurrentIzinStatus, approveIzin, rejectIzin, requestIzinRevision` yang sudah ada dari `@/services/izin.service`, tidak perlu dua baris import terpisah dari file yang sama.)

Tambahkan dua action baru di akhir file:

```ts
export async function editIzinAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const session = await requireAdmin();
  const parsed = editIzinSchema.safeParse({
    id: formData.get("id"),
    jenis_izin: formData.get("jenis_izin"),
    tujuan: formData.get("tujuan"),
    alasan: formData.get("alasan"),
    tanggal_keluar: formData.get("tanggal_keluar"),
    perkiraan_kembali: formData.get("perkiraan_kembali"),
    catatan_perubahan: formData.get("catatan_perubahan"),
  });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Data tidak valid." };

  const tanggalKeluarISO = wibInputToISOString(parsed.data.tanggal_keluar);
  const perkiraanKembaliISO = wibInputToISOString(parsed.data.perkiraan_kembali);
  if (!tanggalKeluarISO || !perkiraanKembaliISO) return { error: "Format tanggal tidak valid." };
  if (new Date(perkiraanKembaliISO) <= new Date(tanggalKeluarISO)) {
    return { error: "Perkiraan kembali harus setelah waktu keluar." };
  }

  const result = await editIzinByPengurus(
    parsed.data.id,
    Number(session.user.id),
    parsed.data.catatan_perubahan,
    {
      jenis_izin: parsed.data.jenis_izin,
      alasan: parsed.data.alasan,
      tujuan: parsed.data.tujuan,
      tanggal_keluar: tanggalKeluarISO,
      perkiraan_kembali: perkiraanKembaliISO,
    }
  );
  if (result.error) return { error: result.error };

  revalidatePath("/beranda");
  return { success: true };
}

export async function hapusIzinAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const session = await requireAdmin();
  const parsed = hapusIzinSchema.safeParse({
    id: formData.get("id"),
    alasan: formData.get("alasan"),
  });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Data tidak valid." };

  const result = await deleteIzinByPengurus(parsed.data.id, Number(session.user.id), parsed.data.alasan);
  if (result.error) return { error: result.error };

  revalidatePath("/beranda");
  return { success: true };
}
```

**Penting:** kedua action ini memanggil `requireAdmin()` di baris pertama, persis seperti `setujuiIzinAction`/`tolakIzinAction`. Jangan sampai baris ini hilang — tanpa ini, santri bisa memanggil action ini langsung dan mengedit/menghapus pengajuan siapa saja.

### 8.3 Komponen baru `src/components/EditIzinForm.tsx`

Buat file baru, meniru gaya `src/components/RevisiIzinForm.tsx`:

```tsx
"use client";

import { useActionState, useEffect, useState } from "react";
import { editIzinAction, type ActionState } from "@/app/admin/actions";
import { isoToWibInputValue } from "@/lib/format";
import type { IzinRow } from "@/lib/types";

const initialState: ActionState = {};

interface EditIzinFormProps {
  izin: IzinRow;
  onClose: () => void;
}

export default function EditIzinForm({ izin, onClose }: EditIzinFormProps) {
  const [state, formAction, pending] = useActionState(editIzinAction, initialState);
  const [tanggalKeluar, setTanggalKeluar] = useState(isoToWibInputValue(izin.tanggal_keluar));
  const [perkiraanKembali, setPerkiraanKembali] = useState(isoToWibInputValue(izin.perkiraan_kembali));
  const [validationError, setValidationError] = useState<string | null>(null);

  useEffect(() => {
    if (tanggalKeluar && perkiraanKembali && new Date(perkiraanKembali) <= new Date(tanggalKeluar)) {
      setValidationError("Perkiraan waktu kembali harus lebih lambat dari waktu keluar.");
    } else {
      setValidationError(null);
    }
  }, [tanggalKeluar, perkiraanKembali]);

  useEffect(() => {
    if (state.success) onClose();
  }, [state.success, onClose]);

  return (
    <form action={formAction} className="rounded-md border border-line bg-paper p-4 space-y-4">
      <input type="hidden" name="id" value={izin.id} />
      <p className="text-sm font-medium text-clay">
        Mode edit oleh petugas — perubahan akan tercatat di riwayat audit.
      </p>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <label htmlFor={`edit_jenis_${izin.id}`} className="block text-sm font-medium">Jenis izin</label>
          <select
            id={`edit_jenis_${izin.id}`}
            name="jenis_izin"
            defaultValue={izin.jenis_izin}
            required
            className="w-full rounded-md border border-line bg-paper-raised px-3 py-2 text-sm outline-none focus:border-teal focus:ring-1 focus:ring-teal"
          >
            <option value="HARIAN">Izin harian</option>
            <option value="MENGINAP">Izin menginap</option>
            <option value="REKREASI">Rekreasi</option>
            <option value="KELUARGA">Keperluan keluarga</option>
            <option value="DARURAT">Darurat</option>
          </select>
        </div>
        <div className="space-y-1.5">
          <label htmlFor={`edit_tujuan_${izin.id}`} className="block text-sm font-medium">Tujuan</label>
          <input
            id={`edit_tujuan_${izin.id}`}
            name="tujuan"
            defaultValue={izin.tujuan}
            required
            className="w-full rounded-md border border-line bg-paper-raised px-3 py-2 text-sm outline-none focus:border-teal focus:ring-1 focus:ring-teal"
          />
        </div>
      </div>

      <div className="space-y-1.5">
        <label htmlFor={`edit_alasan_${izin.id}`} className="block text-sm font-medium">Alasan</label>
        <textarea
          id={`edit_alasan_${izin.id}`}
          name="alasan"
          rows={2}
          defaultValue={izin.alasan}
          required
          className="w-full rounded-md border border-line bg-paper-raised px-3 py-2 text-sm outline-none focus:border-teal focus:ring-1 focus:ring-teal resize-none"
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <label htmlFor={`edit_keluar_${izin.id}`} className="block text-sm font-medium">Waktu keluar</label>
          <input
            id={`edit_keluar_${izin.id}`}
            name="tanggal_keluar"
            type="datetime-local"
            required
            value={tanggalKeluar}
            onChange={(e) => setTanggalKeluar(e.target.value)}
            className="w-full rounded-md border border-line bg-paper-raised px-3 py-2 text-sm outline-none focus:border-teal focus:ring-1 focus:ring-teal"
          />
        </div>
        <div className="space-y-1.5">
          <label htmlFor={`edit_kembali_${izin.id}`} className="block text-sm font-medium">Perkiraan kembali</label>
          <input
            id={`edit_kembali_${izin.id}`}
            name="perkiraan_kembali"
            type="datetime-local"
            required
            value={perkiraanKembali}
            onChange={(e) => setPerkiraanKembali(e.target.value)}
            className="w-full rounded-md border border-line bg-paper-raised px-3 py-2 text-sm outline-none focus:border-teal focus:ring-1 focus:ring-teal"
          />
        </div>
      </div>

      <div className="space-y-1.5">
        <label htmlFor={`edit_catatan_${izin.id}`} className="block text-sm font-medium">
          Alasan perubahan (wajib, untuk log audit)
        </label>
        <textarea
          id={`edit_catatan_${izin.id}`}
          name="catatan_perubahan"
          rows={2}
          required
          placeholder="Contoh: Santri salah pilih jenis izin, seharusnya Menginap bukan Harian"
          className="w-full rounded-md border border-line bg-paper-raised px-3 py-2 text-sm outline-none focus:border-teal focus:ring-1 focus:ring-teal resize-none"
        />
      </div>

      {validationError && <p className="text-sm text-clay" role="alert">{validationError}</p>}
      {state.error && <p className="text-sm text-clay" role="alert">{state.error}</p>}

      <div className="flex gap-3">
        <button
          type="submit"
          disabled={pending || Boolean(validationError)}
          className="rounded-md bg-teal px-4 py-2 text-sm font-medium text-paper-raised hover:opacity-90 disabled:opacity-60"
        >
          {pending ? "Menyimpan..." : "Simpan perubahan"}
        </button>
        <button type="button" onClick={onClose} className="rounded-md border border-line px-4 py-2 text-sm text-ink-soft hover:bg-paper">
          Batal
        </button>
      </div>
    </form>
  );
}
```

### 8.4 `src/components/AdminIzinRow.tsx` — tambah tombol Edit & Hapus

Tambahkan import di bagian atas file:

```ts
import { useState } from "react"; // sudah ada, pastikan tidak dobel import
import EditIzinForm from "@/components/EditIzinForm";
import { setujuiIzinAction, tolakIzinAction, mintaRevisiIzinAction, hapusIzinAction, type ActionState } from "@/app/admin/actions";
```

Di dalam komponen `AdminIzinRow`, tambahkan state baru sejajar dengan `showTolak`/`showMintaRevisi`:

```ts
const [showEdit, setShowEdit] = useState(false);
const [showHapus, setShowHapus] = useState(false);
const [hapusState, hapusAction, hapusPending] = useActionState(hapusIzinAction, initialState);
```

Cari blok kondisi `{izin.status === "PERLU_REVISI" && ( ... )}` di bagian paling bawah komponen (sebelum `</li>` penutup), lalu tambahkan blok baru **setelah** blok itu:

```tsx
{izin.status !== "DIHAPUS" && (
  <div className="mt-3.5 pt-3.5 border-t border-line">
    {!showEdit && !showHapus && (
      <div className="flex items-center gap-4">
        <button
          type="button"
          onClick={() => { setShowEdit(true); setShowHapus(false); }}
          className="text-sm text-teal"
        >
          Edit data
        </button>
        <button
          type="button"
          onClick={() => { setShowHapus(true); setShowEdit(false); }}
          className="text-sm text-clay"
        >
          Hapus pengajuan
        </button>
      </div>
    )}

    {showEdit && <EditIzinForm izin={izin} onClose={() => setShowEdit(false)} />}

    {showHapus && (
      <form action={hapusAction} className="space-y-2.5">
        <input type="hidden" name="id" value={izin.id} />
        <p className="text-sm text-clay font-medium">
          Yakin ingin menghapus pengajuan ini? Pengajuan akan disembunyikan dari daftar aktif.
        </p>
        <textarea
          name="alasan"
          rows={2}
          required
          placeholder="Alasan penghapusan"
          className="w-full rounded-md border border-line bg-paper px-3 py-2 text-sm resize-none"
        />
        {hapusState.error && <p className="text-sm text-clay">{hapusState.error}</p>}
        <div className="flex gap-3">
          <button
            disabled={hapusPending}
            className="rounded-md bg-clay px-3.5 py-1.5 text-sm font-medium text-paper-raised disabled:opacity-60"
          >
            {hapusPending ? "Menghapus..." : "Hapus dari daftar"}
          </button>
          <button type="button" onClick={() => setShowHapus(false)} className="text-sm text-ink-soft">
            Batal
          </button>
        </div>
      </form>
    )}
  </div>
)}
```

Catatan: blok ini diletakkan **di luar** kondisi `izin.status === "MENUNGGU"` yang sudah ada, supaya Edit/Hapus tetap muncul di status apa pun (DISETUJUI, SEDANG_KELUAR, SUDAH_KEMBALI, DITOLAK, dst).

### 8.5 `src/components/StatusPill.tsx`

Tambahkan satu baris ke object `STATUS_CONFIG`:

```ts
DIHAPUS: { label: "Dihapus", dot: "bg-ink-soft", text: "text-ink-soft" },
```

### 8.6 `src/app/beranda/page.tsx`

Cari baris filter status di fungsi `BerandaPengurus`:

```tsx
{["MENUNGGU","PERLU_REVISI","DISETUJUI","SEDANG_KELUAR","SUDAH_KEMBALI","DITOLAK"].map(s => <option key={s} value={s}>{s.replaceAll("_", " ")}</option>)}
```

Tambahkan `"DIHAPUS"` di akhir array:

```tsx
{["MENUNGGU","PERLU_REVISI","DISETUJUI","SEDANG_KELUAR","SUDAH_KEMBALI","DITOLAK","DIHAPUS"].map(s => <option key={s} value={s}>{s.replaceAll("_", " ")}</option>)}
```

### 8.7 (Opsional/bonus, boleh dilewati kalau waktu terbatas) `src/components/ExportLaporanForm.tsx`

Tambahkan satu opsi di `<select id="export-status">`:

```tsx
<option value="DIHAPUS">Dihapus</option>
```

## 9. Validasi & edge case yang wajib ditangani

- [ ] `editIzinAction` dan `hapusIzinAction` menolak akses kalau bukan `PENGURUS` (lewat `requireAdmin()`), sama seperti action lain di `admin/actions.ts`.
- [ ] Form Edit tidak bisa dikirim tanpa "Alasan perubahan" diisi (validasi browser `required` **dan** validasi server `zod`, minimal 3 karakter).
- [ ] Form Hapus tidak bisa dikirim tanpa "Alasan penghapusan" diisi.
- [ ] Edit pada pengajuan yang sudah `DIHAPUS` harus ditolak dengan pesan error, bukan berhasil mengubah data.
- [ ] Hapus pada pengajuan yang sudah `DIHAPUS` (misal diklik dua kali cepat / dua tab) harus ditolak percobaan keduanya, bukan crash.
- [ ] Edit **tidak mengubah kolom `status`** — status pengajuan tetap sama persis seperti sebelum diedit.
- [ ] Setelah dihapus, pengajuan hilang dari riwayat gelara (`getRiwayatIzinSantri`) dan dari daftar default pengurus (`fetchPagedIzin` tanpa filter), tapi tetap muncul kalau pengurus memilih filter status "Dihapus".
- [ ] Setiap Edit tercatat di `izin_logs` dengan `data_sebelum` dan `data_sesudah` lengkap dan benar.
- [ ] Setiap Hapus tercatat di `izin_logs` dengan `old_status` sesuai status sebelum dihapus.
- [ ] Gelara menerima notifikasi push saat pengajuannya diedit maupun dihapus (kalau VAPID key sudah dikonfigurasi di `.env.local`).
- **Known limitation (boleh didiamkan untuk versi pertama, tidak menghalangi rilis):** kalau pengurus meng-edit `perkiraan_kembali` pada pengajuan yang sudah berstatus `SUDAH_KEMBALI`, kolom `late_minutes`/`return_status` yang sudah tersimpan **tidak otomatis dihitung ulang**. Catat ini di deskripsi PR/commit supaya reviewer sadar.

## 10. Testing checklist manual (sebelum dianggap selesai)

1. Login sebagai pengurus, buka `/beranda`, cari pengajuan berstatus **Disetujui**, klik "Edit data" → form muncul terisi data lama.
2. Ubah `tujuan`, isi "Alasan perubahan", klik "Simpan perubahan" → sukses, data di kartu berubah, **status tetap "Disetujui"** (tidak berubah jadi Menunggu atau lainnya).
3. Cek tabel `izin_logs` di Supabase: ada baris baru `action = 'EDIT_PENGURUS'` dengan `data_sebelum` dan `data_sesudah` sesuai perubahan.
4. Coba submit form Edit dengan "Alasan perubahan" dikosongkan → harus gagal dengan pesan error jelas.
5. Klik "Hapus pengajuan" pada pengajuan lain, isi alasan, klik "Hapus dari daftar" → pengajuan itu langsung hilang dari daftar "Semua pengajuan" (tanpa filter).
6. Refresh halaman gelara pemilik pengajuan tadi → pengajuan itu juga hilang dari riwayatnya.
7. Di dashboard pengurus, pilih filter status "Dihapus" → pengajuan yang tadi dihapus muncul kembali, tanpa tombol Edit/Hapus/Setujui/Tolak apa pun di baris itu.
8. Cek `izin_logs`: ada baris `action = 'HAPUS_PENGURUS'` dengan `catatan` sesuai alasan yang diisi.
9. Coba akses `editIzinAction`/`hapusIzinAction` sambil login sebagai **santri** (misal lewat form yang dimodifikasi manual di devtools) → harus ditolak "Tidak diizinkan.", bukan berhasil.
10. Login sebagai gelara yang pengajuannya baru diedit/dihapus → pastikan notifikasi push masuk (kalau push notification sudah aktif di device tsb).
11. Jalankan `npm run build` dan `npm run lint` → pastikan tidak ada error baru akibat perubahan ini.

## 11. Ringkasan file yang akan disentuh

| File | Perubahan |
|---|---|
| `supabase/schema.sql` | Tambah `'DIHAPUS'` ke check constraint status; tambah kolom `deleted_by`, `deleted_at` |
| `supabase/migration.sql` | Tambah section migrasi V6 |
| `src/types/database.types.ts` | Tambah `"DIHAPUS"` ke union status; tambah field `deleted_by`, `deleted_at` (Row/Insert/Update) |
| `src/services/izin.service.ts` | Tambah `getIzinFullById`, `editIzinByPengurus`, `deleteIzinByPengurus`; ubah `getRiwayatIzinSantri` dan `fetchPagedIzin` supaya mengecualikan `DIHAPUS` secara default |
| `src/app/admin/actions.ts` | Tambah `editIzinAction`, `hapusIzinAction` + schema validasinya |
| `src/components/EditIzinForm.tsx` | **File baru** — form edit untuk pengurus |
| `src/components/AdminIzinRow.tsx` | Tambah tombol & state "Edit data" / "Hapus pengajuan" |
| `src/components/StatusPill.tsx` | Tambah entri `DIHAPUS` |
| `src/app/beranda/page.tsx` | Tambah `"DIHAPUS"` ke opsi filter status pengurus |
| `src/components/ExportLaporanForm.tsx` | (Opsional) tambah opsi status "Dihapus" |

## 12. Definition of Done

- Semua item checklist di Bagian 9 dan Bagian 10 sudah dicoba dan lolos, termasuk skenario keamanan (nomor 9 dan 5–8 di checklist testing).
- Tidak ada perubahan pada alur Setujui/Tolak/Minta Revisi/ajukan-izin-baru yang sudah ada (regresi nol).
- `editIzinAction` dan `hapusIzinAction` **selalu** memanggil `requireAdmin()` di baris pertama — kalau reviewer menemukan salah satu action ini bisa dipanggil tanpa cek role, kembalikan untuk diperbaiki, ini prioritas keamanan tertinggi di fitur ini.
- Setiap Edit/Hapus selalu menghasilkan satu baris baru di `izin_logs` — tidak boleh ada jalur kode yang mengubah data tanpa logging.
- Kode mengikuti gaya/pola yang sudah dipakai di file-file terkait (penamaan variabel, cara pakai `zod`, cara pakai `useActionState`, cara konversi tanggal WIB) — jangan bikin pola baru yang beda sendiri.
- Migrasi SQL sudah diuji jalan di database Supabase (baik instalasi baru dari `schema.sql` maupun database lama lewat `migration.sql`).