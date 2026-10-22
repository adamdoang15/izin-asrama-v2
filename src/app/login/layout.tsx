import PublicNav from "@/components/PublicNav";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";

export default async function LoginLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();
  if (session?.user) {
    if (session.user.role === "PENGURUS") {
      redirect("/kelola-akun");
    }
    redirect("/beranda");
  }

  return (
    <>
      <PublicNav hideLoginButton />
      {children}
    </>
  );
}
