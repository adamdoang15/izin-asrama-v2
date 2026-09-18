
import Link from "next/link";
import { auth, signOut } from "@/lib/auth";
import NavLinks from "./NavLinks";
import UserMenu from "./UserMenu";

export default async function TopNav() {
  const session = await auth();
  if (!session?.user) return null;

  const { name, role, kamar } = session.user;
  const isPengurus = role === "PENGURUS";

  const navItems: {
    href: string;
    label: string;
    icon: "dashboard" | "users";
  }[] = [
    { href: "/beranda", label: "Beranda", icon: "dashboard" },
    ...(isPengurus
      ? [
          {
            href: "/kelola-akun",
            label: "Kelola akun",
            icon: "users" as const,
          },
        ]
      : []),
  ];

  const showNav = navItems.length > 1;

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

        {showNav && (
          <div className="hidden md:flex">
            <NavLinks items={navItems} />
          </div>
        )}

        <UserMenu
          name={name ?? "Pengguna"}
          subtitle={subtitle}
          showSearch={isPengurus}
          pengaturanHref="/pengaturan"
          kelolaAkunHref={isPengurus ? "/kelola-akun" : undefined}
          onSignOut={handleSignOut}
        />
      </div>

      {showNav && (
        <div className="border-t border-line px-4 py-2 md:hidden">
          <NavLinks items={navItems} />
        </div>
      )}
    </header>
  );
}
