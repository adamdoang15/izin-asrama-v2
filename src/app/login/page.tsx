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
    <main className="flex-1 flex items-center justify-center px-6 py-16">
      <div className="w-full max-w-sm">
        <div className="mb-8">
          <Link
            href="/"
            className="text-xl font-semibold tracking-tight hover:opacity-80 transition-opacity"
          >
            Izin Asrama
          </Link>
          <p className="mt-1.5 text-sm text-ink-soft leading-relaxed">
            Masuk untuk mengajukan atau meninjau izin keluar lingkungan
            asrama.
          </p>
        </div>

        <form action={formAction} className="space-y-4">
          <div className="space-y-1.5">
            <label
              htmlFor="username"
              className="block text-sm font-medium text-ink"
            >
              Username
            </label>
            <input
              id="username"
              name="username"
              type="text"
              autoComplete="username"
              required
              className="w-full rounded-md border border-line bg-paper-raised px-3 py-2 text-sm outline-none focus:border-teal focus:ring-1 focus:ring-teal transition-colors"
              placeholder="Huruf kecil, tanpa spasi"
            />
          </div>

          <div className="space-y-1.5">
            <label
              htmlFor="password"
              className="block text-sm font-medium text-ink"
            >
              Kata sandi
            </label>
            <input
              id="password"
              name="password"
              type="password"
              autoComplete="current-password"
              required
              className="w-full rounded-md border border-line bg-paper-raised px-3 py-2 text-sm outline-none focus:border-teal focus:ring-1 focus:ring-teal transition-colors"
              placeholder="••••••••"
            />
          </div>

          {state.error && (
            <p className="text-sm text-clay" role="alert">
              {state.error}
            </p>
          )}

          <button
            type="submit"
            disabled={pending}
            className="w-full rounded-md bg-teal px-4 py-2.5 text-sm font-medium text-paper-raised hover:opacity-90 disabled:opacity-60 transition-opacity"
          >
            {pending ? "Memproses..." : "Masuk"}
          </button>
        </form>

        <Link
          href="/"
          className="mt-6 inline-block text-sm text-ink-soft hover:text-ink transition-colors"
        >
          ← Kembali ke beranda
        </Link>
      </div>
    </main>
  );
}
