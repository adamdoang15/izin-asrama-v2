"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import type { DailyActivityDataResult } from "@/services/daily-activity.service";

export default function DailyActivityGelaraView({
  initialData,
  userName,
}: {
  initialData: DailyActivityDataResult;
  userName: string;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

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

  function handleFilterChange(params: { weekId?: string; monthId?: string }) {
    const sp = new URLSearchParams();
    if (params.weekId) sp.set("week", params.weekId);
    if (params.monthId) sp.set("month", params.monthId);
    
    startTransition(() => {
      router.push(`/daily-activity?${sp.toString()}`);
    });
  }

  const currentWeek =
    initialData.weeks.find((w) => w.id === selectedWeekId) || initialData.weeks[0];

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
      <main className="flex-1 max-w-4xl mx-auto w-full px-6 py-12 space-y-6">
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
    <main className={`flex-1 max-w-4xl mx-auto w-full px-6 py-12 md:py-20 space-y-10 md:space-y-12 transition-all duration-500 ${isPending ? "opacity-50 pointer-events-none cursor-wait" : "opacity-100"}`}>
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

      {/* Selector Periode (Bulan & Minggu) */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-4 w-full md:w-max">
        <div className="flex flex-col sm:flex-row sm:items-center bg-paper-raised/60 dark:bg-ink/5 p-2 md:p-3 rounded-2xl border border-line/50 gap-3 shadow-sm max-w-full">
          <label className="shrink-0 text-[10px] md:text-xs font-bold uppercase tracking-widest text-ink-soft pl-2">
            Pilih Periode:
          </label>
          <div className="flex gap-2 w-full sm:w-auto">
            <select
              value={initialData.selectedMonthId}
              onChange={(e) => handleFilterChange({ monthId: e.target.value, weekId: initialData.selectedWeekId })}
              className="w-full sm:w-auto rounded-xl border border-ink/10 dark:border-line bg-white/60 dark:bg-ink/10 px-4 py-2.5 text-sm font-medium text-ink outline-none focus:border-ink dark:focus:border-teal focus:ring-1 focus:ring-ink dark:focus:ring-teal/50 transition-all cursor-pointer hover:bg-white dark:hover:bg-ink/20"
            >
              {initialData.availableMonths.map((m) => (
                <option key={m.id} value={m.id} className="bg-paper text-ink font-medium">
                  {m.label}
                </option>
              ))}
            </select>
            {periodTab === "mingguan" && initialData.weeks.length > 0 && (
              <select
                value={selectedWeekId}
                onChange={(e) => {
                  setSelectedWeekId(e.target.value);
                  handleFilterChange({ weekId: e.target.value, monthId: initialData.selectedMonthId });
                }}
                className="w-full sm:w-auto rounded-xl border border-ink/10 dark:border-line bg-white/60 dark:bg-ink/10 px-4 py-2.5 text-sm font-medium text-ink outline-none focus:border-ink dark:focus:border-teal focus:ring-1 focus:ring-ink dark:focus:ring-teal/50 transition-all cursor-pointer hover:bg-white dark:hover:bg-ink/20"
              >
                {initialData.weeks.map((w) => (
                  <option key={w.id} value={w.id} className="bg-paper text-ink font-medium">
                    {w.label}
                  </option>
                ))}
              </select>
            )}
          </div>
        </div>
      </div>

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
