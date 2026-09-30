import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

// Hanya inisialisasi jika environment variables Upstash sudah ada
const redis = (process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN)
  ? new Redis({
    url: process.env.UPSTASH_REDIS_REST_URL,
    token: process.env.UPSTASH_REDIS_REST_TOKEN,
  })
  : null;

// Batasi: 5 percobaan login dalam waktu 1 menit per IP
const ratelimit = redis
  ? new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(5, "1 m"),
    analytics: true,
    prefix: "@upstash/ratelimit",
  })
  : null;

export async function middleware(request: NextRequest) {
  // Hanya lindungi endpoint login dari brute-force (NextAuth credentials POST endpoint)
  const isLoginApi = request.nextUrl.pathname === "/api/auth/callback/credentials" && request.method === "POST";

  if (isLoginApi && ratelimit) {
    // Ambil IP pengunjung, atau fallback ke 'anonymous'
    const ip = request.ip || request.headers.get("x-forwarded-for") || "anonymous";
    const { success, pending, limit, reset, remaining } = await ratelimit.limit(`ratelimit_login_${ip}`);

    if (!success) {
      // Return 429 Too Many Requests jika terlalu banyak mencoba
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

  return NextResponse.next();
}

export const config = {
  // Hanya jalankan middleware ini pada endpoint login credentials
  matcher: ["/api/auth/callback/credentials"],
};
