"use client";

import { useEffect } from "react";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[Error Boundary]", error);
  }, [error]);

  return (
    <main className="flex-1 flex flex-col items-center justify-center min-h-[60vh] px-6 py-16 text-center">
      <div className="rounded-xl border border-line bg-paper-raised p-8 max-w-md w-full shadow-xs space-y-4">
        <div className="grid h-14 w-14 place-items-center rounded-full bg-clay-soft mx-auto">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="h-7 w-7 text-clay">
            <path d="M12 9v4m0 4h.01M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>
        <h1 className="text-lg font-bold text-ink">Terjadi Kesalahan</h1>
        <p className="text-sm text-ink-soft">
          Maaf, terjadi kesalahan yang tidak terduga. Silakan coba muat ulang halaman.
        </p>
        {error.digest && (
          <p className="text-xs text-ink-soft/60 font-mono">
            Kode: {error.digest}
          </p>
        )}
        <button
          onClick={reset}
          className="inline-flex items-center gap-2 rounded-lg bg-teal px-5 py-2.5 text-sm font-semibold text-white hover:opacity-90 transition-opacity"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="h-4 w-4">
            <path d="M4 4v5h5M20 20v-5h-5M20.49 9A9 9 0 0 0 5.64 5.64L4 4m16 16-1.64-1.64A9 9 0 0 1 3.51 15" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          Coba Lagi
        </button>
      </div>
    </main>
  );
}
