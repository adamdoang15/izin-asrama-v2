"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { BellIcon, ChevronDownIcon, SearchIcon } from "./icons";

export default function UserMenu({
  name,
  subtitle,
  showSearch,
  pengaturanHref,
  kelolaAkunHref,
  onSignOut,
}: {
  name: string;
  subtitle: string;
  showSearch: boolean;
  pengaturanHref?: string;
  kelolaAkunHref?: string;
  onSignOut: () => Promise<void>;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  const initial = name?.trim()?.[0]?.toUpperCase() ?? "?";

  return (
    <div className="flex items-center gap-2">
      {showSearch && (
        <button
          type="button"
          aria-label="Cari"
          className="grid h-9 w-9 place-items-center rounded-full text-ink-soft hover:bg-paper hover:text-ink transition-colors"
        >
          <SearchIcon className="h-[18px] w-[18px]" />
        </button>
      )}

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
          onClick={() => setOpen((v) => !v)}
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
          <div className="absolute right-0 top-full z-10 mt-2 w-52 overflow-hidden rounded-md border border-line bg-paper-raised shadow-lg">
            <div className="border-b border-line px-4 py-3 sm:hidden">
              <p className="text-sm font-medium">{name}</p>
              <p className="text-xs text-ink-soft">{subtitle}</p>
            </div>
            {pengaturanHref && (
              <Link
                href={pengaturanHref}
                className="block px-4 py-2.5 text-sm text-ink-soft hover:bg-paper hover:text-ink border-b border-line"
                onClick={() => setOpen(false)}
              >
                Pengaturan akun
              </Link>
            )}
            {kelolaAkunHref && (
              <Link
                href={kelolaAkunHref}
                className="block px-4 py-2.5 text-sm text-ink-soft hover:bg-paper hover:text-ink border-b border-line"
                onClick={() => setOpen(false)}
              >
                Kelola akun
              </Link>
            )}
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
