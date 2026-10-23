"use client";

import Image from "next/image";
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
    <main className="flex-1 flex items-center justify-center p-3 sm:p-6 md:p-10 relative z-10 min-h-[90vh]">
      <div className="w-full max-w-5xl rounded-2xl sm:rounded-3xl overflow-hidden glass-panel shadow-2xl grid grid-cols-1 md:grid-cols-12 border border-white/50 dark:border-white/10">

        {/* Sisi Kiri: Visual Hero dengan Foto Asrama & Overlay (Compact di Mobile) */}
        <div className="md:col-span-6 lg:col-span-7 relative flex flex-col justify-between p-6 sm:p-8 md:p-12 overflow-hidden h-44 sm:h-56 md:h-auto md:min-h-[580px] text-white">
          {/* Foto Asrama sebagai Background */}
          <Image
            src="/asrama-hero.jpg"
            alt="Gedung Asrama"
            fill
            priority
            className="object-cover object-center scale-105"
          />

          {/* Dark & Glassmorphism Overlay */}
          <div className="absolute inset-0 bg-gradient-to-tr from-[#0a1e2b]/95 via-[#0e2a3b]/85 to-[#164850]/75 backdrop-blur-[2px]" />

          {/* Soft Blur Ornaments */}
          <div className="absolute -top-12 -left-12 w-48 h-48 bg-teal/30 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute -bottom-12 right-12 w-56 h-56 bg-amber/20 rounded-full blur-3xl pointer-events-none" />

          {/* Konten Utama Sisi Kiri */}
          <div className="relative z-10 my-auto py-2 md:py-8">
            <h1 className="text-2xl sm:text-3xl md:text-5xl font-extrabold tracking-tight text-white drop-shadow-md leading-tight">
              Hola! Selamat Datang Kembali
            </h1>
            <p className="mt-2 text-xs sm:text-sm md:text-base text-white/80 max-w-md leading-relaxed font-light hidden md:block">
              Kelola dan pantau perizinan abang/kakak secara praktis, tertib, dan transparan dalam satu sistem.
            </p>
          </div>

          {/* Footer Sisi Kiri (Hanya Desktop) */}
          <div className="relative z-10 pt-4 border-t border-white/15 items-center justify-between text-xs text-white/60 hidden md:flex">
            <span>copyright © {new Date().getFullYear()}</span>
            <span>Kegelaraan</span>
          </div>
        </div>

        {/* Sisi Kanan: Form Login (Glassmorphism Card) */}
        <div className="md:col-span-6 lg:col-span-5 flex flex-col justify-center p-5 sm:p-8 md:p-12 relative z-10 bg-paper-raised/85 dark:bg-paper-raised/70 backdrop-blur-xl">
          <div className="mb-5 md:mb-8 text-center md:text-left">
            <h2 className="text-xl sm:text-2xl md:text-3xl font-extrabold tracking-tight text-ink">
              MASUK
            </h2>
            <p className="mt-1 text-xs text-ink-soft">
              Silakan masukkan username dan password abang/kakak untuk masuk.
            </p>
          </div>

          <form action={formAction} className="space-y-4 md:space-y-5">
            {/* Field Username dengan Ikon */}
            <div className="space-y-1.5">
              <label
                htmlFor="username"
                className="block text-[11px] font-bold uppercase tracking-wider text-ink-soft"
              >
                Username
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-ink-soft">
                  <svg
                    className="w-4 h-4 opacity-75"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                    />
                  </svg>
                </span>
                <input
                  id="username"
                  name="username"
                  type="text"
                  autoComplete="username"
                  required
                  placeholder="Masukkan username"
                  className="w-full rounded-xl border border-line bg-paper/60 dark:bg-ink/10 pl-10 pr-4 py-3 text-base md:text-sm font-medium text-ink outline-none focus:border-ink dark:focus:border-teal focus:ring-1 focus:ring-ink dark:focus:ring-teal/50 transition-all placeholder:text-ink-soft/40"
                />
              </div>
            </div>

            {/* Field Password dengan Ikon */}
            <div className="space-y-1.5">
              <label
                htmlFor="password"
                className="block text-[11px] font-bold uppercase tracking-wider text-ink-soft"
              >
                Password
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-ink-soft">
                  <svg
                    className="w-4 h-4 opacity-75"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    viewBox="0 0 24 24"
                  >
                    <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M7 11V7a5 5 0 0110 0v4"
                    />
                  </svg>
                </span>
                <input
                  id="password"
                  name="password"
                  type="password"
                  autoComplete="current-password"
                  required
                  placeholder="Masukkan kata sandi"
                  className="w-full rounded-xl border border-line bg-paper/60 dark:bg-ink/10 pl-10 pr-4 py-3 text-base md:text-sm font-medium text-ink outline-none focus:border-ink dark:focus:border-teal focus:ring-1 focus:ring-ink dark:focus:ring-teal/50 transition-all placeholder:text-ink-soft/40"
                />
              </div>
            </div>

            {/* Error Message */}
            {state.error && (
              <div className="bg-clay-soft/90 border border-clay/30 rounded-xl p-3 backdrop-blur-sm animate-in fade-in zoom-in-95 duration-200">
                <p
                  className="text-xs font-semibold tracking-wide text-clay text-center"
                  role="alert"
                >
                  {state.error}
                </p>
              </div>
            )}

            {/* Tombol Log In */}
            <button
              type="submit"
              disabled={pending}
              className="w-full rounded-xl bg-[#0c2438] hover:bg-[#123650] dark:bg-teal dark:hover:bg-teal-hover px-4 py-3.5 text-sm font-bold tracking-wider text-white disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-md hover:shadow-lg active:scale-[0.99] cursor-pointer mt-1"
            >
              {pending ? "Memverifikasi..." : "Log In"}
            </button>
          </form>

          {/* Navigasi Pembantu & Footer Mobile */}
          <div className="mt-6 md:mt-8 pt-4 md:pt-5 border-t border-line/60 text-center space-y-2">
            <div>
              <Link
                href="/"
                className="inline-flex items-center gap-1.5 text-xs font-semibold text-ink-soft hover:text-ink dark:hover:text-white transition-colors"
              >
                <span>←</span> Kembali ke Statistik Publik
              </Link>
            </div>
            <p className="text-[11px] text-ink-soft/60 font-medium md:hidden">
              copyright © {new Date().getFullYear()} Kegelaraan
            </p>
          </div>
        </div>

      </div>
    </main>
  );
}
