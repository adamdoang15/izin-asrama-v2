# Fitur: "Minta Revisi" — Pengurus Menandai, Gelara yang Merevisi Datanya

> **Koreksi penting dari draf sebelumnya:** yang benar-benar **mengedit data** pengajuan adalah **gelara (santri, pemilik izin)**, **bukan pengurus**. Pengurus hanya **menandai pengajuan butuh revisi** dan **menuliskan catatan** (apa yang salah/perlu diperbaiki). Setelah ditandai, gelara login, melihat catatan itu, mengedit datanya sendiri, lalu mengirim ulang. Baru setelah itu pengurus melihatnya lagi di antrean dan Setujui/Tolak seperti biasa.

## 1. Latar belakang

Saat ini, di halaman `/beranda`, setiap pengajuan izin berstatus `MENUNGGU` hanya punya dua aksi (lihat `src/components/AdminIzinRow.tsx`):

- **Setujui** → `setujuiIzinAction` di `src/app/admin/actions.ts`
- **Tolak** → `tolakIzinAction` di `src/app/admin/actions.ts`

Masalahnya: kalau gelara salah input data (salah pilih jenis izin, salah tulis tujuan, salah jam), satu-satunya jalan sekarang adalah **Tolak**, lalu gelara harus mengajukan izin baru dari nol. Ini merepotkan dan bikin histori data berantakan (ada izin "ditolak" padahal sebenarnya cuma typo).

## 2. Tujuan fitur

Menambahkan tombol **"Minta Revisi"** di samping tombol Setujui/Tolak untuk pengurus. Bedanya dengan Tolak:

- **Tolak** = pengajuan ditutup permanen, kalau gelara mau keluar lagi harus ajukan izin baru.
- **Minta Revisi** = pengajuan **tidak ditutup**, hanya dikembalikan ke gelara pemiliknya dengan catatan apa yang perlu diperbaiki. Gelara mengedit data yang salah di form yang sudah terisi otomatis, lalu kirim ulang — **tanpa membuat pengajuan baru**.

## 3. Aktor & pembagian tanggung jawab

| Aktor | Bisa apa |
|---|---|
| **Pengurus** | Melihat pengajuan `MENUNGGU`, klik "Minta Revisi", **wajib** menulis catatan (apa yang salah / perlu diperbaiki). Pengurus **tidak mengubah data pengajuan sama sekali** — pengurus cuma memberi status "butuh revisi" + catatan. |
| **Gelara (santri, pemilik izin)** | Melihat pengajuannya sendiri yang berstatus "Perlu direvisi" beserta catatan dari pengurus, mengedit field yang salah (jenis izin, tujuan, alasan, waktu keluar, perkiraan kembali), lalu kirim ulang. Setelah dikirim ulang, status kembali jadi `MENUNGGU` dan masuk antrean pengurus lagi. |

## 4. Lingkup (scope)

**Termasuk:**
- Tombol "Minta Revisi" untuk pengurus, hanya muncul di izin berstatus `MENUNGGU`.
- Form "Minta Revisi" hanya berisi **satu field wajib**: catatan (apa yang perlu diperbaiki gelara). Pengurus **tidak** mengedit `jenis_izin`/`tujuan`/`alasan`/tanggal di sini.
- Status baru pada izin: `PERLU_REVISI`.
- Di sisi gelara (halaman `/beranda` versi santri), pengajuan berstatus `PERLU_REVISI` menampilkan catatan dari pengurus + form edit (field-nya sudah terisi data lama, gelara tinggal betulkan yang salah).
- Setelah gelara kirim ulang, status kembali ke `MENUNGGU`, pengurus dapat notifikasi bahwa ada pengajuan yang sudah direvisi dan siap ditinjau lagi.
- Semua kejadian (minta revisi & kirim ulang revisi) tercatat di `izin_logs` untuk audit.

**Tidak termasuk (di luar scope):**
- Pengurus **tidak** boleh mengedit data pengajuan santri secara langsung. Kalau nanti dibutuhkan (misalnya untuk kasus darurat di mana gelara tidak bisa dihubungi), itu tiket terpisah dan butuh diskusi keamanan/izin tersendiri.
- Minta Revisi untuk izin yang sudah `DISETUJUI`, `SEDANG_KELUAR`, `SUDAH_KEMBALI`, atau `DITOLAK` — hanya berlaku untuk `MENUNGGU`.
- Tidak ada batas berapa kali sebuah izin boleh bolak-balik revisi (boleh berkali-kali, tidak perlu dibatasi di versi pertama ini).

