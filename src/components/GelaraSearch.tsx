"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useRef, useTransition } from "react";
import { SearchIcon } from "./icons";

export default function GelaraSearch() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const inputRef = useRef<HTMLInputElement>(null);
  const [, startTransition] = useTransition();

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const q = inputRef.current?.value.trim() ?? "";
    const params = new URLSearchParams(searchParams.toString());
    if (q) params.set("q", q);
    else params.delete("q");
    startTransition(() => router.push(`/kelola-akun?${params.toString()}`));
  }

  function handleClear() {
    if (inputRef.current) inputRef.current.value = "";
    const params = new URLSearchParams(searchParams.toString());
    params.delete("q");
    startTransition(() => router.push(`/kelola-akun?${params.toString()}`));
  }

  const currentQ = searchParams.get("q") ?? "";

  return (
    <form onSubmit={handleSubmit} className="flex items-center gap-2">
      <div className="relative flex-1">
        <SearchIcon className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-soft" />
        <input
          ref={inputRef}
          type="search"
          name="q"
          defaultValue={currentQ}
          placeholder="Cari nama gelara..."
          className="w-full rounded-md border border-line bg-paper-raised py-2 pl-9 pr-3 text-sm outline-none focus:border-teal focus:ring-1 focus:ring-teal"
        />
      </div>
      <button
        type="submit"
        className="rounded-md bg-teal px-4 py-2 text-sm font-medium text-paper-raised hover:opacity-90 transition-opacity"
      >
        Cari
      </button>
      {currentQ && (
        <button
          type="button"
          onClick={handleClear}
          className="text-sm text-ink-soft hover:text-ink"
        >
          Reset
        </button>
      )}
    </form>
  );
}