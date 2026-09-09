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
  } catch (error) {
    if (error instanceof AuthError) {
      switch (error.type) {
        case "CredentialsSignin":
          return { error: "Username atau kata sandi salah." };
        default:
          return { error: "Terjadi kesalahan saat masuk. Coba lagi." };
      }
    }
    // NextAuth throws a redirect internally on success — let it propagate.
    throw error;
  }
}
