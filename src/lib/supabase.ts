import { createClient } from "@supabase/supabase-js";

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

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceRoleKey) {
  throw new Error(
    "Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY environment variables. " +
      "Copy .env.example to .env.local and fill in your Supabase project credentials."
  );
}

export const supabase = createClient(supabaseUrl, supabaseServiceRoleKey, {
  auth: { persistSession: false },
});
