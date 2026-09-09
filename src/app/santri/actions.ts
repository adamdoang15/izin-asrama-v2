"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth";
import { supabase } from "@/lib/supabase";
import { syncScheduledIzinStatuses } from "@/lib/izin";
import { wibInputToISOString } from "@/lib/format";

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

  // Inputs are plain "YYYY-MM-DDTHH:mm" strings from <input type="datetime-local">
  // with no timezone attached — treat them as WIB and convert to real UTC
  // instants so times are stored and compared correctly everywhere.
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

  const { data: activeRequests, error: conflictError } = await supabase
    .from("izin")
    .select("id, tanggal_keluar, perkiraan_kembali, status")
    .eq("user_id", Number(session.user.id))
    .in("status", ["MENUNGGU", "DISETUJUI", "SEDANG_KELUAR"])
    .lt("tanggal_keluar", perkiraanKembaliISO)
    .gt("perkiraan_kembali", tanggalKeluarISO);

  if (conflictError) return { error: `Gagal memeriksa jadwal izin: ${conflictError.message}` };
  if ((activeRequests ?? []).length > 0) {
    return { error: "Kamu masih memiliki pengajuan/izin aktif pada rentang waktu tersebut." };
  }

  const { data: inserted, error } = await supabase
    .from("izin")
    .insert({
      user_id: Number(session.user.id),
      jenis_izin,
      alasan,
      tujuan,
      tanggal_keluar: tanggalKeluarISO,
      perkiraan_kembali: perkiraanKembaliISO,
    })
    .select("id")
    .single();

  if (error) return { error: `Gagal menyimpan pengajuan: ${error.message}` };

  await supabase.from("izin_logs").insert({
    izin_id: inserted.id,
    actor_id: Number(session.user.id),
    action: "AJUKAN",
    new_status: "MENUNGGU",
    catatan: null,
  });

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

  const { data: izin, error: fetchError } = await supabase
    .from("izin")
    .select("id, user_id, status, perkiraan_kembali, tanggal_keluar")
    .eq("id", id.data)
    .eq("user_id", Number(session.user.id))
    .maybeSingle();

  if (fetchError || !izin) return { error: "Izin tidak ditemukan." };
  if (izin.status !== "SEDANG_KELUAR") return { error: "Izin ini belum berstatus sedang keluar." };

  const now = new Date();
  const batasKembali = new Date(izin.perkiraan_kembali);
  const lateMs = Math.max(0, now.getTime() - batasKembali.getTime());
  const lateMinutes = Math.ceil(lateMs / 60000);
  const returnStatus = lateMinutes > 0 ? "TERLAMBAT" : "TEPAT_WAKTU";
  const returnedAt = now.toISOString();

  const { error: updateError } = await supabase
    .from("izin")
    .update({
      status: "SUDAH_KEMBALI",
      returned_at: returnedAt,
      return_status: returnStatus,
      late_minutes: lateMinutes,
      updated_at: returnedAt,
    })
    .eq("id", id.data)
    .eq("user_id", Number(session.user.id))
    .eq("status", "SEDANG_KELUAR");

  if (updateError) return { error: `Gagal mencatat kepulangan: ${updateError.message}` };

  await supabase.from("izin_logs").insert({
    izin_id: id.data,
    actor_id: Number(session.user.id),
    action: "KEMBALI",
    old_status: "SEDANG_KELUAR",
    new_status: "SUDAH_KEMBALI",
    catatan: returnStatus === "TERLAMBAT" ? `Terlambat ${lateMinutes} menit.` : "Kembali tepat waktu.",
  });

  revalidatePath("/beranda");
  return { success: true };
}
