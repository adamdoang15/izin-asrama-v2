import type { Metadata } from "next";
import { PushNotificationManager } from "@/components/PushNotificationManager";
import { ThemeProvider } from "@/components/ThemeProvider";
import "./globals.css";

export const metadata: Metadata = {
  title: "Izin Asrama",
  description: "Pengajuan dan persetujuan izin keluar lingkungan asrama",
  icons: {
    icon: "/logo.png",
  },
};

// script anti-flash, dijalankan paling awal sebelum React hydrate
const themeInitScript = `
(function () {
  try {
    var stored = localStorage.getItem("theme");
    var isDark =
      stored === "dark" ||
      (stored !== "light" &&
        window.matchMedia("(prefers-color-scheme: dark)").matches);
    if (isDark) document.documentElement.classList.add("dark");
  } catch (e) {}
})();
`;

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="id" className="h-full" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeInitScript }} />
      </head>
      <body className="min-h-full flex flex-col font-sans antialiased">
        <ThemeProvider>
          <PushNotificationManager />
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}