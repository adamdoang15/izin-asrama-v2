# [Feature] Dark Mode untuk Web Izin Asrama

**Tipe:** Feature
**Estimasi:** 1–2 hari kerja (untuk developer junior)
**Project:** izin-asrama-v5 (Next.js 16 App Router + Tailwind CSS v4 + TypeScript)

---

## 1. Ringkasan

Tambahkan mode gelap (dark mode) ke seluruh halaman web Izin Asrama, dengan tombol untuk berpindah antara mode **Terang**, **Gelap**, dan **Ikuti Sistem**. Pilihan tema harus tersimpan (persist) sehingga saat pengguna membuka web lagi, tema yang dipilih tetap sama.

Dokumen ini ditulis selangkah demi selangkah agar bisa langsung dikerjakan tanpa perlu banyak keputusan desain tambahan. Ikuti urutan tahapan di bagian 5, jangan lompat urutan, karena tahapan-tahapan awal jadi fondasi untuk tahapan berikutnya.

## 2. Definisi Selesai (Acceptance Criteria)

Fitur dianggap selesai jika semua poin berikut terpenuhi:

- [ ] Ada tombol/kontrol untuk mengganti tema di navbar (baik untuk halaman publik maupun halaman setelah login), dan juga di halaman `/pengaturan`.
- [ ] Pilihan tema: **Terang**, **Gelap**, **Sistem** (mengikuti pengaturan OS/browser pengguna).
- [ ] Pilihan tema tersimpan di `localStorage` dan tetap berlaku setelah refresh halaman atau membuka tab baru.
- [ ] **Tidak ada flash/kedip** warna salah saat halaman pertama kali dimuat (misalnya sudah pilih dark tapi sempat kelihatan putih sepersekian detik lalu baru berubah gelap). Ini disebut FOUC (Flash of Unstyled/Incorrect Content) dan wajib dihindari.
- [ ] Semua halaman berikut sudah dicek tampil benar di kedua mode (terang & gelap), lihat checklist lengkap di bagian 7:
  - `/` (landing/statistik publik)
  - `/login`
  - `/panduan`
  - `/beranda`
  - `/kelola-akun` (khusus role PENGURUS)
  - `/pengaturan`
  - Form pengajuan izin (`IzinForm`), tabel/daftar izin, dropdown akun (`UserMenu`)
- [ ] Kontras warna teks tetap mudah dibaca di mode gelap (tidak ada teks abu-abu gelap di atas latar gelap, dsb).
- [ ] Input `type="date"` dan `type="datetime-local"` (dipakai di `IzinForm.tsx` dan `ExportLaporanForm.tsx`) ikut menyesuaikan ke gaya gelap bawaan browser, bukan tetap putih terang.
- [ ] Tidak ada perubahan pada logika bisnis (perizinan, autentikasi, export excel, dsb) — ini murni perubahan tampilan/UI.

## 3. Konteks Teknis Project (Sudah Dicek, Baca Sebelum Mulai)

Project ini sudah menggunakan **Next.js 16 (App Router)**, **React 19**, dan **Tailwind CSS v4**. Tailwind v4 **tidak punya file `tailwind.config.js`** — semua konfigurasi tema warna didefinisikan langsung di `src/app/globals.css` memakai CSS variable, lewat blok `@theme inline`.

Ini kabar baik: hampir seluruh komponen di project ini **sudah konsisten** memakai nama warna semantik seperti `bg-paper`, `text-ink`, `text-ink-soft`, `border-line`, `bg-teal`, `bg-teal-soft`, `bg-amber-soft`, `bg-sage-soft`, `bg-clay-soft`, dst — bukan warna Tailwind bawaan seperti `bg-white` atau `text-gray-900`. Artinya **kita bisa implementasikan dark mode terutama hanya dengan mengganti nilai CSS variable di satu tempat** (`globals.css`), tanpa perlu mengedit satu-per-satu class di puluhan file komponen.

File kunci yang perlu dipahami sebelum mulai:

