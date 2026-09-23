"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth";
import { getCurrentIzinStatus, approveIzin, rejectIzin, requestIzinRevision } from "@/services/izin.service";

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