## 5. Desain solusi

### 5.1 Status baru: `PERLU_REVISI`

Tambahkan satu nilai baru ke enum status izin yang sudah ada di `supabase/schema.sql` / `supabase/migration.sql`, di antara `MENUNGGU` dan status lain:

```
MENUNGGU → PERLU_REVISI → MENUNGGU → (DISETUJUI | DITOLAK) → ...
```

Jadi state machine status izin yang sudah ada (`MENUNGGU → DISETUJUI/DITOLAK/SEDANG_KELUAR → SUDAH_KEMBALI`) tetap sama persis, cuma ditambah satu "jalur memutar": dari `MENUNGGU` bisa mampir ke `PERLU_REVISI` lalu balik lagi ke `MENUNGGU`.

### 5.2 Alur end-to-end

1. Gelara mengajukan izin seperti biasa (tidak berubah) → status `MENUNGGU`.
2. Pengurus buka `/beranda`, lihat pengajuan itu di `AdminIzinRow`. Selain tombol Setujui/Tolak, ada tombol baru **"Minta Revisi"**.
3. Pengurus klik "Minta Revisi" → muncul form kecil dengan satu textarea **wajib diisi**: "Catatan untuk gelara" (contoh: "Jenis izin salah pilih, seharusnya Menginap bukan Harian"). Klik "Kirim ke gelara".
4. Server action `mintaRevisiIzinAction` (pengurus) mengubah status izin jadi `PERLU_REVISI`, menyimpan catatan itu ke kolom `catatan_admin` (kolom ini sudah ada di tabel `izin`, sekarang dipakai juga untuk kebutuhan ini, tidak perlu kolom baru), dan mencatat log `izin_logs` dengan `action = 'MINTA_REVISI'`.
5. Sistem kirim notifikasi push ke gelara pemilik izin: "Pengajuan izin Anda perlu direvisi. Catatan: {catatan dari pengurus}".
6. Gelara login, buka `/beranda` (halaman miliknya sendiri, bagian "Riwayat pengajuan"). Pengajuan dengan status `PERLU_REVISI` menampilkan catatan pengurus + tombol **"Revisi & Kirim Ulang"**.
7. Klik tombol itu → muncul form edit (field-nya **sudah terisi** dengan data yang sekarang tersimpan: jenis izin, tujuan, alasan, waktu keluar, perkiraan kembali). Gelara memperbaiki yang salah, lalu klik "Kirim ulang".
8. Server action `kirimRevisiIzinAction` (santri) memvalidasi datanya (aturan validasi sama seperti saat mengajukan izin baru), memastikan izin ini memang **milik gelara yang login** dan statusnya memang `PERLU_REVISI`, lalu meng-update data izin dan mengubah status kembali ke `MENUNGGU`, mengosongkan `catatan_admin` (supaya tidak nyangkut catatan lama), dan mencatat log `izin_logs` dengan `action = 'KIRIM_REVISI'`.
9. Sistem kirim notifikasi push ke **semua pengurus** (pakai `sendNotificationToPengurus`, sama seperti saat pengajuan baru dibuat): "Gelara {nama} telah mengirim ulang pengajuan yang direvisi, mohon ditinjau."
10. Pengajuan itu muncul lagi di antrean pengurus dengan status `MENUNGGU`, siap di-Setujui/Tolak/Minta-Revisi-lagi seperti alur normal.

### 5.3 Kenapa desain begini?

- **Pengurus tidak boleh mengedit data gelara secara langsung** karena data pengajuan (alasan, tujuan) adalah pernyataan dari gelara sendiri — kalau pengurus yang mengubahnya diam-diam, itu jadi tidak akurat/tidak bisa dipertanggungjawabkan sebagai pernyataan gelara. Makanya cukup pengurus **menandai + kasih catatan**, dan gelara sendiri yang membetulkan.
- **Reuse kolom `catatan_admin`**: kolom ini sudah ada di tabel `izin` dan sudah dipakai untuk catatan penolakan (`rejectIzin` di `src/services/izin.service.ts`). Karena semantiknya mirip ("catatan dari pengurus untuk gelara terkait status pengajuan ini"), kita pakai kolom yang sama untuk catatan revisi. Ini menghindari migrasi kolom baru yang tidak perlu.
- **Status balik ke `MENUNGGU`, bukan langsung disetujui otomatis**: supaya pengurus tetap meninjau ulang data yang sudah diperbaiki sebelum benar-benar menyetujui — mencegah bug di mana data berubah tapi tidak ada yang mengecek ulang.

