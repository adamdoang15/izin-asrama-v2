"use client";

import { useActionState, useEffect, useState } from "react";
import { kirimRevisiIzinAction, type RevisiIzinState } from "@/app/santri/actions";
import { isoToWibInputValue } from "@/lib/format";
import type { IzinRow } from "@/lib/types";

const initialState: RevisiIzinState = {};

interface RevisiIzinFormProps {
  izin: IzinRow;
}

export default function RevisiIzinForm({ izin }: RevisiIzinFormProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [state, formAction, pending] = useActionState(kirimRevisiIzinAction, initialState);

  const [tanggalKeluar, setTanggalKeluar] = useState(isoToWibInputValue(izin.tanggal_keluar));
  const [perkiraanKembali, setPerkiraanKembali] = useState(isoToWibInputValue(izin.perkiraan_kembali));
  const [validationError, setValidationError] = useState<string | null>(null);

  useEffect(() => {
    if (tanggalKeluar && perkiraanKembali) {
      if (new Date(perkiraanKembali) <= new Date(tanggalKeluar)) {
        setValidationError("Perkiraan waktu kembali harus lebih lambat dari waktu keluar.");
      } else {
        setValidationError(null);
      }
    } else {
      setValidationError(null);
    }
  }, [tanggalKeluar, perkiraanKembali]);

  if (!isOpen) {
    return (
      <div className="mt-3.5 pt-3.5 border-t border-line space-y-3">
        {izin.catatan_admin && (
          <div className="rounded-md border border-clay/30 bg-clay/5 p-3 text-clay text-sm">
            <p className="font-semibold">Catatan dari Petugas:</p>
            <p className="mt-0.5">{izin.catatan_admin}</p>
          </div>
        )}
        <button
          type="button"
          onClick={() => setIsOpen(true)}
          className="rounded-md bg-teal px-3.5 py-1.5 text-sm font-medium text-paper-raised hover:opacity-90"
        >
          Revisi & Kirim Ulang
        </button>
      </div>
    );
  }

  return (
    <div className="mt-3.5 pt-3.5 border-t border-line space-y-3">
      {izin.catatan_admin && (
        <div className="rounded-md border border-clay/30 bg-clay/5 p-3 text-clay text-sm">
          <p className="font-semibold">Catatan dari Petugas:</p>
          <p className="mt-0.5">{izin.catatan_admin}</p>
        </div>
      )}

      <form action={formAction} className="rounded-md border border-line bg-paper p-4 space-y-4">
        <input type="hidden" name="id" value={izin.id} />

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <label htmlFor={`revisi_jenis_${izin.id}`} className="block text-sm font-medium">
              Jenis izin
            </label>
            <select
              id={`revisi_jenis_${izin.id}`}
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
            <label htmlFor={`revisi_tujuan_${izin.id}`} className="block text-sm font-medium">
              Tujuan
            </label>
            <input
              id={`revisi_tujuan_${izin.id}`}
              name="tujuan"
              defaultValue={izin.tujuan}
              required
              placeholder="Contoh: Ke toko buku"
              className="w-full rounded-md border border-line bg-paper-raised px-3 py-2 text-sm outline-none focus:border-teal focus:ring-1 focus:ring-teal"
            />
          </div>
        </div>

        <div className="space-y-1.5">
          <label htmlFor={`revisi_alasan_${izin.id}`} className="block text-sm font-medium">
            Alasan
          </label>
          <textarea
            id={`revisi_alasan_${izin.id}`}
            name="alasan"
            rows={3}
            defaultValue={izin.alasan}
            required
            placeholder="Jelaskan alasan izin secara singkat"
            className="w-full rounded-md border border-line bg-paper-raised px-3 py-2 text-sm outline-none focus:border-teal focus:ring-1 focus:ring-teal resize-none"
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <label htmlFor={`revisi_keluar_${izin.id}`} className="block text-sm font-medium">
              Waktu keluar
            </label>
            <input
              id={`revisi_keluar_${izin.id}`}
              name="tanggal_keluar"
              type="datetime-local"
              required
              value={tanggalKeluar}
              onChange={(e) => {
                const val = e.target.value;
                setTanggalKeluar(val);
                if (perkiraanKembali && val > perkiraanKembali) {
                  setPerkiraanKembali("");
                }
              }}
              className="w-full rounded-md border border-line bg-paper-raised px-3 py-2 text-sm outline-none focus:border-teal focus:ring-1 focus:ring-teal"
            />
          </div>
          <div className="space-y-1.5">
            <label htmlFor={`revisi_kembali_${izin.id}`} className="block text-sm font-medium">
              Perkiraan kembali
            </label>
            <input
              id={`revisi_kembali_${izin.id}`}
              name="perkiraan_kembali"
              type="datetime-local"
              required
              min={tanggalKeluar}
              value={perkiraanKembali}
              onChange={(e) => setPerkiraanKembali(e.target.value)}
              className="w-full rounded-md border border-line bg-paper-raised px-3 py-2 text-sm outline-none focus:border-teal focus:ring-1 focus:ring-teal"
            />
          </div>
        </div>

        {validationError && (
          <p className="text-sm text-clay" role="alert">
            {validationError}
          </p>
        )}
        {state.error && <p className="text-sm text-clay" role="alert">{state.error}</p>}

        <div className="flex gap-3">
          <button
            type="submit"
            disabled={pending || Boolean(validationError)}
            className="rounded-md bg-teal px-4 py-2 text-sm font-medium text-paper-raised hover:opacity-90 disabled:opacity-60"
          >
            {pending ? "Mengirim..." : "Kirim ulang"}
          </button>
          <button
            type="button"
            onClick={() => setIsOpen(false)}
            className="rounded-md border border-line px-4 py-2 text-sm text-ink-soft hover:bg-paper"
          >
            Batal
          </button>
        </div>
      </form>
    </div>
  );
}
