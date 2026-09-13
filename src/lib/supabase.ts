import { createClient } from "@supabase/supabase-js";
import { env } from "@/lib/env";
import type { Database } from "@/types/database.types";

/**
 * IMPORTANT: this client uses the Supabase *service role* key, which
 * bypasses Row Level Security. It must only ever be imported from
 * server-side code (Server Components, Server Actions, Route Handlers) —
 * never from a "use client" file, or the key would leak to the browser.
 *
 * We don't use Supabase's built-in Auth here; accounts (santri & petugas)
 * live in our own `users` table with bcrypt-hashed passwords, checked by
 * the NextAuth Credentials provider in src/lib/auth.ts.
 */

export const supabase = createClient<Database>(
  env.SUPABASE_URL,
  env.SUPABASE_SERVICE_ROLE_KEY,
  {
    auth: { persistSession: false },
  }
);
