"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth";
import { supabase } from "@/lib/supabase";

async function requireAdmin() {
  const session = await auth();
  if (!session?.user || session.user.role !== "PENGURUS") throw new Error("Tidak diizinkan.");
  return session;
}

export type ActionState = { error?: string; success?: boolean };

const idSchema = z.coerce.number().int().positive();
const rejectSchema = z.object({ id: idSchema, catatan: z.string().trim().min(3, "Catatan penolakan wajib diisi.") });

async function getCurrentStatus(id: number) {
  const { data, error } = await supabase.from("izin").select("status, user_id, tanggal_keluar").eq("id", id).maybeSingle();
  if (error || !data) throw new Error("Pengajuan tidak ditemukan.");
  return data;
}

async function writeLog(id: number, actorId: number, oldStatus: string, newStatus: string, action: string, catatan: string | null) {
  await supabase.from("izin_logs").insert({ izin_id: id, actor_id: actorId, action, old_status: oldStatus, new_status: newStatus, catatan });
}

export async function setujuiIzinAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const session = await requireAdmin();
  const id = idSchema.safeParse(formData.get("id"));
  if (!id.success) return { error: "Pengajuan tidak ditemukan." };

  const current = await getCurrentStatus(id.data);
  if (current.status !== "MENUNGGU") return { error: "Pengajuan ini sudah diproses." };

  const now = new Date().toISOString();
  const scheduledExit = new Date(current.tanggal_keluar);
  const nextStatus = scheduledExit <= new Date(now) ? "SEDANG_KELUAR" : "DISETUJUI";
  const { error } = await supabase.from("izin").update({ status: nextStatus, approved_by: Number(session.user.id), approved_at: now, catatan_admin: null, updated_at: now }).eq("id", id.data).eq("status", "MENUNGGU");
  if (error) return { error: `Gagal menyetujui: ${error.message}` };

  await writeLog(id.data, Number(session.user.id), "MENUNGGU", nextStatus, "SETUJUI", null);
  revalidatePath("/beranda");
  return { success: true };
}

export async function tolakIzinAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const session = await requireAdmin();
  const parsed = rejectSchema.safeParse({ id: formData.get("id"), catatan: formData.get("catatan") });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Data tidak valid." };

  const current = await getCurrentStatus(parsed.data.id);
  if (current.status !== "MENUNGGU") return { error: "Pengajuan ini sudah diproses." };

  const now = new Date().toISOString();
  const { error } = await supabase.from("izin").update({ status: "DITOLAK", approved_by: Number(session.user.id), approved_at: now, catatan_admin: parsed.data.catatan, updated_at: now }).eq("id", parsed.data.id).eq("status", "MENUNGGU");
  if (error) return { error: `Gagal menolak: ${error.message}` };

  await writeLog(parsed.data.id, Number(session.user.id), "MENUNGGU", "DITOLAK", "TOLAK", parsed.data.catatan);
  revalidatePath("/beranda");
  return { success: true };
}

