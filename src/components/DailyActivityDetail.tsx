"use client";

import { useEffect, useState } from "react";
import type { AbsentActivityRecord, GelaraSummary, WeekPeriod } from "@/services/daily-activity.service";

interface DailyActivityDetailProps {
  summary: GelaraSummary | null;
  currentWeek: WeekPeriod;
  absentActivities: AbsentActivityRecord[];
  onClose: () => void;
}

export default function DailyActivityDetail({
  summary,
  currentWeek,
  absentActivities,
  onClose,
}: DailyActivityDetailProps) {
  const [activeTab, setActiveTab] = useState<"mingguan" | "bulanan">("mingguan");

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  if (!summary) return null;

  const initial = summary.namaGelara.trim()?.[0]?.toUpperCase() ?? "?";

  // Filter activities for this gelara
  const gelaraAbsences = absentActivities.filter(
    (a) => a.namaGelara.toLowerCase() === summary.namaGelara.toLowerCase()
  );

  const weeklyAbsences = gelaraAbsences.filter(
    (a) => a.tanggal >= currentWeek.startDate && a.tanggal <= currentWeek.endDate
  );

  const monthlyAbsences = gelaraAbsences;

  const currentList = activeTab === "mingguan" ? weeklyAbsences : monthlyAbsences;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-in fade-in duration-200">
      <div
        className="w-full max-w-xl max-h-[90vh] flex flex-col rounded-xl border border-line bg-paper-raised shadow-xl overflow-hidden animate-in zoom-in-95 duration-200"
        role="dialog"
        aria-modal="true"
        aria-labelledby="detail-modal-title"
      >
        {/* Modal Header */}
        <div className="flex items-start justify-between border-b border-line px-6 py-4">
          <div className="flex items-center gap-3">
            <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-teal-soft text-base font-semibold text-teal">
              {initial}
            </span>
            <div>
              <h3 id="detail-modal-title" className="text-base font-semibold leading-tight">
                {summary.namaGelara}
              </h3>
              <p className="text-xs text-ink-soft mt-0.5">Detail Monitoring Ketidakhadiran</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Tutup"
            className="rounded-lg p-1.5 text-ink-soft hover:bg-paper hover:text-ink transition-colors"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="h-5 w-5">
              <path d="M18 6 6 18M6 6l12 12" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-6">
          {/* Progress Cards */}
          <div className="grid grid-cols-2 gap-3">
            {/* Mingguan */}
            <div
              onClick={() => setActiveTab("mingguan")}
              className={`cursor-pointer rounded-lg border p-4 transition-all ${
                activeTab === "mingguan"
                  ? "border-teal bg-teal-soft/30 ring-1 ring-teal"
                  : "border-line bg-paper hover:border-ink-soft/40"
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold uppercase tracking-wider text-ink-soft">
                  Mingguan
                </span>
                <span className="text-[11px] text-ink-soft">{currentWeek.shortLabel}</span>
              </div>
              <div className="mt-2 flex items-baseline gap-2">
                <span className="text-2xl font-bold text-teal">
                  {summary.progressMingguan !== null ? `${summary.progressMingguan.toFixed(1)}%` : "—"}
                </span>
                <span className="text-xs text-clay font-medium">
                  {summary.jumlahAMingguan} Alpha (A)
                </span>
              </div>
              <p className="text-[11px] text-ink-soft mt-1">
                Dari {summary.totalTercatatMingguan} kegiatan tercatat
              </p>
            </div>

            {/* Bulanan */}
            <div
              onClick={() => setActiveTab("bulanan")}
              className={`cursor-pointer rounded-lg border p-4 transition-all ${
                activeTab === "bulanan"
                  ? "border-teal bg-teal-soft/30 ring-1 ring-teal"
                  : "border-line bg-paper hover:border-ink-soft/40"
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold uppercase tracking-wider text-ink-soft">
                  Bulanan
                </span>
                <span className="text-[11px] text-ink-soft">Sep 2026</span>
              </div>
              <div className="mt-2 flex items-baseline gap-2">
                <span className="text-2xl font-bold text-teal">
                  {summary.progressBulanan !== null ? `${summary.progressBulanan.toFixed(1)}%` : "—"}
                </span>
                <span className="text-xs text-clay font-medium">
                  {summary.jumlahABulanan} Alpha (A)
                </span>
              </div>
              <p className="text-[11px] text-ink-soft mt-1">
                Dari {summary.totalTercatatBulanan} kegiatan tercatat
              </p>
            </div>
          </div>

          {/* Tab Selection */}
          <div>
            <div className="flex items-start justify-between gap-3 mb-3">
              <div className="min-w-0">
                <h4 className="text-sm font-semibold">
                  Daftar Kegiatan Tidak Diikuti ({activeTab === "mingguan" ? "Minggu Ini" : "Bulan Ini"})
                </h4>
              </div>
              <span className="shrink-0 whitespace-nowrap inline-flex items-center text-xs font-medium text-clay bg-clay-soft px-2.5 py-0.5 rounded-full">
                {currentList.length} Kegiatan A
              </span>
            </div>

            {currentList.length === 0 ? (
              <div className="rounded-lg border border-line bg-paper p-6 text-center">
                <p className="text-sm font-medium text-sage">Alhamdulillah, tidak ada catatan Alpha (A)</p>
                <p className="text-xs text-ink-soft mt-1">
                  Seluruh kegiatan tercatat telah diikuti dengan baik pada periode ini.
                </p>
              </div>
            ) : (
              <ul className="divide-y divide-line rounded-lg border border-line bg-paper overflow-hidden">
                {currentList.map((item) => (
                  <li key={item.id} className="flex items-center justify-between px-4 py-3 hover:bg-paper-raised transition-colors">
                    <div className="min-w-0 pr-3">
                      <p className="text-sm font-medium text-ink truncate">{item.aktivitas}</p>
                      <p className="text-xs text-ink-soft mt-0.5">
                        {item.hari}, {item.tanggalFormatted}
                      </p>
                    </div>
                    <span className="shrink-0 inline-flex items-center rounded-md bg-clay-soft px-2 py-1 text-xs font-semibold text-clay">
                      Status A
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>

        {/* Modal Footer */}
        <div className="border-t border-line px-6 py-3 bg-paper/50 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg bg-teal px-4 py-2 text-sm font-medium text-paper-raised hover:opacity-90 transition-opacity"
          >
            Selesai
          </button>
        </div>
      </div>
    </div>
  );
}