```
src/app/globals.css        <- definisi warna (CSS variable) & @theme inline, DI SINI inti perubahan
src/app/layout.tsx         <- root layout, tempat pasang script anti-flash & ThemeProvider
src/components/TopNav.tsx  <- navbar untuk user yang sudah login (server component)
src/components/UserMenu.tsx<- dropdown akun di navbar (client component), tempat pasang toggle
src/components/PublicNav.tsx <- navbar untuk halaman publik/belum login (server component)
src/app/pengaturan/page.tsx<- halaman "Pengaturan Akun", tempat pasang kontrol tema versi lengkap
src/components/icons.tsx   <- kumpulan komponen SVG icon, tempat tambah icon matahari/bulan
```

Isi `globals.css` saat ini (sebagai referensi, jangan dihapus, akan kita tambah bagian baru):

```css
@import "tailwindcss";

:root {
  --paper: #f7f7f4;
  --paper-raised: #ffffff;
  --ink: #1f2420;
  --ink-soft: #5b6660;
  --line: #e2e2dc;

  --teal: #2f6f63;
  --teal-soft: #e7f0ed;

  --amber: #b8863c;
  --amber-soft: #f6ecdb;

  --sage: #5f7d56;
  --sage-soft: #e9efe4;

  --clay: #a8574a;
  --clay-soft: #f5e7e4;
}

@theme inline {
  --color-paper: var(--paper);
  --color-paper-raised: var(--paper-raised);
  --color-ink: var(--ink);
  --color-ink-soft: var(--ink-soft);
  --color-line: var(--line);
  --color-teal: var(--teal);
  --color-teal-soft: var(--teal-soft);
  --color-amber: var(--amber);
  --color-amber-soft: var(--amber-soft);
  --color-sage: var(--sage);
  --color-sage-soft: var(--sage-soft);
  --color-clay: var(--clay);
  --color-clay-soft: var(--clay-soft);
  --font-sans: ui-sans-serif, "Inter", "Segoe UI", system-ui, -apple-system,
    sans-serif;
}

body {
  background: var(--paper);
  color: var(--ink);
}

* {
  border-color: var(--line);
}

::selection {
  background: var(--teal-soft);
  color: var(--teal);
}
```

## 4. Keputusan Arsitektur (Jangan Diubah Tanpa Diskusi)

1. **Strategi dark mode: class-based**, bukan `prefers-color-scheme` murni. Artinya dark mode aktif ketika ada class `dark` di tag `<html>`. Ini dipilih karena kita butuh pengguna bisa **memilih manual** (Terang/Gelap/Sistem), bukan cuma ikut OS.
2. **Penyimpanan pilihan**: `localStorage` dengan key `"theme"`, nilai salah satu dari `"light"`, `"dark"`, `"system"`.
3. **Anti-flash**: dilakukan lewat inline `<script>` kecil yang dijalankan sebelum React hydrate, langsung di `<head>`, karena membaca `localStorage` dan set class `dark` di `<html>` harus terjadi sebelum browser sempat menggambar (paint) halaman.
4. **Sumber warna tetap satu**: kita **tidak** menambahkan prefix `dark:` di setiap className komponen. Cukup override nilai CSS variable (`--paper`, `--ink`, dst) di dalam selector `.dark { ... }` pada `globals.css`. Karena semua komponen sudah memakai token warna ini, perubahan otomatis menyebar ke seluruh app.
5. `dark:` variant Tailwind tetap kita aktifkan (lihat Tahap 1) sebagai "jalan darurat" untuk kasus khusus yang butuh penyesuaian ekstra (contoh: bayangan/shadow, logo), bukan sebagai cara utama.

## 5. Tahapan Implementasi

Kerjakan berurutan dari Tahap 1 ke Tahap 9.

### Tahap 1 — Aktifkan mode `dark:` berbasis class di Tailwind v4

**File:** `src/app/globals.css`

Tailwind v4 secara default memakai `prefers-color-scheme` untuk `dark:`. Kita perlu ubah supaya `dark:` bereaksi terhadap class `.dark`, bukan pengaturan OS. Tambahkan baris ini tepat di bawah `@import "tailwindcss";`:

```css
@import "tailwindcss";

@custom-variant dark (&:where(.dark, .dark *));

:root {
  /* ...tetap seperti sebelumnya... */
}
```

### Tahap 2 — Definisikan palet warna mode gelap

