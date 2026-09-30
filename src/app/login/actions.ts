"use server";

import { signIn } from "@/lib/auth";
import { AuthError } from "next-auth";

export type LoginState = {
  error?: string;
};

export async function loginAction(
  _prevState: LoginState,
  formData: FormData
): Promise<LoginState> {
  try {
    await signIn("credentials", {
      username: formData.get("username"),
      password: formData.get("password"),
      redirectTo: "/beranda",
    });
    return {};
    } catch (error: any) {
    if (error instanceof AuthError) {
      switch (error.type) {
        case "CredentialsSignin":
          return { error: "Username atau kata sandi salah." };
        default:
          return { error: "Terjadi kesalahan saat masuk. Coba lagi." };
      }
    }
    
    // Next.js redirect errors harus di-throw ulang agar proses redirect berjalan
    if (error?.digest?.startsWith("NEXT_REDIRECT")) {
      throw error;
    }

    // Tangkap error lainnya (seperti 429 Too Many Requests dari Middleware)
    return { error: "Terlalu banyak percobaan login. Silakan tunggu 1 menit lalu coba lagi." };
  }
}
