"use client";

import { useActionState, useState } from "react";
import {
  updateAccountAction,
  toggleAccountAction,
  toggleBlacklistAction,
  type AccountActionState,
} from "@/app/kelola-akun/actions";
import type { UserRow } from "@/lib/types";

const initialState: AccountActionState = {};

export default function AccountRow({ account, isSelf }: { account: UserRow; isSelf: boolean }) {
  const [editing, setEditing] = useState(false);
  const [showBlacklistForm, setShowBlacklistForm] = useState(false);
  const [updateState, updateAction, updatePending] = useActionState(updateAccountAction, initialState);
  const [toggleState, toggleAction, togglePending] = useActionState(toggleAccountAction, initialState);
  const [blacklistState, blacklistAction, blacklistPending] = useActionState(toggleBlacklistAction, initialState);

  return (
    <li className={`rounded-md border border-line bg-paper-raised px-4 py-3.5 ${!account.is_active ? "opacity-60" : ""}`}>
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <p className="text-sm font-medium truncate">
              {account.name}
              {isSelf && <span className="ml-1.5 text-xs text-ink-soft">(kamu)</span>}
            </p>
            {account.is_blacklisted && (
              <span className="inline-flex items-center rounded-full bg-clay/10 px-2 py-0.5 text-xs font-medium text-clay border border-clay/20">
                Diblacklist
              </span>
            )}
          </div>
          <p className="text-sm text-ink-soft mt-0.5">
            @{account.username}
            {account.kamar ? ` · ${account.kamar}` : ""}
          </p>
          <div className="flex items-center gap-3 text-xs mt-1">
            <span className={account.is_active ? "text-sage" : "text-clay"}>
              {account.is_active ? "Aktif" : "Nonaktif"}
            </span>
          </div>
          {account.is_blacklisted && account.blacklist_reason && (
            <p className="text-xs text-clay mt-1.5 bg-clay/5 p-2 rounded border border-clay/10">
              <span className="font-semibold">Alasan blacklist:</span> {account.blacklist_reason}
            </p>
          )}
        </div>
        <button
          type="button"
          onClick={() => setEditing((v) => !v)}
          className="text-sm text-teal shrink-0 hover:underline"
        >
          {editing ? "Tutup" : "Edit"}
        </button>
      </div>

      {editing && (
        <div className="mt-3.5 pt-3.5 border-t border-line space-y-4">
          <form action={updateAction} className="space-y-3">
            <input type="hidden" name="id" value={account.id} />
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label className="block text-sm font-medium">Nama</label>
                <input
                  name="name"
                  defaultValue={account.name}
                  required
                  className="w-full rounded-md border border-line bg-paper px-3 py-2 text-sm"
                />
              </div>
              {account.role === "SANTRI" && (
                <div className="space-y-1.5">
                  <label className="block text-sm font-medium">Kamar</label>
                  <input
                    name="kamar"
                    defaultValue={account.kamar ?? ""}
                    className="w-full rounded-md border border-line bg-paper px-3 py-2 text-sm"
                  />
                </div>
              )}
            </div>
            <div className="space-y-1.5">
              <label className="block text-sm font-medium">
                Kata sandi baru <span className="text-ink-soft font-normal">(opsional)</span>
              </label>
              <input
                name="password"
                type="password"
                minLength={6}
                autoComplete="new-password"
                placeholder="minimal 6 karakter"
                className="w-full rounded-md border border-line bg-paper px-3 py-2 text-sm"
              />
            </div>
            {updateState.error && <p className="text-sm text-clay">{updateState.error}</p>}
            {updateState.success && <p className="text-sm text-sage">Perubahan disimpan.</p>}
            <button
              disabled={updatePending}
              className="rounded-md bg-teal px-3.5 py-1.5 text-sm font-medium text-paper-raised disabled:opacity-60"
            >
              {updatePending ? "Menyimpan..." : "Simpan"}
            </button>
          </form>

          {!isSelf && (
            <div className="pt-2 border-t border-line/50 space-y-3">
              <form action={toggleAction}>
                <input type="hidden" name="id" value={account.id} />
                <input type="hidden" name="active" value={String(account.is_active)} />
                <button
                  disabled={togglePending}
                  className={`text-sm ${account.is_active ? "text-clay" : "text-teal"}`}
                >
                  {togglePending ? "Memproses..." : account.is_active ? "Nonaktifkan akun" : "Aktifkan akun"}
                </button>
                {toggleState.error && <p className="text-sm text-clay mt-1">{toggleState.error}</p>}
              </form>

              {account.role === "SANTRI" && (
                <div>
                  {account.is_blacklisted ? (
                    <form action={blacklistAction} className="pt-1">
                      <input type="hidden" name="id" value={account.id} />
                      <input type="hidden" name="is_blacklisted" value="false" />
                      <button
                        disabled={blacklistPending}
                        className="text-sm text-sage hover:underline font-medium"
                      >
                        {blacklistPending ? "Memproses..." : "Cabut Blacklist"}
                      </button>
                      {blacklistState.error && <p className="text-sm text-clay mt-1">{blacklistState.error}</p>}
                    </form>
                  ) : (
                    <div>
                      {!showBlacklistForm ? (
                        <button
                          type="button"
                          onClick={() => setShowBlacklistForm(true)}
                          className="text-sm text-clay hover:underline font-medium"
                        >
                          Blacklist Santri
                        </button>
                      ) : (
                        <form action={blacklistAction} className="mt-2 space-y-2 bg-clay/5 p-3 rounded-md border border-clay/20">
                          <input type="hidden" name="id" value={account.id} />
                          <input type="hidden" name="is_blacklisted" value="true" />
                          <label className="block text-xs font-semibold text-clay">
                            Alasan Blacklist (wajib)
                          </label>
                          <textarea
                            name="reason"
                            required
                            rows={2}
                            placeholder="Contoh: Terlambat kembali 3x berturut-turut"
                            className="w-full rounded-md border border-line bg-paper px-3 py-1.5 text-sm resize-none"
                          />
                          {blacklistState.error && <p className="text-xs text-clay">{blacklistState.error}</p>}
                          <div className="flex items-center gap-2">
                            <button
                              disabled={blacklistPending}
                              className="rounded-md bg-clay px-3 py-1 text-xs font-medium text-white disabled:opacity-60"
                            >
                              {blacklistPending ? "Memproses..." : "Konfirmasi Blacklist"}
                            </button>
                            <button
                              type="button"
                              onClick={() => setShowBlacklistForm(false)}
                              className="text-xs text-ink-soft hover:underline"
                            >
                              Batal
                            </button>
                          </div>
                        </form>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </li>
  );
}

