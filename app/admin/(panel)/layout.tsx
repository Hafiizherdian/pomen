import { Suspense } from "react";

import { AdminSidebar } from "@/app/components/admin/admin-sidebar";
import { ThemeToggle } from "@/app/components/theme/theme-toggle";
import { SidebarInset, SidebarProvider, SidebarTrigger } from "@/app/components/ui/sidebar";
import { requireRole } from "@/lib/admin-auth";

async function SidebarLoader() {
  const user = await requireRole("admin");
  return <AdminSidebar role={user.role} />;
}

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <SidebarProvider>
      <Suspense fallback={<AdminSidebar role={null} />}>
        <SidebarLoader />
      </Suspense>
      <SidebarInset>
        <header className="flex h-12 items-center gap-2 px-4">
          <SidebarTrigger className="md:hidden" />
          <ThemeToggle className="ml-auto" />
        </header>
        <div className="mx-auto w-full min-w-0 max-w-6xl flex-1 space-y-6 p-6">{children}</div>
      </SidebarInset>
    </SidebarProvider>
  );
}