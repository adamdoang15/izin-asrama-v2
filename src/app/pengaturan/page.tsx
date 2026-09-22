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
    <main className="flex-1 max-w-3xl mx-auto w-full px-6 py-10 space-y-8">
      <div>
        <Link
          href="/beranda"
          className="inline-flex items-center text-sm text-teal hover:underline mb-3"
        >
          ← Kembali ke Beranda
        </Link>
        <h1 className="text-xl font-semibold tracking-tight">Pengaturan Akun</h1>
        <p className="text-sm text-ink-soft mt-1">
          Kelola kata sandi dan informasi profil akun Anda.
        </p>
      </div>

      <section className="rounded-lg border border-line bg-paper-raised p-5 space-y-4">
        <h2 className="text-base font-semibold tracking-tight">Informasi Akun</h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-sm">
          <div>
            <span className="block text-xs text-ink-soft mb-0.5">Nama</span>
            <span className="font-medium text-ink">{name ?? "-"}</span>
          </div>
          <div>
            <span className="block text-xs text-ink-soft mb-0.5">Peran</span>
            <span className="font-medium text-ink">
              {role === "PENGURUS" ? "Mentor / Pengurus" : "Gelara"}
            </span>
          </div>
          {kamar && (
            <div>
              <span className="block text-xs text-ink-soft mb-0.5">Kamar</span>
              <span className="font-medium text-ink">{kamar}</span>
            </div>
          )}
        </div>
      </section>

      <section className="rounded-lg border border-line bg-paper-raised p-5 space-y-4">
        <div>
          <h2 className="text-base font-semibold tracking-tight">Tampilan</h2>
          <p className="text-xs text-ink-soft mt-1">
            Pilih tampilan terang, gelap, atau ikuti pengaturan perangkat Anda.
          </p>
        </div>
        <ThemeToggle variant="segmented" />
      </section>

      <section className="rounded-lg border border-line bg-paper-raised p-5 space-y-4">
        <div>
          <h2 className="text-base font-semibold tracking-tight">Ganti Kata Sandi</h2>
          <p className="text-xs text-ink-soft mt-1">
            Masukkan kata sandi saat ini untuk memverifikasi identitas Anda sebelum menetapkan kata sandi baru.
          </p>
        </div>
        <ChangePasswordForm />
      </section>
    </main>
  );
}
