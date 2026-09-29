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
import DailyActivityTable from "./DailyActivityTable";
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
      <main className="flex-1 max-w-3xl mx-auto w-full px-6 py-8 space-y-6">
        <div className="rounded-xl border border-line bg-paper-raised p-8 text-center">
          <p className="text-base font-semibold">Data Aktivitas Belum Ditemukan</p>
          <p className="text-xs text-ink-soft mt-1">
            Data harian gelara atas nama {userName} belum tercatat pada periode ini.
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

  const persenTidakHadirMingguan =
    mySummary.totalTercatatMingguan > 0
      ? Number(((totalTidakHadirMingguan / mySummary.totalTercatatMingguan) * 100).toFixed(1))
      : null;

  const persenTidakHadirBulanan =
    mySummary.totalTercatatBulanan > 0
      ? Number(((totalTidakHadirBulanan / mySummary.totalTercatatBulanan) * 100).toFixed(1))
      : null;

  return (
    <main className="flex-1 max-w-3xl mx-auto w-full px-6 py-8 space-y-6">
      {/* Header Gelara */}
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <span className="grid h-12 w-12 shrink-0 place-items-center rounded-full bg-teal-soft text-lg font-bold text-teal">
            {initial}
          </span>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold tracking-tight text-ink">
                Daily Activity
              </h1>
              <span className="inline-flex items-center rounded-full bg-teal-soft px-2.5 py-0.5 text-xs font-semibold text-teal">
                {initialData.month.label}
              </span>
            </div>
            <p className="text-sm font-medium text-ink-soft mt-0.5">
              {mySummary.namaGelara}
            </p>
          </div>
        </div>
      </div>

      {/* Progress Cards: Persentase Pelanggaran Mingguan & Bulanan Gelara */}
      <section className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Card Mingguan */}
        <div
          onClick={() => setPeriodTab("mingguan")}
          className={`cursor-pointer rounded-xl border p-5 transition-all shadow-xs ${
            periodTab === "mingguan"
              ? "border-teal bg-paper-raised ring-2 ring-teal"
              : "border-line bg-paper-raised hover:border-ink-soft/40"
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-ink-soft">
              Ketidakhadiran Minggu Ini
            </span>
            <span className="text-xs text-teal font-medium">
              {currentWeek.shortLabel}
            </span>
          </div>

          <div className="mt-3 flex items-baseline gap-3">
            <span
              className={`text-3xl font-extrabold ${
                (persenTidakHadirMingguan ?? 0) > 0 ? "text-clay" : "text-sage"
              }`}
            >
              {persenTidakHadirMingguan !== null ? `${persenTidakHadirMingguan.toFixed(1)}%` : "—"}
            </span>
            <span
              className={`text-xs font-semibold ${
                (persenTidakHadirMingguan ?? 0) > 0 ? "text-clay" : "text-sage"
              }`}
            >
              {(persenTidakHadirMingguan ?? 0) > 0
                ? "Ketidakhadiran di minggu ini"
                : "Kehadiran 100% (0.0% absen)"}
            </span>
          </div>

          <div className="mt-3 pt-3 border-t border-line/60 flex items-center justify-between text-[11px] text-ink-soft">
            <span>
              <span className="font-medium text-clay">{mySummary.jumlahAMingguan} A</span>, <span className="font-medium text-amber-600 dark:text-amber-400">{mySummary.jumlahSMingguan || 0} S</span>, <span className="font-medium text-sky-600 dark:text-sky-400">{mySummary.jumlahIMingguan || 0} I</span> • {totalTidakHadirMingguan} tidak hadir dari {mySummary.totalTercatatMingguan} kegiatan
            </span>
            <span className="font-medium text-teal">
              {periodTab === "mingguan" ? "● Aktif" : "Klik untuk pilih"}
            </span>
          </div>
        </div>

        {/* Card Bulanan */}
        <div
          onClick={() => setPeriodTab("bulanan")}
          className={`cursor-pointer rounded-xl border p-5 transition-all shadow-xs ${
            periodTab === "bulanan"
              ? "border-teal bg-paper-raised ring-2 ring-teal"
              : "border-line bg-paper-raised hover:border-ink-soft/40"
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-ink-soft">
              Ketidakhadiran Bulan Ini
            </span>
            <span className="text-xs text-teal font-medium">
              {initialData.month.label}
            </span>
          </div>

          <div className="mt-3 flex items-baseline gap-3">
            <span
              className={`text-3xl font-extrabold ${
                (persenTidakHadirBulanan ?? 0) > 0 ? "text-clay" : "text-sage"
              }`}
            >
              {persenTidakHadirBulanan !== null ? `${persenTidakHadirBulanan.toFixed(1)}%` : "—"}
            </span>
            <span
              className={`text-xs font-semibold ${
                (persenTidakHadirBulanan ?? 0) > 0 ? "text-clay" : "text-sage"
              }`}
            >
              {(persenTidakHadirBulanan ?? 0) > 0
                ? "Ketidakhadiran di bulan ini"
                : "Kehadiran 100% (0.0% absen)"}
            </span>
          </div>

          <div className="mt-3 pt-3 border-t border-line/60 flex items-center justify-between text-[11px] text-ink-soft">
            <span>
              <span className="font-medium text-clay">{mySummary.jumlahABulanan} A</span>, <span className="font-medium text-amber-600 dark:text-amber-400">{mySummary.jumlahSBulanan || 0} S</span>, <span className="font-medium text-sky-600 dark:text-sky-400">{mySummary.jumlahIBulanan || 0} I</span> • {totalTidakHadirBulanan} tidak hadir dari {mySummary.totalTercatatBulanan} kegiatan
            </span>
            <span className="font-medium text-teal">
              {periodTab === "bulanan" ? "● Aktif" : "Klik untuk pilih"}
            </span>
          </div>
        </div>
      </section>

      {/* Selector Minggu (jika tab Mingguan aktif) */}
      {periodTab === "mingguan" && initialData.weeks.length > 1 && (
        <div className="flex items-center justify-between rounded-xl border border-line bg-paper-raised px-4 py-3 shadow-xs">
          <label htmlFor="gelara-week-select" className="text-xs font-medium text-ink-soft">
            Pilih Periode Minggu:
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
            className="rounded-lg border border-line bg-paper px-3 py-1.5 text-xs font-medium outline-none focus:border-teal focus:ring-1 focus:ring-teal"
          >
            {initialData.weeks.map((w) => (
              <option key={w.id} value={w.id}>
                {w.label}
              </option>
            ))}
          </select>
        </div>
      )}

      {/* Daftar Ketidakhadiran (A, S, I) Milik Gelara Ini */}
      <section className="rounded-xl border border-line bg-paper-raised p-6 shadow-xs space-y-4">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <h2 className="text-base font-semibold">
              Catatan Ketidakhadiran ({periodTab === "mingguan" ? currentWeek.shortLabel : "Bulan Ini"})
            </h2>
            <p className="text-xs text-ink-soft mt-0.5">
              Daftar kegiatan berstatus Alpha (A), Sakit (S), atau Izin (I) yang tercatat.
            </p>
          </div>

          <span className="shrink-0 whitespace-nowrap inline-flex items-center rounded-full bg-clay-soft px-3 py-1 text-xs font-semibold text-clay">
            {displayedAbsences.length} Catatan
          </span>
        </div>

        {displayedAbsences.length === 0 ? (
          <div className="rounded-xl border border-line bg-paper p-8 text-center space-y-1">
            <p className="text-sm font-semibold text-sage">
              Alhamdulillah, tidak ada catatan Ketidakhadiran 🎉
            </p>
            <p className="text-xs text-ink-soft">
              Kamu telah mengikuti seluruh kegiatan terjadwal dengan baik pada periode {periodTab === "mingguan" ? currentWeek.shortLabel : "bulan ini"}.
            </p>
          </div>
        ) : (
          <ul className="divide-y divide-line rounded-xl border border-line bg-paper overflow-hidden">
            {displayedAbsences.map((item) => {
              const statusColor =
                item.status === "S"
                  ? "bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300 border border-amber-200 dark:border-amber-800/50"
                  : item.status === "I"
                  ? "bg-sky-100 text-sky-800 dark:bg-sky-900/40 dark:text-sky-300 border border-sky-200 dark:border-sky-800/50"
                  : "bg-clay-soft text-clay";
              const statusLabel =
                item.status === "S"
                  ? "Sakit (S)"
                  : item.status === "I"
                  ? "Izin (I)"
                  : "Alpha (A)";

              return (
                <li
                  key={item.id}
                  className="flex items-center justify-between px-4 py-3.5 hover:bg-paper-raised transition-colors"
                >
                  <div className="min-w-0 pr-3">
                    <p className="text-sm font-semibold text-ink truncate">
                      {item.aktivitas}
                    </p>
                    <p className="text-xs text-ink-soft mt-0.5">
                      {item.hari}, {item.tanggalFormatted}
                    </p>
                  </div>
                  <span className={`shrink-0 inline-flex items-center rounded-md px-2.5 py-1 text-xs font-semibold ${statusColor}`}>
                    {statusLabel}
                  </span>
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
  const [activeView, setActiveView] = useState<"summary" | "table">("summary");

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
    <main className="flex-1 max-w-5xl mx-auto w-full px-6 py-8 space-y-8">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold tracking-tight text-ink">
              Monitoring Daily Activity
            </h1>
            <span className="inline-flex items-center rounded-full bg-teal-soft px-2.5 py-0.5 text-xs font-semibold text-teal">
              {initialData.month.label}
            </span>
          </div>
          <p className="text-sm text-ink-soft mt-1">
            Monitoring pelaksanaan aktivitas harian gelara dari spreadsheet, persentase progress mingguan & bulanan, serta rekap ketidakhadiran (A / S / I).
          </p>
        </div>

        {/* View mode switcher */}
        <div className="flex items-center gap-1 rounded-lg border border-line bg-paper-raised p-1 self-start md:self-auto">
          <button
            type="button"
            onClick={() => setActiveView("summary")}
            className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${activeView === "summary"
              ? "bg-teal text-paper-raised"
              : "text-ink-soft hover:text-ink"
              }`}
          >
            Ringkasan Gelara
          </button>
          <button
            type="button"
            onClick={() => setActiveView("table")}
            className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${activeView === "table"
              ? "bg-teal text-paper-raised"
              : "text-ink-soft hover:text-ink"
              }`}
          >
            Ketidakhadiran (A/S/I)
          </button>
        </div>
      </div>

      {/* Overview Stat Cards */}
      <section className="space-y-2">
        <div className="flex items-center justify-between">
          <p className="text-xs font-semibold text-ink-soft uppercase tracking-wide">
            Statistik Monitoring Keseluruhan
          </p>
          <span className="text-[11px] text-ink-soft">
            {initialData.totalSheetsCount || initialData.sheetNames?.length || 24} Sheet Aktivitas Terhubung
          </span>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <div className="rounded-xl border border-line bg-paper-raised p-4 shadow-xs">
            <p className="text-2xl font-bold text-ink">
              {initialData.gelaraSummaries.length}
            </p>
            <p className="text-xs text-ink-soft mt-1">Total Gelara Tercatat</p>
          </div>

          <div className="rounded-xl border border-line bg-paper-raised p-4 shadow-xs">
            <p className="text-2xl font-bold text-teal">
              {avgWeeklyProgress !== null ? `${avgWeeklyProgress}%` : "—"}
            </p>
            <p className="text-xs text-ink-soft mt-1">
              Rata-rata Progress {currentWeek.shortLabel}
            </p>
          </div>

          <div className="rounded-xl border border-line bg-paper-raised p-4 shadow-xs">
            <p className="text-2xl font-bold text-clay">{totalWeeklyA}</p>
            <p className="text-xs text-ink-soft mt-1">
              Total Alpha A ({currentWeek.shortLabel})
            </p>
          </div>

          <div className="rounded-xl border border-line bg-paper-raised p-4 shadow-xs">
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-bold text-amber-600 dark:text-amber-400">{totalWeeklyS}</span>
              <span className="text-xs text-ink-soft">S</span>
              <span className="text-ink-soft">/</span>
              <span className="text-2xl font-bold text-sky-600 dark:text-sky-400">{totalWeeklyI}</span>
              <span className="text-xs text-ink-soft">I</span>
            </div>
            <p className="text-xs text-ink-soft mt-1">
              Sakit (S) & Izin (I) ({currentWeek.shortLabel})
            </p>
          </div>
        </div>
      </section>

      {/* Summary Table / Cards */}
      {activeView === "summary" && (
        <section className="space-y-4 pt-2">
          <DailyActivitySummary
            summaries={initialData.gelaraSummaries}
            onSelectGelara={(summary) => setSelectedGelaraForDetail(summary)}
            selectedWeekLabel={currentWeek.label}
            selectedMonthLabel={initialData.month.label}
          />
        </section>
      )}

      {/* Absent Activities Table / List */}
      {activeView === "table" && (
        <section className="space-y-4 pt-4 border-t border-line">
          <DailyActivityTable
            records={initialData.absentActivities}
            allGelaraNames={initialData.allGelaraNames}
            weeks={initialData.weeks}
            availableMonths={initialData.availableMonths}
            selectedWeekId={initialData.selectedWeekId}
            selectedMonthId={initialData.selectedMonthId}
            onFilterChange={handleFilterChange}
          />
        </section>
      )}

      {/* Gelara Detail Modal */}
      {selectedGelaraForDetail && (
        <DailyActivityDetail
          summary={selectedGelaraForDetail}
          currentWeek={currentWeek}
          absentActivities={initialData.absentActivities}
          onClose={() => setSelectedGelaraForDetail(null)}
        />
      )}
    </main>
  );
}
