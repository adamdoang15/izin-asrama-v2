"use server";

import { z } from "zod";
import bcrypt from "bcryptjs";
import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth";
import { getUserById, updateUser } from "@/services/user.service";

export type ChangePasswordActionState = {
  error?: string;
  success?: boolean;
};

const changePasswordSchema = z
  .object({
    oldPassword: z.string().min(1, "Kata sandi saat ini wajib diisi."),
    newPassword: z.string().min(6, "Kata sandi baru minimal 6 karakter."),
    confirmPassword: z.string().min(1, "Konfirmasi kata sandi baru wajib diisi."),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: "Konfirmasi kata sandi baru tidak cocok.",
    path: ["confirmPassword"],
  });

export async function changePasswordAction(
  _prev: ChangePasswordActionState,
  formData: FormData
): Promise<ChangePasswordActionState> {
  const session = await auth();
  if (!session?.user?.id) {
    return { error: "Anda belum login." };
  }

  const userId = Number(session.user.id);
  if (!userId) {
    return { error: "Identitas pengguna tidak valid." };
  }

  const parsed = changePasswordSchema.safeParse({
    oldPassword: formData.get("oldPassword"),
    newPassword: formData.get("newPassword"),
    confirmPassword: formData.get("confirmPassword"),
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Data tidak valid." };
  }

  const { oldPassword, newPassword } = parsed.data;

  const currentUser = await getUserById(userId);
  if (!currentUser) {
    return { error: "Pengguna tidak ditemukan atau tidak aktif." };
  }

  const validOldPassword = bcrypt.compareSync(oldPassword, currentUser.password_hash);
  if (!validOldPassword) {
    return { error: "Kata sandi saat ini salah." };
  }

  const newHash = bcrypt.hashSync(newPassword, 10);
  const result = await updateUser(userId, {
    password_hash: newHash,
    updated_at: new Date().toISOString(),
  });

  if (result.error) {
    return { error: result.error };
  }

  revalidatePath("/pengaturan");
  return { success: true };
}