**File:** `src/app/globals.css`

Tambahkan blok `.dark { ... }` **setelah** blok `:root { ... }` yang sudah ada (jangan hapus blok `:root`, itu tetap jadi nilai default/mode terang). Gunakan nilai berikut sebagai titik awal (boleh disesuaikan sedikit saat QA visual di Tahap 8, tapi jangan drastis mengubah hue-nya):

```css
.dark {
  --paper: #14181a;
  --paper-raised: #1c2225;
  --ink: #edf1ee;
  --ink-soft: #9aa6a0;
  --line: #2c3335;

  --teal: #5fb3a1;
  --teal-soft: #1d2f2c;

  --amber: #d6a662;
  --amber-soft: #332a1a;

  --sage: #8fb583;
  --sage-soft: #22301f;

  --clay: #d98b7c;
  --clay-soft: #362320;

  color-scheme: dark;
}
```

Catatan penting soal `color-scheme: dark;` di atas: baris ini **wajib ada**. Tanpa ini, elemen form bawaan browser (`<input type="date">`, `<input type="datetime-local">`, scrollbar) akan tetap tampil putih terang meskipun sisa halaman sudah gelap, karena itu bukan diatur lewat class Tailwind melainkan gaya bawaan browser. Ini relevan langsung untuk `IzinForm.tsx` dan `ExportLaporanForm.tsx` yang memakai kedua tipe input tersebut.

Setelah ini, jalankan `npm run dev`, buka DevTools, lalu di console jalankan `document.documentElement.classList.add('dark')` untuk mengecek sementara apakah warna sudah berganti. Ini cara cepat verifikasi Tahap 1–2 sebelum lanjut membuat toggle sungguhan.

### Tahap 3 — Buat util pengelola tema

**File baru:** `src/lib/theme.ts`

```ts
export type Theme = "light" | "dark" | "system";

export const THEME_STORAGE_KEY = "theme";

export function getSystemTheme(): "light" | "dark" {
  if (typeof window === "undefined") return "light";
  return window.matchMedia("(prefers-color-scheme: dark)").matches
    ? "dark"
    : "light";
}

export function resolveTheme(theme: Theme): "light" | "dark" {
  return theme === "system" ? getSystemTheme() : theme;
}

export function applyTheme(theme: Theme) {
  const resolved = resolveTheme(theme);
  const root = document.documentElement;
  root.classList.toggle("dark", resolved === "dark");
}

export function getStoredTheme(): Theme {
  if (typeof window === "undefined") return "system";
  const stored = window.localStorage.getItem(THEME_STORAGE_KEY);
  if (stored === "light" || stored === "dark" || stored === "system") {
    return stored;
  }
  return "system";
}

export function storeTheme(theme: Theme) {
  window.localStorage.setItem(THEME_STORAGE_KEY, theme);
}
```

### Tahap 4 — Pasang script anti-flash (FOUC) di root layout

**File:** `src/app/layout.tsx`

Script ini harus jalan sebelum React hydrate, jadi ditulis manual sebagai inline `<script>` di `<head>`, bukan lewat `useEffect`. Ubah `layout.tsx` menjadi seperti berikut (tambahkan bagian yang ditandai):

```tsx
import type { Metadata } from "next";
import { PushNotificationManager } from "@/components/PushNotificationManager";
import { ThemeProvider } from "@/components/ThemeProvider"; // BARU
import "./globals.css";

export const metadata: Metadata = {
  title: "Izin Asrama",
  description: "Pengajuan dan persetujuan izin keluar lingkungan asrama",
  icons: {
    icon: "/logo.png",
  },
};

// BARU: script anti-flash, dijalankan paling awal sebelum React hydrate
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
    <html lang="id" className="h-full">
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
```

Penjelasan untuk yang belum familiar: menambahkan tag `<head>` manual di root layout App Router itu diperbolehkan Next.js untuk elemen yang tidak dikelola oleh `metadata` API (seperti inline script ini). Next.js akan tetap menggabungkannya dengan tag `<head>` lain yang dihasilkan dari `export const metadata`.

### Tahap 5 — Buat `ThemeProvider` (context React)

