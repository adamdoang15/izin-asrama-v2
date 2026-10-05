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
import ExportLaporanForm from "@/components/ExportLaporanForm";
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
    <main className="flex-1 max-w-4xl mx-auto w-full px-6 py-12 md:py-20 space-y-12 relative z-10">

      {/* Bold Header */}
      <div className="max-w-2xl">
        <h1 className="text-5xl md:text-7xl font-bold tracking-tighter text-ink">
          Halo, {user?.name?.split(" ")[0] || "Gelara"}.
        </h1>
        <p className="mt-4 text-lg font-medium leading-relaxed text-ink-soft md:text-xl">
          Kelola pengajuan izin kamu. Pastikan untuk selalu kembali tepat waktu sesuai pengajuan yang sudah disetujui yaa..
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-12 gap-8">
        {/* Form Section */}
        <section className="md:col-span-5 glass-panel p-8 md:p-10 flex flex-col h-fit">
          <div className="mb-8">
            <h2 className="text-xs font-semibold uppercase tracking-widest text-teal">Ajukan Izin</h2>
            <p className="mt-2 text-3xl font-bold tracking-tight text-ink">Keperluan Baru</p>
          </div>
          <IzinForm isBlacklisted={isBlacklisted} blacklistReason={user?.blacklist_reason} blacklistUntil={user?.blacklist_until} />
        </section>

        {/* History Section */}
        <section className="md:col-span-7 glass-panel p-8 md:p-10">
          <div className="mb-8">
            <h2 className="text-xs font-semibold uppercase tracking-widest text-ink-soft">Aktivitas</h2>
            <p className="mt-2 text-3xl font-bold tracking-tight text-ink">Riwayat Pengajuan</p>
          </div>

          {riwayat.length === 0 ? (
            <div className="rounded-xl border border-line border-dashed bg-white/20 p-10 text-center">
              <p className="text-sm font-medium text-ink-soft">Anda belum memiliki riwayat pengajuan izin.</p>
            </div>
          ) : (
            <ul className="space-y-6">
              {riwayat.map((izin) => {
                const approver = izin.approved_by_user?.name ?? null;
                return (
                  <li key={izin.id} className="relative pl-6 before:absolute before:left-0 before:top-2 before:bottom-0 before:w-px before:bg-line">
                    <div className="absolute left-[-4px] top-2.5 h-2.5 w-2.5 rounded-full bg-teal-soft border-2 border-teal"></div>

                    <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-3 mb-3">
                          <span className="text-[10px] font-bold uppercase tracking-widest text-teal bg-teal-soft/80 px-2 py-1 rounded-sm">
                            {JENIS_IZIN_LABEL[izin.jenis_izin]}
                          </span>
                          <StatusPill status={izin.status} />
                        </div>

                        <h3 className="text-xl font-bold tracking-tight mt-1 text-ink">{izin.tujuan}</h3>
                        <p className="text-sm font-medium text-ink-soft mt-2 leading-relaxed">{izin.alasan}</p>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mt-6 pt-6 border-t border-line/50">
                          <div>
                            <p className="text-[10px] font-bold uppercase tracking-widest text-ink-soft mb-1">Waktu Keluar</p>
                            <p className="text-sm font-semibold">{formatTanggalWaktu(izin.tanggal_keluar)}</p>
                          </div>
                          <div>
                            <p className="text-[10px] font-bold uppercase tracking-widest text-ink-soft mb-1">Batas Kembali</p>
                            <p className="text-sm font-semibold">{formatTanggalWaktu(izin.perkiraan_kembali)}</p>
                          </div>
                        </div>

                        <div className="mt-5 space-y-2">
                          {approver && (
                            <p className={`text-xs font-semibold ${izin.status === "DITOLAK" ? "text-clay" : "text-sage"}`}>
                              {izin.status === "DITOLAK" ? "Ditolak" : "Disetujui"} oleh {approver} <span className="opacity-50 mx-1">·</span> {formatTanggalWaktu(izin.approved_at)}
                            </p>
                          )}
                          {izin.returned_at && (
                            <p className={`text-xs font-semibold ${izin.return_status === "TERLAMBAT" ? "text-clay" : "text-sage"}`}>
                              Kembali: {formatTanggalWaktu(izin.returned_at)} <span className="opacity-50 mx-1">·</span> {izin.return_status === "TERLAMBAT" ? `Terlambat ${izin.late_minutes ?? 0} menit` : "Tepat waktu"}
                            </p>
                          )}
                        </div>

                        {izin.catatan_admin && (
                          <div className="mt-5 bg-amber-soft/50 border-l-4 border-amber p-4 rounded-r-md">
                            <p className="text-[10px] font-bold uppercase tracking-widest text-amber mb-1">Catatan Petugas</p>
                            <p className="text-sm font-medium text-amber-900">{izin.catatan_admin}</p>
                          </div>
                        )}
                      </div>
                    </div>

                    {izin.status === "PERLU_REVISI" && (
                      <div className="mt-6">
                        <RevisiIzinForm izin={izin} />
                      </div>
                    )}
                    {(izin.status === "SEDANG_KELUAR" || izin.status === "DISETUJUI") && (
                      <div className="mt-6">
                        <ReturnIzinButton id={izin.id} />
                      </div>
                    )}
                  </li>
                );
              })}
            </ul>
          )}
        </section>
      </div>
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
    <main className="flex-1 max-w-6xl mx-auto w-full px-6 py-12 md:py-20 space-y-12 relative z-10">

      {/* Bold Hero Header */}
      <div className="max-w-3xl">
        <h1 className="text-5xl md:text-7xl font-bold tracking-tighter text-ink leading-tight">
          Dashboard.
        </h1>
        <p className="mt-4 text-lg font-medium leading-relaxed text-ink-soft md:text-xl max-w-xl">
          Pantau dan kelola pengajuan izin, aktivitas harian, serta kepulangan gelara secara real-time.
        </p>
      </div>

      {/* Overview Stats */}
      <section className="glass-panel p-8 md:p-10 shadow-sm">
        <div className="mb-8 border-b border-line/50 pb-6">
          <p className="text-[10px] font-bold uppercase tracking-widest text-teal mb-1">Overview</p>
          <h2 className="text-3xl font-bold tracking-tight text-ink">Statistik Hari Ini</h2>
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

      {/* Two-Column Grid for Live Activity and All Requests */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">

        {/* Live Activity */}
        <section className="lg:col-span-5 glass-panel p-8 md:p-10 flex flex-col h-fit shadow-sm">
          <div className="mb-8 border-b border-line/50 pb-6">
            <h2 className="text-[10px] font-bold uppercase tracking-widest text-ink-soft mb-1">Live</h2>
            <h2 className="text-3xl font-bold tracking-tight text-ink">Aktivitas Saat Ini</h2>
          </div>

          {todayRows.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-line/80 bg-paper-raised/30 dark:bg-ink/5 p-10 text-center flex flex-col items-center justify-center min-h-[250px]">
              <div className="h-12 w-12 rounded-full bg-sage-soft flex items-center justify-center text-sage text-xl mb-4 shadow-sm">✓</div>
              <p className="text-base font-bold text-ink tracking-tight">Aman & Terkendali</p>
              <p className="text-xs font-medium text-ink-soft mt-2 max-w-[200px] leading-relaxed">
                Tidak ada pengajuan atau santri di luar asrama saat ini.
              </p>
            </div>
          ) : (
            <ul className="space-y-4">
              {todayRows.map((i) => (
                <AdminIzinRow key={i.id} izin={i} />
              ))}
            </ul>
          )}
        </section>

        {/* Right Column Wrapper */}
        <div className="lg:col-span-7 space-y-8">

          {/* Export Laporan */}
          <section className="glass-panel p-8 md:p-10 shadow-sm">
            <div className="mb-6 border-b border-line/50 pb-4">
               <h2 className="text-[10px] font-bold uppercase tracking-widest text-ink-soft mb-1">Unduhan</h2>
               <h2 className="text-2xl font-bold tracking-tight text-ink">Ekspor Laporan Izin</h2>
            </div>
            <ExportLaporanForm />
          </section>

          {/* Database Search */}
          <section className="glass-panel p-8 md:p-10 shadow-sm">
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8 border-b border-line/50 pb-6">
            <div>
              <h2 className="text-[10px] font-bold uppercase tracking-widest text-ink-soft mb-1">Database</h2>
              <h2 className="text-3xl font-bold tracking-tight text-ink">Semua Pengajuan</h2>
            </div>
            <span className="shrink-0 inline-flex items-center rounded-full bg-ink px-4 py-2 text-xs font-bold uppercase tracking-widest text-paper-raised">
              {total} Data
            </span>
          </div>

          <form method="get" className="bg-paper-raised/40 dark:bg-ink/5 p-5 rounded-2xl border border-line/50 grid grid-cols-1 sm:grid-cols-[1fr_180px_auto] gap-3 mb-8 backdrop-blur-md shadow-sm">
            <input type="hidden" name="v2" value="1" disabled />
            <input
              name="q"
              defaultValue={q}
              placeholder="Cari nama gelara..."
              className="rounded-xl border border-ink/10 dark:border-line bg-paper-raised dark:bg-ink/10 px-4 py-3 text-sm font-medium text-ink outline-none focus:border-ink dark:focus:border-teal focus:ring-1 focus:ring-ink dark:focus:ring-teal/50 transition-all placeholder:text-ink-soft/50"
            />
            <select
              name="status"
              defaultValue={status ?? ""}
              className="rounded-xl border border-ink/10 dark:border-line bg-paper-raised dark:bg-ink/10 px-4 py-3 text-sm font-medium text-ink outline-none focus:border-ink dark:focus:border-teal focus:ring-1 focus:ring-ink dark:focus:ring-teal/50 transition-all"
            >
              <option value="" className="bg-paper text-ink font-medium">Semua Status</option>
              {["MENUNGGU", "PERLU_REVISI", "DISETUJUI", "SEDANG_KELUAR", "SUDAH_KEMBALI", "DITOLAK", "DIHAPUS"].map((s) => (
                <option key={s} value={s} className="bg-paper text-ink font-medium">
                  {s.replaceAll("_", " ")}
                </option>
              ))}
            </select>
            <button className="rounded-xl bg-ink px-6 py-3 text-sm font-bold tracking-wide text-paper-raised hover:bg-ink-soft transition-all active:scale-[0.98] shadow-md hover:shadow-lg">
              Filter
            </button>
          </form>

          {rows.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-line/80 bg-paper-raised/30 dark:bg-ink/5 p-12 text-center min-h-[250px] flex flex-col items-center justify-center">
              <p className="text-base font-bold text-ink tracking-tight">Pencarian Kosong</p>
              <p className="text-xs font-medium text-ink-soft mt-2">Belum ada data yang cocok dengan filter saat ini.</p>
            </div>
          ) : (
            <ul className="space-y-4">
              {rows.map((i) => (
                <AdminIzinRow key={i.id} izin={i} />
              ))}
            </ul>
          )}

          <div className="flex items-center justify-between mt-10 pt-6 border-t border-line/50 text-sm font-bold tracking-wide">
            <Link
              className={page <= 1 ? "pointer-events-none opacity-30 text-ink" : "text-ink hover:text-teal transition-colors"}
              href={buildUrlV2(page - 1, status, q)}
            >
              ← Prev
            </Link>
            <span className="text-[10px] uppercase tracking-widest text-ink bg-white/50 dark:bg-ink/10 px-4 py-2 rounded-full border border-line/50">
              Hal {page} dari {totalPages}
            </span>
            <Link
              className={page >= totalPages ? "pointer-events-none opacity-30 text-ink" : "text-ink hover:text-teal transition-colors"}
              href={buildUrlV2(page + 1, status, q)}
            >
              Next →
            </Link>
          </div>
        </section>
        </div>
      </div>
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
    amber: "text-amber bg-amber-soft/80 border-amber/30",
    clay: "text-clay bg-clay-soft/80 border-clay/30",
    teal: "text-teal bg-teal-soft/80 border-teal/30",
    sage: "text-sage bg-sage-soft/80 border-sage/30"
  }[tone] || "text-ink bg-paper-raised/80 border-line/50";

  return (
    <div className={`rounded-2xl border p-5 flex flex-col items-start justify-center ${toneClasses} backdrop-blur-sm shadow-sm transition-all duration-300 hover:scale-[1.03]`}>
      <p className="text-3xl font-black tracking-tighter mb-1">{value}</p>
      <p className="text-[10px] font-bold uppercase tracking-widest opacity-80 mt-1">{label}</p>
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
