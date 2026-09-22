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
