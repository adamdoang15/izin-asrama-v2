import NextAuth from "next-auth";
import { authConfig } from "@/auth.config";
import { NextResponse } from "next/server";
import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

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

const { auth } = NextAuth(authConfig);

export default auth(async (req) => {
  const isLoginApi = req.nextUrl.pathname === "/api/auth/callback/credentials" && req.method === "POST";
  
  if (isLoginApi && ratelimit) {
    // Mengambil IP dari header untuk menghindari error TypeScript pada NextAuthRequest
    const ip = req.headers.get("x-forwarded-for") || "anonymous";
    const { success, pending, limit, reset, remaining } = await ratelimit.limit(`ratelimit_login_${ip}`);
    
    if (!success) {
      return new NextResponse(
        JSON.stringify({ error: "Terlalu banyak percobaan login. Silakan tunggu 1 menit." }),
        {
          status: 429,
          headers: {
            "Content-Type": "application/json",
            "X-RateLimit-Limit": limit.toString(),
            "X-RateLimit-Remaining": remaining.toString(),
            "X-RateLimit-Reset": reset.toString(),
          },
        }
      );
    }
  }
});

export const config = {
  matcher: [
    "/",
    "/login",
    "/beranda/:path*",
    "/kelola-akun/:path*",
    "/pengaturan/:path*",
    "/daily-activity/:path*",
    "/api/auth/callback/credentials",
  ],
};
