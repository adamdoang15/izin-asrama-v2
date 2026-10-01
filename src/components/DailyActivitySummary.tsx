"use client";

import { useMemo, useState, useRef } from "react";
import type { GelaraSummary } from "@/services/daily-activity.service";
import { SearchIcon } from "./icons";
import { useVirtualizer } from "@tanstack/react-virtual";

type SortKey =
  | "no"
  | "namaGelara"
  | "progressMingguan"
  | "progressBulanan"
  | "jumlahAMingguan"
  | "jumlahABulanan";

type SortDir = "asc" | "desc";

const SORT_LABELS: Record<SortKey, string> = {
  no: "No",
  namaGelara: "Nama",
  progressMingguan: "Progress Mingguan",
  progressBulanan: "Progress Bulanan",
  jumlahAMingguan: "A Minggu",
  jumlahABulanan: "A Bulan",
};

function SortIcon({ active, dir }: { active: boolean; dir: SortDir }) {
  return (
    <span
      className={`inline-flex flex-col ml-1 gap-px align-middle transition-opacity ${active ? "opacity-100" : "opacity-30 group-hover/th:opacity-60"}`}
    >
      <svg
        width="6"
        height="4"
        viewBox="0 0 6 4"
        className={`block transition-colors ${active && dir === "asc" ? "text-teal" : "text-ink-soft"}`}
      >
        <path d="M3 0L6 4H0L3 0Z" fill="currentColor" />
      </svg>
      <svg
        width="6"
        height="4"
        viewBox="0 0 6 4"
        className={`block transition-colors ${active && dir === "desc" ? "text-teal" : "text-ink-soft"}`}
      >
        <path d="M3 4L0 0H6L3 4Z" fill="currentColor" />
      </svg>
    </span>
  );
}

interface DailyActivitySummaryProps {
  summaries: GelaraSummary[];
  onSelectGelara: (summary: GelaraSummary) => void;
  selectedWeekLabel?: string;
  selectedMonthLabel?: string;
}

