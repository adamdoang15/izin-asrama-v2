"use client";

import { useActionState, useEffect, useState } from "react";
import { editIzinAction, type ActionState } from "@/app/admin/actions";
import { isoToWibInputValue } from "@/lib/format";
import type { IzinRow } from "@/lib/types";

const initialState: ActionState = {};

interface EditIzinFormProps {
  izin: IzinRow;
  onClose: () => void;
}

export default function EditIzinForm({ izin, onClose }: EditIzinFormProps) {
  const [state, formAction, pending] = useActionState(editIzinAction, initialState);
  const [tanggalKeluar, setTanggalKeluar] = useState(isoToWibInputValue(izin.tanggal_keluar));
  const [perkiraanKembali, setPerkiraanKembali] = useState(isoToWibInputValue(izin.perkiraan_kembali));
  const validationError =
    tanggalKeluar && perkiraanKembali && new Date(perkiraanKembali) <= new Date(tanggalKeluar)
      ? "Perkiraan waktu kembali harus lebih lambat dari waktu keluar."
      : null;

  useEffect(() => {
    if (state.success) onClose();
  }, [state.success, onClose]);

  return (
    <form action={formAction} className="rounded-md border border-line bg-paper p-4 space-y-4">
      <input type="hidden" name="id" value={izin.id} />
      <p className="text-sm font-medium text-clay">
        Mode edit oleh petugas — perubahan akan tercatat di riwayat audit.
      </p>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <label htmlFor={`edit_jenis_${izin.id}`} className="block text-sm font-medium">Jenis izin</label>
          <select
            id={`edit_jenis_${izin.id}`}
            name="jenis_izin"
            defaultValue={izin.jenis_izin}
            required
            className="w-full rounded-md border border-line bg-paper-raised px-3 py-2 text-sm outline-none focus:border-teal focus:ring-1 focus:ring-teal"
          >
            <option value="HARIAN">Izin harian</option>
            <option value="MENGINAP">Izin menginap</option>
            <option value="REKREASI">Rekreasi</option>
            <option value="KELUARGA">Keperluan keluarga</option>
            <option value="DARURAT">Darurat</option>
          </select>
        </div>
        <div className="space-y-1.5">
          <label htmlFor={`edit_tujuan_${izin.id}`} className="block text-sm font-medium">Tujuan</label>
          <input
            id={`edit_tujuan_${izin.id}`}
            name="tujuan"
            defaultValue={izin.tujuan}
            required
            className="w-full rounded-md border border-line bg-paper-raised px-3 py-2 text-sm outline-none focus:border-teal focus:ring-1 focus:ring-teal"
          />
        </div>
      </div>

      <div className="space-y-1.5">
        <label htmlFor={`edit_alasan_${izin.id}`} className="block text-sm font-medium">Alasan</label>
        <textarea
          id={`edit_alasan_${izin.id}`}
          name="alasan"
          rows={2}
          defaultValue={izin.alasan}
          required
          className="w-full rounded-md border border-line bg-paper-raised px-3 py-2 text-sm outline-none focus:border-teal focus:ring-1 focus:ring-teal resize-none"
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <label htmlFor={`edit_keluar_${izin.id}`} className="block text-sm font-medium">Waktu keluar</label>
          <input
            id={`edit_keluar_${izin.id}`}
            name="tanggal_keluar"
            type="datetime-local"
            required
            value={tanggalKeluar}
            onChange={(e) => setTanggalKeluar(e.target.value)}
            className="w-full rounded-md border border-line bg-paper-raised px-3 py-2 text-sm outline-none focus:border-teal focus:ring-1 focus:ring-teal"
          />
        </div>
        <div className="space-y-1.5">
          <label htmlFor={`edit_kembali_${izin.id}`} className="block text-sm font-medium">Perkiraan kembali</label>
          <input
            id={`edit_kembali_${izin.id}`}
            name="perkiraan_kembali"
            type="datetime-local"
            required
            value={perkiraanKembali}
            onChange={(e) => setPerkiraanKembali(e.target.value)}
            className="w-full rounded-md border border-line bg-paper-raised px-3 py-2 text-sm outline-none focus:border-teal focus:ring-1 focus:ring-teal"
          />
        </div>
      </div>

      <div className="space-y-1.5">
        <label htmlFor={`edit_catatan_${izin.id}`} className="block text-sm font-medium">
          Alasan perubahan (wajib, untuk log audit)
        </label>
        <textarea
          id={`edit_catatan_${izin.id}`}
          name="catatan_perubahan"
          rows={2}
          required
          placeholder="Contoh: Santri salah pilih jenis izin, seharusnya Menginap bukan Harian"
          className="w-full rounded-md border border-line bg-paper-raised px-3 py-2 text-sm outline-none focus:border-teal focus:ring-1 focus:ring-teal resize-none"
        />
      </div>

      {validationError && <p className="text-sm text-clay" role="alert">{validationError}</p>}
      {state.error && <p className="text-sm text-clay" role="alert">{state.error}</p>}

      <div className="flex gap-3">
        <button
          type="submit"
          disabled={pending || Boolean(validationError)}
          className="rounded-md bg-teal px-4 py-2 text-sm font-medium text-paper-raised hover:opacity-90 disabled:opacity-60"
        >
          {pending ? "Menyimpan..." : "Simpan perubahan"}
        </button>
        <button type="button" onClick={onClose} className="rounded-md border border-line px-4 py-2 text-sm text-ink-soft hover:bg-paper">
          Batal
        </button>
      </div>
    </form>
  );
}
