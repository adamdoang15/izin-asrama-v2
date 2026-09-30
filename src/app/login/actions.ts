"use server";

import { signIn } from "@/lib/auth";
import { AuthError } from "next-auth";
import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";
import { headers } from "next/headers";

const redis = (process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN)
  ? new Redis({
      url: process.env.UPSTASH_REDIS_REST_URL,
      token: process.env.UPSTASH_REDIS_REST_TOKEN,
    })
  : null;

const ratelimit = redis
  ? new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(5, "1 m"),
      analytics: true,
      prefix: "@upstash/ratelimit",
    })
  : null;

export type LoginState = {
  error?: string;
};

export async function loginAction(
  _prevState: LoginState,
  formData: FormData
): Promise<LoginState> {
  if (ratelimit) {
    // Gunakan headers() dari next/headers untuk mendapatkan IP di Server Action
    const ip = headers().get("x-forwarded-for") || "anonymous";
    const { success } = await ratelimit.limit(`ratelimit_login_${ip}`);
    if (!success) {
      return { error: "Terlalu banyak percobaan login. Silakan tunggu 1 menit lalu coba lagi." };
    }
  }

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
