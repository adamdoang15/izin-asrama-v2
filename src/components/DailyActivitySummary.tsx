"use client";

import { useMemo, useState } from "react";
import type { GelaraSummary } from "@/services/daily-activity.service";
import { SearchIcon } from "./icons";

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

  return (
    <div className="space-y-4">
      {/* Header & Search */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-base font-semibold">Ringkasan Progress Gelara</h2>
          <p className="text-xs text-ink-soft mt-0.5">
            Tingkat keikutsertaan dihitung berdasarkan aktivitas tercatat yang tidak berstatus A.
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
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-line bg-paper/60 text-xs font-semibold text-ink-soft uppercase tracking-wider">
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
                      <span className="inline-flex items-center gap-0.5 justify-center">
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
                <th scope="col" className="px-4 py-3 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {filteredSummaries.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-8 text-center text-sm text-ink-soft">
                    Tidak ada data gelara yang sesuai dengan pencarian.
                  </td>
                </tr>
              ) : (
                filteredSummaries.map((row, idx) => (
                  <tr
                    key={row.namaGelara}
                    className="hover:bg-paper/50 transition-colors group cursor-pointer"
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
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Mobile Card List */}
      <div className="md:hidden space-y-3">
        {filteredSummaries.length === 0 ? (
          <div className="rounded-xl border border-line bg-paper-raised p-6 text-center text-sm text-ink-soft">
            Tidak ada data gelara yang sesuai.
          </div>
        ) : (
          filteredSummaries.map((row, idx) => (
            <div
              key={row.namaGelara}
              onClick={() => onSelectGelara(row)}
              className="rounded-xl border border-line bg-paper-raised p-4 shadow-xs space-y-3 cursor-pointer hover:border-teal transition-colors"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-teal-soft text-xs font-semibold text-teal">
                    {row.namaGelara.trim()?.[0]?.toUpperCase()}
                  </span>
                  <div>
                    <h3 className="text-sm font-semibold leading-tight">{row.namaGelara}</h3>
                    <p className="text-[11px] text-ink-soft mt-0.5">#{idx + 1}</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onSelectGelara(row);
                  }}
                  className="text-xs font-medium text-teal hover:underline"
                >
                  Detail →
                </button>
              </div>

              <div className="grid grid-cols-2 gap-2 pt-1 border-t border-line">
                <div className="rounded-lg bg-paper p-2.5">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] uppercase font-semibold text-ink-soft">Mingguan</span>
                    <span className="text-[10px] text-clay font-medium">{row.jumlahAMingguan} A</span>
                  </div>
                  <p className="text-base font-bold text-teal mt-0.5">
                    {row.progressMingguan !== null ? `${row.progressMingguan.toFixed(1)}%` : "—"}
                  </p>
                </div>

                <div className="rounded-lg bg-paper p-2.5">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] uppercase font-semibold text-ink-soft">Bulanan</span>
                    <span className="text-[10px] text-clay font-medium">{row.jumlahABulanan} A</span>
                  </div>
                  <p className="text-base font-bold text-teal mt-0.5">
                    {row.progressBulanan !== null ? `${row.progressBulanan.toFixed(1)}%` : "—"}
                  </p>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