**File baru:** `src/components/ThemeProvider.tsx`

```tsx
"use client";

import { createContext, useContext, useEffect, useState } from "react";
import {
  applyTheme,
  getStoredTheme,
  storeTheme,
  type Theme,
} from "@/lib/theme";

type ThemeContextValue = {
  theme: Theme;
  setTheme: (theme: Theme) => void;
};

const ThemeContext = createContext<ThemeContextValue | null>(null);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = useState<Theme>("system");

  // Sinkronkan state React dengan localStorage saat pertama kali mount
  useEffect(() => {
    setThemeState(getStoredTheme());
  }, []);

  // Terapkan class .dark setiap kali theme berubah
  useEffect(() => {
    applyTheme(theme);
  }, [theme]);

  // Kalau user pilih "system", ikuti perubahan preferensi OS secara live
  useEffect(() => {
    if (theme !== "system") return;
    const media = window.matchMedia("(prefers-color-scheme: dark)");
    const handler = () => applyTheme("system");
    media.addEventListener("change", handler);
    return () => media.removeEventListener("change", handler);
  }, [theme]);

  function setTheme(next: Theme) {
    storeTheme(next);
    setThemeState(next);
  }

  return (
    <ThemeContext.Provider value={{ theme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error("useTheme harus dipakai di dalam <ThemeProvider>");
  return ctx;
}
```

### Tahap 6 — Tambah icon Matahari & Bulan

**File:** `src/components/icons.tsx`

Ikuti gaya icon yang sudah ada di file ini (`viewBox="0 0 24 24"`, `stroke="currentColor"`). Tambahkan dua fungsi baru di akhir file:

```tsx
export function SunIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.8}
      className={className}
    >
      <circle cx="12" cy="12" r="4.2" />
      <path d="M12 2.5v2.4M12 19.1v2.4M4.6 4.6l1.7 1.7M17.7 17.7l1.7 1.7M2.5 12h2.4M19.1 12h2.4M4.6 19.4l1.7-1.7M17.7 6.3l1.7-1.7" />
    </svg>
  );
}

export function MoonIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.8}
      className={className}
    >
      <path d="M20 14.5A8.5 8.5 0 1 1 9.5 4a6.8 6.8 0 0 0 10.5 10.5Z" />
    </svg>
  );
}

export function MonitorIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.8}
      className={className}
    >
      <rect x="2.5" y="4.5" width="19" height="12" rx="1.5" />
      <path d="M8 20.5h8M12 16.5v4" />
    </svg>
  );
}
```

### Tahap 7 — Buat komponen `ThemeToggle` (dua tampilan: ikon & segmented)

**File baru:** `src/components/ThemeToggle.tsx`

Buat satu komponen dengan dua varian tampilan lewat prop `variant`, supaya logikanya tidak duplikat antara navbar dan halaman pengaturan:

- `variant="icon"` → satu tombol bulat kecil di navbar, klik untuk berpindah Terang → Gelap → Sistem → Terang (siklus), dengan `title`/`aria-label` yang menyebutkan mode aktif. Dipakai di `UserMenu.tsx` dan `PublicNav.tsx`.
- `variant="segmented"` → tiga tombol berdampingan dengan label teks "Terang" / "Gelap" / "Sistem", dipakai di halaman `/pengaturan` supaya lebih jelas untuk pengguna.

