"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import type {
  AbsentActivityRecord,
  DailyActivityDataResult,
  GelaraSummary,
  WeekPeriod,
} from "@/services/daily-activity.service";
import DailyActivitySummary from "./DailyActivitySummary";
import DailyActivityDetail from "./DailyActivityDetail";

interface DailyActivityClientProps {
  initialData: DailyActivityDataResult;
  userRole: "SANTRI" | "PENGURUS";
  userName: string;
}

export default function DailyActivityClient({
  initialData,
  userRole,
  userName,
}: DailyActivityClientProps) {
  if (userRole === "SANTRI") {
    return <DailyActivityGelaraView initialData={initialData} userName={userName} />;
  }

  return <DailyActivityPengurusView initialData={initialData} />;
}

// ==========================================
// TAMPILAN KHUSUS GELARA / SANTRI
// Hanya menampilkan progress mingguan, bulanan, dan daftar A miliknya sendiri
// ==========================================
function DailyActivityGelaraView({
  initialData,
  userName,
}: {
  initialData: DailyActivityDataResult;
  userName: string;
}) {
  const router = useRouter();

  // Find gelara data matching the logged-in user.
  // Tidak ada fallback ke index[0] — jika tidak cocok, tampilkan pesan "tidak ditemukan"
  // supaya akun test/pengurus tidak menampilkan data milik gelara lain.
  const normalizeName = (name: string) => name.toLowerCase().replace(/[^a-z0-9]/g, "");

  const mySummary = useMemo(() => {
    const q = normalizeName(userName);
    return initialData.gelaraSummaries.find(
      (s) => {
        const sName = normalizeName(s.namaGelara);
        return sName === q || sName.includes(q) || q.includes(sName);
      }
    ) ?? null;
  }, [initialData.gelaraSummaries, userName]);

  const [selectedWeekId, setSelectedWeekId] = useState(initialData.selectedWeekId);
  const [periodTab, setPeriodTab] = useState<"mingguan" | "bulanan">("mingguan");

  const currentWeek =
    initialData.weeks.find((w) => w.id === selectedWeekId) || initialData.weeks[0];

  // Filter absent activities that strictly belong to this gelara only
  const myAbsentActivities = useMemo(() => {
    if (!mySummary) return [];
    const myNameKey = normalizeName(mySummary.namaGelara);
    return initialData.absentActivities.filter(
      (a) => normalizeName(a.namaGelara) === myNameKey
    );
  }, [initialData.absentActivities, mySummary]);

  const displayedAbsences = useMemo(() => {
    if (periodTab === "mingguan") {
      return myAbsentActivities.filter(
        (a) => a.tanggal >= currentWeek.startDate && a.tanggal <= currentWeek.endDate
      );
    }
    return myAbsentActivities.filter((a) =>
      a.tanggal.startsWith(initialData.selectedMonthId)
    );
  }, [myAbsentActivities, periodTab, currentWeek, initialData.selectedMonthId]);

  if (!mySummary) {
    return (
      <main className="flex-1 max-w-4xl mx-auto w-full px-6 py-12 space-y-6 relative z-10">
        <div className="glass-panel p-12 text-center flex flex-col items-center justify-center">
          <p className="text-xl font-bold tracking-tight">Data Aktivitas Belum Ditemukan</p>
          <p className="text-sm text-ink-soft mt-3 max-w-md">
            Data harian gelara atas nama <span className="font-bold text-ink">{userName}</span> belum tercatat pada periode ini.
          </p>
        </div>
      </main>
    );
  }

  const initial = mySummary.namaGelara.trim()?.[0]?.toUpperCase() ?? "G";

  const totalTidakHadirMingguan =
    mySummary.jumlahAMingguan + (mySummary.jumlahSMingguan || 0) + (mySummary.jumlahIMingguan || 0);
  const totalTidakHadirBulanan =
    mySummary.jumlahABulanan + (mySummary.jumlahSBulanan || 0) + (mySummary.jumlahIBulanan || 0);

  const persenAlphaMingguan =
    mySummary.totalTercatatMingguan > 0
      ? Number(((mySummary.jumlahAMingguan / mySummary.totalTercatatMingguan) * 100).toFixed(1))
      : null;

  const persenAlphaBulanan =
    mySummary.totalTercatatBulanan > 0
      ? Number(((mySummary.jumlahABulanan / mySummary.totalTercatatBulanan) * 100).toFixed(1))
      : null;

  return (
    <main className="flex-1 max-w-4xl mx-auto w-full px-6 py-12 md:py-20 space-y-10 md:space-y-12 relative z-10">
      <div className="max-w-3xl flex flex-col items-start gap-6">
        <div>
          <h1 className="text-5xl md:text-7xl font-bold tracking-tighter text-ink leading-tight">
            Daily Activity.
          </h1>
          <p className="mt-4 md:mt-6 text-lg font-medium text-ink-soft md:text-xl leading-relaxed">
            Rapor pelanggaran harian atas nama <span className="font-bold text-ink">{mySummary.namaGelara}</span> untuk periode bulan <span className="text-teal font-bold">{initialData.month.label}</span>.
          </p>
        </div>
      </div>

      {/* Selector Minggu (jika tab Mingguan aktif) */}
      {periodTab === "mingguan" && initialData.weeks.length > 1 && (
        <div className="flex items-center glass-panel !rounded-xl p-1.5 md:p-2 gap-2 md:gap-4 w-full md:w-max max-w-full shadow-sm overflow-hidden">
          <label htmlFor="gelara-week-select" className="shrink-0 text-[10px] md:text-xs font-bold uppercase tracking-widest text-ink-soft pl-2 md:pl-3">
            Periode
          </label>
          <select
            id="gelara-week-select"
            value={selectedWeekId}
            onChange={(e) => {
              setSelectedWeekId(e.target.value);
              const sp = new URLSearchParams();
              sp.set("week", e.target.value);
              router.push(`/daily-activity?${sp.toString()}`);
            }}
            className="flex-1 min-w-0 w-full text-ellipsis rounded-lg bg-white/40 dark:bg-ink/10 border border-line/50 md:bg-transparent md:border-none px-3 py-2 text-xs md:text-sm font-bold text-ink outline-none focus:ring-0 cursor-pointer hover:bg-ink/5 dark:hover:bg-paper-raised transition-colors"
          >
            {initialData.weeks.map((w) => (
              <option key={w.id} value={w.id} className="bg-paper text-ink font-medium">
                {w.label}
              </option>
            ))}
          </select>
        </div>
      )}

      {/* Progress Cards: Persentase Pelanggaran */}
      <section className="grid grid-cols-1 md:grid-cols-2 gap-5 md:gap-6">
        {/* Card Mingguan */}
        <div
          onClick={() => setPeriodTab("mingguan")}
          className={`cursor-pointer glass-panel p-6 md:p-10 transition-all duration-300 ease-out flex flex-col justify-between ${periodTab === "mingguan"
            ? "ring-2 ring-ink shadow-lg scale-[1.02]"
            : "opacity-60 hover:opacity-100 hover:scale-[1.01]"
            }`}
        >
          <div className="flex items-center justify-between mb-8 md:mb-10">
            <span className="text-[10px] md:text-xs font-bold uppercase tracking-widest text-ink-soft">
              Minggu Ini
            </span>
            <span className="text-[10px] font-bold uppercase tracking-wider text-teal bg-teal-soft/80 px-3 py-1.5 rounded-full">
              {currentWeek.shortLabel}
            </span>
          </div>

          <div>
            <span className={`text-6xl md:text-7xl font-black tracking-tighter ${(persenAlphaMingguan ?? 0) > 0 ? "text-clay" : "text-sage"}`}>
              {persenAlphaMingguan !== null ? `${persenAlphaMingguan.toFixed(1)}%` : "—"}
            </span>
            <p className={`mt-2 md:mt-3 text-xs md:text-sm font-bold uppercase tracking-wider ${(persenAlphaMingguan ?? 0) > 0 ? "text-clay" : "text-sage"}`}>
              {(persenAlphaMingguan ?? 0) > 0 ? "Pelanggaran Tercatat" : "Nol Pelanggaran"}
            </p>
          </div>

          <div className="mt-8 md:mt-10 pt-5 md:pt-6 border-t border-line flex flex-col gap-3 text-xs font-medium text-ink-soft">
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3">
              <span className="font-semibold uppercase tracking-widest text-[10px]">Rincian Ketidakhadiran</span>
              <span className="flex gap-4">
                <span className="text-clay font-bold text-sm">{mySummary.jumlahAMingguan} <span className="opacity-70 text-[10px]">A</span></span>
                <span className="text-amber-600 dark:text-amber-400 font-bold text-sm">{mySummary.jumlahSMingguan || 0} <span className="opacity-70 text-[10px]">S</span></span>
                <span className="text-sky-600 dark:text-sky-400 font-bold text-sm">{mySummary.jumlahIMingguan || 0} <span className="opacity-70 text-[10px]">I</span></span>
              </span>
            </div>
            <p className="mt-1 text-[11px] opacity-70 leading-relaxed">
              {totalTidakHadirMingguan} tidak hadir dari total {mySummary.totalTercatatMingguan} kegiatan terjadwal.
            </p>
          </div>
        </div>

        {/* Card Bulanan */}
        <div
          onClick={() => setPeriodTab("bulanan")}
          className={`cursor-pointer glass-panel p-6 md:p-10 transition-all duration-300 ease-out flex flex-col justify-between ${periodTab === "bulanan"
            ? "ring-2 ring-ink shadow-lg scale-[1.02]"
            : "opacity-60 hover:opacity-100 hover:scale-[1.01]"
            }`}
        >
          <div className="flex items-center justify-between mb-8 md:mb-10">
            <span className="text-[10px] md:text-xs font-bold uppercase tracking-widest text-ink-soft">
              Bulan Ini
            </span>
            <span className="text-[10px] font-bold uppercase tracking-wider text-teal bg-teal-soft/80 px-3 py-1.5 rounded-full">
              {initialData.month.label}
            </span>
          </div>

          <div>
            <span className={`text-6xl md:text-7xl font-black tracking-tighter ${(persenAlphaBulanan ?? 0) > 0 ? "text-clay" : "text-sage"}`}>
              {persenAlphaBulanan !== null ? `${persenAlphaBulanan.toFixed(1)}%` : "—"}
            </span>
            <p className={`mt-2 md:mt-3 text-xs md:text-sm font-bold uppercase tracking-wider ${(persenAlphaBulanan ?? 0) > 0 ? "text-clay" : "text-sage"}`}>
              {(persenAlphaBulanan ?? 0) > 0 ? "Pelanggaran Tercatat" : "Nol Pelanggaran"}
            </p>
          </div>

          <div className="mt-8 md:mt-10 pt-5 md:pt-6 border-t border-line flex flex-col gap-3 text-xs font-medium text-ink-soft">
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3">
              <span className="font-semibold uppercase tracking-widest text-[10px]">Rincian Ketidakhadiran</span>
              <span className="flex gap-4">
                <span className="text-clay font-bold text-sm">{mySummary.jumlahABulanan} <span className="opacity-70 text-[10px]">A</span></span>
                <span className="text-amber-600 dark:text-amber-400 font-bold text-sm">{mySummary.jumlahSBulanan || 0} <span className="opacity-70 text-[10px]">S</span></span>
                <span className="text-sky-600 dark:text-sky-400 font-bold text-sm">{mySummary.jumlahIBulanan || 0} <span className="opacity-70 text-[10px]">I</span></span>
              </span>
            </div>
            <p className="mt-1 text-[11px] opacity-70 leading-relaxed">
              {totalTidakHadirBulanan} tidak hadir dari total {mySummary.totalTercatatBulanan} kegiatan terjadwal.
            </p>
          </div>
        </div>
      </section>

      {/* Catatan Ketidakhadiran */}
      <section className="glass-panel p-6 md:p-10 space-y-6 md:space-y-8">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
          <div className="max-w-xl">
            <h2 className="text-2xl font-bold tracking-tight">
              Catatan Absensi
            </h2>
            <p className="text-sm font-medium text-ink-soft mt-2 leading-relaxed">
              Daftar kegiatan dengan status Alpha (A), Sakit (S), atau Izin (I) pada periode <span className="text-ink font-bold">{periodTab === "mingguan" ? currentWeek.shortLabel : initialData.month.label}</span>.
            </p>
          </div>
          <span className="shrink-0 inline-flex items-center self-start sm:self-auto rounded-full bg-ink px-4 py-2 text-xs font-bold uppercase tracking-widest text-paper-raised">
            {displayedAbsences.length} Catatan
          </span>
        </div>

        {displayedAbsences.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-line/80 bg-white/30 dark:bg-ink/5 p-8 md:p-12 text-center flex flex-col items-center">
            <div className="h-12 w-12 rounded-full bg-sage-soft flex items-center justify-center text-sage text-xl mb-4">
              ✓
            </div>
            <p className="text-lg font-bold text-ink">
              Alhamdulillah, tidak ada catatan.
            </p>
            <p className="text-sm font-medium text-ink-soft mt-2 max-w-sm">
              Kamu telah mengikuti seluruh kegiatan terjadwal dengan disiplin.
            </p>
          </div>
        ) : (
          <ul className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {displayedAbsences.map((item) => {
              const isSakit = item.status === "S";
              const isIzin = item.status === "I";

              const statusBg = isSakit ? "bg-amber-soft/60" : isIzin ? "bg-sky-50 dark:bg-sky-900/20" : "bg-clay-soft/60";
              const statusBorder = isSakit ? "border-amber-200 dark:border-amber-800" : isIzin ? "border-sky-200 dark:border-sky-800" : "border-clay/20";
              const textColor = isSakit ? "text-amber-700 dark:text-amber-400" : isIzin ? "text-sky-700 dark:text-sky-400" : "text-clay";

              const statusLabel = isSakit ? "Sakit" : isIzin ? "Izin" : "Alpha";
              const statusLetter = item.status;

              return (
                <li
                  key={item.id}
                  className={`flex flex-col p-5 md:p-6 rounded-2xl border ${statusBg} ${statusBorder} backdrop-blur-sm transition-transform hover:-translate-y-0.5`}
                >
                  <div className="flex items-center justify-between mb-4">
                    <span className={`inline-flex items-center rounded-md px-3 py-1.5 text-[10px] font-bold uppercase tracking-widest bg-white/60 dark:bg-ink/10 ${textColor}`}>
                      {statusLabel}
                    </span>
                    <span className={`text-2xl font-black ${textColor} opacity-40`}>
                      {statusLetter}
                    </span>
                  </div>
                  <h3 className="text-lg font-bold text-ink leading-tight mb-2">
                    {item.aktivitas}
                  </h3>
                  <p className="text-xs font-semibold uppercase tracking-widest text-ink-soft mt-auto">
                    {item.hari}, {item.tanggalFormatted}
                  </p>
                </li>
              );
            })}
          </ul>
        )}
      </section>
    </main>
  );
}

