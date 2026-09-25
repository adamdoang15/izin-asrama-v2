import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import PublicNav from "@/components/PublicNav";
import StatsLanding from "@/components/StatsLanding";
import { supabase } from "@/lib/supabase";

export const metadata: Metadata = {
  title: "Perizinan Gelara | Izin Asrama",
  description: "Halaman perizinan gelaran secara real-time.",
  openGraph: {
    title: "Perizinan Gelara | Izin Asrama",
    description: "Halaman perizinan gelaran secara real-time.",
  },
};

export default async function LandingPage() {
  const session = await auth();
  if (session?.user) {
    redirect("/beranda");
  }

  // Only pull the last 5 years of history, capped at 5000 rows.
  const fiveYearsAgo = new Date();
  fiveYearsAgo.setFullYear(fiveYearsAgo.getFullYear() - 5);

  const [{ data: izinRows }, { count: totalSantri }] = await Promise.all([
    supabase
      .from("izin")
      .select("tanggal_keluar,status,returned_at,return_status")
      .gte("tanggal_keluar", fiveYearsAgo.toISOString())
      .order("tanggal_keluar", { ascending: false })
      .limit(5000),
    supabase
      .from("users")
      .select("id", { count: "exact", head: true })
      .eq("role", "SANTRI")
      .eq("is_active", true),
  ]);

  return (
    <>
      <PublicNav />
      <StatsLanding rows={izinRows ?? []} totalSantri={totalSantri ?? 0} />
      <footer className="border-t border-line bg-paper-raised">
        <div className="mx-auto max-w-6xl px-6 py-6 text-xs text-ink-soft">
          <span>Izin Asrama</span>
        </div>
      </footer>
    </>
  );
}
