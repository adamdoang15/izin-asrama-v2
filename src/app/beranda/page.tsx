import { redirect } from "next/navigation";
import Link from "next/link";
import { auth } from "@/lib/auth";
import type { IzinRowWithUserJoin, IzinWithSantri, StatusIzin } from "@/lib/types";
import { JENIS_IZIN_LABEL } from "@/lib/types";
import IzinForm from "@/components/IzinForm";
import StatusPill from "@/components/StatusPill";
import AdminIzinRow from "@/components/AdminIzinRow";
import { formatTanggalWaktu, jakartaDayRange, jakartaDateParts } from "@/lib/format";
import ReturnIzinButton from "@/components/ReturnIzinButton";
import RevisiIzinForm from "@/components/RevisiIzinForm";
import ExportLaporanForm from "@/components/ExportLaporanForm";
import {
  syncScheduledIzinStatuses,
  getRiwayatIzinSantri,
  getIzinCountsHariIni,
  getIzinKeluarHariIni,
  getIzinMenungguPersetujuan,
  fetchPagedIzin,
} from "@/services/izin.service";
import { getUserById, syncBlacklistStatus } from "@/services/user.service";

const PAGE_SIZE = 20;

type SearchParams = Promise<{ page?: string; status?: string; q?: string }>;

export default async function BerandaPage({ searchParams }: { searchParams: SearchParams }) {
  const session = await auth();
  if (!session?.user) redirect("/login");
  return session.user.role === "PENGURUS"
    ? <BerandaPengurus searchParams={searchParams} />
    : <BerandaSantri userId={Number(session.user.id)} />;
}

