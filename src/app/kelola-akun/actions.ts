"use server";

import { z } from "zod";
import bcrypt from "bcryptjs";
import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth";
import {
  checkUsernameExists,
  createUser,
  updateUser,
  toggleUserStatus,
  toggleBlacklistStatus,
} from "@/services/user.service";

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

  const exists = await checkUsernameExists(username);
  if (exists) return { error: "Username sudah digunakan, pilih yang lain." };

  const result = await createUser({
    username,
    password_hash: bcrypt.hashSync(password, 10),
    name,
    role,
    kamar: role === "SANTRI" ? kamar || null : null,
    is_active: true,
  });

  if (result.error) return { error: result.error };

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

  const payload: { name: string; kamar: string | null; updated_at: string; password_hash?: string } = {
    name,
    kamar: kamar || null,
    updated_at: new Date().toISOString(),
  };
  if (password) payload.password_hash = bcrypt.hashSync(password, 10);

  const result = await updateUser(id, payload);
  if (result.error) return { error: result.error };

  revalidatePath("/kelola-akun");
  return { success: true };
}

export async function toggleAccountAction(_prev: AccountActionState, formData: FormData): Promise<AccountActionState> {
  const session = await requireAdmin();
  const id = Number(formData.get("id"));
  if (!id) return { error: "Akun tidak ditemukan." };
  if (String(id) === session.user.id) return { error: "Akun yang sedang digunakan tidak dapat dinonaktifkan." };
  const active = formData.get("active") === "true";

  const result = await toggleUserStatus(id, !active);
  if (result.error) return { error: result.error };

  revalidatePath("/kelola-akun");
  return { success: true };
}

export async function toggleBlacklistAction(_prev: AccountActionState, formData: FormData): Promise<AccountActionState> {
  const session = await requireAdmin();
  const id = Number(formData.get("id"));
  if (!id) return { error: "Akun tidak ditemukan." };
  if (String(id) === session.user.id) return { error: "Anda tidak dapat mem-blacklist akun sendiri." };
  
  const isBlacklisted = formData.get("is_blacklisted") === "true";
  const blacklistReason = formData.get("reason") ? String(formData.get("reason")).trim() : null;

  if (isBlacklisted && !blacklistReason) {
    return { error: "Alasan blacklist wajib diisi." };
  }

  const result = await toggleBlacklistStatus(id, isBlacklisted, blacklistReason);
  if (result.error) return { error: result.error };

  revalidatePath("/kelola-akun");
  return { success: true };
}