```tsx
"use client";

import { useTheme } from "./ThemeProvider";
import { MonitorIcon, MoonIcon, SunIcon } from "./icons";
import type { Theme } from "@/lib/theme";

const OPTIONS: { value: Theme; label: string }[] = [
  { value: "light", label: "Terang" },
  { value: "dark", label: "Gelap" },
  { value: "system", label: "Sistem" },
];

function iconFor(theme: Theme, className: string) {
  if (theme === "light") return <SunIcon className={className} />;
  if (theme === "dark") return <MoonIcon className={className} />;
  return <MonitorIcon className={className} />;
}

export default function ThemeToggle({
  variant = "icon",
}: {
  variant?: "icon" | "segmented";
}) {
  const { theme, setTheme } = useTheme();

  if (variant === "segmented") {
    return (
      <div className="inline-flex w-fit rounded-xl border border-line bg-paper p-1">
        {OPTIONS.map((opt) => (
          <button
            key={opt.value}
            type="button"
            onClick={() => setTheme(opt.value)}
            className={`flex items-center gap-1.5 rounded-lg px-3 py-2 text-xs font-medium transition-colors ${
              theme === opt.value
                ? "bg-teal text-paper-raised"
                : "text-ink-soft hover:text-ink"
            }`}
          >
            {iconFor(opt.value, "h-4 w-4")}
            {opt.label}
          </button>
        ))}
      </div>
    );
  }

  function cycle() {
    const order: Theme[] = ["light", "dark", "system"];
    const next = order[(order.indexOf(theme) + 1) % order.length];
    setTheme(next);
  }

  return (
    <button
      type="button"
      onClick={cycle}
      aria-label={`Tema saat ini: ${OPTIONS.find((o) => o.value === theme)?.label}. Klik untuk ganti.`}
      title={`Tema: ${OPTIONS.find((o) => o.value === theme)?.label}`}
      className="grid h-9 w-9 place-items-center rounded-full text-ink-soft hover:bg-paper hover:text-ink transition-colors"
    >
      {iconFor(theme, "h-[18px] w-[18px]")}
    </button>
  );
}
```

### Tahap 8 — Pasang `ThemeToggle` di navbar dan halaman pengaturan

Lakukan tiga perubahan berikut:

**a) `src/components/UserMenu.tsx`** (dropdown akun untuk user yang sudah login)

Tambahkan `<ThemeToggle />` (variant default `"icon"`) di baris tombol ikon yang sudah ada (di sebelah ikon pencarian dan lonceng notifikasi), dan import di bagian atas file:

```tsx
import ThemeToggle from "./ThemeToggle";
```

Letakkan `<ThemeToggle />` sebelum atau sesudah tombol `BellIcon`, mengikuti pola className tombol ikon lain yang sudah ada di file itu.

**b) `src/components/PublicNav.tsx`** (navbar untuk halaman publik/belum login)

`PublicNav` adalah server component (ada `async function`), tapi tetap boleh me-render `ThemeToggle` yang client component — itu valid di Next.js App Router. Tambahkan `<ThemeToggle />` di dalam `<nav>` (untuk user login) maupun di blok `else` (untuk user belum login), sejajar dengan link "Panduan SOP".

**c) `src/app/pengaturan/page.tsx`**

Tambahkan section baru "Tampilan" berisi `<ThemeToggle variant="segmented" />`, mengikuti pola `<section>` yang sudah ada di halaman itu (class `rounded-lg border border-line bg-paper-raised p-5 space-y-4`). Contoh penempatan: setelah section "Informasi Akun", sebelum section "Ganti Kata Sandi".

```tsx
<section className="rounded-lg border border-line bg-paper-raised p-5 space-y-4">
  <div>
    <h2 className="text-base font-semibold tracking-tight">Tampilan</h2>
    <p className="text-xs text-ink-soft mt-1">
      Pilih tampilan terang, gelap, atau ikuti pengaturan perangkat Anda.
    </p>
  </div>
  <ThemeToggle variant="segmented" />
</section>
```

Jangan lupa import `ThemeToggle` (client component) di file `pengaturan/page.tsx` (server component) — ini juga valid, sama seperti poin (b).

### Tahap 9 — Pengecekan detail & kontras (manual QA)

Setelah semua tahap di atas berjalan, cek satu-satu poin ini secara visual di browser (mode terang & gelap):

1. **`StatusPill.tsx`** — titik status (`bg-amber`, `bg-sage`, `bg-clay`, `bg-teal`, `bg-ink-soft`) harus tetap kontras dan mudah dibedakan di atas latar gelap.
2. **`StatsLanding.tsx`** — grafik batang (`bg-teal-soft` sebagai track, `bg-teal` sebagai fill) harus tetap terlihat jelas bedanya di mode gelap; begitu juga kartu `bg-sage-soft` dan `bg-clay-soft` di bagian "Indikator kepulangan".
3. **Shadow/bayangan** (`shadow-sm`, `shadow-lg`, dipakai di `UserMenu.tsx`, `StatsLanding.tsx`, `panduan/page.tsx`) — bayangan hitam bawaan Tailwind biasanya tetap oke di atas latar gelap, tapi cek sekilas apakah kartu terlihat "melayang" wajar atau malah aneh. Kalau kurang pas, boleh perhalus lewat CSS di `globals.css`, contoh:
   ```css
   .dark {
     --tw-shadow-color: rgb(0 0 0 / 0.4);
   }
   ```
