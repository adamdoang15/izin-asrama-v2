"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { BellIcon, CalendarActivityIcon, ChevronDownIcon, DashboardIcon, UsersIcon } from "./icons";
import ThemeToggle from "./ThemeToggle";

function DownloadIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} className={className}>
      <path d="M12 3v13M7 11l5 5 5-5" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M4 20h16" strokeLinecap="round" />
    </svg>
  );
}

function ExportPanel({ onClose }: { onClose: () => void }) {
  return (
    <div className="border-t border-line px-4 py-3 space-y-3">
      <p className="text-xs font-semibold text-ink-soft uppercase tracking-wide">Ekspor laporan</p>
      <form
        method="get"
        action="/api/laporan/export"
        target="_blank"
        onSubmit={onClose}
        className="space-y-2"
      >
        <div className="grid grid-cols-2 gap-2">
          <div className="space-y-1">
            <label className="block text-xs font-medium" htmlFor="em-start">Dari</label>
            <input
              id="em-start"
              type="date"
              name="start"
              className="w-full rounded-md border border-line bg-paper px-2 py-1.5 text-xs outline-none focus:border-teal focus:ring-1 focus:ring-teal"
            />
          </div>
          <div className="space-y-1">
            <label className="block text-xs font-medium" htmlFor="em-end">Sampai</label>
            <input
              id="em-end"
              type="date"
              name="end"
              className="w-full rounded-md border border-line bg-paper px-2 py-1.5 text-xs outline-none focus:border-teal focus:ring-1 focus:ring-teal"
            />
          </div>
        </div>
        <select
          name="status"
          className="w-full rounded-md border border-line bg-paper px-2 py-1.5 text-xs outline-none focus:border-teal focus:ring-1 focus:ring-teal"
        >
          <option value="">Semua status</option>
          <option value="MENUNGGU">Menunggu</option>
          <option value="DISETUJUI">Disetujui</option>
          <option value="SEDANG_KELUAR">Sedang keluar</option>
          <option value="SUDAH_KEMBALI">Sudah kembali</option>
          <option value="DITOLAK">Ditolak</option>
          <option value="DIHAPUS">Dihapus</option>
        </select>
        <select
          name="jenis"
          className="w-full rounded-md border border-line bg-paper px-2 py-1.5 text-xs outline-none focus:border-teal focus:ring-1 focus:ring-teal"
        >
          <option value="">Semua jenis</option>
          <option value="HARIAN">Izin harian</option>
          <option value="MENGINAP">Izin menginap</option>
          <option value="REKREASI">Rekreasi</option>
          <option value="KELUARGA">Keperluan keluarga</option>
          <option value="DARURAT">Darurat</option>
        </select>
        <button
          type="submit"
          className="w-full rounded-md bg-teal px-3 py-1.5 text-xs font-medium text-paper-raised hover:opacity-90 transition-opacity"
        >
          ↓ Ekspor Excel
        </button>
      </form>
    </div>
  );
}

export default function UserMenu({
  name,
  subtitle,
  pengaturanHref,
  berandaHref,
  dailyActivityHref,
  kelolaAkunHref,
  showEkspor,
  onSignOut,
}: {
  name: string;
  subtitle: string;
  pengaturanHref?: string;
  berandaHref?: string;
  dailyActivityHref?: string;
  kelolaAkunHref?: string;
  showEkspor?: boolean;
  onSignOut: () => Promise<void>;
}) {
  const [open, setOpen] = useState(false);
  const [eksporOpen, setEksporOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
        setEksporOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  const initial = name?.trim()?.[0]?.toUpperCase() ?? "?";

  function closeAll() {
    setOpen(false);
    setEksporOpen(false);
  }

  return (
    <div className="flex items-center gap-2">
      <ThemeToggle />

      <button
        type="button"
        aria-label="Notifikasi"
        className="grid h-9 w-9 place-items-center rounded-full text-ink-soft hover:bg-paper hover:text-ink transition-colors"
      >
        <BellIcon className="h-[18px] w-[18px]" />
      </button>

      <div className="relative" ref={ref}>
        <button
          type="button"
          onClick={() => { setOpen((v) => !v); setEksporOpen(false); }}
          className="flex items-center gap-2 rounded-full py-1 pl-1 pr-2 hover:bg-paper transition-colors"
        >
          <span className="grid h-8 w-8 place-items-center rounded-full bg-teal-soft text-sm font-semibold text-teal">
            {initial}
          </span>
          <span className="hidden text-left sm:block">
            <span className="block text-sm font-medium leading-tight">{name}</span>
            <span className="block text-xs leading-tight text-ink-soft">{subtitle}</span>
          </span>
          <ChevronDownIcon
            className={`h-4 w-4 text-ink-soft transition-transform ${open ? "rotate-180" : ""}`}
          />
        </button>

        {open && (
          <div className="absolute right-0 top-full z-10 mt-2 w-60 overflow-hidden rounded-md border border-line bg-paper-raised shadow-lg">
            {/* Identity (mobile only) */}
            <div className="border-b border-line px-4 py-3 sm:hidden">
              <p className="text-sm font-medium">{name}</p>
              <p className="text-xs text-ink-soft">{subtitle}</p>
            </div>

            {/* Beranda */}
            {berandaHref && (
              <Link
                href={berandaHref}
                className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-ink-soft hover:bg-paper hover:text-ink border-b border-line"
                onClick={closeAll}
              >
                <DashboardIcon className="h-4 w-4 shrink-0" />
                Beranda
              </Link>
            )}

            {/* Daily Activity */}
            {dailyActivityHref && (
              <Link
                href={dailyActivityHref}
                className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-ink-soft hover:bg-paper hover:text-ink border-b border-line"
                onClick={closeAll}
              >
                <CalendarActivityIcon className="h-4 w-4 shrink-0" />
                Daily Activity
              </Link>
            )}

            {/* Kelola akun */}
            {kelolaAkunHref && (
              <Link
                href={kelolaAkunHref}
                className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-ink-soft hover:bg-paper hover:text-ink border-b border-line"
                onClick={closeAll}
              >
                <UsersIcon className="h-4 w-4 shrink-0" />
                Kelola akun
              </Link>
            )}

            {/* Pengaturan akun */}
            {pengaturanHref && (
              <Link
                href={pengaturanHref}
                className="block px-4 py-2.5 text-sm text-ink-soft hover:bg-paper hover:text-ink border-b border-line"
                onClick={closeAll}
              >
                Pengaturan akun
              </Link>
            )}

            {/* Ekspor laporan */}
            {showEkspor && (
              <>
                <button
                  type="button"
                  onClick={() => setEksporOpen((v) => !v)}
                  className="flex w-full items-center gap-2.5 border-b border-line px-4 py-2.5 text-sm text-ink-soft hover:bg-paper hover:text-ink"
                >
                  <DownloadIcon className="h-4 w-4 shrink-0" />
                  <span className="flex-1 text-left">Ekspor laporan</span>
                  <ChevronDownIcon
                    className={`h-3.5 w-3.5 transition-transform ${eksporOpen ? "rotate-180" : ""}`}
                  />
                </button>
                {eksporOpen && <ExportPanel onClose={closeAll} />}
              </>
            )}

            {/* Keluar */}
            <form action={onSignOut}>
              <button
                type="submit"
                className="block w-full px-4 py-2.5 text-left text-sm text-clay hover:bg-clay-soft"
              >
                Keluar
              </button>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}
