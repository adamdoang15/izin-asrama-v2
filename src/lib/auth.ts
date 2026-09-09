import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { authConfig } from "@/auth.config";
import { supabase } from "@/lib/supabase";
import type { UserRow } from "@/lib/types";

export const { handlers, signIn, signOut, auth } = NextAuth({
  ...authConfig,
  providers: [
    Credentials({
      credentials: {
        username: { label: "Username", type: "text" },
        password: { label: "Kata sandi", type: "password" },
      },
      authorize: async (credentials) => {
        const username = credentials?.username as string | undefined;
        const password = credentials?.password as string | undefined;
        if (!username || !password) return null;

        const { data: user } = await supabase
          .from("users")
          .select("*")
          .eq("username", username).eq("is_active", true)
          .maybeSingle<UserRow>();
        if (!user) return null;

        const valid = bcrypt.compareSync(password, user.password_hash);
        if (!valid) return null;

        return {
          id: String(user.id),
          name: user.name,
          role: user.role,
          kamar: user.kamar,
        };
      },
    }),
  ],
});
