import Link from "next/link";
import { Suspense } from "react";
import { ArrowLeft, LogOut } from "lucide-react";

import { logoutAdmin } from "@/app/admin-actions";
import { AdminNav } from "@/app/components/admin/admin-nav";
import { ThemeToggle } from "@/app/components/theme/theme-toggle";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="mx-auto w-full max-w-6xl flex-1 space-y-6 p-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <Link
            href="/"
            className="inline-flex items-center gap-1 text-xs text-muted transition-colors hover:text-foreground"
          >
            <ArrowLeft className="size-3.5" />
            Kembali ke aplikasi
          </Link>
          <h1 className="mt-1 text-2xl font-semibold">Admin</h1>
          <p className="text-sm text-muted">
            Kelola anggota tim, master data, group, impor data, dan laporan
          </p>
        </div>
        <div className="flex items-center gap-1">
          <ThemeToggle />
          <form action={logoutAdmin}>
            <button
              type="submit"
              className="inline-flex h-9 items-center gap-2 rounded-lg px-3 text-sm text-muted transition-colors hover:bg-default hover:text-foreground"
            >
              <LogOut className="size-4" />
              Keluar
            </button>
          </form>
        </div>
      </div>

      {/* usePathname() di AdminNav butuh Suspense (cacheComponents). */}
      <Suspense fallback={<div className="h-10 border-b border-border" />}>
        <AdminNav />
      </Suspense>

      {children}
    </div>
  );
}