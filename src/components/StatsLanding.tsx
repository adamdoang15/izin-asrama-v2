"use client";

import { useMemo, useState } from "react";
import Link from "next/link";

type Period = "HARIAN" | "MINGGUAN" | "BULANAN" | "TAHUNAN";
type Row = {
  tanggal_keluar: string;
  status: string;
  returned_at: string | null;
  return_status: string | null;
};

type Bucket = { label: string; count: number };

type Props = {
  rows: Row[];
  totalSantri: number;
};

const TZ = "Asia/Jakarta";

function parts(value: string | Date) {
  const p = new Intl.DateTimeFormat("en-CA", {
    timeZone: TZ,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(new Date(value));
  return Object.fromEntries(p.filter((x) => x.type !== "literal").map((x) => [x.type, x.value]));
}

function keyOf(value: string | Date) {
  const p = parts(value);
  return `${p.year}-${p.month}-${p.day}`;
}

function monthKey(value: string | Date) {
  const p = parts(value);
  return `${p.year}-${p.month}`;
}

function yearKey(value: string | Date) {
  return parts(value).year;
}

function localDateKey(date: Date) {
  const p = parts(date);
  return `${p.year}-${p.month}-${p.day}`;
}

function startOfToday() {
  const now = new Date();
  const p = parts(now);
  return new Date(`${p.year}-${p.month}-${p.day}T00:00:00+07:00`);
}

function addDays(date: Date, amount: number) {
  const next = new Date(date);
  next.setUTCDate(next.getUTCDate() + amount);
  return next;
}

function formatShortDate(key: string) {
  const [y, m, d] = key.split("-").map(Number);
  return new Intl.DateTimeFormat("id-ID", { day: "numeric", month: "short" }).format(
    new Date(Date.UTC(y, m - 1, d, 12))
  );
}

function formatMonth(key: string) {
  const [y, m] = key.split("-").map(Number);
  return new Intl.DateTimeFormat("id-ID", { month: "short", year: "numeric" }).format(
    new Date(Date.UTC(y, m - 1, 15))
  );
}

function StatCard({ label, value, note }: { label: string; value: number; note?: string }) {
  return (
    <div className="glass-panel p-6 flex flex-col justify-between">
      <p className="text-xs font-semibold uppercase tracking-widest text-ink-soft">{label}</p>
      <div className="mt-6">
        <p className="text-4xl font-bold tracking-tighter">{value.toLocaleString("id-ID")}</p>
        {note && <p className="mt-2 text-xs text-ink-soft">{note}</p>}
      </div>
    </div>
  );
}

function Chart({ buckets }: { buckets: Bucket[] }) {
  const max = Math.max(...buckets.map((b) => b.count), 1);
  return (
    <div className="glass-panel p-8">
      <div className="mb-8 md:mb-12">
        <h2 className="text-xl font-bold tracking-tight">Tren Pengajuan</h2>
        <p className="mt-1 text-sm text-ink-soft">Distribusi volume izin berdasarkan periode berjalan.</p>
      </div>
      <div className="flex h-64 items-end gap-3 overflow-x-auto pb-4 scrollbar-none">
        {buckets.map((bucket) => {
          const height = Math.max((bucket.count / max) * 100, bucket.count ? 8 : 2);
          return (
            <div key={bucket.label} className="group flex min-w-[48px] flex-1 flex-col items-center justify-end gap-3">
              <span className="text-sm font-semibold opacity-0 transition-opacity group-hover:opacity-100">{bucket.count}</span>
              <div className="flex h-44 w-full items-end rounded-t-sm bg-teal-soft/40 backdrop-blur-sm">
                <div className="w-full rounded-t-sm bg-teal/80 transition-all duration-500 ease-out hover:bg-teal" style={{ height: `${height}%` }} />
              </div>
              <span className="max-w-[60px] truncate text-xs font-medium text-ink-soft" title={bucket.label}>{bucket.label}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default function StatsLanding({ rows }: Props) {
  const [period, setPeriod] = useState<Period>("HARIAN");

  const data = useMemo(() => {
    const today = startOfToday();
    let buckets: Bucket[] = [];

    if (period === "HARIAN") {
      buckets = Array.from({ length: 7 }, (_, i) => {
        const d = addDays(today, i - 6);
        const key = localDateKey(d);
        return { label: formatShortDate(key), count: rows.filter((r) => keyOf(r.tanggal_keluar) === key).length };
      });
    } else if (period === "MINGGUAN") {
      const p = parts(today);
      const year = Number(p.year);
      const month = Number(p.month);
      const daysInMonth = new Date(Date.UTC(year, month, 0)).getUTCDate();
      const monthLabel = new Intl.DateTimeFormat("id-ID", { month: "short" }).format(
        new Date(Date.UTC(year, month - 1, 15))
      );
      const ranges: [number, number][] = [
        [1, 7],
        [8, 14],
        [15, 21],
        [22, daysInMonth],
      ];
      buckets = ranges.map(([start, end]) => {
        const count = rows.filter((r) => {
          const rp = parts(r.tanggal_keluar);
          return (
            Number(rp.year) === year &&
            Number(rp.month) === month &&
            Number(rp.day) >= start &&
            Number(rp.day) <= end
          );
        }).length;
        return { label: `${start}-${end} ${monthLabel}`, count };
      });
    } else if (period === "BULANAN") {
      const nowParts = parts(today);
      const first = new Date(Date.UTC(Number(nowParts.year), Number(nowParts.month) - 1, 1, 12));
      buckets = Array.from({ length: 12 }, (_, i) => {
        const d = new Date(Date.UTC(first.getUTCFullYear(), first.getUTCMonth() + i - 11, 1, 12));
        const key = `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}`;
        return { label: formatMonth(key), count: rows.filter((r) => monthKey(r.tanggal_keluar) === key).length };
      });
    } else {
      const currentYear = Number(parts(today).year);
      buckets = Array.from({ length: 5 }, (_, i) => {
        const year = String(currentYear - 4 + i);
        return { label: year, count: rows.filter((r) => yearKey(r.tanggal_keluar) === year).length };
      });
    }

    const keys = period === "HARIAN"
      ? Array.from({ length: 7 }, (_, i) => localDateKey(addDays(today, i - 6)))
      : period === "BULANAN"
        ? buckets.map((_, i) => {
            const p = parts(today);
            const d = new Date(Date.UTC(Number(p.year), Number(p.month) - 1 + i - 11, 1, 12));
            return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}`;
          })
        : period === "TAHUNAN"
          ? buckets.map((b) => b.label)
          : null;

    const inPeriod = keys
      ? rows.filter((r) => {
          const key = period === "HARIAN" ? keyOf(r.tanggal_keluar) : period === "BULANAN" ? monthKey(r.tanggal_keluar) : yearKey(r.tanggal_keluar);
          return keys.includes(key);
        })
      : rows;

    if (period === "MINGGUAN") {
      const p = parts(today);
      const year = Number(p.year);
      const month = Number(p.month);
      inPeriod.splice(
        0,
        inPeriod.length,
        ...rows.filter((r) => {
          const rp = parts(r.tanggal_keluar);
          return Number(rp.year) === year && Number(rp.month) === month;
        })
      );
    }

    const approved = inPeriod.filter((r) => r.status === "DISETUJUI" || r.status === "SEDANG_KELUAR" || r.status === "SUDAH_KEMBALI").length;
    const returned = inPeriod.filter((r) => r.status === "SUDAH_KEMBALI").length;
    const active = inPeriod.filter((r) => r.status === "SEDANG_KELUAR").length;
    const rejected = inPeriod.filter((r) => r.status === "DITOLAK").length;
    const late = inPeriod.filter((r) => r.return_status === "TERLAMBAT").length;
    const total = inPeriod.length;

    return { buckets, total, approved, returned, active, rejected, late };
  }, [period, rows]);

  return (
    <main className="flex-1 relative">
      {/* Bold Hero Section */}
      <section className="mx-auto max-w-6xl px-6 pb-12 pt-20 md:pb-20 md:pt-32 relative z-10">
        <div className="max-w-4xl">
          <h1 className="text-5xl font-bold tracking-tighter md:text-7xl lg:text-8xl text-ink">
            Aktivitas Izin Asrama.
          </h1>
          <p className="mt-8 max-w-2xl text-lg font-medium leading-relaxed text-ink-soft md:text-2xl">
            Transparansi perizinan gelara secara real-time. Memantau statistik kepulangan, keterlambatan, dan mobilitas harian asrama.
          </p>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-6 pb-20 relative z-10">
        <div className="mb-8 flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
          <div className="glass-panel !rounded-2xl flex w-full max-w-full overflow-x-auto scrollbar-none md:w-fit md:inline-flex p-1.5 shadow-sm">
            {(["HARIAN", "MINGGUAN", "BULANAN", "TAHUNAN"] as Period[]).map((item) => (
              <button 
                key={item} 
                type="button" 
                onClick={() => setPeriod(item)} 
                className={`shrink-0 flex-1 md:flex-none rounded-xl px-5 py-2.5 text-xs font-bold tracking-wide uppercase transition-all duration-300 ${period === item ? "bg-ink text-paper-raised shadow-md" : "text-ink-soft hover:text-ink hover:bg-white/40"}`}
              >
                {item}
              </button>
            ))}
          </div>
        </div>

        {/* Structural Layout instead of identical cards */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-5">
          {/* Main Stat */}
          <div className="glass-panel col-span-1 md:col-span-5 p-8 md:p-10 flex flex-col justify-between">
            <div>
              <p className="text-sm font-semibold tracking-widest uppercase text-teal">Total Pengajuan</p>
              <h2 className="mt-4 text-7xl md:text-8xl font-bold tracking-tighter">{data.total.toLocaleString("id-ID")}</h2>
            </div>
            <p className="mt-16 text-sm font-medium text-ink-soft">Jumlah seluruh perizinan yang tercatat dalam sistem pada periode yang dipilih.</p>
          </div>
          
          {/* Minor Stats Grid */}
          <div className="col-span-1 md:col-span-7 grid grid-cols-2 gap-5">
            <StatCard label="Disetujui" value={data.approved} />
            <StatCard label="Sedang Keluar" value={data.active} />
            <StatCard label="Sudah Kembali" value={data.returned} />
            <StatCard label="Ditolak" value={data.rejected} />
          </div>
        </div>

        <div className="mt-5"><Chart buckets={data.buckets} /></div>

        <div className="mt-5 grid grid-cols-1 md:grid-cols-2 gap-5">
          <div className="glass-panel p-8 flex flex-col justify-center">
            <h2 className="text-xl font-bold tracking-tight">Kepatuhan Kepulangan</h2>
            <div className="mt-8 flex items-baseline gap-6">
              <div>
                <p className="text-xs font-semibold uppercase tracking-widest text-ink-soft">Tepat Waktu</p>
                <p className="mt-2 text-4xl font-bold text-sage">{Math.max(data.returned - data.late, 0).toLocaleString("id-ID")}</p>
              </div>
              <div className="h-12 w-px bg-line/50"></div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-widest text-ink-soft">Terlambat</p>
                <p className="mt-2 text-4xl font-bold text-clay">{data.late.toLocaleString("id-ID")}</p>
              </div>
            </div>
          </div>

          <div className="glass-panel p-8 flex flex-col justify-between items-start">
            <div>
              <h2 className="text-xl font-bold tracking-tight text-ink">Standar Operasional (SOP)</h2>
              <p className="mt-3 text-sm leading-relaxed text-ink-soft">
                Pelajari alur pengajuan izin, kategori izin yang diperbolehkan, serta ketentuan validasi radius kepulangan bagi seluruh gelara.
              </p>
            </div>
            <Link
              href="/panduan"
              className="mt-8 inline-flex items-center justify-center rounded-xl bg-ink px-6 py-3 text-sm font-semibold text-paper-raised transition-all hover:bg-ink-soft hover:shadow-lg hover:-translate-y-0.5"
            >
              Baca Panduan Lengkap →
            </Link>
          </div>
        </div>

        <p className="mt-12 text-center text-xs font-medium text-ink-soft opacity-70">
          Statistik diperbarui secara otomatis. Demi keamanan, data pribadi gelara tidak ditampilkan secara publik.
        </p>
      </section>
    </main>
  );
}
