import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { authConfig } from "@/auth.config";
import { getUserByUsername, getUserById } from "@/services/user.service";

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

        const user = await getUserByUsername(username);
        if (!user) return null;

        const valid = bcrypt.compareSync(password, user.password_hash);
        if (!valid) return null;

        return {
          id: String(user.id),
          name: user.name,
          role: user.role,
          kamar: user.kamar,
          pwd_sig: user.password_hash.slice(-10),
        };
      },
    }),
  ],
  callbacks: {
    ...authConfig.callbacks,
    async jwt({ token, user }) {
      // Saat pertama kali login
      if (user) {
        token.id = user.id;
        token.role = user.role;
        token.kamar = user.kamar ?? null;
        token.pwd_sig = user.pwd_sig;
        return token;
      }

      // Setiap request: jika kata sandi telah diubah di database, batalkan sesi
      if (token.id) {
        const dbUser = await getUserById(Number(token.id));
        if (!dbUser) return null;

        // Jika sesi lama belum memiliki pwd_sig, inisialisasi agar tidak terjadi redirect loop
        if (!token.pwd_sig) {
          token.pwd_sig = dbUser.password_hash.slice(-10);
        } else if (dbUser.password_hash.slice(-10) !== token.pwd_sig) {
          return null; // Kata sandi telah diubah -> otomatis logout
        }
      }

      return token;
    },
    async session({ session, token }) {
      if (!token || !session.user) return session;
      session.user.id = token.id as string;
      session.user.role = token.role as "SANTRI" | "PENGURUS";
      session.user.kamar = (token.kamar as string | null) ?? null;
      return session;
    },
  },
});
