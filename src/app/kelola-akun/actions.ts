"use server";

import { z } from "zod";
import bcrypt from "bcryptjs";
import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth";
import { supabase } from "@/lib/supabase";

async function requireAdmin() {
  const session = await auth();
  if (!session?.user || session.user.role !== "PENGURUS") throw new Error("Tidak diizinkan.");
  return session;
}

export type AccountActionState = { error?: string; success?: boolean };
const usernameSchema = z.string().trim().min(3, "Username minimal 3 karakter.").regex(/^[a-zA-Z0-9_.-]+$/, "Username hanya boleh huruf, angka, titik, underscore, atau strip.");
const createSchema = z.object({ username: usernameSchema, password: z.string().min(6, "Kata sandi minimal 6 karakter."), name: z.string().trim().min(2, "Nama wajib diisi."), role: z.enum(["SANTRI", "PENGURUS"]), kamar: z.string().trim().optional() });

export async function createAccountAction(_prev: AccountActionState, formData: FormData): Promise<AccountActionState> {
  await requireAdmin();
  const parsed = createSchema.safeParse({ username: formData.get("username"), password: formData.get("password"), name: formData.get("name"), role: formData.get("role"), kamar: formData.get("kamar") || undefined });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Data tidak valid." };
  const { username, password, name, role, kamar } = parsed.data;
  const { data: existing } = await supabase.from("users").select("id").eq("username", username).maybeSingle();
  if (existing) return { error: "Username sudah digunakan, pilih yang lain." };
  const { error } = await supabase.from("users").insert({ username, password_hash: bcrypt.hashSync(password, 10), name, role, kamar: role === "SANTRI" ? kamar || null : null, is_active: true });
  if (error) return { error: `Gagal membuat akun: ${error.message}` };
  revalidatePath("/kelola-akun");
  return { success: true };
}

const updateSchema = z.object({ id: z.coerce.number().int().positive(), name: z.string().trim().min(2, "Nama wajib diisi."), kamar: z.string().trim().optional(), password: z.string().optional() });

export async function updateAccountAction(_prev: AccountActionState, formData: FormData): Promise<AccountActionState> {
  await requireAdmin();
  const parsed = updateSchema.safeParse({ id: formData.get("id"), name: formData.get("name"), kamar: formData.get("kamar") || undefined, password: formData.get("password") || undefined });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Data tidak valid." };
  const { id, name, kamar, password } = parsed.data;
  if (password && password.length < 6) return { error: "Kata sandi baru minimal 6 karakter." };
  const payload: Record<string, unknown> = { name, kamar: kamar || null, updated_at: new Date().toISOString() };
  if (password) payload.password_hash = bcrypt.hashSync(password, 10);
  const { error } = await supabase.from("users").update(payload).eq("id", id);
  if (error) return { error: `Gagal memperbarui akun: ${error.message}` };
  revalidatePath("/kelola-akun");
  return { success: true };
}

export async function toggleAccountAction(_prev: AccountActionState, formData: FormData): Promise<AccountActionState> {
  const session = await requireAdmin();
  const id = Number(formData.get("id"));
  if (!id) return { error: "Akun tidak ditemukan." };
  if (String(id) === session.user.id) return { error: "Akun yang sedang digunakan tidak dapat dinonaktifkan." };
  const active = formData.get("active") === "true";
  const { error } = await supabase.from("users").update({ is_active: !active, updated_at: new Date().toISOString() }).eq("id", id);
  if (error) return { error: `Gagal mengubah status akun: ${error.message}` };
  revalidatePath("/kelola-akun");
  return { success: true };
}
