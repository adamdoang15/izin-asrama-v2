import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Izin Asrama",
  description: "Pengajuan dan persetujuan izin keluar lingkungan asrama",
  icons: {
    icon: "/logo.png",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="id" className="h-full">
      <body className="min-h-full flex flex-col font-sans antialiased">
        {children}
      </body>
    </html>
  );
}