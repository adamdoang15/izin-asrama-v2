"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import {
  createAccountAction,
  type AccountActionState,
} from "@/app/kelola-akun/actions";

const initialState: AccountActionState = {};

export default function AccountForm() {
  const [state, formAction, pending] = useActionState(
    createAccountAction,
    initialState
  );
  const [role, setRole] = useState<"SANTRI" | "PENGURUS">("SANTRI");
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (state.success) {
      formRef.current?.reset();
      setRole("SANTRI");
    }
  }, [state.success]);

  return (
    <form
      ref={formRef}
      action={formAction}
      className="rounded-md border border-line bg-paper-raised p-4 space-y-4"
    >
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <label htmlFor="name" className="block text-sm font-medium">
            Nama lengkap
          </label>
          <input
            id="name"
            name="name"
            type="text"
            required
            className="w-full rounded-md border border-line bg-paper px-3 py-2 text-sm outline-none focus:border-teal focus:ring-1 focus:ring-teal transition-colors"
          />
        </div>

        <div className="space-y-1.5">
          <label htmlFor="role" className="block text-sm font-medium">
            Peran
          </label>
          <select
            id="role"
            name="role"
            value={role}
            onChange={(e) => setRole(e.target.value as "SANTRI" | "PENGURUS")}
            className="w-full rounded-md border border-line bg-paper px-3 py-2 text-sm outline-none focus:border-teal focus:ring-1 focus:ring-teal transition-colors"
          >
            <option value="SANTRI">Gelara</option>
            <option value="PENGURUS">Mentor</option>
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <label htmlFor="username" className="block text-sm font-medium">
            Username
          </label>
          <input
            id="username"
            name="username"
            type="text"
            required
            placeholder="tanpa spasi"
            className="w-full rounded-md border border-line bg-paper px-3 py-2 text-sm outline-none focus:border-teal focus:ring-1 focus:ring-teal transition-colors"
          />
        </div>

        <div className="space-y-1.5">
          <label htmlFor="password" className="block text-sm font-medium">
            Kata sandi awal
          </label>
          <input
            id="password"
            name="password"
            type="password"
            autoComplete="new-password"
            required
            minLength={6}
            placeholder="minimal 6 karakter"
            className="w-full rounded-md border border-line bg-paper px-3 py-2 text-sm outline-none focus:border-teal focus:ring-1 focus:ring-teal transition-colors"
          />
        </div>
      </div>

      {role === "SANTRI" && (
        <div className="space-y-1.5">
          <label htmlFor="kamar" className="block text-sm font-medium">
             Kamar
          </label>
          <input
            id="kamar"
            name="kamar"
            type="text"
            placeholder="Contoh: Kamar 8 Putra"
            className="w-full rounded-md border border-line bg-paper px-3 py-2 text-sm outline-none focus:border-teal focus:ring-1 focus:ring-teal transition-colors"
          />
        </div>
      )}

      {state.error && (
        <p className="text-sm text-clay" role="alert">
          {state.error}
        </p>
      )}
      {state.success && (
        <p className="text-sm text-sage" role="status">
          Akun berhasil dibuat.
        </p>
      )}

      <button
        type="submit"
        disabled={pending}
        className="rounded-md bg-teal px-4 py-2.5 text-sm font-medium text-paper-raised hover:opacity-90 disabled:opacity-60 transition-opacity"
      >
        {pending ? "Menyimpan..." : "Tambah akun"}
      </button>
    </form>
  );
}
