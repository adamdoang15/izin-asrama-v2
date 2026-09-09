import TopNav from "@/components/TopNav";

export default function BerandaLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <TopNav />
      {children}
    </>
  );
}
