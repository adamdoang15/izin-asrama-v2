"use client";

import { useMemo, useState } from "react";

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
    <div className="rounded-2xl border border-line bg-paper-raised p-5 shadow-sm">
      <p className="text-sm text-ink-soft">{label}</p>
      <p className="mt-2 text-3xl font-semibold tracking-tight">{value.toLocaleString("id-ID")}</p>
      {note && <p className="mt-1 text-xs text-ink-soft">{note}</p>}
    </div>
  );
}

function Chart({ buckets }: { buckets: Bucket[] }) {
  const max = Math.max(...buckets.map((b) => b.count), 1);
  return (
    <div className="rounded-2xl border border-line bg-paper-raised p-5 shadow-sm">
      <div className="mb-5 flex items-end justify-between gap-4">
        <div>
          <h2 className="font-semibold">Tren pengajuan izin</h2>
          <p className="mt-1 text-xs text-ink-soft">Jumlah pengajuan berdasarkan waktu keluar.</p>
        </div>
      </div>
      <div className="flex h-56 items-end gap-2 overflow-x-auto pb-7">
        {buckets.map((bucket) => {
          const height = Math.max((bucket.count / max) * 100, bucket.count ? 8 : 2);
          return (
            <div key={bucket.label} className="flex min-w-[38px] flex-1 flex-col items-center justify-end gap-2">
              <span className="text-xs font-medium">{bucket.count}</span>
              <div className="flex h-36 w-full items-end rounded-lg bg-teal-soft">
                <div className="w-full rounded-lg bg-teal transition-all" style={{ height: `${height}%` }} />
              </div>
              <span className="max-w-[54px] truncate text-[10px] text-ink-soft" title={bucket.label}>{bucket.label}</span>
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
    <main className="flex-1">
      <section className="border-b border-line bg-paper-raised">
        <div className="mx-auto max-w-6xl px-6 pb-12 pt-8 md:pb-16 md:pt-12">
          <div className="flex flex-col gap-7 md:flex-row md:items-end md:justify-between">
            <div className="max-w-2xl">
              <p className="text-sm font-medium text-teal">Sistem Perizinan Asrama</p>
              <h1 className="mt-2 text-3xl font-semibold tracking-tight md:text-5xl">Aktivitas izin asrama TA 2026/2027.</h1>
              <p className="mt-4 max-w-xl text-sm leading-6 text-ink-soft md:text-base">Halaman publik untuk melihat statistik pengajuan izin harian, mingguan, bulanan, dan tahunan tanpa menampilkan data pribadi gelara.</p>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-6 py-8 md:py-10">
        <div className="mb-5 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div><h2 className="text-lg font-semibold">Statistik izin</h2><p className="mt-1 text-sm text-ink-soft">Pilih rentang waktu yang ingin dipantau.</p></div>
          <div className="inline-flex w-fit rounded-xl border border-line bg-paper-raised p-1">
            {(["HARIAN", "MINGGUAN", "BULANAN", "TAHUNAN"] as Period[]).map((item) => (
              <button key={item} type="button" onClick={() => setPeriod(item)} className={`rounded-lg px-3 py-2 text-xs font-medium transition-colors ${period === item ? "bg-teal text-paper-raised" : "text-ink-soft hover:text-ink"}`}>
                {item[0] + item.slice(1).toLowerCase()}
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-5 [&>:last-child]:col-span-2 sm:[&>:last-child]:col-span-1 md:[&>:last-child]:col-span-1">
          <StatCard label="Total izin" value={data.total} />
          <StatCard label="Disetujui" value={data.approved} />
          <StatCard label="Sedang keluar" value={data.active} />
          <StatCard label="Sudah kembali" value={data.returned} />
          <StatCard label="Ditolak" value={data.rejected} />
        </div>

        <div className="mt-5"><Chart buckets={data.buckets} /></div>

        <div className="mt-5 rounded-2xl border border-line bg-paper-raised p-5 shadow-sm">
          <h2 className="font-semibold">Indikator kepulangan</h2>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            <div className="rounded-xl bg-sage-soft p-4"><p className="text-xs text-ink-soft">Tepat waktu</p><p className="mt-1 text-xl font-semibold text-sage">{Math.max(data.returned - data.late, 0).toLocaleString("id-ID")}</p></div>
            <div className="rounded-xl bg-clay-soft p-4"><p className="text-xs text-ink-soft">Terlambat</p><p className="mt-1 text-xl font-semibold text-clay">{data.late.toLocaleString("id-ID")}</p></div>
          </div>
        </div>

        <p className="mt-6 text-center text-xs text-ink-soft">Statistik diperbarui saat halaman dimuat. Data pribadi gelara tidak ditampilkan pada halaman publik.</p>
      </section>
    </main>
  );
}
