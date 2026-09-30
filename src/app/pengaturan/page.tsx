import { redirect } from "next/navigation";
import Link from "next/link";
import { auth } from "@/lib/auth";
import ChangePasswordForm from "@/components/ChangePasswordForm";
import ThemeToggle from "@/components/ThemeToggle";

export default async function PengaturanPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const { name, role, kamar } = session.user;

  return (
    <main className="flex-1 max-w-4xl mx-auto w-full px-6 py-12 md:py-20 space-y-12 relative z-10">
      
      {/* Navigation & Bold Header */}
      <div className="max-w-2xl">
        <Link
          href="/beranda"
          className="inline-flex items-center justify-center rounded-full bg-white/40 dark:bg-ink/10 backdrop-blur-md px-4 py-1.5 text-xs font-bold uppercase tracking-widest text-ink hover:bg-white/70 dark:hover:bg-ink/20 transition-all mb-8 shadow-sm border border-line/50"
        >
          ← Beranda
        </Link>
        <h1 className="text-5xl md:text-7xl font-bold tracking-tighter text-ink leading-tight">
          Pengaturan.
        </h1>
        <p className="mt-4 text-lg font-medium leading-relaxed text-ink-soft md:text-xl">
          Kelola preferensi akun, tampilan antarmuka, dan keamanan profil Anda.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-start">
        {/* Profile Summary Panel */}
        <section className="md:col-span-4 glass-panel p-8 md:p-10 flex flex-col items-center text-center">
          <div className="h-24 w-24 rounded-full bg-teal-soft/80 backdrop-blur-md border border-teal/20 text-4xl font-black text-teal shadow-sm flex items-center justify-center mb-6">
            {name?.[0]?.toUpperCase() ?? "U"}
          </div>
          <h2 className="text-xl font-bold tracking-tight text-ink">{name ?? "-"}</h2>
          <span className="mt-2 inline-block px-3 py-1 rounded-md text-[10px] font-bold uppercase tracking-widest bg-ink text-paper-raised">
            {role === "PENGURUS" ? "Pengurus" : "Gelara"}
          </span>
          {kamar && (
            <p className="mt-6 text-sm font-semibold text-ink-soft border-t border-line/50 pt-6 w-full">
              Kamar: <span className="text-ink">{kamar}</span>
            </p>
          )}
        </section>

        {/* Settings Forms */}
        <div className="md:col-span-8 space-y-8">
          
          <section className="glass-panel p-8 md:p-10">
            <div className="mb-8 border-b border-line/50 pb-6">
              <h2 className="text-sm font-bold uppercase tracking-widest text-teal mb-1">Personalisasi</h2>
              <p className="text-2xl font-bold tracking-tight text-ink">Tampilan Tema</p>
              <p className="text-sm font-medium text-ink-soft mt-2">
                Sesuaikan skema warna antarmuka dengan preferensi kenyamanan mata Anda.
              </p>
            </div>
            <div className="max-w-xs">
              <ThemeToggle variant="segmented" />
            </div>
          </section>

          <section className="glass-panel p-8 md:p-10">
            <div className="mb-8 border-b border-line/50 pb-6">
              <h2 className="text-sm font-bold uppercase tracking-widest text-clay mb-1">Keamanan</h2>
              <p className="text-2xl font-bold tracking-tight text-ink">Ganti Kata Sandi</p>
              <p className="text-sm font-medium text-ink-soft mt-2">
                Amankan akun Anda secara berkala. Pastikan menggunakan kombinasi kata sandi yang kuat.
              </p>
            </div>
            <ChangePasswordForm />
          </section>

        </div>
      </div>
    </main>
  );
}
