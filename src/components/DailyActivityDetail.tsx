"use client";

import { useEffect, useRef, useState } from "react";
import type { AbsentActivityRecord, GelaraSummary, WeekPeriod } from "@/services/daily-activity.service";
import dynamic from "next/dynamic";

const SPPDFDownloadButton = dynamic(() => import("./SPPDFDownloadButton"), {
  ssr: false,
});

interface DailyActivityDetailProps {
  summary: GelaraSummary | null;
  currentWeek: WeekPeriod;
  absentActivities: AbsentActivityRecord[];
  monthLabel?: string;
  year?: number;
  onClose: () => void;
}

type DetailCardType =
  | "kehadiran-mingguan"
  | "kehadiran-bulanan"
  | "pelanggaran-mingguan"
  | "pelanggaran-bulanan";

const CARDS: { id: DetailCardType; title: string; subtitle: string }[] = [
  { id: "kehadiran-mingguan", title: "Kehadiran Mingguan", subtitle: "Minggu Ini" },
  { id: "kehadiran-bulanan", title: "Kehadiran Bulanan", subtitle: "Bulan Ini" },
  { id: "pelanggaran-mingguan", title: "Pelanggaran Minggu Ini", subtitle: "Minggu Ini" },
  { id: "pelanggaran-bulanan", title: "Pelanggaran Bulan Ini", subtitle: "Bulan Ini" },
];

