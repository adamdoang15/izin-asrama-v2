import type { NextAuthConfig } from "next-auth";

/**
 * This config is intentionally free of anything that touches the database.
 * Database access stays in server-side actions/components.
 * It's used directly by middleware.ts for route protection, and spread
 * into the full config in src/lib/auth.ts which adds the Credentials
 * provider for actual sign-in.
 */
export const authConfig: NextAuthConfig = {
  pages: {
    signIn: "/login",
  },
  session: {
    strategy: "jwt",
  },
  providers: [],
  callbacks: {
    authorized({ auth, request: { nextUrl } }) {
      const isLoggedIn = !!auth?.user;
      const role = auth?.user?.role;

      const isKelolaAkunRoute = nextUrl.pathname.startsWith("/kelola-akun");
      const isBerandaRoute = nextUrl.pathname.startsWith("/beranda");
      const isPengaturanRoute = nextUrl.pathname.startsWith("/pengaturan");

      if (isKelolaAkunRoute) {
        if (!isLoggedIn) return false;
        if (role !== "PENGURUS") {
          return Response.redirect(new URL("/beranda", nextUrl));
        }
        return true;
      }

      if (isBerandaRoute || isPengaturanRoute) {
        return isLoggedIn;
      }

      return true;
    },
    jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = user.role;
        token.kamar = user.kamar ?? null;
      }
      return token;
    },
    session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
        session.user.role = token.role as "SANTRI" | "PENGURUS";
        session.user.kamar = (token.kamar as string | null) ?? null;
      }
      return session;
    },
  },
};