## 6. Perubahan database

### 6.1 `supabase/schema.sql`

Cari baris definisi kolom `status` di tabel `izin`:

```sql
status text not null default 'MENUNGGU' check (status in ('MENUNGGU','DISETUJUI','DITOLAK','SEDANG_KELUAR','SUDAH_KEMBALI','TIDAK_JADI')),
```

Ubah jadi (tambahkan `'PERLU_REVISI'`):

```sql
status text not null default 'MENUNGGU' check (status in ('MENUNGGU','PERLU_REVISI','DISETUJUI','DITOLAK','SEDANG_KELUAR','SUDAH_KEMBALI','TIDAK_JADI')),
```

(Opsional tapi disarankan untuk audit yang lebih detail) Tambahkan dua kolom baru di tabel `izin_logs` untuk menyimpan snapshot data sebelum/sesudah saat gelara mengirim ulang revisinya:

```sql
create table if not exists public.izin_logs (
  id bigint generated always as identity primary key,
  izin_id bigint not null references public.izin(id) on delete cascade,
  actor_id bigint references public.users(id) on delete set null,
  action text not null,
  old_status text,
  new_status text,
  catatan text,
  data_sebelum jsonb,
  data_sesudah jsonb,
  created_at timestamptz not null default now()
);
```

### 6.2 `supabase/migration.sql`

Tambahkan section baru di paling bawah file, ikuti pola versi-versi sebelumnya (`-- Perubahan alur V4: ...` yang sudah ada di file itu):

```sql
-- Perubahan alur V5: Fitur "Minta Revisi" (pengurus menandai, gelara yang merevisi)
alter table public.izin_logs add column if not exists data_sebelum jsonb;
alter table public.izin_logs add column if not exists data_sesudah jsonb;

-- Constraint status lama harus dilepas dulu sebelum status baru ditambahkan,
-- sama seperti pola yang dipakai waktu migrasi V1 -> V2 di atas.
do $$
declare r record;
begin
  for r in select conname from pg_constraint where conrelid = 'public.izin'::regclass and contype = 'c' and pg_get_constraintdef(oid) ilike '%status%' and pg_get_constraintdef(oid) ilike '%MENUNGGU%' loop
    execute format('alter table public.izin drop constraint if exists %I', r.conname);
  end loop;
end $$;

alter table public.izin add constraint izin_status_v5
  check (status in ('MENUNGGU','PERLU_REVISI','DISETUJUI','DITOLAK','SEDANG_KELUAR','SUDAH_KEMBALI','TIDAK_JADI'));
```

**Wajib dites**: jalankan migrasi ini di database Supabase yang sudah ada datanya (bukan cuma database baru), pastikan tidak ada error constraint dan data lama tidak berubah.

**Catatan:** kolom `action` di `izin_logs` bertipe `text` biasa tanpa `check constraint`, jadi aman menambahkan nilai baru `'MINTA_REVISI'` dan `'KIRIM_REVISI'` tanpa migrasi tambahan untuk constraint itu.

## 7. Perubahan backend

### 7.1 `src/lib/format.ts` — tambah fungsi kebalikan dari `wibInputToISOString`

File ini sudah punya `wibInputToISOString(value)` yang mengubah string dari `<input type="datetime-local">` (WIB, tanpa info timezone) menjadi ISO UTC untuk disimpan ke database. Untuk form revisi milik gelara, kita butuh kebalikannya: mengubah ISO UTC yang tersimpan di database jadi string WIB naive supaya bisa jadi `defaultValue`/`value` input `datetime-local`. Tambahkan fungsi baru:

```ts
/**
 * Kebalikan dari wibInputToISOString: mengubah ISO timestamp (UTC) menjadi
 * string "YYYY-MM-DDTHH:mm" yang merepresentasikan jam WIB-nya, supaya bisa
 * dipakai sebagai defaultValue/value pada <input type="datetime-local">.
 */
export function isoToWibInputValue(value: string | null | undefined): string {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  const wibMs = date.getTime() + WIB_OFFSET_MS;
  const wib = new Date(wibMs);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${wib.getUTCFullYear()}-${pad(wib.getUTCMonth() + 1)}-${pad(wib.getUTCDate())}T${pad(wib.getUTCHours())}:${pad(wib.getUTCMinutes())}`;
}
```

Tempatkan fungsi ini di bawah `wibInputToISOString` di file yang sama, supaya mudah dibandingkan.

### 7.2 `src/services/izin.service.ts`

Tambah dua fungsi baru, ikuti pola `approveIzin`/`rejectIzin` yang sudah ada di file ini:

```ts
export async function requestIzinRevision(
  id: number,
  actorId: number,
  catatan: string
): Promise<{ error?: string }> {
  const now = new Date().toISOString();
  const current = await getCurrentIzinStatus(id);
  if (!current) return { error: "Pengajuan tidak ditemukan." };

  const { error } = await supabase
    .from("izin")
    .update({
      status: "PERLU_REVISI",
      catatan_admin: catatan,
      updated_at: now,
    })
    .eq("id", id)
    .eq("status", "MENUNGGU"); // jaga-jaga race condition, sama seperti approveIzin/rejectIzin

  if (error) return { error: `Gagal meminta revisi: ${error.message}` };

  await supabase.from("izin_logs").insert({
    izin_id: id,
    actor_id: actorId,
    action: "MINTA_REVISI",
    old_status: "MENUNGGU",
    new_status: "PERLU_REVISI",
    catatan,
  });

  if (current.user_id) {
    await sendNotificationToUser(current.user_id, {
      title: "Pengajuan Izin Perlu Direvisi",
      body: `Catatan dari petugas: ${catatan}`,
      url: "/beranda",
    }).catch((err) => console.error("Gagal mengirim notifikasi minta revisi:", err));
  }

  return {};
}

export interface SubmitRevisionInput {
  jenis_izin: JenisIzin;
  alasan: string;
  tujuan: string;
  tanggal_keluar: string;      // ISO string
  perkiraan_kembali: string;   // ISO string
}

export async function submitIzinRevision(
  id: number,
  userId: number,
  santriName: string,
  input: SubmitRevisionInput
): Promise<{ error?: string }> {
  const now = new Date().toISOString();

  // Ambil data lama untuk snapshot log & validasi kepemilikan/status
  const { data: before, error: beforeError } = await supabase
    .from("izin")
    .select("id, user_id, status, jenis_izin, alasan, tujuan, tanggal_keluar, perkiraan_kembali")
    .eq("id", id)
    .maybeSingle();

  if (beforeError || !before) return { error: "Pengajuan tidak ditemukan." };
  if (before.user_id !== userId) return { error: "Anda tidak memiliki akses ke pengajuan ini." };
  if (before.status !== "PERLU_REVISI") return { error: "Pengajuan ini tidak sedang menunggu revisi Anda." };

  const { error } = await supabase
    .from("izin")
    .update({
      jenis_izin: input.jenis_izin,
      alasan: input.alasan,
      tujuan: input.tujuan,
      tanggal_keluar: input.tanggal_keluar,
      perkiraan_kembali: input.perkiraan_kembali,
      status: "MENUNGGU",
      catatan_admin: null,
      updated_at: now,
    })
    .eq("id", id)
    .eq("user_id", userId)
    .eq("status", "PERLU_REVISI"); // jaga-jaga race condition

  if (error) return { error: `Gagal mengirim ulang revisi: ${error.message}` };

  await supabase.from("izin_logs").insert({
    izin_id: id,
    actor_id: userId,
    action: "KIRIM_REVISI",
    old_status: "PERLU_REVISI",
    new_status: "MENUNGGU",
    catatan: null,
    data_sebelum: {
      jenis_izin: before.jenis_izin,
      alasan: before.alasan,
      tujuan: before.tujuan,
      tanggal_keluar: before.tanggal_keluar,
      perkiraan_kembali: before.perkiraan_kembali,
    },
    data_sesudah: input,
  });

  await sendNotificationToPengurus({
    title: "Revisi Pengajuan Izin Dikirim",
    body: `${santriName} telah mengirim ulang pengajuan yang direvisi, mohon ditinjau.`,
    url: "/beranda",
  }).catch((err) => console.error("Gagal mengirim notifikasi kirim revisi:", err));

  return {};
}
```

**Poin penting:**
- `requestIzinRevision` **tidak menyentuh field data** (`jenis_izin`, `alasan`, `tujuan`, tanggal) sama sekali — cuma `status` dan `catatan_admin`. Ini yang membedakan dari draf lama; jangan sampai fungsi ini ikut menerima parameter data izin.
- `submitIzinRevision` **wajib** memverifikasi `before.user_id !== userId` — ini krusial, supaya seorang gelara tidak bisa mengirim "revisi" untuk pengajuan milik gelara lain hanya dengan menebak `id`.
- Sama seperti alur pengajuan baru, kalau `tanggal_keluar`/`perkiraan_kembali` diubah gelara saat revisi, sebaiknya dicek dulu potensi bentrok jadwal lewat `checkActiveIzinConflict` (fungsi yang sudah ada di file yang sama) **sebelum** memanggil `submitIzinRevision`. Fungsi `checkActiveIzinConflict` saat ini tidak mengecualikan izin yang sedang direvisi itu sendiri dari pengecekan, padahal statusnya (`PERLU_REVISI`) tidak termasuk dalam daftar status yang dicek (`MENUNGGU`, `DISETUJUI`, `SEDANG_KELUAR`) — jadi **sebenarnya aman tanpa perlu parameter `excludeId`** untuk kasus ini. Tetap periksa ulang dengan hati-hati saat implementasi: pastikan test case "gelara merevisi jadwal miliknya sendiri" tidak salah dianggap bentrok dengan pengajuan itu sendiri.

### 7.3 `src/app/admin/actions.ts` — tambah `mintaRevisiIzinAction`

Tambahkan action baru, ikuti pola `tolakIzinAction` yang sudah ada (perhatikan: field-nya cuma `id` + `catatan`, **tidak ada field data izin sama sekali**):

```ts
const mintaRevisiSchema = z.object({
  id: idSchema,
  catatan: z.string().trim().min(3, "Catatan untuk gelara wajib diisi."),
});