4. **Logo (`public/logo.png`)** — cek apakah logo punya latar putih solid (bukan transparan). Kalau iya, logo akan terlihat seperti ada kotak putih di navbar mode gelap. Ini bukan blocker untuk MVP, tapi catat sebagai isu terpisah jika terjadi (solusi: minta versi logo transparan, di luar scope teknis dokumen ini).
5. **Input `date` / `datetime-local`** di `IzinForm.tsx` dan `ExportLaporanForm.tsx` — pastikan kalender popup bawaan browser juga ikut gelap (ini seharusnya otomatis berkat `color-scheme: dark` di Tahap 2).
6. **Refresh test**: pilih mode Gelap, lalu hard refresh (Ctrl+Shift+R) — pastikan tidak ada kedipan putih sebelum berubah gelap.
7. **Mode Sistem**: pilih "Sistem", lalu ganti dark/light mode di pengaturan OS — halaman yang sedang terbuka harus ikut berubah otomatis tanpa reload manual.

## 6. Daftar File yang Akan Dibuat/Diubah

| File | Status |
|---|---|
| `src/app/globals.css` | Diubah (Tahap 1, 2) |
| `src/app/layout.tsx` | Diubah (Tahap 4) |
| `src/lib/theme.ts` | Baru (Tahap 3) |
| `src/components/ThemeProvider.tsx` | Baru (Tahap 5) |
| `src/components/icons.tsx` | Diubah, tambah 3 icon (Tahap 6) |
| `src/components/ThemeToggle.tsx` | Baru (Tahap 7) |
| `src/components/UserMenu.tsx` | Diubah, pasang toggle (Tahap 8a) |
| `src/components/PublicNav.tsx` | Diubah, pasang toggle (Tahap 8b) |
| `src/app/pengaturan/page.tsx` | Diubah, tambah section Tampilan (Tahap 8c) |

## 7. Checklist Pengujian Manual (sebelum PR dianggap selesai)

- [ ] Landing page `/` — mode terang & gelap
- [ ] `/login` — mode terang & gelap, termasuk pesan error (`text-clay`)
- [ ] `/panduan` — mode terang & gelap (halaman ini cukup panjang, scroll semua)
- [ ] `/beranda` sebagai role Gelara (santri) — terang & gelap
- [ ] `/beranda` sebagai role Pengurus (mentor) — terang & gelap
- [ ] `/kelola-akun` — terang & gelap
- [ ] `/pengaturan` — terang & gelap, coba semua 3 opsi tema
- [ ] Form pengajuan izin (`IzinForm`) — cek input datetime-local
- [ ] `ExportLaporanForm` — cek input date
- [ ] Dropdown `UserMenu` terbuka — terang & gelap
- [ ] Tampilan mobile (lebar layar kecil) — terang & gelap
- [ ] Refresh browser tidak ada flash warna salah
- [ ] Tutup & buka tab baru — tema yang dipilih tetap tersimpan
- [ ] Ganti preferensi dark/light di OS saat tema di-set "Sistem" — halaman ikut berubah live

## 8. Di Luar Cakupan (Out of Scope)

- Tidak perlu membuat tema warna lain selain Terang/Gelap (misalnya tema custom per pengguna).
- Tidak perlu mengubah warna file export Excel (`src/lib/excel.ts`) — dokumen yang diexport tetap dengan gaya standar Excel.
- Tidak perlu menambahkan `theme-color` meta tag PWA — project belum punya `manifest.json`, jadi ini tidak relevan untuk saat ini (boleh diajukan sebagai isu terpisah kalau nanti PWA manifest ditambahkan).
- Tidak perlu mengganti logo — cukup dicatat sebagai temuan jika bermasalah secara visual (lihat Tahap 9 poin 4).