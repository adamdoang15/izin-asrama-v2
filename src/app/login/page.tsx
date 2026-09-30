"use client";

import Link from "next/link";
import { useActionState } from "react";
import { loginAction, type LoginState } from "./actions";

const initialState: LoginState = {};

export default function LoginPage() {
  const [state, formAction, pending] = useActionState(
    loginAction,
    initialState
  );

  return (
    <main className="flex-1 flex items-center justify-center px-6 py-16 relative z-10 min-h-[85vh]">
      <div className="w-full max-w-md glass-panel p-10 md:p-14 relative overflow-hidden shadow-xl">
        {/* Subtle blur decoration inside the glass panel - adjusted for light mode contrast */}
        <div className="absolute -top-16 -right-16 w-48 h-48 bg-teal/10 dark:bg-teal-soft/20 rounded-full blur-2xl pointer-events-none"></div>
        
        <div className="mb-10 relative z-10">
          <h1 className="text-4xl md:text-5xl font-bold tracking-tighter text-ink">
            Masuk.
          </h1>
          <p className="mt-3 text-sm font-medium text-ink-soft leading-relaxed max-w-[280px]">
            Otentikasi akses untuk mengelola atau mengajukan perizinan asrama.
          </p>
        </div>

        <form action={formAction} className="space-y-6 relative z-10">
          <div className="space-y-2">
            <label
              htmlFor="username"
              className="block text-[10px] font-bold uppercase tracking-widest text-ink-soft"
            >
              Username
            </label>
            <input
              id="username"
              name="username"
              type="text"
              autoComplete="username"
              required
              className="w-full rounded-xl border border-ink/20 dark:border-line bg-paper-raised dark:bg-ink/10 px-4 py-3.5 text-sm font-medium text-ink outline-none focus:border-ink dark:focus:border-teal focus:ring-1 focus:ring-ink dark:focus:ring-teal/50 transition-all placeholder:text-ink-soft/50"
              placeholder="id_pengguna"
            />
          </div>

          <div className="space-y-2">
            <label
              htmlFor="password"
              className="block text-[10px] font-bold uppercase tracking-widest text-ink-soft"
            >
              Kata sandi
            </label>
            <input
              id="password"
              name="password"
              type="password"
              autoComplete="current-password"
              required
              className="w-full rounded-xl border border-ink/20 dark:border-line bg-paper-raised dark:bg-ink/10 px-4 py-3.5 text-sm font-medium text-ink outline-none focus:border-ink dark:focus:border-teal focus:ring-1 focus:ring-ink dark:focus:ring-teal/50 transition-all placeholder:text-ink-soft/50"
              placeholder="••••••••"
            />
          </div>

          {state.error && (
            <div className="bg-clay-soft/80 border border-clay/30 rounded-lg p-3 backdrop-blur-sm animate-in fade-in zoom-in-95 duration-200">
              <p className="text-xs font-bold tracking-wide text-clay text-center" role="alert">
                {state.error}
              </p>
            </div>
          )}

          <button
            type="submit"
            disabled={pending}
            className="w-full rounded-xl bg-ink px-4 py-3.5 text-sm font-bold tracking-wide text-paper-raised hover:bg-ink-soft disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-md hover:shadow-lg active:scale-[0.98]"
          >
            {pending ? "Memverifikasi..." : "Lanjutkan"}
          </button>
        </form>

        <div className="mt-10 pt-6 border-t border-line/50 text-center relative z-10">
          <Link
            href="/"
            className="inline-block text-[10px] font-bold uppercase tracking-widest text-ink-soft hover:text-ink transition-colors"
          >
            ← Kembali ke Statistik Publik
          </Link>
        </div>
      </div>
    </main>
  );
}