export async function mintaRevisiIzinAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const session = await requireAdmin();
  const parsed = mintaRevisiSchema.safeParse({ id: formData.get("id"), catatan: formData.get("catatan") });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Data tidak valid." };

  const current = await getCurrentIzinStatus(parsed.data.id);
  if (!current) return { error: "Pengajuan tidak ditemukan." };
  if (current.status !== "MENUNGGU") return { error: "Pengajuan ini sudah diproses." };

  const result = await requestIzinRevision(parsed.data.id, Number(session.user.id), parsed.data.catatan);
  if (result.error) return { error: result.error };

  revalidatePath("/beranda");
  return { success: true };
}
```

Update baris import di atas file:
```ts
import { getCurrentIzinStatus, approveIzin, rejectIzin, requestIzinRevision } from "@/services/izin.service";
```

### 7.4 `src/app/santri/actions.ts` — tambah `kirimRevisiIzinAction`

File ini sudah punya `izinSchema` (validasi jenis_izin/tujuan/alasan/tanggal) dan `ajukanIzinAction`. Tambahkan action baru yang **meniru persis** logika validasi `ajukanIzinAction` (termasuk cara konversi tanggal dengan `wibInputToISOString`, cek `perkiraan_kembali <= tanggal_keluar`, dan cek bentrok jadwal dengan `checkActiveIzinConflict`), tapi target akhirnya memanggil `submitIzinRevision`, bukan `createIzin`:

```ts
export type RevisiIzinState = { error?: string; success?: boolean };

const revisiIzinSchema = izinSchema.extend({
  id: z.coerce.number().int().positive(),
});