export default function DailyActivitySummary({
  summaries,
  onSelectGelara,
  selectedWeekLabel = "Minggu Ini",
  selectedMonthLabel = "September 2026",
}: DailyActivitySummaryProps) {
  const [search, setSearch] = useState("");
  const [sortKey, setSortKey] = useState<SortKey>("no");
  const [sortDir, setSortDir] = useState<SortDir>("asc");

  function handleSort(key: SortKey) {
    if (sortKey === key) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(key);
      // Kolom pelanggaran: default descending agar yang paling banyak A muncul duluan
      setSortDir(
        key === "jumlahAMingguan" || key === "jumlahABulanan" ? "desc" : "asc"
      );
    }
  }

  const filteredSummaries = useMemo(() => {
    let list = summaries;

    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter((s) => s.namaGelara.toLowerCase().includes(q));
    }

    list = [...list].sort((a, b) => {
      let cmp = 0;
      if (sortKey === "namaGelara") {
        cmp = a.namaGelara.localeCompare(b.namaGelara, "id");
      } else if (sortKey === "progressMingguan") {
        const av = a.progressMingguan ?? -1;
        const bv = b.progressMingguan ?? -1;
        cmp = av - bv;
      } else if (sortKey === "progressBulanan") {
        const av = a.progressBulanan ?? -1;
        const bv = b.progressBulanan ?? -1;
        cmp = av - bv;
      } else {
        cmp = (a[sortKey] as number) - (b[sortKey] as number);
      }
      return sortDir === "asc" ? cmp : -cmp;
    });

    return list;
  }, [summaries, search, sortKey, sortDir]);

  const parentRef = useRef<HTMLDivElement>(null);
  const rowVirtualizer = useVirtualizer({
    count: filteredSummaries.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 61,
    overscan: 5,
  });

  const mobileParentRef = useRef<HTMLDivElement>(null);
  const mobileRowVirtualizer = useVirtualizer({
    count: filteredSummaries.length,
    getScrollElement: () => mobileParentRef.current,
    estimateSize: () => 180,
    overscan: 5,
  });

  return (
    <div className="space-y-4">
      {/* Header & Search */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-base font-semibold">Ringkasan Progress Gelara</h2>
          <p className="text-xs text-ink-soft mt-0.5">
            Tingkat keikutsertaan dihitung berdasarkan kehadiran (aktivitas tanpa status A, S, atau I).
          </p>
        </div>

        <div className="relative w-full sm:w-64">
          <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-ink-soft pointer-events-none" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Cari nama gelara..."
            className="w-full rounded-lg border border-line bg-paper-raised pl-9 pr-3 py-1.5 text-xs outline-none focus:border-teal focus:ring-1 focus:ring-teal"
          />
        </div>
      </div>

      {/* Mobile sort chips */}
      <div className="md:hidden flex items-center gap-2 overflow-x-auto pb-1">
        <span className="shrink-0 text-[10px] font-semibold uppercase text-ink-soft">Urutkan:</span>
        {(Object.keys(SORT_LABELS) as SortKey[]).map((key) => {
          const active = sortKey === key;
          return (
            <button
              key={key}
              type="button"
              onClick={() => handleSort(key)}
              className={`shrink-0 rounded-full border px-2.5 py-0.5 text-[10px] font-medium transition-colors ${
                active
                  ? "border-teal bg-teal text-paper-raised"
                  : "border-line bg-paper-raised text-ink-soft hover:border-teal hover:text-teal"
              }`}
            >
              {SORT_LABELS[key]}
              {active ? (sortDir === "asc" ? " ↑" : " ↓") : ""}
            </button>
          );
        })}
      </div>

      {/* Desktop / Tablet Table */}
      <div className="hidden md:block overflow-hidden rounded-xl border border-line bg-paper-raised shadow-xs">
        <div ref={parentRef} className="overflow-auto max-h-[600px] scrollbar-thin scrollbar-thumb-line">
          <table className="w-full text-left text-sm relative">
            <thead className="sticky top-0 z-10">
              <tr className="border-b border-line bg-paper shadow-sm text-xs font-semibold text-ink-soft uppercase tracking-wider">
                {(["no", "namaGelara", "progressMingguan", "progressBulanan", "jumlahAMingguan", "jumlahABulanan"] as SortKey[]).map((col) => {
                  const active = sortKey === col;
                  const isCenter = col !== "namaGelara";
                  return (
                    <th
                      key={col}
                      scope="col"
                      onClick={() => handleSort(col)}
                      aria-sort={active ? (sortDir === "asc" ? "ascending" : "descending") : "none"}
                      className={`px-4 py-3 cursor-pointer select-none hover:text-ink transition-colors group/th ${
                        col === "no" ? "w-12 text-center" : isCenter ? "text-center" : ""
                      }`}
                    >
                      <span className="inline-flex items-center gap-0.5 justify-center bg-paper">
                        {col === "progressMingguan" ? (
                          <>
                            Progress Mingguan
                            <span className="block text-[10px] font-normal normal-case text-ink-soft ml-0.5">({selectedWeekLabel})</span>
                          </>
                        ) : col === "progressBulanan" ? (
                          <>
                            Progress Bulanan
                            <span className="block text-[10px] font-normal normal-case text-ink-soft ml-0.5">({selectedMonthLabel})</span>
                          </>
                        ) : (
                          SORT_LABELS[col]
                        )}
                        <SortIcon active={active} dir={sortDir} />
                      </span>
                    </th>
                  );
                })}
                <th scope="col" className="px-4 py-3 text-right bg-paper">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line bg-paper">
              {filteredSummaries.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-8 text-center text-sm text-ink-soft">
                    Tidak ada data gelara yang sesuai dengan pencarian.
                  </td>
                </tr>
              ) : (
                <>
                  {rowVirtualizer.getVirtualItems().length > 0 && (
                    <tr style={{ height: `${rowVirtualizer.getVirtualItems()[0]?.start ?? 0}px` }} />
                  )}
                  {rowVirtualizer.getVirtualItems().map((virtualRow) => {
                    const row = filteredSummaries[virtualRow.index];
                    const idx = virtualRow.index;
                    return (
                      <tr
                        key={row.namaGelara}
                        className="hover:bg-paper-raised transition-colors group cursor-pointer"
                        onClick={() => onSelectGelara(row)}
                      >
                        <td className="px-4 py-3.5 text-center text-xs text-ink-soft font-medium">
                          {idx + 1}
                        </td>
                        <td className="px-4 py-3.5 font-medium text-ink">
                          <div className="flex items-center gap-2.5">
                            <span className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-teal-soft text-xs font-semibold text-teal">
                              {row.namaGelara.trim()?.[0]?.toUpperCase()}
                            </span>
                            <span>{row.namaGelara}</span>
                          </div>
                        </td>
                        <td className="px-4 py-3.5 text-center">
                          {row.progressMingguan !== null ? (
                            <span className="inline-flex items-center gap-1.5 font-semibold text-teal bg-teal-soft px-2.5 py-1 rounded-md text-xs">
                              {row.progressMingguan.toFixed(1)}%
                            </span>
                          ) : (
                            <span className="text-xs text-ink-soft italic">—</span>
                          )}
                        </td>
                        <td className="px-4 py-3.5 text-center">
                          {row.progressBulanan !== null ? (
                            <span className="inline-flex items-center gap-1.5 font-semibold text-teal bg-teal-soft px-2.5 py-1 rounded-md text-xs">
                              {row.progressBulanan.toFixed(1)}%
                            </span>
                          ) : (
                            <span className="text-xs text-ink-soft italic">—</span>
                          )}
                        </td>
                        <td className="px-4 py-3.5 text-center">
                          <span className={`text-xs font-medium ${row.jumlahAMingguan > 0 ? "text-clay font-semibold" : "text-ink-soft"}`}>
                            {row.jumlahAMingguan}
                          </span>
                        </td>
                        <td className="px-4 py-3.5 text-center">
                          <span className={`text-xs font-medium ${row.jumlahABulanan > 0 ? "text-clay font-semibold" : "text-ink-soft"}`}>
                            {row.jumlahABulanan}
                          </span>
                        </td>
                        <td className="px-4 py-3.5 text-right">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              onSelectGelara(row);
                            }}
                            className="rounded-md border border-line bg-paper px-2.5 py-1 text-xs font-medium text-ink hover:bg-teal hover:text-paper-raised hover:border-teal transition-all"
                          >
                            Lihat Detail
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                  {rowVirtualizer.getVirtualItems().length > 0 && (
                    <tr
                      style={{
                        height: `${
                          rowVirtualizer.getTotalSize() -
                          (rowVirtualizer.getVirtualItems()[rowVirtualizer.getVirtualItems().length - 1]?.end ?? 0)
                        }px`,
                      }}
                    />
                  )}
                </>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Mobile Card List */}
      <div
        ref={mobileParentRef}
        className="md:hidden overflow-auto max-h-[70vh] scrollbar-thin scrollbar-thumb-line pb-4 px-1"
      >
        {filteredSummaries.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-line/80 bg-paper-raised/30 dark:bg-ink/5 p-8 text-center text-sm font-bold text-ink mt-2">
            Tidak ada data gelara yang sesuai.
          </div>
        ) : (
          <div
            style={{
              height: `${mobileRowVirtualizer.getTotalSize()}px`,
              width: "100%",
              position: "relative",
            }}
          >
            {mobileRowVirtualizer.getVirtualItems().map((virtualRow) => {
              const row = filteredSummaries[virtualRow.index];
              const idx = virtualRow.index;
              return (
                <div
                  key={row.namaGelara}
                  style={{
                    position: "absolute",
                    top: 0,
                    left: 0,
                    width: "100%",
                    transform: `translateY(${virtualRow.start}px)`,
                    paddingBottom: "16px",
                  }}
                >
                  <div
                    onClick={() => onSelectGelara(row)}
                    className="rounded-2xl border border-line/50 bg-white/40 dark:bg-ink/10 p-5 shadow-sm space-y-4 cursor-pointer hover:scale-[1.01] hover:shadow-md transition-all backdrop-blur-sm h-full"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-teal-soft/80 border border-teal/20 text-sm font-bold text-teal shadow-sm">
                          {row.namaGelara.trim()?.[0]?.toUpperCase()}
                        </span>
                        <div>
                          <h3 className="text-sm font-bold text-ink leading-tight">{row.namaGelara}</h3>
                          <p className="text-[10px] font-bold uppercase tracking-widest text-ink-soft mt-1">Peringkat #{idx + 1}</p>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          onSelectGelara(row);
                        }}
                        className="rounded-lg bg-ink px-3 py-1.5 text-[10px] font-bold uppercase tracking-widest text-paper-raised active:scale-95 transition-transform"
                      >
                        Detail
                      </button>
                    </div>

                    <div className="grid grid-cols-2 gap-3 pt-4 border-t border-line/50">
                      
                      {/* Mingguan */}
                      <div className="rounded-xl border border-line/50 bg-paper-raised/60 dark:bg-ink/10 p-3 flex flex-col justify-between shadow-sm">
                        <p className="text-[10px] font-bold uppercase tracking-widest text-ink-soft mb-2">Mingguan</p>
                        
                        <div className="mb-3">
                          <span className="text-3xl font-black text-teal tracking-tighter">
                            {row.progressMingguan !== null ? `${row.progressMingguan.toFixed(1)}%` : "—"}
                          </span>
                        </div>

                        <div className="flex flex-wrap gap-1.5 mt-auto">
                          <span className={`inline-flex items-center rounded-md px-1.5 py-0.5 text-[10px] font-bold ${row.jumlahAMingguan > 0 ? "bg-clay-soft/80 text-clay" : "bg-paper text-ink-soft border border-line/50"}`}>
                            {row.jumlahAMingguan} A
                          </span>
                          <span className={`inline-flex items-center rounded-md px-1.5 py-0.5 text-[10px] font-bold ${row.jumlahSMingguan ? "bg-amber-soft/80 text-amber-700 dark:text-amber-400" : "bg-paper text-ink-soft border border-line/50"}`}>
                            {row.jumlahSMingguan || 0} S
                          </span>
                          <span className={`inline-flex items-center rounded-md px-1.5 py-0.5 text-[10px] font-bold ${row.jumlahIMingguan ? "bg-sky-50 dark:bg-sky-900/30 text-sky-600 dark:text-sky-400" : "bg-paper text-ink-soft border border-line/50"}`}>
                            {row.jumlahIMingguan || 0} I
                          </span>
                        </div>
                      </div>

                      {/* Bulanan */}
                      <div className="rounded-xl border border-line/50 bg-paper-raised/60 dark:bg-ink/10 p-3 flex flex-col justify-between shadow-sm">
                        <p className="text-[10px] font-bold uppercase tracking-widest text-ink-soft mb-2">Bulanan</p>
                        
                        <div className="mb-3">
                          <span className="text-3xl font-black text-teal tracking-tighter">
                            {row.progressBulanan !== null ? `${row.progressBulanan.toFixed(1)}%` : "—"}
                          </span>
                        </div>

                        <div className="flex flex-wrap gap-1.5 mt-auto">
                          <span className={`inline-flex items-center rounded-md px-1.5 py-0.5 text-[10px] font-bold ${row.jumlahABulanan > 0 ? "bg-clay-soft/80 text-clay" : "bg-paper text-ink-soft border border-line/50"}`}>
                            {row.jumlahABulanan} A
                          </span>
                          <span className={`inline-flex items-center rounded-md px-1.5 py-0.5 text-[10px] font-bold ${row.jumlahSBulanan ? "bg-amber-soft/80 text-amber-700 dark:text-amber-400" : "bg-paper text-ink-soft border border-line/50"}`}>
                            {row.jumlahSBulanan || 0} S
                          </span>
                          <span className={`inline-flex items-center rounded-md px-1.5 py-0.5 text-[10px] font-bold ${row.jumlahIBulanan ? "bg-sky-50 dark:bg-sky-900/30 text-sky-600 dark:text-sky-400" : "bg-paper text-ink-soft border border-line/50"}`}>
                            {row.jumlahIBulanan || 0} I
                          </span>
                        </div>
                      </div>

                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
