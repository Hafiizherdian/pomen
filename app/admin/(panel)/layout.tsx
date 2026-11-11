import { AdminSidebar } from "@/app/components/admin/admin-sidebar";
import { ThemeToggle } from "@/app/components/theme/theme-toggle";
import { SidebarInset, SidebarProvider, SidebarTrigger } from "@/app/components/ui/sidebar";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <SidebarProvider>
      <AdminSidebar />
      <SidebarInset>
        <header className="flex h-12 items-center gap-2 px-4">
          {/* Di mobile sidebar berupa drawer, jadi tombol bukanya ada di sini. */}
          <SidebarTrigger className="md:hidden" />
          <ThemeToggle className="ml-auto" />
        </header>
        <div className="mx-auto w-full min-w-0 max-w-6xl flex-1 space-y-6 p-6">{children}</div>
      </SidebarInset>
    </SidebarProvider>
  );
}