export default function DailyActivityDetail({
  summary,
  currentWeek,
  absentActivities,
  monthLabel = "Bulan",
  year = new Date().getFullYear(),
  onClose,
}: DailyActivityDetailProps) {
  const [activeCard, setActiveCard] = useState<DetailCardType>("kehadiran-mingguan");
  const sliderRef = useRef<HTMLDivElement>(null);
  const isScrollingRef = useRef(false);

  useEffect(() => {
    const originalStyle = window.getComputedStyle(document.body).overflow;
    document.body.style.overflow = "hidden";

    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => {
      document.body.style.overflow = originalStyle;
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [onClose]);

  if (!summary) return null;

  const initial = summary.namaGelara.trim()?.[0]?.toUpperCase() ?? "?";

  // Normalisasi nama yang konsisten dengan DailyActivityClient
  const normalizeName = (name: string) => name.toLowerCase().replace(/[^a-z0-9]/g, "");

  // Filter activities for this gelara
  const gelaraAbsences = absentActivities.filter(
    (a) => normalizeName(a.namaGelara) === normalizeName(summary.namaGelara)
  );

  const weeklyAbsences = gelaraAbsences.filter(
    (a) => a.tanggal >= currentWeek.startDate && a.tanggal <= currentWeek.endDate
  );

  // Filter bulanan: hanya tampilkan absent activities yang termasuk bulan yang dipilih
  const selectedMonthPrefix = currentWeek.startDate.slice(0, 7); // "YYYY-MM"
  const monthlyAbsences = gelaraAbsences.filter(
    (a) => a.tanggal.startsWith(selectedMonthPrefix)
  );

  const isWeekly = activeCard.includes("mingguan");
  const isPelanggaran = activeCard.includes("pelanggaran");
  const periodAbsences = isWeekly ? weeklyAbsences : monthlyAbsences;
  const currentList = isPelanggaran ? periodAbsences.filter((a) => a.status === "A") : periodAbsences;

  // Persentase Pelanggaran (Alpha / Kegiatan) seperti yang ditampilkan kepada Gelara
  const persenPelanggaranMingguan =
    summary.totalTercatatMingguan > 0
      ? Number(((summary.jumlahAMingguan / summary.totalTercatatMingguan) * 100).toFixed(1))
      : 0;

  const persenPelanggaranBulanan =
    summary.totalTercatatBulanan > 0
      ? Number(((summary.jumlahABulanan / summary.totalTercatatBulanan) * 100).toFixed(1))
      : 0;

  function scrollToCardIndex(index: number) {
    if (sliderRef.current) {
      const card = sliderRef.current.children[index] as HTMLElement;
      if (card) {
        isScrollingRef.current = true;
        card.scrollIntoView({ behavior: "smooth", block: "nearest", inline: "start" });
        setActiveCard(CARDS[index].id);
        setTimeout(() => {
          isScrollingRef.current = false;
        }, 350);
      }
    }
  }

  function scrollSlider(direction: "left" | "right") {
    const currentIndex = CARDS.findIndex((c) => c.id === activeCard);
    const nextIndex =
      direction === "left"
        ? Math.max(0, currentIndex - 1)
        : Math.min(CARDS.length - 1, currentIndex + 1);
    scrollToCardIndex(nextIndex);
  }

  // Handle touch / swipe scroll to automatically highlight current card
  function handleSliderScroll() {
    if (isScrollingRef.current || !sliderRef.current) return;
    const container = sliderRef.current;
    const cardWidth = container.firstElementChild?.clientWidth || 250;
    const gap = 12; // gap-3 = 12px
    const index = Math.round(container.scrollLeft / (cardWidth + gap));
    const clampedIndex = Math.max(0, Math.min(index, CARDS.length - 1));
    const targetCard = CARDS[clampedIndex];
    if (targetCard && targetCard.id !== activeCard) {
      setActiveCard(targetCard.id);
    }
  }

  const activeCardIndex = CARDS.findIndex((c) => c.id === activeCard);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/50 backdrop-blur-xs animate-in fade-in duration-200">
      <div
        className="w-full max-w-2xl max-h-[92vh] flex flex-col rounded-xl border border-line bg-paper-raised shadow-xl overflow-hidden animate-in zoom-in-95 duration-200"
        role="dialog"
        aria-modal="true"
        aria-labelledby="detail-modal-title"
      >
        {/* Modal Header */}
        <div className="flex items-start justify-between border-b border-line px-5 sm:px-6 py-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between w-full gap-4 sm:gap-0">
            <div className="flex items-center gap-3 pr-2">
              <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-teal-soft text-base font-semibold text-teal">
                {initial}
              </span>
              <div>
                <h3 id="detail-modal-title" className="text-base font-semibold leading-tight text-ink">
                  {summary.namaGelara}
                </h3>
                <p className="text-xs text-ink-soft mt-0.5">Detail Monitoring Kehadiran & Pelanggaran</p>
              </div>
            </div>
            {summary.progressBulanan !== null && summary.progressBulanan < 85 && (
              <div className="sm:mr-4">
                <SPPDFDownloadButton
                  monthLabel={monthLabel}
                  year={year}
                  gelara={summary}
                  absences={gelaraAbsences}
                />
              </div>
            )}
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
        <div className="flex-1 overflow-y-auto px-4 sm:px-6 py-4 sm:py-5 space-y-5">
          {/* Slider Controls Header */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold uppercase tracking-wider text-ink-soft">
                  Kartu Statistik
                </span>
              </div>
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => scrollSlider("left")}
                  aria-label="Geser ke kiri"
                  className="rounded-md border border-line bg-paper p-1.5 text-ink-soft hover:bg-paper-raised hover:text-ink transition-colors"
                >
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} className="h-3.5 w-3.5">
                    <path d="m15 18-6-6 6-6" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </button>
                <button
                  type="button"
                  onClick={() => scrollSlider("right")}
                  aria-label="Geser ke kanan"
                  className="rounded-md border border-line bg-paper p-1.5 text-ink-soft hover:bg-paper-raised hover:text-ink transition-colors"
                >
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} className="h-3.5 w-3.5">
                    <path d="m9 18 6-6-6-6" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </button>
              </div>
            </div>

            {/* Scrollable Cards Slider with Touch Swipe & Momentum Scroll */}
            <div
              ref={sliderRef}
              onScroll={handleSliderScroll}
              className="flex gap-3 overflow-x-auto pb-2 pt-1 scroll-smooth snap-x snap-mandatory scrollbar-none touch-pan-x overscroll-x-contain"
              style={{ WebkitOverflowScrolling: "touch" }}
              tabIndex={0}
              role="region"
              aria-label="Daftar Kartu Statistik (Dapat digeser)"
            >
              {/* Card 1: Kehadiran Mingguan */}
              <div
                onClick={() => {
                  setActiveCard("kehadiran-mingguan");
                  scrollToCardIndex(0);
                }}
                className={`w-[80vw] max-w-[280px] sm:w-[260px] min-w-[240px] shrink-0 snap-start cursor-pointer rounded-xl border p-4 transition-all shadow-xs select-none ${activeCard === "kehadiran-mingguan"
                  ? "border-teal bg-teal-soft/25 ring-2 ring-teal"
                  : "border-line bg-paper hover:border-ink-soft/40"
                  }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold uppercase tracking-wider text-ink-soft">
                    Kehadiran Mingguan
                  </span>
                  <span className="text-[11px] font-medium text-teal">{currentWeek.shortLabel}</span>
                </div>
                <div className="mt-2.5 flex items-baseline justify-between gap-2">
                  <span className="text-2xl font-bold text-teal">
                    {summary.progressMingguan !== null ? `${summary.progressMingguan.toFixed(1)}%` : "—"}
                  </span>
                  <span className="text-xs font-semibold whitespace-nowrap">
                    <span className="text-clay">{summary.jumlahAMingguan} A</span>,{" "}
                    <span className="text-amber-600 dark:text-amber-400">{summary.jumlahSMingguan || 0} S</span>,{" "}
                    <span className="text-sky-600 dark:text-sky-400">{summary.jumlahIMingguan || 0} I</span>
                  </span>
                </div>
                <p className="text-[11px] text-ink-soft mt-1.5">
                  Dari {summary.totalTercatatMingguan} kegiatan tercatat
                </p>
              </div>

              {/* Card 2: Kehadiran Bulanan */}
              <div
                onClick={() => {
                  setActiveCard("kehadiran-bulanan");
                  scrollToCardIndex(1);
                }}
                className={`w-[80vw] max-w-[280px] sm:w-[260px] min-w-[240px] shrink-0 snap-start cursor-pointer rounded-xl border p-4 transition-all shadow-xs select-none ${activeCard === "kehadiran-bulanan"
                  ? "border-teal bg-teal-soft/25 ring-2 ring-teal"
                  : "border-line bg-paper hover:border-ink-soft/40"
                  }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold uppercase tracking-wider text-ink-soft">
                    Kehadiran Bulanan
                  </span>
                  <span className="text-[11px] font-medium text-teal">Bulan Ini</span>
                </div>
                <div className="mt-2.5 flex items-baseline justify-between gap-2">
                  <span className="text-2xl font-bold text-teal">
                    {summary.progressBulanan !== null ? `${summary.progressBulanan.toFixed(1)}%` : "—"}
                  </span>
                  <span className="text-xs font-semibold whitespace-nowrap">
                    <span className="text-clay">{summary.jumlahABulanan} A</span>,{" "}
                    <span className="text-amber-600 dark:text-amber-400">{summary.jumlahSBulanan || 0} S</span>,{" "}
                    <span className="text-sky-600 dark:text-sky-400">{summary.jumlahIBulanan || 0} I</span>
                  </span>
                </div>
                <p className="text-[11px] text-ink-soft mt-1.5">
                  Dari {summary.totalTercatatBulanan} kegiatan tercatat
                </p>
              </div>

              {/* Card 3: Pelanggaran Mingguan (Tampilan Gelara) */}
              <div
                onClick={() => {
                  setActiveCard("pelanggaran-mingguan");
                  scrollToCardIndex(2);
                }}
                className={`w-[80vw] max-w-[280px] sm:w-[260px] min-w-[240px] shrink-0 snap-start cursor-pointer rounded-xl border p-4 transition-all shadow-xs select-none ${activeCard === "pelanggaran-mingguan"
                  ? "border-clay bg-clay-soft/30 ring-2 ring-clay"
                  : "border-line bg-paper hover:border-ink-soft/40"
                  }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold uppercase tracking-wider text-ink-soft">
                    Pelanggaran Minggu Ini
                  </span>
                  <span className="text-[11px] font-medium text-clay">{currentWeek.shortLabel}</span>
                </div>
                <div className="mt-2.5 flex items-baseline gap-2.5">
                  <span
                    className={`text-2xl font-extrabold ${persenPelanggaranMingguan > 0 ? "text-clay" : "text-sage"
                      }`}
                  >
                    {persenPelanggaranMingguan.toFixed(1)}%
                  </span>
                  <span
                    className={`text-xs font-semibold ${persenPelanggaranMingguan > 0 ? "text-clay" : "text-sage"
                      }`}
                  >
                    {persenPelanggaranMingguan > 0 ? "Pelanggaran" : "Nol Pelanggaran"}
                  </span>
                </div>
                <p className="text-[11px] text-ink-soft mt-1.5">
                  <span className="font-semibold text-clay">{summary.jumlahAMingguan} A</span> dari {summary.totalTercatatMingguan} kegiatan tercatat
                </p>
              </div>

              {/* Card 4: Pelanggaran Bulanan (Tampilan Gelara) */}
              <div
                onClick={() => {
                  setActiveCard("pelanggaran-bulanan");
                  scrollToCardIndex(3);
                }}
                className={`w-[80vw] max-w-[280px] sm:w-[260px] min-w-[240px] shrink-0 snap-start cursor-pointer rounded-xl border p-4 transition-all shadow-xs select-none ${activeCard === "pelanggaran-bulanan"
                  ? "border-clay bg-clay-soft/30 ring-2 ring-clay"
                  : "border-line bg-paper hover:border-ink-soft/40"
                  }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold uppercase tracking-wider text-ink-soft">
                    Pelanggaran Bulan Ini
                  </span>
                  <span className="text-[11px] font-medium text-clay">Bulan Ini</span>
                </div>
                <div className="mt-2.5 flex items-baseline gap-2.5">
                  <span
                    className={`text-2xl font-extrabold ${persenPelanggaranBulanan > 0 ? "text-clay" : "text-sage"
                      }`}
                  >
                    {persenPelanggaranBulanan.toFixed(1)}%
                  </span>
                  <span
                    className={`text-xs font-semibold ${persenPelanggaranBulanan > 0 ? "text-clay" : "text-sage"
                      }`}
                  >
                    {persenPelanggaranBulanan > 0 ? "Pelanggaran" : "Nol Pelanggaran"}
                  </span>
                </div>
                <p className="text-[11px] text-ink-soft mt-1.5">
                  <span className="font-semibold text-clay">{summary.jumlahABulanan} A</span> dari {summary.totalTercatatBulanan} kegiatan tercatat
                </p>
              </div>
            </div>

            {/* Mobile Pagination Indicator Dots */}
            <div className="flex items-center justify-center gap-1.5 pt-1 sm:hidden">
              {CARDS.map((card, idx) => (
                <button
                  key={card.id}
                  type="button"
                  onClick={() => scrollToCardIndex(idx)}
                  className={`h-1.5 rounded-full transition-all ${activeCardIndex === idx ? "w-6 bg-teal" : "w-1.5 bg-line hover:bg-ink-soft/40"
                    }`}
                  aria-label={`Slide ke ${card.title}`}
                />
              ))}
            </div>
          </div>

          {/* Tab Selection & Daftar Catatan */}
          <div className="space-y-3 pt-2">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div className="min-w-0">
                <h4 className="text-sm font-semibold text-ink">
                  {isPelanggaran ? "Daftar Pelanggaran Alpha (A)" : "Daftar Ketidakhadiran (A / S / I)"} ({isWeekly ? "Minggu Ini" : "Bulan Ini"})
                </h4>
                <p className="text-xs text-ink-soft mt-0.5">
                  Menampilkan aktivitas {isPelanggaran ? "dengan status Alpha (A)" : "dengan status A, S, atau I"} periode {isWeekly ? currentWeek.shortLabel : "bulan ini"}.
                </p>
              </div>
              <div className="flex items-center gap-2 self-start sm:self-auto">
                <span className="shrink-0 whitespace-nowrap inline-flex items-center text-xs font-medium text-teal bg-teal-soft px-2.5 py-0.5 rounded-full">
                  {currentList.length} Catatan
                </span>
              </div>
            </div>

            {currentList.length === 0 ? (
              <div className="rounded-xl border border-line bg-paper p-6 text-center">
                <p className="text-sm font-medium text-sage">
                  {isPelanggaran ? "Alhamdulillah, tidak ada catatan Pelanggaran" : "Alhamdulillah, tidak ada catatan Ketidakhadiran"}
                </p>
                <p className="text-xs text-ink-soft mt-1">
                  Seluruh kegiatan tercatat telah diikuti dengan baik pada periode {isWeekly ? currentWeek.shortLabel : "bulan ini"}.
                </p>
              </div>
            ) : (
              <ul className="divide-y divide-line rounded-xl border border-line bg-paper overflow-hidden">
                {currentList.map((item) => {
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
                    <li key={item.id} className="flex items-center justify-between px-4 py-3 hover:bg-paper-raised transition-colors">
                      <div className="min-w-0 pr-3">
                        <p className="text-sm font-medium text-ink truncate">{item.aktivitas}</p>
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
          </div>
        </div>

        {/* Modal Footer */}
        <div className="border-t border-line px-6 py-3.5 bg-paper/50 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg bg-teal px-5 py-2 text-sm font-medium text-paper-raised hover:opacity-90 transition-opacity"
          >
            Tutup
          </button>
        </div>
      </div>
    </div>
  );
}

