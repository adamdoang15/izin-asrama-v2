import { z } from "zod";

const envSchema = z.object({
  SUPABASE_URL: z.string().url("SUPABASE_URL harus berupa URL yang valid."),
  SUPABASE_SERVICE_ROLE_KEY: z
    .string()
    .min(1, "SUPABASE_SERVICE_ROLE_KEY wajib diisi."),
  NEXT_PUBLIC_VAPID_PUBLIC_KEY: z.string().optional(),
  VAPID_PRIVATE_KEY: z.string().optional(),
  VAPID_SUBJECT: z.string().optional().default("mailto:admin@asrama.com"),
  ASRAMA_LAT: z.string().optional(),
  ASRAMA_LNG: z.string().optional(),
  ASRAMA_RADIUS_METERS: z.string().optional(),
});

const _env = envSchema.safeParse({
  SUPABASE_URL: process.env.SUPABASE_URL,
  SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY,
  NEXT_PUBLIC_VAPID_PUBLIC_KEY: process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY,
  VAPID_PRIVATE_KEY: process.env.VAPID_PRIVATE_KEY,
  VAPID_SUBJECT: process.env.VAPID_SUBJECT,
  ASRAMA_LAT: process.env.ASRAMA_LAT || process.env.NEXT_PUBLIC_ASRAMA_LAT,
  ASRAMA_LNG: process.env.ASRAMA_LNG || process.env.NEXT_PUBLIC_ASRAMA_LNG,
  ASRAMA_RADIUS_METERS: process.env.ASRAMA_RADIUS_METERS || process.env.NEXT_PUBLIC_ASRAMA_RADIUS_METERS,
});

if (!_env.success) {
  console.error("❌ Invalid environment variables:", _env.error.format());
  throw new Error(
    "Missing or invalid SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY environment variables. Check .env.local file."
  );
}

export const env = _env.data;
