"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { DashboardIcon, UsersIcon } from "./icons";

const ICONS = {
  dashboard: DashboardIcon,
  users: UsersIcon,
} as const;

type NavItem = {
  href: string;
  label: string;
  icon: keyof typeof ICONS;
};

export default function NavLinks({ items }: { items: NavItem[] }) {
  const pathname = usePathname();

  return (
    <nav className="flex items-center gap-1 rounded-full bg-paper p-1">
      {items.map((item) => {
        const active = pathname === item.href || pathname?.startsWith(item.href + "/");
        const Icon = ICONS[item.icon];
        return (
          <Link
            key={item.href}
            href={item.href}
            className={`flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium transition-colors ${
              active
                ? "bg-ink text-paper-raised"
                : "text-ink-soft hover:text-ink"
            }`}
          >
            <Icon className="h-4 w-4" />
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
