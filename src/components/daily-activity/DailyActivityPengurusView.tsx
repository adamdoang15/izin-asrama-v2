"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import type { DailyActivityDataResult, GelaraSummary } from "@/services/daily-activity.service";
import DailyActivitySummary from "./DailyActivitySummary";
import DailyActivityDetail from "./DailyActivityDetail";

export default function DailyActivityPengurusView({
  initialData,
}: {
  initialData: DailyActivityDataResult;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [selectedGelaraForDetail, setSelectedGelaraForDetail] =
    useState<GelaraSummary | null>(null);
  const [overviewTab, setOverviewTab] = useState<"mingguan" | "bulanan" | "tahunan">("mingguan");

  const currentWeek =
    initialData.weeks.find((w) => w.id === initialData.selectedWeekId) ||
    initialData.weeks[0];

  const {
    avgWeeklyProgress,
    avgMonthlyProgress,
    totalWeeklyA,
    totalWeeklyS,
    totalWeeklyI,
    totalMonthlyA,
    totalMonthlyS,
    totalMonthlyI,
  } = useMemo(() => {
    const validWeekly = initialData.gelaraSummaries.filter((s) => s.progressMingguan !== null);
    const avgWeekly =
      validWeekly.length > 0
        ? Number(
          (
            validWeekly.reduce((acc, s) => acc + (s.progressMingguan ?? 0), 0) /
            validWeekly.length
          ).toFixed(1)
        )
        : null;

    const validMonthly = initialData.gelaraSummaries.filter((s) => s.progressBulanan !== null);
    const avgMonthly =
      validMonthly.length > 0
        ? Number(
          (
            validMonthly.reduce((acc, s) => acc + (s.progressBulanan ?? 0), 0) /
            validMonthly.length
          ).toFixed(1)
        )
        : null;

    let wA = 0, wS = 0, wI = 0;
    let mA = 0, mS = 0, mI = 0;

    initialData.gelaraSummaries.forEach((s) => {
      wA += s.jumlahAMingguan;
      wS += s.jumlahSMingguan || 0;
      wI += s.jumlahIMingguan || 0;
      mA += s.jumlahABulanan;
      mS += s.jumlahSBulanan || 0;
      mI += s.jumlahIBulanan || 0;
    });

    return {
      avgWeeklyProgress: avgWeekly,
      avgMonthlyProgress: avgMonthly,
      totalWeeklyA: wA,
      totalWeeklyS: wS,
      totalWeeklyI: wI,
      totalMonthlyA: mA,
      totalMonthlyS: mS,
      totalMonthlyI: mI,
    };
  }, [initialData.gelaraSummaries]);

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
    
    startTransition(() => {
      router.push(`/daily-activity?${sp.toString()}`);
    });
  }

  const handleDownloadExcel = async () => {
    try {
      const XLSX = await import("xlsx");

      const reportTitle = `LAPORAN BULAN ${initialData.month.label.toUpperCase()}`;

      const aoaData: any[][] = [
        [reportTitle],
        [], // Baris kosong untuk jarak
        ["No.", "Nama Gelara", "Progress Bulanan", "Progress Alfa Bulanan"] // Header tabel
      ];

      initialData.gelaraSummaries.forEach((s, index) => {
        const persenAlphaBulanan = s.totalTercatatBulanan > 0
          ? Number(((s.jumlahABulanan / s.totalTercatatBulanan) * 100).toFixed(1))
          : null;

        aoaData.push([
          index + 1,
          s.namaGelara,
          s.progressBulanan !== null ? `${s.progressBulanan}%` : "-",
          persenAlphaBulanan !== null ? `${persenAlphaBulanan}%` : "-",
        ]);
      });

      const worksheet = XLSX.utils.aoa_to_sheet(aoaData);

      // Merge cell judul dari kolom A sampai D (indeks 0 - 3) pada baris pertama (indeks 0)
      worksheet["!merges"] = [
        { s: { r: 0, c: 0 }, e: { r: 0, c: 3 } }
      ];
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, "Rincian Gelara");

      const fileName = `Laporan_Aktivitas_${initialData.month.label.replace(/\s+/g, "_")}.xlsx`;
      XLSX.writeFile(workbook, fileName);
    } catch (error) {
      console.error("Failed to export to Excel", error);
    }
  };

  return (
    <main className={`flex-1 max-w-6xl mx-auto w-full px-6 py-12 md:py-20 space-y-12 transition-all duration-500 ${isPending ? "opacity-50 pointer-events-none cursor-wait" : "opacity-100"}`}>

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
          <h2 className="text-xl font-bold tracking-tight text-ink">Ringkasan</h2>
          <div className="flex rounded-xl bg-paper-raised/40 dark:bg-ink/10 p-1 border border-line/50 w-fit">
            {(["mingguan", "bulanan", "tahunan"] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setOverviewTab(tab)}
                className={`px-4 py-2 text-[10px] font-bold uppercase tracking-widest rounded-lg transition-all ${overviewTab === tab
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

          <div className="flex flex-col sm:flex-row items-center gap-4 w-full md:w-auto">
            <button
              onClick={handleDownloadExcel}
              className="group flex items-center justify-center gap-2 rounded-xl border border-ink/20 dark:border-line bg-transparent px-4 py-2.5 text-sm font-semibold text-ink transition-all hover:border-ink hover:bg-ink/5 focus:outline-none focus:ring-2 focus:ring-ink/50 w-full sm:w-auto"
              title="Download Excel"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="opacity-70 group-hover:opacity-100 transition-opacity">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                <polyline points="7 10 12 15 17 10" />
                <line x1="12" x2="12" y1="15" y2="3" />
              </svg>
              <span>Download Excel</span>
            </button>

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
