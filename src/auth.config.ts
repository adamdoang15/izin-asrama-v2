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

      const isRootRoute = nextUrl.pathname === "/";
      const isLoginRoute = nextUrl.pathname === "/login";
      const isKelolaAkunRoute = nextUrl.pathname.startsWith("/kelola-akun");
      const isBerandaRoute = nextUrl.pathname.startsWith("/beranda");
      const isPengaturanRoute = nextUrl.pathname.startsWith("/pengaturan");
      const isDailyActivityRoute = nextUrl.pathname.startsWith("/daily-activity");

      // Jika pengguna sudah login, membuka halaman awal (/) atau login (/login)
      // akan langsung dialihkan ke /beranda
      if (isLoggedIn && (isRootRoute || isLoginRoute)) {
        return Response.redirect(new URL("/beranda", nextUrl));
      }

      if (isKelolaAkunRoute) {
        if (!isLoggedIn) return false;
        if (role !== "PENGURUS") {
          return Response.redirect(new URL("/beranda", nextUrl));
        }
        return true;
      }

      if (isBerandaRoute || isPengaturanRoute || isDailyActivityRoute) {
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