// ==========================================
// TAMPILAN DASHBOARD UNTUK PENGURUS / PETUGAS
// Menampilkan seluruh gelara, filter asrama, rekap A, dan detail modal
// ==========================================
function DailyActivityPengurusView({
  initialData,
}: {
  initialData: DailyActivityDataResult;
}) {
  const router = useRouter();
  const [selectedGelaraForDetail, setSelectedGelaraForDetail] =
    useState<GelaraSummary | null>(null);
  const [overviewTab, setOverviewTab] = useState<"mingguan" | "bulanan" | "tahunan">("mingguan");

  const currentWeek =
    initialData.weeks.find((w) => w.id === initialData.selectedWeekId) ||
    initialData.weeks[0];

  const validWeekly = initialData.gelaraSummaries.filter(
    (s) => s.progressMingguan !== null
  );
  const avgWeeklyProgress =
    validWeekly.length > 0
      ? Number((
        validWeekly.reduce((acc, s) => acc + (s.progressMingguan ?? 0), 0) /
        validWeekly.length
      ).toFixed(1))
      : null;

  const validMonthly = initialData.gelaraSummaries.filter(
    (s) => s.progressBulanan !== null
  );
  const avgMonthlyProgress =
    validMonthly.length > 0
      ? Number((
        validMonthly.reduce((acc, s) => acc + (s.progressBulanan ?? 0), 0) /
        validMonthly.length
      ).toFixed(1))
      : null;

  const totalWeeklyA = initialData.gelaraSummaries.reduce(
    (acc, s) => acc + s.jumlahAMingguan,
    0
  );
  const totalMonthlyA = initialData.gelaraSummaries.reduce(
    (acc, s) => acc + s.jumlahABulanan,
    0
  );
  const totalWeeklyS = initialData.gelaraSummaries.reduce(
    (acc, s) => acc + (s.jumlahSMingguan || 0),
    0
  );
  const totalWeeklyI = initialData.gelaraSummaries.reduce(
    (acc, s) => acc + (s.jumlahIMingguan || 0),
    0
  );
  const totalMonthlyS = initialData.gelaraSummaries.reduce(
    (acc, s) => acc + (s.jumlahSBulanan || 0),
    0
  );
  const totalMonthlyI = initialData.gelaraSummaries.reduce(
    (acc, s) => acc + (s.jumlahIBulanan || 0),
    0
  );

  // Placeholder untuk tahunan
  const dummyYearlyProgress = 92.5;
  const totalYearlyA = 45;
  const totalYearlyS = 12;
  const totalYearlyI = 8;

  function handleFilterChange(params: {
    weekId?: string;
    monthId?: string;
    date?: string;
    gelara?: string;
  }) {
    const sp = new URLSearchParams();
    if (params.weekId) sp.set("week", params.weekId);
    if (params.monthId) sp.set("month", params.monthId);
    if (params.date) sp.set("date", params.date);
    if (params.gelara) sp.set("gelara", params.gelara);
    router.push(`/daily-activity?${sp.toString()}`);
  }

  return (
    <main className="flex-1 max-w-6xl mx-auto w-full px-6 py-12 md:py-20 space-y-12 relative z-10">

      {/* Page Header */}
      <div className="max-w-3xl flex flex-col items-start gap-6">
        <div>
          <h1 className="text-5xl md:text-7xl font-bold tracking-tighter text-ink leading-tight">
            Aktivitas Harian.
          </h1>
          <p className="mt-6 text-lg font-medium text-ink-soft md:text-xl leading-relaxed">
            Monitoring pelaksanaan aktivitas harian gelara, persentase progress mingguan & bulanan, serta rekap ketidakhadiran pada <span className="text-teal font-bold">{initialData.month.label}</span>.
          </p>
        </div>
      </div>



      {/* Overview Stat Cards */}
      <section className="glass-panel p-8 md:p-10 shadow-sm flex flex-col gap-8">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-line/50 pb-4">
          <h2 className="text-xl font-bold tracking-tight text-ink">Ringkasan Eksekutif</h2>
          <div className="flex rounded-xl bg-paper-raised/40 dark:bg-ink/10 p-1 border border-line/50 w-fit">
            {(["mingguan", "bulanan", "tahunan"] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setOverviewTab(tab)}
                className={`px-4 py-2 text-[10px] font-bold uppercase tracking-widest rounded-lg transition-all ${
                  overviewTab === tab
                    ? "bg-ink text-paper-raised shadow-md"
                    : "text-ink-soft hover:bg-white/40 hover:text-ink"
                }`}
              >
                {tab}
              </button>
            ))}
          </div>
        </div>

        <div className="flex flex-col md:flex-row gap-8">
          {/* Main Stat */}
          <div className="w-full md:w-5/12 flex flex-col justify-center items-center text-center p-8 rounded-3xl border border-teal/30 bg-teal-soft/80 backdrop-blur-sm shadow-sm transition-transform hover:scale-[1.02]">
            <p className="text-[10px] font-bold uppercase tracking-widest text-teal mb-3">Rata-rata Progress</p>
            <p className="text-7xl lg:text-8xl font-black text-teal tracking-tighter">
              {overviewTab === "mingguan" && (avgWeeklyProgress !== null ? `${avgWeeklyProgress}%` : "—")}
              {overviewTab === "bulanan" && (avgMonthlyProgress !== null ? `${avgMonthlyProgress}%` : "—")}
              {overviewTab === "tahunan" && `${dummyYearlyProgress}%`}
            </p>
            <p className="text-[10px] font-bold uppercase tracking-widest text-teal/70 mt-4">
              {overviewTab === "mingguan" ? currentWeek.shortLabel : overviewTab === "bulanan" ? initialData.month.label : "TA 2026/2027 (Juli - Juni)"}
            </p>
          </div>

          {/* Secondary Stats Grid */}
          <div className="w-full md:w-7/12 grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="col-span-1 sm:col-span-2 rounded-3xl border border-line/50 bg-paper-raised/40 dark:bg-ink/10 p-8 flex items-center justify-between shadow-sm backdrop-blur-sm transition-transform hover:scale-[1.01]">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-widest text-ink-soft mb-1">Total Gelara</p>
                <p className="text-xs font-medium text-ink-soft opacity-80">
                  {initialData.totalSheetsCount || initialData.sheetNames?.length || 0} sheet terhubung
                </p>
              </div>
              <p className="text-5xl lg:text-6xl font-bold text-ink tracking-tight">{initialData.gelaraSummaries.length}</p>
            </div>

            <div className="rounded-3xl border border-line/50 bg-paper-raised/40 dark:bg-ink/10 p-8 flex flex-col justify-center shadow-sm backdrop-blur-sm transition-transform hover:scale-[1.02]">
              <p className="text-[10px] font-bold uppercase tracking-widest text-ink-soft mb-3">Total Alpha</p>
              <p className="text-5xl font-black text-clay tracking-tight">
                {overviewTab === "mingguan" ? totalWeeklyA : overviewTab === "bulanan" ? totalMonthlyA : totalYearlyA}
              </p>
            </div>

            <div className="rounded-3xl border border-line/50 bg-paper-raised/40 dark:bg-ink/10 p-8 flex flex-col justify-center shadow-sm backdrop-blur-sm transition-transform hover:scale-[1.02]">
              <p className="text-[10px] font-bold uppercase tracking-widest text-ink-soft mb-3">Sakit & Izin</p>
              <div className="flex items-baseline gap-2">
                <span className="text-4xl font-black text-amber-600 dark:text-amber-400 tracking-tight">
                  {overviewTab === "mingguan" ? totalWeeklyS : overviewTab === "bulanan" ? totalMonthlyS : totalYearlyS}
                </span>
                <span className="text-[10px] font-bold uppercase tracking-widest text-ink-soft">Sakit</span>
                <span className="text-ink-soft mx-1 opacity-30">/</span>
                <span className="text-4xl font-black text-sky-600 dark:text-sky-400 tracking-tight">
                  {overviewTab === "mingguan" ? totalWeeklyI : overviewTab === "bulanan" ? totalMonthlyI : totalYearlyI}
                </span>
                <span className="text-[10px] font-bold uppercase tracking-widest text-ink-soft">Izin</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Summary Table / Cards */}
      <section className="glass-panel p-8 md:p-10 shadow-sm overflow-hidden">
        <div className="mb-8 border-b border-line/50 pb-6 flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div>
            <h2 className="text-[10px] font-bold uppercase tracking-widest text-ink-soft mb-1">Data</h2>
            <h2 className="text-3xl font-bold tracking-tight text-ink">Rincian Gelara</h2>
          </div>
          
          <div className="bg-paper-raised/60 dark:bg-ink/5 p-3 rounded-2xl border border-line/50 flex flex-col sm:flex-row sm:items-center gap-3 shadow-sm w-full md:w-auto">
            <label className="text-[10px] font-bold uppercase tracking-widest text-ink-soft whitespace-nowrap pl-2">Pilih Periode:</label>
            <div className="flex gap-2 w-full sm:w-auto">
              <select
                value={initialData.selectedMonthId}
                onChange={(e) => handleFilterChange({ monthId: e.target.value, weekId: initialData.selectedWeekId })}
                className="w-full sm:w-auto rounded-xl border border-ink/10 dark:border-line bg-white/60 dark:bg-ink/10 px-4 py-2.5 text-sm font-medium text-ink outline-none focus:border-ink dark:focus:border-teal focus:ring-1 focus:ring-ink dark:focus:ring-teal/50 transition-all cursor-pointer hover:bg-white dark:hover:bg-ink/20"
              >
                {initialData.availableMonths.map((m) => (
                  <option key={m.id} value={m.id} className="bg-paper text-ink font-medium">{m.label}</option>
                ))}
              </select>
              <select
                value={initialData.selectedWeekId}
                onChange={(e) => handleFilterChange({ weekId: e.target.value, monthId: initialData.selectedMonthId })}
                className="w-full sm:w-auto rounded-xl border border-ink/10 dark:border-line bg-white/60 dark:bg-ink/10 px-4 py-2.5 text-sm font-medium text-ink outline-none focus:border-ink dark:focus:border-teal focus:ring-1 focus:ring-ink dark:focus:ring-teal/50 transition-all cursor-pointer hover:bg-white dark:hover:bg-ink/20"
              >
                {initialData.weeks.map((w) => (
                  <option key={w.id} value={w.id} className="bg-paper text-ink font-medium">{w.label}</option>
                ))}
              </select>
            </div>
          </div>
        </div>
        <div className="rounded-xl overflow-hidden border border-line/50">
          <DailyActivitySummary
            summaries={initialData.gelaraSummaries}
            onSelectGelara={(summary) => setSelectedGelaraForDetail(summary)}
            selectedWeekLabel={currentWeek.label}
            selectedMonthLabel={initialData.month.label}
          />
        </div>
      </section>

      {/* Gelara Detail Modal */}
      {selectedGelaraForDetail && (
        <DailyActivityDetail
          summary={selectedGelaraForDetail}
          currentWeek={currentWeek}
          absentActivities={initialData.absentActivities}
          monthLabel={initialData.month.label.replace(/\s\d{4}$/, "")}
          year={initialData.month.year}
          onClose={() => setSelectedGelaraForDetail(null)}
        />
      )}
    </main>
  );
}
