"use client";

import { useMemo, useState } from "react";
import type {
  AbsentActivityRecord,
  MonthPeriod,
  WeekPeriod,
} from "@/services/daily-activity.service";
import { SearchIcon } from "./icons";

interface DailyActivityTableProps {
  records: AbsentActivityRecord[];
  allGelaraNames: string[];
  weeks: WeekPeriod[];
  availableMonths: MonthPeriod[];
  selectedWeekId: string;
  selectedMonthId: string;
  initialDate?: string;
  initialGelara?: string;
  onFilterChange: (params: {
    weekId?: string;
    monthId?: string;
    date?: string;
    gelara?: string;
  }) => void;
}

export default function DailyActivityTable({
  records,
  allGelaraNames,
  weeks,
  availableMonths,
  selectedWeekId,
  selectedMonthId,
  initialDate = "",
  initialGelara = "",
  onFilterChange,
}: DailyActivityTableProps) {
  const [filterMode, setFilterMode] = useState<"semua" | "mingguan" | "bulanan" | "harian">(
    initialDate ? "harian" : "mingguan"
  );
  const [selectedWeek, setSelectedWeek] = useState(selectedWeekId);
  const [selectedMonth, setSelectedMonth] = useState(selectedMonthId);
  const [selectedDate, setSelectedDate] = useState(initialDate);
  const [selectedGelara, setSelectedGelara] = useState(initialGelara);
  const [activitySearch, setActivitySearch] = useState("");

  const currentWeek = weeks.find((w) => w.id === selectedWeek) || weeks[0];

  const [sYear, sMonth] = (selectedMonth || "2026-09").split("-").map(Number);
  const lastDayInMonth = sYear && sMonth ? new Date(sYear, sMonth, 0).getDate() : 30;
  const minDate = `${selectedMonth}-01`;
  const maxDate = `${selectedMonth}-${String(lastDayInMonth).padStart(2, "0")}`;

  // Client-side filtering for fast responsiveness
  const filteredRecords = useMemo(() => {
    return records.filter((rec) => {
      // 1. Filter Period / Date
      if (filterMode === "harian") {
        if (selectedDate && rec.tanggal !== selectedDate) return false;
      } else if (filterMode === "mingguan") {
        if (rec.tanggal < currentWeek.startDate || rec.tanggal > currentWeek.endDate) {
          return false;
        }
      } else if (filterMode === "bulanan") {
        if (!rec.tanggal.startsWith(selectedMonth)) return false;
      }

      // 2. Filter Gelara
      if (selectedGelara && rec.namaGelara !== selectedGelara) {
        return false;
      }

      // 3. Search Activity or Name
      if (activitySearch.trim()) {
        const q = activitySearch.toLowerCase();
        const matchesAct = rec.aktivitas.toLowerCase().includes(q);
        const matchesName = rec.namaGelara.toLowerCase().includes(q);
        if (!matchesAct && !matchesName) return false;
      }

      return true;
    });
  }, [
    records,
    filterMode,
    selectedDate,
    currentWeek,
    selectedMonth,
    selectedGelara,
    activitySearch,
  ]);

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-base font-semibold">Daftar Kegiatan yang Tidak Diikuti</h2>
            <span className="inline-flex items-center rounded-full bg-clay-soft px-2.5 py-0.5 text-xs font-semibold text-clay">
              {filteredRecords.length} Record Alpha (A)
            </span>
          </div>
          <p className="text-xs text-ink-soft mt-0.5">
            Menampilkan pelanggaran ketidakhadiran (status A) untuk penanganan pengurus.
          </p>
        </div>
      </div>

      {/* Filter Controls Bar */}
      <div className="rounded-xl border border-line bg-paper-raised p-4 space-y-3 shadow-xs">
        {/* Filter Mode Selector */}
        <div className="flex flex-wrap items-center gap-1.5 pb-2 border-b border-line">
          <span className="text-xs font-semibold text-ink-soft mr-2">Filter Periode:</span>
          <button
            type="button"
            onClick={() => {
              setFilterMode("mingguan");
              onFilterChange({ weekId: selectedWeek, monthId: selectedMonth, gelara: selectedGelara });
            }}
            className={`px-3 py-1 text-xs rounded-full font-medium transition-colors ${
              filterMode === "mingguan"
                ? "bg-teal text-paper-raised"
                : "bg-paper text-ink-soft hover:text-ink"
            }`}
          >
            Mingguan
          </button>
          <button
            type="button"
            onClick={() => {
              setFilterMode("bulanan");
              onFilterChange({ monthId: selectedMonth, gelara: selectedGelara });
            }}
            className={`px-3 py-1 text-xs rounded-full font-medium transition-colors ${
              filterMode === "bulanan"
                ? "bg-teal text-paper-raised"
                : "bg-paper text-ink-soft hover:text-ink"
            }`}
          >
            Bulanan
          </button>
          <button
            type="button"
            onClick={() => {
              setFilterMode("harian");
              if (!selectedDate) setSelectedDate(minDate);
              onFilterChange({ date: selectedDate || minDate, gelara: selectedGelara });
            }}
            className={`px-3 py-1 text-xs rounded-full font-medium transition-colors ${
              filterMode === "harian"
                ? "bg-teal text-paper-raised"
                : "bg-paper text-ink-soft hover:text-ink"
            }`}
          >
            Tanggal Harian
          </button>
          <button
            type="button"
            onClick={() => {
              setFilterMode("semua");
              onFilterChange({ gelara: selectedGelara });
            }}
            className={`px-3 py-1 text-xs rounded-full font-medium transition-colors ${
              filterMode === "semua"
                ? "bg-teal text-paper-raised"
                : "bg-paper text-ink-soft hover:text-ink"
            }`}
          >
            Semua Data
          </button>
        </div>

        {/* Dynamic Filters Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-2.5 pt-1">
          {/* Week Filter (when weekly) */}
          {filterMode === "mingguan" && (
            <div>
              <label className="block text-[11px] font-medium text-ink-soft mb-1">
                Pilih Minggu
              </label>
              <select
                value={selectedWeek}
                onChange={(e) => {
                  setSelectedWeek(e.target.value);
                  onFilterChange({
                    weekId: e.target.value,
                    monthId: selectedMonth,
                    gelara: selectedGelara,
                  });
                }}
                className="w-full rounded-lg border border-line bg-paper px-2.5 py-1.5 text-xs outline-none focus:border-teal focus:ring-1 focus:ring-teal"
              >
                {weeks.map((w) => (
                  <option key={w.id} value={w.id}>
                    {w.label}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Month Filter (when monthly) */}
          {filterMode === "bulanan" && (
            <div>
              <label className="block text-[11px] font-medium text-ink-soft mb-1">
                Pilih Bulan
              </label>
              <select
                value={selectedMonth}
                onChange={(e) => {
                  setSelectedMonth(e.target.value);
                  onFilterChange({
                    monthId: e.target.value,
                    gelara: selectedGelara,
                  });
                }}
                className="w-full rounded-lg border border-line bg-paper px-2.5 py-1.5 text-xs outline-none focus:border-teal focus:ring-1 focus:ring-teal"
              >
                {availableMonths.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.label}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Date Filter (when daily) */}
          {filterMode === "harian" && (
            <div>
              <label className="block text-[11px] font-medium text-ink-soft mb-1">
                Pilih Tanggal
              </label>
              <input
                type="date"
                value={selectedDate}
                min={minDate}
                max={maxDate}
                onChange={(e) => {
                  setSelectedDate(e.target.value);
                  onFilterChange({
                    date: e.target.value,
                    gelara: selectedGelara,
                  });
                }}
                className="w-full rounded-lg border border-line bg-paper px-2.5 py-1.5 text-xs outline-none focus:border-teal focus:ring-1 focus:ring-teal"
              />
            </div>
          )}

          {/* Gelara Filter */}
          <div>
            <label className="block text-[11px] font-medium text-ink-soft mb-1">
              Filter Nama Gelara
            </label>
            <select
              value={selectedGelara}
              onChange={(e) => {
                setSelectedGelara(e.target.value);
                onFilterChange({
                  weekId: filterMode === "mingguan" ? selectedWeek : undefined,
                  monthId: filterMode === "bulanan" ? selectedMonth : undefined,
                  date: filterMode === "harian" ? selectedDate : undefined,
                  gelara: e.target.value,
                });
              }}
              className="w-full rounded-lg border border-line bg-paper px-2.5 py-1.5 text-xs outline-none focus:border-teal focus:ring-1 focus:ring-teal"
            >
              <option value="">Semua Gelara ({allGelaraNames.length})</option>
              {allGelaraNames.map((nama) => (
                <option key={nama} value={nama}>
                  {nama}
                </option>
              ))}
            </select>
          </div>

          {/* Quick Search */}
          <div className="sm:col-span-2">
            <label className="block text-[11px] font-medium text-ink-soft mb-1">
              Cari Nama / Kegiatan
            </label>
            <div className="relative">
              <SearchIcon className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-ink-soft pointer-events-none" />
              <input
                type="text"
                value={activitySearch}
                onChange={(e) => setActivitySearch(e.target.value)}
                placeholder="Misal: 'Bangun Tidur', 'Adam', 'Piket'..."
                className="w-full rounded-lg border border-line bg-paper pl-8 pr-3 py-1.5 text-xs outline-none focus:border-teal focus:ring-1 focus:ring-teal"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Desktop / Tablet Table */}
      <div className="hidden md:block overflow-hidden rounded-xl border border-line bg-paper-raised shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-line bg-paper/60 text-xs font-semibold text-ink-soft uppercase tracking-wider">
                <th scope="col" className="px-4 py-3 w-12 text-center">No</th>
                <th scope="col" className="px-4 py-3">Tanggal</th>
                <th scope="col" className="px-4 py-3">Nama Gelara</th>
                <th scope="col" className="px-4 py-3">Kegiatan yang Tidak Diikuti</th>
                <th scope="col" className="px-4 py-3 text-center w-24">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {filteredRecords.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-4 py-10 text-center text-sm text-ink-soft">
                    <div className="max-w-sm mx-auto space-y-1">
                      <p className="font-semibold text-ink">Tidak ada catatan ketidakhadiran</p>
                      <p className="text-xs text-ink-soft">
                        Tidak ada aktivitas berstatus A pada filter yang dipilih.
                      </p>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredRecords.map((item, idx) => (
                  <tr key={item.id} className="hover:bg-paper/40 transition-colors">
                    <td className="px-4 py-3.5 text-center text-xs text-ink-soft font-medium">
                      {idx + 1}
                    </td>
                    <td className="px-4 py-3.5 text-xs font-medium text-ink whitespace-nowrap">
                      <div>
                        <span>{item.tanggalFormatted}</span>
                        <span className="block text-[11px] text-ink-soft font-normal">{item.hari}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3.5 font-medium text-ink">
                      <div className="flex items-center gap-2">
                        <span className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-teal-soft text-[11px] font-semibold text-teal">
                          {item.namaGelara.trim()?.[0]?.toUpperCase()}
                        </span>
                        <span>{item.namaGelara}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3.5 text-xs font-semibold text-ink">
                      <span className="inline-block rounded-md bg-paper border border-line px-2.5 py-1">
                        {item.aktivitas}
                      </span>
                    </td>
                    <td className="px-4 py-3.5 text-center">
                      <span className="inline-flex items-center rounded-full bg-clay-soft px-2.5 py-0.5 text-xs font-semibold text-clay">
                        Alpha (A)
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Mobile Card List */}
      <div className="md:hidden space-y-2.5">
        {filteredRecords.length === 0 ? (
          <div className="rounded-xl border border-line bg-paper-raised p-6 text-center text-sm text-ink-soft">
            Tidak ada catatan ketidakhadiran pada filter ini.
          </div>
        ) : (
          filteredRecords.map((item) => (
            <div
              key={item.id}
              className="rounded-xl border border-line bg-paper-raised p-3.5 shadow-xs space-y-2"
            >
              <div className="flex items-start justify-between gap-2">
                <div>
                  <h4 className="text-sm font-semibold leading-tight">{item.namaGelara}</h4>
                  <p className="text-[11px] text-ink-soft mt-0.5">
                    {item.hari}, {item.tanggalFormatted}
                  </p>
                </div>
                <span className="shrink-0 inline-flex items-center rounded-md bg-clay-soft px-2 py-0.5 text-xs font-semibold text-clay">
                  Status A
                </span>
              </div>
              <div className="rounded-lg bg-paper p-2 text-xs font-medium text-ink flex items-center gap-2">
                <span className="text-[10px] uppercase font-semibold text-ink-soft">Kegiatan:</span>
                <span className="font-semibold text-clay">{item.aktivitas}</span>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
