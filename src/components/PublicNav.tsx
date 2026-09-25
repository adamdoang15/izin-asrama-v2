import Link from "next/link";
import { auth, signOut } from "@/lib/auth";
import ThemeToggle from "./ThemeToggle";

export default async function PublicNav() {
  const session = await auth();

  return (
    <header className="border-b border-line bg-paper-raised">
      <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">

        {/* Logo + Nama */}
        <Link
          href="/"
          className="flex items-center gap-2 hover:opacity-80 transition-opacity"
        >
          <img
            src="/logo.png"
            alt="Logo Izin Asrama"
            className="h-8 w-8 object-contain"
          />

          <span className="text-[15px] font-semibold tracking-tight">
            Izin Asrama
          </span>
        </Link>

        {session?.user ? (
          <nav className="flex items-center gap-5">
            <Link
              href="/beranda"
              className="text-sm text-ink-soft hover:text-ink transition-colors"
            >
              Beranda
            </Link>

            <ThemeToggle />

            <form
              action={async () => {
                "use server";
                await signOut({ redirectTo: "/" });
              }}
            >
              <button
                type="submit"
                className="text-sm text-ink-soft hover:text-ink transition-colors"
              >
                Keluar
              </button>
            </form>
          </nav>
        ) : (
          <div className="flex items-center gap-5">
            <ThemeToggle />
            <Link
              href="/login"
              className="text-sm font-medium text-paper-raised bg-teal px-4 py-2 rounded-md hover:opacity-90 transition-opacity"
            >
              Masuk
            </Link>
          </div>
        )}
      </div>
    </header>
  );
}
