"use client";

import { useActionState, useEffect, useRef } from "react";
import { changePasswordAction, type ChangePasswordActionState } from "@/app/pengaturan/actions";

const initialState: ChangePasswordActionState = {};

export default function ChangePasswordForm() {
  const [state, formAction, isPending] = useActionState(changePasswordAction, initialState);
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (state.success) {
      formRef.current?.reset();
    }
  }, [state.success]);

  return (
    <form ref={formRef} action={formAction} className="space-y-4 max-w-md">
      {state.error && (
        <div className="rounded-md bg-clay-soft border border-line p-3.5 text-sm text-clay">
          {state.error}
        </div>
      )}

      {state.success && (
        <div className="rounded-md bg-teal-soft border border-line p-3.5 text-sm text-teal">
          Kata sandi berhasil diperbarui.
        </div>
      )}

      <div>
        <label htmlFor="oldPassword" className="block text-sm font-medium text-ink mb-1.5">
          Kata sandi saat ini
        </label>
        <input
          id="oldPassword"
          name="oldPassword"
          type="password"
          required
          autoComplete="current-password"
          className="w-full rounded-md border border-line bg-paper-raised px-3.5 py-2 text-sm text-ink placeholder:text-ink-soft focus:border-teal focus:outline-none"
          placeholder="Masukkan kata sandi lama Anda"
        />
      </div>

      <div>
        <label htmlFor="newPassword" className="block text-sm font-medium text-ink mb-1.5">
          Kata sandi baru
        </label>
        <input
          id="newPassword"
          name="newPassword"
          type="password"
          required
          autoComplete="new-password"
          className="w-full rounded-md border border-line bg-paper-raised px-3.5 py-2 text-sm text-ink placeholder:text-ink-soft focus:border-teal focus:outline-none"
          placeholder="Minimal 6 karakter"
        />
      </div>

      <div>
        <label htmlFor="confirmPassword" className="block text-sm font-medium text-ink mb-1.5">
          Konfirmasi kata sandi baru
        </label>
        <input
          id="confirmPassword"
          name="confirmPassword"
          type="password"
          required
          autoComplete="new-password"
          className="w-full rounded-md border border-line bg-paper-raised px-3.5 py-2 text-sm text-ink placeholder:text-ink-soft focus:border-teal focus:outline-none"
          placeholder="Ulangi kata sandi baru"
        />
      </div>

      <button
        type="submit"
        disabled={isPending}
        className="rounded-md bg-teal px-5 py-2.5 text-sm font-medium text-paper-raised hover:bg-teal/90 transition-colors disabled:opacity-50"
      >
        {isPending ? "Menyimpan..." : "Simpan Kata Sandi"}
      </button>
    </form>
  );
}
