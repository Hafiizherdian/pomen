"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

const items = [
  { href: "/admin", label: "Ringkasan", exact: true },
  { href: "/admin/anggota", label: "Anggota Tim" },
  { href: "/admin/master-data", label: "Data status & jenis" },
  { href: "/admin/group", label: "Group" },
  { href: "/admin/impor", label: "Impor data" },
  { href: "/admin/laporan", label: "Laporan" },
];

/** Memakai usePathname(), jadi harus dibungkus Suspense di layout. */
export function AdminNav() {
  const pathname = usePathname();

  return (
    <nav aria-label="Menu admin" className="flex flex-wrap gap-1 border-b border-border">
      {items.map((item) => {
        const active = item.exact
          ? pathname === item.href
          : pathname === item.href || pathname.startsWith(`${item.href}/`);
        return (
          <Link
            key={item.href}
            href={item.href}
            aria-current={active ? "page" : undefined}
            className={cn(
              "-mb-px border-b-2 px-3 py-2 text-sm transition-colors",
              active
                ? "border-accent font-medium text-foreground"
                : "border-transparent text-muted hover:text-foreground",
            )}
          >
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}