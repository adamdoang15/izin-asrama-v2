"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth";
import { wibInputToISOString } from "@/lib/format";
import {
  syncScheduledIzinStatuses,
  checkActiveIzinConflict,
  createIzin,
  getCurrentIzinStatus,
  markIzinReturned,
} from "@/services/izin.service";

const jenisIzinSchema = z.enum(["HARIAN", "MENGINAP", "REKREASI", "KELUARGA", "DARURAT"]);

const izinSchema = z.object({
  jenis_izin: jenisIzinSchema,
  tujuan: z.string().trim().min(3, "Tujuan wajib diisi."),
  alasan: z.string().trim().min(5, "Alasan wajib diisi, minimal 5 karakter."),
  tanggal_keluar: z.string().min(1, "Tanggal keluar wajib diisi."),
  perkiraan_kembali: z.string().min(1, "Perkiraan kembali wajib diisi."),
});

export type AjukanIzinState = { error?: string; success?: boolean };
export type KembaliState = { error?: string; success?: boolean };

export async function ajukanIzinAction(
  _prevState: AjukanIzinState,
  formData: FormData
): Promise<AjukanIzinState> {
  const session = await auth();
  if (!session?.user || session.user.role !== "SANTRI") {
    return { error: "Sesi tidak valid. Silakan masuk kembali." };
  }

  const parsed = izinSchema.safeParse({
    jenis_izin: formData.get("jenis_izin"),
    tujuan: formData.get("tujuan"),
    alasan: formData.get("alasan"),
    tanggal_keluar: formData.get("tanggal_keluar"),
    perkiraan_kembali: formData.get("perkiraan_kembali"),
  });

  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Data tidak valid." };

  const { jenis_izin, tujuan, alasan } = parsed.data;

  const tanggalKeluarISO = wibInputToISOString(parsed.data.tanggal_keluar);
  const perkiraanKembaliISO = wibInputToISOString(parsed.data.perkiraan_kembali);
  if (!tanggalKeluarISO || !perkiraanKembaliISO) {
    return { error: "Format tanggal tidak valid." };
  }

  const keluar = new Date(tanggalKeluarISO);
  const kembali = new Date(perkiraanKembaliISO);
  const now = new Date();

  if (Number.isNaN(keluar.getTime()) || Number.isNaN(kembali.getTime())) {
    return { error: "Format tanggal tidak valid." };
  }
  if (kembali <= keluar) return { error: "Perkiraan kembali harus setelah waktu keluar." };
  if (keluar < new Date(now.getTime() - 5 * 60 * 1000)) {
    return { error: "Waktu keluar tidak boleh berada jauh di masa lalu." };
  }

  await syncScheduledIzinStatuses();

  const conflict = await checkActiveIzinConflict(Number(session.user.id), tanggalKeluarISO, perkiraanKembaliISO);
  if (conflict.error) return { error: conflict.error };
  if (conflict.hasConflict) {
    return { error: "Kamu masih memiliki pengajuan/izin aktif pada rentang waktu tersebut." };
  }

  const result = await createIzin(Number(session.user.id), jenis_izin, alasan, tujuan, tanggalKeluarISO, perkiraanKembaliISO);
  if (result.error) return { error: result.error };

  revalidatePath("/beranda");
  return { success: true };
}

export async function tandaiKembaliAction(
  _prevState: KembaliState,
  formData: FormData
): Promise<KembaliState> {
  const session = await auth();
  if (!session?.user || session.user.role !== "SANTRI") {
    return { error: "Sesi tidak valid. Silakan masuk kembali." };
  }

  const id = z.coerce.number().int().positive().safeParse(formData.get("id"));
  if (!id.success) return { error: "Izin tidak ditemukan." };

  await syncScheduledIzinStatuses();

  const izin = await getCurrentIzinStatus(id.data);
  if (!izin || izin.user_id !== Number(session.user.id)) return { error: "Izin tidak ditemukan." };
  if (izin.status !== "SEDANG_KELUAR") return { error: "Izin ini belum berstatus sedang keluar." };

  const now = new Date();
  const batasKembali = new Date(izin.perkiraan_kembali);
  const lateMs = Math.max(0, now.getTime() - batasKembali.getTime());
  const lateMinutes = Math.ceil(lateMs / 60000);
  const returnStatus = lateMinutes > 0 ? "TERLAMBAT" : "TEPAT_WAKTU";
  const returnedAt = now.toISOString();

  const result = await markIzinReturned(
    id.data,
    Number(session.user.id),
    returnedAt,
    returnStatus,
    lateMinutes,
    session.user.name ?? "Santri"
  );
  if (result.error) return { error: result.error };

  revalidatePath("/beranda");
  return { success: true };
}