import Link from "next/link";
import { formatTanggalWaktu, jakartaDayRange, jakartaDateParts } from "@/lib/format";
import ReturnIzinButton from "@/components/ReturnIzinButton";
import StatusPill from "@/components/StatusPill";
import { JENIS_IZIN_LABEL } from "@/lib/types";
import {
  syncScheduledIzinStatuses,
  getRiwayatIzinSantri,
  getIzinCountsHariIni,
  getIzinKeluarHariIni,
  getIzinMenungguPersetujuan,
  fetchPagedIzin,
} from "@/services/izin.service";
import { getUserById, syncBlacklistStatus } from "@/services/user.service";
import IzinForm from "@/components/IzinForm";
import RevisiIzinForm from "@/components/RevisiIzinForm";
import AdminIzinRow from "@/components/AdminIzinRow";
import { StatusIzin, IzinRowWithUserJoin, IzinWithSantri } from "@/lib/types";

// Note: IzinForm, RevisiIzinForm, AdminIzinRow, StatusPill should theoretically be upgraded to V2 as well.
// For now we use the V1 components for the form/pill and wrap them in V2 layout, 
// except ReturnIzinButtonV2 which we explicitly upgraded.

export async function BerandaSantri({ userId }: { userId: number }) {
  await Promise.all([syncScheduledIzinStatuses(), syncBlacklistStatus()]);
  const [riwayat, user] = await Promise.all([
    getRiwayatIzinSantri(userId),
    getUserById(userId),
  ]);

  const { year, month, day } = jakartaDateParts();
  const todayStr = `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
  const isBlacklisted = Boolean(user?.is_blacklisted) && (!user?.blacklist_until || user.blacklist_until >= todayStr);

  return (
    <main className="flex-1 max-w-3xl mx-auto w-full px-4 sm:px-6 py-8 space-y-10">
      <section className="bg-paper-raised p-6 rounded-2xl border border-line shadow-sm">
        <h2 className="text-xl font-semibold tracking-tight mb-2">Ajukan izin keluar</h2>
        <p className="text-sm text-ink-soft mb-6">Pilih jenis izin, isi tujuan dan waktu, lalu tunggu persetujuan petugas.</p>
        <IzinForm isBlacklisted={isBlacklisted} blacklistReason={user?.blacklist_reason} blacklistUntil={user?.blacklist_until} />
      </section>
      
      <section>
        <h2 className="text-xl font-semibold tracking-tight mb-5">Riwayat pengajuan</h2>
        {riwayat.length === 0 ? (
          <div className="bg-paper-raised p-8 rounded-2xl border border-line border-dashed text-center">
            <p className="text-sm text-ink-soft">Belum ada pengajuan izin.</p>
          </div>
        ) : (
          <ul className="space-y-4">
            {riwayat.map((izin) => {
              const approver = izin.approved_by_user?.name ?? null;
              return (
                <li key={izin.id} className="rounded-2xl border border-line bg-paper-raised p-5 shadow-sm transition-shadow hover:shadow-md">
                  <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-xs font-semibold uppercase tracking-wider text-teal bg-teal-soft px-2 py-1 rounded-md">
                          {JENIS_IZIN_LABEL[izin.jenis_izin]}
                        </span>
                        <StatusPill status={izin.status} />
                      </div>
                      
                      <p className="text-base font-semibold mt-1 truncate text-ink">{izin.tujuan}</p>
                      <p className="text-sm text-ink-soft mt-1 leading-relaxed">{izin.alasan}</p>
                      
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4 bg-paper p-3 rounded-xl border border-line">
                        <div>
                          <p className="text-xs font-medium text-ink-soft mb-0.5">Waktu Keluar</p>
                          <p className="text-sm font-medium">{formatTanggalWaktu(izin.tanggal_keluar)}</p>
                        </div>
                        <div>
                          <p className="text-xs font-medium text-ink-soft mb-0.5">Batas Kembali</p>
                          <p className="text-sm font-medium">{formatTanggalWaktu(izin.perkiraan_kembali)}</p>
                        </div>
                      </div>

                      {approver && (
                        <p className={`text-xs mt-3 font-medium ${izin.status === "DITOLAK" ? "text-clay" : "text-sage"}`}>
                          {izin.status === "DITOLAK" ? "Ditolak" : "Disetujui"} oleh {approver} · {formatTanggalWaktu(izin.approved_at)}
                        </p>
                      )}
                      {izin.returned_at && (
                        <p className={`text-xs mt-1 font-medium ${izin.return_status === "TERLAMBAT" ? "text-clay" : "text-sage"}`}>
                          Kembali: {formatTanggalWaktu(izin.returned_at)} · {izin.return_status === "TERLAMBAT" ? `Terlambat ${izin.late_minutes ?? 0} menit` : "Tepat waktu"}
                        </p>
                      )}
                      {izin.catatan_admin && (
                        <div className="mt-4 bg-amber-soft border border-amber-soft rounded-lg p-3">
                          <p className="text-xs font-semibold text-amber mb-1">Catatan Petugas:</p>
                          <p className="text-sm text-amber">{izin.catatan_admin}</p>
                        </div>
                      )}
                    </div>
                  </div>
                  {izin.status === "PERLU_REVISI" && (
                    <div className="mt-4 pt-4 border-t border-line">
                      <RevisiIzinForm izin={izin} />
                    </div>
                  )}
                  {izin.status === "SEDANG_KELUAR" && <ReturnIzinButton id={izin.id} />}
                </li>
              );
            })}
          </ul>
        )}
      </section>
    </main>
  );
}

const PAGE_SIZE = 20;

export async function BerandaPengurus({ searchParams }: { searchParams: Promise<{ page?: string; status?: string; q?: string }> }) {
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

  return (
    <main className="flex-1 max-w-5xl mx-auto w-full px-4 sm:px-6 py-8 space-y-10">
      <section>
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-6">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-ink">Dashboard Petugas</h1>
            <p className="text-sm text-ink-soft mt-1">Pantau pengajuan, gelara yang sedang keluar, dan kepulangan hari ini.</p>
          </div>
        </div>
        
        <div className="mb-3">
          <p className="text-xs font-bold text-ink-soft uppercase tracking-wider">Statistik Hari Ini</p>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          <StatV2 label="Menunggu" value={counts.MENUNGGU ?? 0} tone="amber" />
          <StatV2 label="Perlu Revisi" value={counts.PERLU_REVISI ?? 0} tone="clay" />
          <StatV2 label="Disetujui" value={counts.DISETUJUI ?? 0} tone="sage" />
          <StatV2 label="Sedang Keluar" value={counts.SEDANG_KELUAR ?? 0} tone="teal" />
          <StatV2 label="Sudah Kembali" value={counts.SUDAH_KEMBALI ?? 0} tone="sage" />
          <StatV2 label="Ditolak" value={counts.DITOLAK ?? 0} tone="clay" />
        </div>
      </section>

      <section>
        <h2 className="text-xl font-semibold tracking-tight mb-5">Aktivitas Hari Ini</h2>
        {todayRows.length === 0 ? (
          <div className="bg-paper-raised p-8 rounded-2xl border border-line border-dashed text-center">
            <p className="text-sm text-ink-soft">Tidak ada pengajuan baru maupun gelara yang sedang/terjadwal keluar hari ini.</p>
          </div>
        ) : (
          <ul className="space-y-4">
            {todayRows.map((i) => (
              // TODO: upgrade AdminIzinRow to V2 if needed
              <AdminIzinRow key={i.id} izin={i} />
            ))}
          </ul>
        )}
      </section>

      <section>
        <div className="flex items-center justify-between mb-5">
          <div>
            <h2 className="text-xl font-semibold tracking-tight">Semua Pengajuan</h2>
            <p className="text-sm text-ink-soft mt-1">{total} data ditemukan.</p>
          </div>
        </div>
        
        <form method="get" className="bg-paper-raised p-4 rounded-xl border border-line grid grid-cols-1 sm:grid-cols-[1fr_200px_auto] gap-3 mb-6">
          <input type="hidden" name="v2" value="1" disabled />
          <input 
            name="q" 
            defaultValue={q} 
            placeholder="Cari nama gelara..." 
            className="rounded-lg border border-line bg-paper px-4 py-2.5 text-sm focus:ring-2 focus:ring-teal focus:border-teal outline-none transition-all"
          />
          <select 
            name="status" 
            defaultValue={status ?? ""} 
            className="rounded-lg border border-line bg-paper px-4 py-2.5 text-sm focus:ring-2 focus:ring-teal outline-none transition-all"
          >
            <option value="">Semua status</option>
            {["MENUNGGU", "PERLU_REVISI", "DISETUJUI", "SEDANG_KELUAR", "SUDAH_KEMBALI", "DITOLAK", "DIHAPUS"].map((s) => (
              <option key={s} value={s}>{s.replaceAll("_", " ")}</option>
            ))}
          </select>
          <button className="rounded-lg bg-teal px-6 py-2.5 text-sm font-medium text-paper-raised hover:bg-teal-soft hover:text-teal transition-all active:scale-95">
            Filter
          </button>
        </form>

        {rows.length === 0 ? (
          <div className="bg-paper-raised p-8 rounded-2xl border border-line border-dashed text-center">
            <p className="text-sm text-ink-soft">Belum ada data yang cocok.</p>
          </div>
        ) : (
          <ul className="space-y-4">
            {rows.map((i) => (
              <AdminIzinRow key={i.id} izin={i} />
            ))}
          </ul>
        )}

        <div className="flex items-center justify-between mt-8 pt-6 border-t border-line text-sm font-medium">
          <Link 
            className={page <= 1 ? "pointer-events-none opacity-40 text-ink-soft" : "text-teal hover:underline"} 
            href={buildUrlV2(page - 1, status, q)}
          >
            ← Sebelumnya
          </Link>
          <span className="text-ink-soft bg-paper-raised px-4 py-1.5 rounded-full border border-line">
            Halaman {page} dari {totalPages}
          </span>
          <Link 
            className={page >= totalPages ? "pointer-events-none opacity-40 text-ink-soft" : "text-teal hover:underline"} 
            href={buildUrlV2(page + 1, status, q)}
          >
            Berikutnya →
          </Link>
        </div>
      </section>
    </main>
  );
}

function mapRows(data: IzinRowWithUserJoin[]): IzinWithSantri[] { 
  return data.map((row) => ({ 
    ...row, 
    nama_santri: row.users?.name ?? "Tidak diketahui", 
    kamar: row.users?.kamar ?? null, 
    nama_penyetuju: row.approved_by_user?.name ?? null 
  })); 
}

function buildUrlV2(page: number, status?: string, q?: string) { 
  const p = new URLSearchParams(); 
  p.set("page", String(page)); 
  if (status) p.set("status", status); 
  if (q) p.set("q", q); 
  return `/beranda?${p.toString()}`; 
}

function StatV2({ label, value, tone }: { label: string; value: number; tone: string }) { 
  const toneClasses = {
    amber: "text-amber bg-amber-soft border-amber/20",
    clay: "text-clay bg-clay-soft border-clay/20",
    teal: "text-teal bg-teal-soft border-teal/20",
    sage: "text-sage bg-sage-soft border-sage/20"
  }[tone] || "text-ink bg-paper-raised border-line";

  return (
    <div className={`rounded-2xl border p-4 flex flex-col items-start justify-center ${toneClasses} shadow-sm transition-transform hover:-translate-y-1`}>
      <p className="text-3xl font-bold tracking-tight mb-1">{value}</p>
      <p className="text-xs font-semibold uppercase tracking-wider opacity-80">{label}</p>
    </div>
  ); 
}

import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";

type SearchParams = Promise<{ page?: string; status?: string; q?: string }>;

export default async function BerandaPage({ searchParams }: { searchParams: SearchParams }) {
  const session = await auth();
  if (!session?.user) redirect("/login");
  return session.user.role === "PENGURUS" ? <BerandaPengurus searchParams={searchParams} /> : <BerandaSantri userId={Number(session.user.id)} />;
}