export async function kirimRevisiIzinAction(
  _prevState: RevisiIzinState,
  formData: FormData
): Promise<RevisiIzinState> {
  const session = await auth();
  if (!session?.user || session.user.role !== "SANTRI") {
    return { error: "Sesi tidak valid. Silakan masuk kembali." };
  }

  const parsed = revisiIzinSchema.safeParse({
    id: formData.get("id"),
    jenis_izin: formData.get("jenis_izin"),
    tujuan: formData.get("tujuan"),
    alasan: formData.get("alasan"),
    tanggal_keluar: formData.get("tanggal_keluar"),
    perkiraan_kembali: formData.get("perkiraan_kembali"),
  });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Data tidak valid." };

  const { jenis_izin, tujuan, alasan } = parsed.data;

  const tanggalKeluarISO = wibInputToISOString(parsed.data.tanggal_keluar);
  const perkiraanKembaliISO = wibInputToISOString(parsed.data.perkiraan_kembali);
  if (!tanggalKeluarISO || !perkiraanKembaliISO) {
    return { error: "Format tanggal tidak valid." };
  }

  const keluar = new Date(tanggalKeluarISO);
  const kembali = new Date(perkiraanKembaliISO);
  if (kembali <= keluar) return { error: "Perkiraan kembali harus setelah waktu keluar." };

  const conflict = await checkActiveIzinConflict(Number(session.user.id), tanggalKeluarISO, perkiraanKembaliISO);
  if (conflict.error) return { error: conflict.error };
  if (conflict.hasConflict) {
    return { error: "Jadwal baru ini bentrok dengan pengajuan/izin aktif Anda yang lain." };
  }

  const result = await submitIzinRevision(parsed.data.id, Number(session.user.id), session.user.name ?? "Gelara", {
    jenis_izin,
    alasan,
    tujuan,
    tanggal_keluar: tanggalKeluarISO,
    perkiraan_kembali: perkiraanKembaliISO,
  });
  if (result.error) return { error: result.error };

  revalidatePath("/beranda");
  return { success: true };
}
```

Update baris import di atas file:
```ts
import {
  syncScheduledIzinStatuses,
  checkActiveIzinConflict,
  createIzin,
  getCurrentIzinStatus,
  markIzinReturned,
  submitIzinRevision,
} from "@/services/izin.service";
```

## 8. Perubahan frontend

### 8.1 `src/components/StatusPill.tsx`

Tambahkan satu entri baru di `STATUS_CONFIG` untuk status `PERLU_REVISI`, misalnya:

```ts
PERLU_REVISI: { label: "Perlu direvisi", dot: "bg-clay", text: "text-clay" },
```

(Warna boleh disesuaikan asal jelas berbeda secara visual dari `MENUNGGU` dan `DITOLAK`, supaya pengurus/gelara tidak salah baca status di daftar.)

### 8.2 `src/components/AdminIzinRow.tsx` — tombol "Minta Revisi" untuk pengurus

- Import `mintaRevisiIzinAction` dari `@/app/admin/actions`.
- Tambah state: `const [showMintaRevisi, setShowMintaRevisi] = useState(false);`
- Tambah `useActionState` baru: `const [revisiState, revisiAction, revisiPending] = useActionState(mintaRevisiIzinAction, initialState);`
- Di blok tombol yang sekarang isinya Setujui/Tolak (`{izin.status === "MENUNGGU" && (...)}`), tambahkan tombol ketiga **"Minta Revisi"** di sebelah tombol "Tolak", yang men-set `showMintaRevisi(true)` (dan menutup form tolak kalau lagi terbuka, begitu juga sebaliknya — hanya satu form yang boleh terbuka dalam satu waktu).
- Kalau `showMintaRevisi === true`, render form kecil: satu `<textarea name="catatan" required rows={2} placeholder="Apa yang perlu diperbaiki gelara?" />` + `<input type="hidden" name="id" value={izin.id} />`, tombol submit "Kirim ke gelara" / "Mengirim..." saat `revisiPending`, dan tombol "Batal".
- **Tambahan penting**: kalau `izin.status === "PERLU_REVISI"`, jangan tampilkan tombol Setujui/Tolak/Minta-Revisi sama sekali (karena memang belum ada yang bisa disetujui — datanya sedang menunggu diperbaiki gelara). Sebagai gantinya tampilkan blok info, misalnya:

```tsx
{izin.status === "PERLU_REVISI" && (
  <div className="mt-3.5 pt-3.5 border-t border-line text-sm text-ink-soft">
    Menunggu gelara merevisi pengajuan ini.
    {izin.catatan_admin && <p className="mt-1">Catatan Anda: {izin.catatan_admin}</p>}
  </div>
)}
```

### 8.3 Komponen baru `src/components/RevisiIzinForm.tsx` — form edit untuk gelara

Buat komponen baru meniru gaya `src/components/IzinForm.tsx` (field sama persis: `jenis_izin`, `tujuan`, `alasan`, `tanggal_keluar`, `perkiraan_kembali`), dengan perbedaan:

- Menerima props data izin yang sedang direvisi: `id`, `jenis_izin`, `tujuan`, `alasan`, `tanggal_keluar` (ISO), `perkiraan_kembali` (ISO), dan `catatanAdmin`.
- Semua field diisi `defaultValue`/`value` awal dari data yang sedang direvisi, bukan kosong. Untuk dua field tanggal, konversi dari ISO ke string `datetime-local` pakai fungsi baru `isoToWibInputValue` dari `src/lib/format.ts` (lihat bagian 7.1).
- Tampilkan catatan dari pengurus (`catatanAdmin`) di bagian atas form dengan gaya yang jelas terlihat (mirip blok peringatan blacklist di `IzinForm.tsx`, boleh dicontek stylingnya), supaya gelara langsung tahu apa yang perlu dibetulkan.
- Gunakan `useActionState(kirimRevisiIzinAction, initialState)` dari `@/app/santri/actions`, sertakan `<input type="hidden" name="id" value={id} />`.
- Tombol submit: "Kirim ulang" / "Mengirim..." saat pending.
- Boleh dicontek validasi client-side untuk `perkiraan_kembali > tanggal_keluar` seperti yang sudah ada di `IzinForm.tsx` (pakai `useEffect` yang sama polanya) supaya gelara dapat feedback instan sebelum submit.

### 8.4 `src/app/beranda/page.tsx`

- Di fungsi `BerandaSantri`, pada bagian render `riwayat.map(...)`, tambahkan kondisi: kalau `izin.status === "PERLU_REVISI"`, render `<RevisiIzinForm .../>` di bawah info izin tsb (menggantikan posisi `<ReturnIzinButton>` yang sekarang hanya muncul untuk status `SEDANG_KELUAR` — pola kondisionalnya sama, tinggal ditambah satu cabang lagi).
- Import `RevisiIzinForm` dari `@/components/RevisiIzinForm`.
- Di fungsi `BerandaPengurus`, tambahkan `PERLU_REVISI` ke dalam array pilihan filter status pada `<select name="status">` (cari baris `["MENUNGGU","DISETUJUI","SEDANG_KELUAR","SUDAH_KEMBALI","DITOLAK"]` dan tambahkan `"PERLU_REVISI"` di situ) supaya pengurus bisa memfilter daftar pengajuan yang sedang menunggu direvisi gelara.
- (Opsional, boleh di-skip di iterasi pertama kalau dirasa scope tambahan) Tambahkan satu kartu `<Stat label="Perlu revisi" .../>` di baris statistik, dengan nilai dari `counts.PERLU_REVISI ?? 0`.

### 8.5 `src/services/izin.service.ts` — `getIzinCounts`

Tambahkan `PERLU_REVISI: 0` ke object `counts` awal di fungsi `getIzinCounts`, supaya statusnya ikut terhitung dan tidak menyebabkan `undefined` kalau dipakai untuk kartu statistik di langkah 8.4:

```ts
const counts = { MENUNGGU: 0, PERLU_REVISI: 0, DISETUJUI: 0, SEDANG_KELUAR: 0, SUDAH_KEMBALI: 0, DITOLAK: 0 } as Record<string, number>;
```

## 9. Validasi & edge case yang wajib ditangani

- [ ] Tombol "Minta Revisi" hanya muncul untuk izin berstatus `MENUNGGU`.
- [ ] Form "Minta Revisi" tidak bisa dikirim tanpa catatan (validasi browser `required` **dan** validasi server `zod`, minimal 3 karakter).
- [ ] Setelah diminta revisi, izin **tidak lagi menampilkan tombol Setujui/Tolak/Minta-Revisi** di dashboard pengurus sampai gelara mengirim ulang.
- [ ] Gelara **hanya bisa** mengirim ulang revisi untuk pengajuan **miliknya sendiri** — wajib dicek `before.user_id === userId` di `submitIzinRevision`, kembalikan error kalau tidak cocok (bukan crash / data bocor).
- [ ] Gelara **tidak bisa** mengirim ulang revisi kalau status pengajuan itu bukan `PERLU_REVISI` (misalnya sudah keburu disetujui/ditolak pengurus lain, atau sudah dikirim ulang sebelumnya).
- [ ] Validasi tanggal & field wajib di form revisi gelara sama ketatnya dengan form pengajuan baru (`perkiraan_kembali` harus setelah `tanggal_keluar`, semua field tidak boleh kosong).
- [ ] Jadwal baru hasil revisi tidak bentrok dengan izin aktif lain milik gelara yang sama (pakai `checkActiveIzinConflict`).
- [ ] Setelah gelara kirim ulang, `catatan_admin` di database harus sudah kosong lagi (`null`), supaya tidak ada catatan basi yang nyangkut di pengajuan yang sudah direvisi.
- [ ] Notifikasi terkirim dua arah: pengurus → gelara saat diminta revisi, gelara → semua pengurus saat revisi dikirim ulang.

## 10. Testing checklist manual (sebelum dianggap selesai)

1. Login sebagai pengurus, buka `/beranda`, cari izin berstatus Menunggu, klik "Minta Revisi".
2. Coba kirim tanpa mengisi catatan → harus gagal dengan pesan error jelas.
3. Isi catatan (contoh: "Tujuan kurang jelas, tolong sebutkan nama tempatnya"), kirim → sukses. Status izin di dashboard pengurus berubah jadi "Perlu direvisi" dan tombol aksi hilang, diganti info "Menunggu gelara merevisi...".
4. Cek `izin_logs` di Supabase: ada baris baru `action = 'MINTA_REVISI'` dengan `catatan` terisi sesuai yang ditulis pengurus.
5. Login sebagai gelara pemilik izin tsb, buka `/beranda`. Pengajuan itu tampil dengan status "Perlu direvisi" beserta catatan dari pengurus, dan form edit sudah terisi data lama.
6. Ubah field yang salah, coba kirim dengan `perkiraan_kembali` lebih awal dari `tanggal_keluar` → harus gagal, pesan error jelas.
7. Perbaiki tanggalnya, kirim ulang → sukses. Status kembali jadi "Menunggu", data di kartu riwayat sudah menampilkan data baru.
8. Cek `izin_logs`: ada baris baru `action = 'KIRIM_REVISI'` dengan `data_sebelum` dan `data_sesudah` terisi benar, dan kolom `catatan_admin` di tabel `izin` sudah kosong lagi.
9. Login sebagai pengurus lagi, pengajuan itu sudah muncul kembali di antrean "Menunggu" dengan tombol Setujui/Tolak/Minta-Revisi aktif lagi seperti pengajuan normal. Klik "Setujui" → berhasil seperti alur biasa.
10. Coba (misalnya lewat dua sesi browser berbeda / dua akun gelara) mengirim revisi untuk `id` pengajuan **milik gelara lain** dengan mengubah nilai `id` di form → harus ditolak dengan error, bukan berhasil mengubah data orang lain.
11. Coba kirim ulang revisi dua kali berturut-turut untuk pengajuan yang sama (submit form dua kali cepat / buka dua tab) → percobaan kedua harus gagal dengan pesan bahwa pengajuan sudah tidak berstatus "Perlu direvisi" lagi, bukan crash.
12. Pastikan build (`npm run build`) dan lint (`npm run lint` kalau ada) tidak ada error baru akibat perubahan ini.

## 11. Ringkasan file yang akan disentuh

| File | Perubahan |
|---|---|
| `supabase/schema.sql` | Tambah `'PERLU_REVISI'` ke check constraint status; tambah kolom `data_sebelum`, `data_sesudah` di `izin_logs` |
| `supabase/migration.sql` | Tambah section migrasi V5 |
| `src/lib/format.ts` | Tambah fungsi `isoToWibInputValue` |
| `src/services/izin.service.ts` | Tambah `requestIzinRevision`, `submitIzinRevision`; tambah `PERLU_REVISI` di `getIzinCounts` |
| `src/app/admin/actions.ts` | Tambah `mintaRevisiIzinAction` + schema validasinya |
| `src/app/santri/actions.ts` | Tambah `kirimRevisiIzinAction` + schema validasinya |
| `src/components/StatusPill.tsx` | Tambah entri `PERLU_REVISI` |
| `src/components/AdminIzinRow.tsx` | Tambah tombol & form "Minta Revisi"; tambah blok info saat `PERLU_REVISI` |
| `src/components/RevisiIzinForm.tsx` | **File baru** — form edit untuk gelara |
| `src/app/beranda/page.tsx` | Render `RevisiIzinForm` di riwayat gelara; tambah opsi filter status & (opsional) kartu statistik untuk pengurus |

## 12. Definition of Done

- Semua item di checklist bagian 9 dan 10 sudah dicoba dan lolos, termasuk skenario keamanan (nomor 10 dan 11 di checklist testing).
- Tidak ada perubahan pada alur Setujui/Tolak/ajukan-izin-baru yang sudah ada (regresi nol).
- Pengurus **tidak pernah** langsung mengubah field data izin (`jenis_izin`, `tujuan`, `alasan`, tanggal) di kode manapun — kalau reviewer menemukan ini, kembalikan untuk diperbaiki, karena ini melanggar prinsip inti fitur ini.
- Kode mengikuti gaya/pola yang sudah dipakai di file-file terkait (penamaan variabel, cara pakai `zod`, cara pakai `useActionState`, cara konversi tanggal WIB) — jangan bikin pola baru yang beda sendiri.
- Migrasi SQL sudah diuji jalan di database Supabase (baik instalasi baru dari `schema.sql` maupun database lama lewat `migration.sql`).