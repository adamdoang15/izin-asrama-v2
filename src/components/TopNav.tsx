
import Link from "next/link";
import { auth, signOut } from "@/lib/auth";
import UserMenu from "./UserMenu";

export default async function TopNav() {
  const session = await auth();
  if (!session?.user) return null;

  const { name, role, kamar } = session.user;
  const isPengurus = role === "PENGURUS";

  const subtitle = kamar ? kamar : isPengurus ? "Mentor" : "Gelara";

  async function handleSignOut() {
    "use server";
    await signOut({ redirectTo: "/login" });
  }

  return (
    <header className="sticky top-0 z-20 border-b border-line bg-paper-raised">
      <div className="mx-auto flex max-w-5xl items-center justify-between gap-4 px-6 py-3">

        {/* Logo + Nama */}
        <Link
          href="/beranda"
          className="flex items-center gap-2 hover:opacity-80 transition-opacity"
        >
          <img
            src="/logo.png"
            alt="Logo Izin Asrama"
            className="h-8 w-8 object-contain"
          />
          <p className="text-[15px] font-semibold tracking-tight">
            Izin Asrama
          </p>
        </Link>

        <UserMenu
          name={name ?? "Pengguna"}
          subtitle={subtitle}
          berandaHref="/beranda"
          dailyActivityHref="/daily-activity"
          kelolaAkunHref={isPengurus ? "/kelola-akun" : undefined}
          pengaturanHref={!isPengurus ? "/pengaturan" : undefined}
          showEkspor={isPengurus}
          onSignOut={handleSignOut}
        />
      </div>
    </header>
  );
}
