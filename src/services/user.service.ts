import { supabase } from "@/lib/supabase";
import type { Database } from "@/types/database.types";
import type { UserRow } from "@/lib/types";

type InsertUser = Database["public"]["Tables"]["users"]["Insert"];
type UpdateUser = Database["public"]["Tables"]["users"]["Update"];

export async function getUserByUsername(username: string): Promise<UserRow | null> {
  const { data, error } = await supabase
    .from("users")
    .select("*")
    .eq("username", username)
    .eq("is_active", true)
    .maybeSingle();

  if (error) {
    console.error("Gagal mengambil user by username:", error.message);
    return null;
  }
  return data;
}

export async function getUserById(id: number): Promise<UserRow | null> {
  const { data, error } = await supabase
    .from("users")
    .select("*")
    .eq("id", id)
    .eq("is_active", true)
    .maybeSingle();

  if (error) {
    console.error("Gagal mengambil user by id:", error.message);
    return null;
  }
  return data;
}

export async function getAllUsers(): Promise<UserRow[]> {
  const { data, error } = await supabase
    .from("users")
    .select("*")
    .order("role", { ascending: true })
    .order("name", { ascending: true });

  if (error) {
    console.error("Gagal mengambil semua users:", error.message);
    return [];
  }
  return data ?? [];
}

export async function checkUsernameExists(username: string): Promise<boolean> {
  const { data, error } = await supabase
    .from("users")
    .select("id")
    .eq("username", username)
    .maybeSingle();

  if (error) {
    console.error("Gagal mengecek username:", error.message);
    return false;
  }
  return !!data;
}

export async function createUser(payload: InsertUser): Promise<{ error?: string }> {
  const { error } = await supabase.from("users").insert(payload);
  if (error) {
    return { error: `Gagal membuat akun: ${error.message}` };
  }
  return {};
}

export async function updateUser(id: number, payload: UpdateUser): Promise<{ error?: string }> {
  const { error } = await supabase.from("users").update(payload).eq("id", id);
  if (error) {
    return { error: `Gagal memperbarui akun: ${error.message}` };
  }
  return {};
}

export async function toggleUserStatus(id: number, newStatus: boolean): Promise<{ error?: string }> {
  const { error } = await supabase
    .from("users")
    .update({ is_active: newStatus, updated_at: new Date().toISOString() })
    .eq("id", id);

  if (error) {
    return { error: `Gagal mengubah status akun: ${error.message}` };
  }
  return {};
}

export async function toggleBlacklistStatus(
  id: number,
  isBlacklisted: boolean,
  reason?: string | null
): Promise<{ error?: string }> {
  const { error } = await supabase
    .from("users")
    .update({
      is_blacklisted: isBlacklisted,
      blacklist_reason: isBlacklisted ? reason ?? null : null,
      updated_at: new Date().toISOString(),
    })
    .eq("id", id);

  if (error) {
    return { error: `Gagal mengubah status blacklist: ${error.message}` };
  }
  return {};
}

