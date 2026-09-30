import PublicNav from "@/components/PublicNav";

export default function LoginLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <PublicNav hideLoginButton />
      {children}
    </>
  );
}