async function BerandaSantri({ userId }: { userId: number }) {
  await Promise.all([syncScheduledIzinStatuses(), syncBlacklistStatus()]);
  const [riwayat, user] = await Promise.all([
    getRiwayatIzinSantri(userId),
    getUserById(userId),
  ]);

  const { year, month, day } = jakartaDateParts();
  const todayStr = `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
  const isBlacklisted = Boolean(user?.is_blacklisted) && (!user?.blacklist_until || user.blacklist_until >= todayStr);

  return <main className="flex-1 max-w-3xl mx-auto w-full px-6 py-8 space-y-8">
    <section><h2 className="text-base font-semibold mb-1">Ajukan izin keluar</h2><p className="text-sm text-ink-soft mb-4">Pilih jenis izin, isi tujuan dan waktu, lalu tunggu persetujuan petugas.</p><IzinForm isBlacklisted={isBlacklisted} blacklistReason={user?.blacklist_reason} blacklistUntil={user?.blacklist_until} /></section>
    <section><h2 className="text-base font-semibold mb-4">Riwayat pengajuan</h2>{riwayat.length === 0 ? <p className="text-sm text-ink-soft">Belum ada pengajuan izin.</p> : <ul className="space-y-3">{riwayat.map((izin) => {
      const approver = izin.approved_by_user?.name ?? null;
      return <li key={izin.id} className="rounded-md border border-line bg-paper-raised px-4 py-3.5">
        <div className="flex items-start justify-between gap-4"><div className="min-w-0"><p className="text-xs text-teal">{JENIS_IZIN_LABEL[izin.jenis_izin]}</p><p className="text-sm font-medium mt-1 truncate">{izin.tujuan}</p><p className="text-sm text-ink-soft mt-0.5">{izin.alasan}</p><p className="text-xs text-ink-soft mt-2">Keluar: {formatTanggalWaktu(izin.tanggal_keluar)}</p><p className="text-xs text-ink-soft">Batas kembali: {formatTanggalWaktu(izin.perkiraan_kembali)}</p>{approver && <p className="text-xs text-sage mt-2">Disetujui oleh {approver} · {formatTanggalWaktu(izin.approved_at)}</p>}{izin.returned_at && <p className={`text-xs mt-1 ${izin.return_status === "TERLAMBAT" ? "text-clay" : "text-sage"}`}>Kembali: {formatTanggalWaktu(izin.returned_at)} · {izin.return_status === "TERLAMBAT" ? `Terlambat ${izin.late_minutes ?? 0} menit` : "Tepat waktu"}</p>}{izin.catatan_admin && <p className="text-xs text-ink-soft mt-2 border-t border-line pt-2">Catatan petugas: {izin.catatan_admin}</p>}</div><StatusPill status={izin.status} /></div>
        {izin.status === "PERLU_REVISI" && <RevisiIzinForm izin={izin} />}
        {izin.status === "SEDANG_KELUAR" && <ReturnIzinButton id={izin.id} />}
      </li>;
    })}</ul>}</section>
  </main>;
}

async function BerandaPengurus({ searchParams }: { searchParams: SearchParams }) {
  const params = await searchParams;
  const page = Math.max(1, Number(params.page ?? "1") || 1);
  const status = params.status as StatusIzin | undefined;
  const q = (params.q ?? "").trim();
  const { start: dayStart, end: dayEnd } = jakartaDayRange();

  await Promise.all([syncScheduledIzinStatuses(), syncBlacklistStatus()]);

  const [counts, pendingRowsRaw, todayRowsRaw, listResult] = await Promise.all([
    getIzinCountsHariIni(dayStart, dayEnd),
    getIzinMenungguPersetujuan(),
    getIzinKeluarHariIni(dayStart, dayEnd),
    fetchPagedIzin(page, PAGE_SIZE, status, q),
  ]);

  const todayRows = [...mapRows(pendingRowsRaw), ...mapRows(todayRowsRaw)];
  const rows = mapRows(listResult.data);
  const total = listResult.count;
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  return <main className="flex-1 max-w-5xl mx-auto w-full px-6 py-8 space-y-8">
    <section><div className="flex items-end justify-between gap-4 mb-4"><div><h1 className="text-lg font-semibold">Dashboard petugas</h1><p className="text-sm text-ink-soft">Pantau pengajuan, gelara yang sedang keluar, dan kepulangan hari ini.</p></div></div>
      <div className="mb-1"><p className="text-xs font-semibold text-ink-soft uppercase tracking-wide">Statistik hari ini</p></div>
      <div className="grid grid-cols-2 md:grid-cols-6 gap-3"><Stat label="Menunggu" value={counts.MENUNGGU ?? 0} tone="amber"/><Stat label="Perlu revisi" value={counts.PERLU_REVISI ?? 0} tone="clay"/><Stat label="Disetujui" value={counts.DISETUJUI ?? 0} tone="sage"/><Stat label="Sedang keluar" value={counts.SEDANG_KELUAR ?? 0} tone="teal"/><Stat label="Sudah kembali" value={counts.SUDAH_KEMBALI ?? 0} tone="sage"/><Stat label="Ditolak" value={counts.DITOLAK ?? 0} tone="clay"/></div>
    </section>
    <section><h2 className="text-base font-semibold mb-4">Keluar hari ini</h2>{todayRows.length === 0 ? <p className="text-sm text-ink-soft">Tidak ada pengajuan baru maupun gelara yang sedang/terjadwal keluar hari ini.</p> : <ul className="space-y-3">{todayRows.map(i => <AdminIzinRow key={i.id} izin={i}/>)}</ul>}</section>
    <section><div className="flex items-center justify-between mb-4"><div><h2 className="text-base font-semibold">Semua pengajuan</h2><p className="text-xs text-ink-soft mt-1">{total} data ditemukan.</p></div></div>
      <form method="get" className="grid grid-cols-1 sm:grid-cols-[1fr_180px_auto] gap-2 mb-4"><input name="q" defaultValue={q} placeholder="Cari nama gelara..." className="rounded-md border border-line bg-paper-raised px-3 py-2 text-sm"/><select name="status" defaultValue={status ?? ""} className="rounded-md border border-line bg-paper-raised px-3 py-2 text-sm"><option value="">Semua status</option>{["MENUNGGU","PERLU_REVISI","DISETUJUI","SEDANG_KELUAR","SUDAH_KEMBALI","DITOLAK","DIHAPUS"].map(s => <option key={s} value={s}>{s.replaceAll("_", " ")}</option>)}</select><button className="rounded-md bg-teal px-4 py-2 text-sm font-medium text-paper-raised">Filter</button></form>
      {rows.length === 0 ? <p className="text-sm text-ink-soft">Belum ada data yang cocok.</p> : <ul className="space-y-3">{rows.map(i => <AdminIzinRow key={i.id} izin={i}/>)}</ul>}
      <div className="flex items-center justify-between mt-5 text-sm"><Link className={page <= 1 ? "pointer-events-none opacity-40" : "text-teal"} href={buildUrl(page-1,status,q)}>← Sebelumnya</Link><span className="text-ink-soft">Halaman {page} / {totalPages}</span><Link className={page >= totalPages ? "pointer-events-none opacity-40" : "text-teal"} href={buildUrl(page+1,status,q)}>Berikutnya →</Link></div>
    </section>
  </main>;
}

function mapRows(data: IzinRowWithUserJoin[]): IzinWithSantri[] { return data.map(row => ({ ...row, nama_santri: row.users?.name ?? "Tidak diketahui", kamar: row.users?.kamar ?? null, nama_penyetuju: row.approved_by_user?.name ?? null })); }
function buildUrl(page: number, status?: string, q?: string) { const p = new URLSearchParams(); p.set("page", String(page)); if (status) p.set("status", status); if (q) p.set("q", q); return `/beranda?${p.toString()}`; }
function Stat({label,value,tone}:{label:string;value:number;tone:string}) { return <div className="rounded-md border border-line bg-paper-raised px-4 py-3"><p className={`text-xl font-semibold ${tone === "amber" ? "text-amber" : tone === "clay" ? "text-clay" : tone === "teal" ? "text-teal" : "text-sage"}`}>{value}</p><p className="text-xs text-ink-soft mt-1">{label}</p></div>; }
