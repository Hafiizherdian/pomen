import { Suspense } from "react";
import { LogOut } from "lucide-react";

import { logoutAdmin } from "@/app/admin-actions";
import { AdminNav } from "@/app/components/admin/admin-nav";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex-1 space-y-6 p-6">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold">Admin</h1>
          <p className="text-sm text-muted">
            Kelola anggota tim, master data, group, dan laporan
          </p>
        </div>
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

      {/* usePathname() di AdminNav butuh Suspense (cacheComponents). */}
      <Suspense fallback={<div className="h-10 border-b border-border" />}>
        <AdminNav />
      </Suspense>

      {children}
    </div>
  );
}