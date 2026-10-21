import type { DefaultSession } from "next-auth";

declare module "next-auth" {
  interface User {
    role?: "SANTRI" | "PENGURUS";
    kamar?: string | null;
    pwd_sig?: string;
  }

  interface Session {
    user: {
      id: string;
      role: "SANTRI" | "PENGURUS";
      kamar: string | null;
    } & DefaultSession["user"];
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id?: string;
    role?: "SANTRI" | "PENGURUS";
    kamar?: string | null;
    pwd_sig?: string;
  }
}
