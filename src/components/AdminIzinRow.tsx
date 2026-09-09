"use client";

import { useActionState, useState } from "react";
import { setujuiIzinAction, tolakIzinAction, type ActionState } from "@/app/admin/actions";
import StatusPill from "@/components/StatusPill";
import { formatTanggalWaktu } from "@/lib/format";
import { JENIS_IZIN_LABEL, type IzinWithSantri } from "@/lib/types";

const initialState: ActionState = {};

export default function AdminIzinRow({ izin }: { izin: IzinWithSantri }) {
  const [showTolak, setShowTolak] = useState(false);
  const [approveState, approveAction, approvePending] = useActionState(setujuiIzinAction, initialState);
  const [rejectState, rejectAction, rejectPending] = useActionState(tolakIzinAction, initialState);

  return (
    <li className="rounded-md border border-line bg-paper-raised px-4 py-3.5">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <p className="text-sm font-medium truncate">{izin.nama_santri}{izin.kamar ? ` · ${izin.kamar}` : ""}</p>
          <p className="text-xs text-teal mt-1">{JENIS_IZIN_LABEL[izin.jenis_izin]}</p>
          <p className="text-sm mt-1">{izin.tujuan}</p>
          <p className="text-sm text-ink-soft mt-0.5">{izin.alasan}</p>
          <p className="text-xs text-ink-soft mt-2">Keluar: {formatTanggalWaktu(izin.tanggal_keluar)}</p>
          <p className="text-xs text-ink-soft">Batas kembali: {formatTanggalWaktu(izin.perkiraan_kembali)}</p>
          {izin.approved_by && izin.nama_penyetuju && (
            <p className="text-xs text-sage mt-2">Disetujui oleh {izin.nama_penyetuju} · {formatTanggalWaktu(izin.approved_at)}</p>
          )}
          {izin.returned_at && (
            <p className={`text-xs mt-1 ${izin.return_status === "TERLAMBAT" ? "text-clay" : "text-sage"}`}>
              Kembali: {formatTanggalWaktu(izin.returned_at)} · {izin.return_status === "TERLAMBAT" ? `Terlambat ${izin.late_minutes ?? 0} menit` : "Tepat waktu"}
            </p>
          )}
          {izin.catatan_admin && <p className="text-xs text-ink-soft mt-2 border-t border-line pt-2">Catatan: {izin.catatan_admin}</p>}
        </div>
        <StatusPill status={izin.status} />
      </div>

      {izin.status === "MENUNGGU" && (
        <div className="mt-3.5 pt-3.5 border-t border-line">
          {!showTolak ? (
            <div className="flex items-center gap-3 flex-wrap">
              <form action={approveAction}>
                <input type="hidden" name="id" value={izin.id} />
                <button disabled={approvePending} className="rounded-md bg-teal px-3.5 py-1.5 text-sm font-medium text-paper-raised disabled:opacity-60">
                  {approvePending ? "Memproses..." : "Setujui"}
                </button>
              </form>
              <button type="button" onClick={() => setShowTolak(true)} className="text-sm text-clay">Tolak</button>
              {approveState.error && <p className="text-sm text-clay">{approveState.error}</p>}
            </div>
          ) : (
            <form action={rejectAction} className="space-y-2.5">
              <input type="hidden" name="id" value={izin.id} />
              <textarea name="catatan" rows={2} required placeholder="Alasan penolakan" className="w-full rounded-md border border-line bg-paper px-3 py-2 text-sm resize-none" />
              {rejectState.error && <p className="text-sm text-clay">{rejectState.error}</p>}
              <div className="flex gap-3">
                <button disabled={rejectPending} className="rounded-md bg-clay px-3.5 py-1.5 text-sm font-medium text-paper-raised disabled:opacity-60">{rejectPending ? "Memproses..." : "Kirim penolakan"}</button>
                <button type="button" onClick={() => setShowTolak(false)} className="text-sm text-ink-soft">Batal</button>
              </div>
            </form>
          )}
        </div>
      )}
    </li>
  );
}
