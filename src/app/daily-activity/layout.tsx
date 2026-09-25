import TopNav from "@/components/TopNav";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Daily Activity — Monitoring Ketidakhadiran & Progress",
  description:
    "Monitoring pelaksanaan aktivitas harian gelara, progress mingguan & bulanan, serta rekap ketidakhadiran.",
};

export default function DailyActivityLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen flex flex-col bg-paper">
      <TopNav />
      {children}
    </div>
  );
}
