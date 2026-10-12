"use client";

import { useState } from "react";
import type { KelasStatistik } from "@/services/daily-activity.service";

interface KelasStatistikTableProps {
  mingguanStats: KelasStatistik[];
  bulananStats: KelasStatistik[];
  selectedWeekLabel: string;
  selectedMonthLabel: string;
}

function getProgressBadge(progress: number | null) {
  if (progress === null) {
    return <span className="text-xs text-ink-soft italic">—</span>;
  }

  let colorClasses = "text-teal bg-teal-soft border-teal/20";
  if (progress < 75) {
    colorClasses = "text-clay bg-clay/10 border-clay/20";
  } else if (progress < 90) {
    colorClasses = "text-amber-700 bg-amber-500/10 border-amber-500/20 dark:text-amber-400";
  }

  return (
    <span
      className={`inline-flex items-center gap-1 font-semibold px-2.5 py-1 rounded-md text-xs border ${colorClasses}`}
    >
      {progress.toFixed(1)}%
    </span>
  );
}

export default function KelasStatistikTable({
  mingguanStats,
  bulananStats,
  selectedWeekLabel,
  selectedMonthLabel,
}: KelasStatistikTableProps) {
  const [periode, setPeriode] = useState<"mingguan" | "bulanan">("mingguan");

  const activeStats = periode === "mingguan" ? mingguanStats : bulananStats;
  const currentPeriodText = periode === "mingguan" ? selectedWeekLabel : selectedMonthLabel;

  const hasTanpaKelas = activeStats.some((s) => s.kelas === "Tanpa Kelas");

  return (
    <section className="glass-panel p-8 md:p-10 shadow-sm overflow-hidden flex flex-col gap-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 border-b border-line/50 pb-5">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-ink">
            Statistik per Kelas
          </h2>
          <p className="mt-1 text-sm text-ink-soft leading-relaxed">
            Perbandingan tingkat kehadiran sholat berjamaah (5 waktu) dan seluruh aktivitas harian untuk periode{" "}
            <span className="font-semibold text-ink">{currentPeriodText}</span>.
          </p>
        </div>

        {/* Tab Toggle */}
        <div className="flex rounded-xl bg-paper-raised/40 dark:bg-ink/10 p-1 border border-line/50 w-fit shrink-0">
          <button
            type="button"
            onClick={() => setPeriode("mingguan")}
            className={`px-4 py-2 text-xs font-semibold rounded-lg transition-all ${
              periode === "mingguan"
                ? "bg-ink text-paper-raised shadow-sm"
                : "text-ink-soft hover:bg-white/40 dark:hover:bg-white/5 hover:text-ink"
            }`}
          >
            Mingguan
          </button>
          <button
            type="button"
            onClick={() => setPeriode("bulanan")}
            className={`px-4 py-2 text-xs font-semibold rounded-lg transition-all ${
              periode === "bulanan"
                ? "bg-ink text-paper-raised shadow-sm"
                : "text-ink-soft hover:bg-white/40 dark:hover:bg-white/5 hover:text-ink"
            }`}
          >
            Bulanan
          </button>
        </div>
      </div>

      {hasTanpaKelas && (
        <div className="rounded-xl border border-amber-500/20 bg-amber-500/5 px-4 py-3 text-xs text-amber-800 dark:text-amber-300 flex items-center justify-between gap-3">
          <span>
            Beberapa santri terdata di baris <strong>Tanpa Kelas</strong> karena kolom kelas di akun mereka belum diatur.
          </span>
          <span className="shrink-0 text-[11px] font-medium text-amber-700/80 dark:text-amber-400">
            Dapat diperbarui di menu Kelola Akun
          </span>
        </div>
      )}

      {activeStats.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-line/80 bg-paper-raised/30 dark:bg-ink/5 p-10 text-center text-sm font-medium text-ink-soft">
          Belum ada data aktivitas atau santri untuk periode ini.
        </div>
      ) : (
        <>
          {/* Desktop Table View */}
          <div className="hidden md:block overflow-x-auto rounded-xl border border-line/50">
            <table className="w-full text-left text-sm">
              <thead className="bg-paper-raised/70 border-b border-line text-ink-soft text-xs font-semibold">
                <tr>
                  <th scope="col" className="px-4 py-3.5 w-12 text-center">No</th>
                  <th scope="col" className="px-4 py-3.5 min-w-[140px]">Kelas</th>
                  <th scope="col" className="px-4 py-3.5 text-center">Santri</th>
                  <th scope="col" className="px-4 py-3.5 text-center border-l border-line/40">
                    Progress Sholat
                  </th>
                  <th scope="col" className="px-4 py-3.5 text-center">
                    Alpha / Sakit / Izin (Sholat)
                  </th>
                  <th scope="col" className="px-4 py-3.5 text-center border-l border-line/40">
                    Progress Keseluruhan
                  </th>
                  <th scope="col" className="px-4 py-3.5 text-center">
                    Alpha / Sakit / Izin (Total)
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line/40 bg-paper">
                {activeStats.map((item, idx) => {
                  const isTanpaKelas = item.kelas === "Tanpa Kelas";

                  return (
                    <tr
                      key={item.kelas}
                      className={`hover:bg-paper-raised/40 transition-colors ${
                        isTanpaKelas ? "bg-amber-500/[0.02]" : ""
                      }`}
                    >
                      <td className="px-4 py-3.5 text-center text-ink-soft text-xs">
                        {idx + 1}
                      </td>

                      <td className="px-4 py-3.5 font-medium text-ink">
                        <div className="flex items-center gap-2">
                          <span
                            className={`font-bold ${
                              isTanpaKelas
                                ? "text-ink-soft italic font-normal"
                                : "text-ink"
                            }`}
                          >
                            {isTanpaKelas ? "Tanpa Kelas" : `Kelas ${item.kelas}`}
                          </span>
                        </div>
                      </td>

                      <td className="px-4 py-3.5 text-center">
                        <span className="inline-flex items-center justify-center min-w-6 px-2 py-0.5 rounded-full bg-paper-raised text-xs font-semibold text-ink-soft border border-line/50">
                          {item.jumlahSantri}
                        </span>
                      </td>

                      {/* Sholat Berjamaah */}
                      <td className="px-4 py-3.5 text-center border-l border-line/40">
                        {getProgressBadge(item.sholatProgress)}
                      </td>

                      <td className="px-4 py-3.5 text-center text-xs">
                        <span className={`font-semibold ${item.sholatAlpha > 0 ? "text-clay" : "text-ink-soft"}`}>
                          {item.sholatAlpha}
                        </span>
                        <span className="text-ink-soft/40 mx-1">/</span>
                        <span className={`font-semibold ${item.sholatSakit > 0 ? "text-amber-600 dark:text-amber-400" : "text-ink-soft"}`}>
                          {item.sholatSakit}
                        </span>
                        <span className="text-ink-soft/40 mx-1">/</span>
                        <span className={`font-semibold ${item.sholatIzin > 0 ? "text-sky-600 dark:text-sky-400" : "text-ink-soft"}`}>
                          {item.sholatIzin}
                        </span>
                      </td>

                      {/* Keseluruhan */}
                      <td className="px-4 py-3.5 text-center border-l border-line/40">
                        {getProgressBadge(item.overallProgress)}
                      </td>

                      <td className="px-4 py-3.5 text-center text-xs">
                        <span className={`font-semibold ${item.overallAlpha > 0 ? "text-clay" : "text-ink-soft"}`}>
                          {item.overallAlpha}
                        </span>
                        <span className="text-ink-soft/40 mx-1">/</span>
                        <span className={`font-semibold ${item.overallSakit > 0 ? "text-amber-600 dark:text-amber-400" : "text-ink-soft"}`}>
                          {item.overallSakit}
                        </span>
                        <span className="text-ink-soft/40 mx-1">/</span>
                        <span className={`font-semibold ${item.overallIzin > 0 ? "text-sky-600 dark:text-sky-400" : "text-ink-soft"}`}>
                          {item.overallIzin}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Mobile Card View */}
          <div className="md:hidden space-y-3">
            {activeStats.map((item) => {
              const isTanpaKelas = item.kelas === "Tanpa Kelas";

              return (
                <div
                  key={item.kelas}
                  className="rounded-2xl border border-line/60 bg-paper-raised/40 p-4 space-y-3 shadow-sm"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-base text-ink">
                        {isTanpaKelas ? "Tanpa Kelas" : `Kelas ${item.kelas}`}
                      </span>
                      <span className="text-xs px-2 py-0.5 rounded-full bg-paper border border-line text-ink-soft font-medium">
                        {item.jumlahSantri} santri
                      </span>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3 pt-1">
                    {/* Sholat Column */}
                    <div className="rounded-xl border border-line/40 bg-paper p-3 space-y-1.5">
                      <p className="text-[11px] font-semibold text-ink-soft">
                        Sholat Berjamaah
                      </p>
                      <div>{getProgressBadge(item.sholatProgress)}</div>
                      <p className="text-[11px] text-ink-soft pt-1">
                        A: <strong className={item.sholatAlpha > 0 ? "text-clay" : ""}>{item.sholatAlpha}</strong> ·{" "}
                        S: <strong className={item.sholatSakit > 0 ? "text-amber-600 dark:text-amber-400" : ""}>{item.sholatSakit}</strong> ·{" "}
                        I: <strong className={item.sholatIzin > 0 ? "text-sky-600 dark:text-sky-400" : ""}>{item.sholatIzin}</strong>
                      </p>
                    </div>

                    {/* Overall Column */}
                    <div className="rounded-xl border border-line/40 bg-paper p-3 space-y-1.5">
                      <p className="text-[11px] font-semibold text-ink-soft">
                        Semua Aktivitas
                      </p>
                      <div>{getProgressBadge(item.overallProgress)}</div>
                      <p className="text-[11px] text-ink-soft pt-1">
                        A: <strong className={item.overallAlpha > 0 ? "text-clay" : ""}>{item.overallAlpha}</strong> ·{" "}
                        S: <strong className={item.overallSakit > 0 ? "text-amber-600 dark:text-amber-400" : ""}>{item.overallSakit}</strong> ·{" "}
                        I: <strong className={item.overallIzin > 0 ? "text-sky-600 dark:text-sky-400" : ""}>{item.overallIzin}</strong>
                      </p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}
    </section>
  );
}
