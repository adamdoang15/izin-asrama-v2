"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth";
import { wibInputToISOString } from "@/lib/format";
import {
  getCurrentIzinStatus,
  approveIzin,
  rejectIzin,
  requestIzinRevision,
  editIzinByPengurus,
  deleteIzinByPengurus,
  markIzinReturnedByPengurus,
} from "@/services/izin.service";

async function requireAdmin() {
  const session = await auth();
  if (!session?.user || session.user.role !== "PENGURUS") throw new Error("Tidak diizinkan.");
  return session;
}

export type ActionState = { error?: string; success?: boolean };

const idSchema = z.coerce.number().int().positive();
const rejectSchema = z.object({ id: idSchema, catatan: z.string().trim().min(3, "Catatan penolakan wajib diisi.") });
const mintaRevisiSchema = z.object({
  id: idSchema,
  catatan: z.string().trim().min(3, "Catatan untuk gelara wajib diisi."),
});

const tandaiKembaliManualSchema = z.object({
  id: idSchema,
  alasan: z.string().trim().min(3, "Alasan penandaan kembali manual wajib diisi, minimal 3 karakter."),
});

const jenisIzinSchema = z.enum(["HARIAN", "MENGINAP", "REKREASI", "KELUARGA", "DARURAT"]);

const editIzinSchema = z.object({
  id: idSchema,
  jenis_izin: jenisIzinSchema,
  tujuan: z.string().trim().min(3, "Tujuan wajib diisi."),
  alasan: z.string().trim().min(5, "Alasan wajib diisi, minimal 5 karakter."),
  tanggal_keluar: z.string().min(1, "Tanggal keluar wajib diisi."),
  perkiraan_kembali: z.string().min(1, "Perkiraan kembali wajib diisi."),
  catatan_perubahan: z.string().trim().min(3, "Alasan perubahan wajib diisi, minimal 3 karakter."),
});

const hapusIzinSchema = z.object({
  id: idSchema,
  alasan: z.string().trim().min(3, "Alasan penghapusan wajib diisi."),
});

export async function setujuiIzinAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const session = await requireAdmin();
  const id = idSchema.safeParse(formData.get("id"));
  if (!id.success) return { error: "Pengajuan tidak ditemukan." };

  const current = await getCurrentIzinStatus(id.data);
  if (!current) return { error: "Pengajuan tidak ditemukan." };
  if (current.status !== "MENUNGGU") return { error: "Pengajuan ini sudah diproses." };

  const now = new Date();
  const scheduledExit = new Date(current.tanggal_keluar);
  const nextStatus = scheduledExit <= now ? "SEDANG_KELUAR" : "DISETUJUI";

  const result = await approveIzin(id.data, Number(session.user.id), nextStatus);
  if (result.error) return { error: result.error };

  revalidatePath("/beranda");
  return { success: true };
}

export async function tolakIzinAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const session = await requireAdmin();
  const parsed = rejectSchema.safeParse({ id: formData.get("id"), catatan: formData.get("catatan") });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Data tidak valid." };

  const current = await getCurrentIzinStatus(parsed.data.id);
  if (!current) return { error: "Pengajuan tidak ditemukan." };
  if (current.status !== "MENUNGGU") return { error: "Pengajuan ini sudah diproses." };

  const result = await rejectIzin(parsed.data.id, Number(session.user.id), parsed.data.catatan);
  if (result.error) return { error: result.error };

  revalidatePath("/beranda");
  return { success: true };
}

export async function mintaRevisiIzinAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const session = await requireAdmin();
  const parsed = mintaRevisiSchema.safeParse({ id: formData.get("id"), catatan: formData.get("catatan") });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Data tidak valid." };

  const current = await getCurrentIzinStatus(parsed.data.id);
  if (!current) return { error: "Pengajuan tidak ditemukan." };
  if (current.status !== "MENUNGGU") return { error: "Pengajuan ini sudah diproses." };

  const result = await requestIzinRevision(parsed.data.id, Number(session.user.id), parsed.data.catatan);
  if (result.error) return { error: result.error };

  revalidatePath("/beranda");
  return { success: true };
}

export async function tandaiKembaliManualAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const session = await requireAdmin();
  const parsed = tandaiKembaliManualSchema.safeParse({
    id: formData.get("id"),
    alasan: formData.get("alasan"),
  });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Data tidak valid." };

  const result = await markIzinReturnedByPengurus(
    parsed.data.id,
    Number(session.user.id),
    session.user.name ?? "Pengurus",
    parsed.data.alasan
  );
  if (result.error) return { error: result.error };

  revalidatePath("/beranda");
  return { success: true };
}

export async function editIzinAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const session = await requireAdmin();
  const parsed = editIzinSchema.safeParse({
    id: formData.get("id"),
    jenis_izin: formData.get("jenis_izin"),
    tujuan: formData.get("tujuan"),
    alasan: formData.get("alasan"),
    tanggal_keluar: formData.get("tanggal_keluar"),
    perkiraan_kembali: formData.get("perkiraan_kembali"),
    catatan_perubahan: formData.get("catatan_perubahan"),
  });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Data tidak valid." };

  const tanggalKeluarISO = wibInputToISOString(parsed.data.tanggal_keluar);
  const perkiraanKembaliISO = wibInputToISOString(parsed.data.perkiraan_kembali);
  if (!tanggalKeluarISO || !perkiraanKembaliISO) return { error: "Format tanggal tidak valid." };
  if (new Date(perkiraanKembaliISO) <= new Date(tanggalKeluarISO)) {
    return { error: "Perkiraan kembali harus setelah waktu keluar." };
  }

  const result = await editIzinByPengurus(
    parsed.data.id,
    Number(session.user.id),
    parsed.data.catatan_perubahan,
    {
      jenis_izin: parsed.data.jenis_izin,
      alasan: parsed.data.alasan,
      tujuan: parsed.data.tujuan,
      tanggal_keluar: tanggalKeluarISO,
      perkiraan_kembali: perkiraanKembaliISO,
    }
  );
  if (result.error) return { error: result.error };

  revalidatePath("/beranda");
  return { success: true };
}

export async function hapusIzinAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const session = await requireAdmin();
  const parsed = hapusIzinSchema.safeParse({
    id: formData.get("id"),
    alasan: formData.get("alasan"),
  });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Data tidak valid." };

  const result = await deleteIzinByPengurus(parsed.data.id, Number(session.user.id), parsed.data.alasan);
  if (result.error) return { error: result.error };

  revalidatePath("/beranda");
  return { success: true };
}

