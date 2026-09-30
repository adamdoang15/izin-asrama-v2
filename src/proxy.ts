import NextAuth from "next-auth";
import { authConfig } from "@/auth.config";

const { auth } = NextAuth(authConfig);

export default auth;

export const config = {
  matcher: [
    "/",
    "/login",
    "/beranda/:path*",
    "/kelola-akun/:path*",
    "/pengaturan/:path*",
    "/daily-activity/:path*",
  ],
};
