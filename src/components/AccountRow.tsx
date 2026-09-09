"use client";

import { useActionState, useState } from "react";
import { updateAccountAction, toggleAccountAction, type AccountActionState } from "@/app/kelola-akun/actions";
import type { UserRow } from "@/lib/types";

const initialState: AccountActionState = {};

export default function AccountRow({ account, isSelf }: { account: UserRow; isSelf: boolean }) {
  const [editing, setEditing] = useState(false);
  const [updateState, updateAction, updatePending] = useActionState(updateAccountAction, initialState);
  const [toggleState, toggleAction, togglePending] = useActionState(toggleAccountAction, initialState);

  return <li className={`rounded-md border border-line bg-paper-raised px-4 py-3.5 ${!account.is_active ? "opacity-60" : ""}`}>
    <div className="flex items-start justify-between gap-4"><div className="min-w-0"><p className="text-sm font-medium truncate">{account.name}{isSelf && <span className="ml-1.5 text-xs text-ink-soft">(kamu)</span>}</p><p className="text-sm text-ink-soft mt-0.5">@{account.username}{account.kamar ? ` · ${account.kamar}` : ""}</p><p className={`text-xs mt-1 ${account.is_active ? "text-sage" : "text-clay"}`}>{account.is_active ? "Aktif" : "Nonaktif"}</p></div><button type="button" onClick={() => setEditing(v => !v)} className="text-sm text-teal shrink-0">{editing ? "Tutup" : "Edit"}</button></div>
    {editing && <div className="mt-3.5 pt-3.5 border-t border-line space-y-4"><form action={updateAction} className="space-y-3"><input type="hidden" name="id" value={account.id}/><div className="grid grid-cols-1 sm:grid-cols-2 gap-3"><div className="space-y-1.5"><label className="block text-sm font-medium">Nama</label><input name="name" defaultValue={account.name} required className="w-full rounded-md border border-line bg-paper px-3 py-2 text-sm"/></div>{account.role === "SANTRI" && <div className="space-y-1.5"><label className="block text-sm font-medium">Kamar</label><input name="kamar" defaultValue={account.kamar ?? ""} className="w-full rounded-md border border-line bg-paper px-3 py-2 text-sm"/></div>}</div><div className="space-y-1.5"><label className="block text-sm font-medium">Kata sandi baru <span className="text-ink-soft font-normal">(opsional)</span></label><input name="password" type="password" minLength={6} autoComplete="new-password" placeholder="minimal 6 karakter" className="w-full rounded-md border border-line bg-paper px-3 py-2 text-sm"/></div>{updateState.error && <p className="text-sm text-clay">{updateState.error}</p>}{updateState.success && <p className="text-sm text-sage">Perubahan disimpan.</p>}<button disabled={updatePending} className="rounded-md bg-teal px-3.5 py-1.5 text-sm font-medium text-paper-raised disabled:opacity-60">{updatePending ? "Menyimpan..." : "Simpan"}</button></form>
      {!isSelf && <form action={toggleAction} className="pt-2"><input type="hidden" name="id" value={account.id}/><input type="hidden" name="active" value={String(account.is_active)}/><button disabled={togglePending} className={`text-sm ${account.is_active ? "text-clay" : "text-teal"}`}>{togglePending ? "Memproses..." : account.is_active ? "Nonaktifkan akun" : "Aktifkan akun"}</button>{toggleState.error && <p className="text-sm text-clay mt-2">{toggleState.error}</p>}</form>}
    </div>}
  </li>;
}
