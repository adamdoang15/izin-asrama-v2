"use client";

import { useActionState, useEffect, useRef } from "react";
import { ajukanIzinAction, type AjukanIzinState } from "@/app/santri/actions";

const initialState: AjukanIzinState = {};

interface IzinFormProps {
  isBlacklisted?: boolean;
  blacklistReason?: string | null;
}

export default function IzinForm({ isBlacklisted, blacklistReason }: IzinFormProps) {
  const [state, formAction, pending] = useActionState(ajukanIzinAction, initialState);
  const formRef = useRef<HTMLFormElement>(null);
  useEffect(() => { if (state.success) formRef.current?.reset(); }, [state.success]);

  if (isBlacklisted) {
    return (
      <div className="rounded-md border border-clay/30 bg-clay/5 p-4 space-y-2 text-clay">
        <div className="flex items-center gap-2 font-semibold text-sm">
          <svg className="w-5 h-5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
          <span>Akun Anda Sedang Diblacklist</span>
        </div>
        <p className="text-sm">
          Anda tidak dapat mengajukan izin keluar saat ini.
          {blacklistReason && (
            <span className="block mt-1">
              <span className="font-semibold">Alasan:</span> {blacklistReason}
            </span>
          )}
        </p>
      </div>
    );
  }

  return (
    <form ref={formRef} action={formAction} className="rounded-md border border-line bg-paper-raised p-4 space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <label htmlFor="jenis_izin" className="block text-sm font-medium">Jenis izin</label>
          <select id="jenis_izin" name="jenis_izin" required className="w-full rounded-md border border-line bg-paper px-3 py-2 text-sm outline-none focus:border-teal focus:ring-1 focus:ring-teal">
            <option value="HARIAN">Izin harian</option>
            <option value="MENGINAP">Izin menginap</option>
            <option value="REKREASI">Rekreasi</option>
            <option value="KELUARGA">Keperluan keluarga</option>
            <option value="DARURAT">Darurat</option>
          </select>
        </div>
        <div className="space-y-1.5">
          <label htmlFor="tujuan" className="block text-sm font-medium">Tujuan</label>
          <input id="tujuan" name="tujuan" required placeholder="Contoh: Ke toko kue Cibadak" className="w-full rounded-md border border-line bg-paper px-3 py-2 text-sm outline-none focus:border-teal focus:ring-1 focus:ring-teal" />
        </div>
      </div>
      <div className="space-y-1.5">
        <label htmlFor="alasan" className="block text-sm font-medium">Alasan</label>
        <textarea id="alasan" name="alasan" rows={3} required placeholder="Jelaskan alasan izin secara singkat" className="w-full rounded-md border border-line bg-paper px-3 py-2 text-sm outline-none focus:border-teal focus:ring-1 focus:ring-teal resize-none" />
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-1.5"><label htmlFor="tanggal_keluar" className="block text-sm font-medium">Waktu keluar</label><input id="tanggal_keluar" name="tanggal_keluar" type="datetime-local" required className="w-full rounded-md border border-line bg-paper px-3 py-2 text-sm outline-none focus:border-teal focus:ring-1 focus:ring-teal" /></div>
        <div className="space-y-1.5"><label htmlFor="perkiraan_kembali" className="block text-sm font-medium">Perkiraan kembali</label><input id="perkiraan_kembali" name="perkiraan_kembali" type="datetime-local" required className="w-full rounded-md border border-line bg-paper px-3 py-2 text-sm outline-none focus:border-teal focus:ring-1 focus:ring-teal" /></div>
      </div>
      {state.error && <p className="text-sm text-clay" role="alert">{state.error}</p>}
      {state.success && <p className="text-sm text-sage" role="status">Pengajuan terkirim dan masuk antrean persetujuan.</p>}
      <button type="submit" disabled={pending} className="rounded-md bg-teal px-4 py-2.5 text-sm font-medium text-paper-raised hover:opacity-90 disabled:opacity-60">{pending ? "Mengirim..." : "Ajukan izin"}</button>
    </form>
  );
}
