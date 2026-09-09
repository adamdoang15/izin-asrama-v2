import TopNav from "@/components/TopNav";

export default function KelolaAkunLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <TopNav />
      {children}
    </>
  );
}
