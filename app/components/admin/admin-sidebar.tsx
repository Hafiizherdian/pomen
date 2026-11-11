"use client";

import { Suspense } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  ArrowLeft,
  FolderKanban,
  Layers,
  LayoutDashboard,
  LayoutList,
  LogOut,
  Upload,
  Users,
} from "lucide-react";

import { logoutAdmin } from "@/app/admin-actions";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
  SidebarSeparator,
  SidebarTrigger,
} from "@/app/components/ui/sidebar";
import Image from "next/image";

const items = [
  { href: "/admin", title: "Ringkasan", icon: LayoutDashboard, exact: true },
  { href: "/admin/anggota", title: "Anggota Tim", icon: Users },
  { href: "/admin/master-data", title: "Data status & jenis", icon: Layers },
  { href: "/admin/group", title: "Group", icon: FolderKanban },
  { href: "/admin/impor", title: "Impor data", icon: Upload },
  { href: "/admin/laporan", title: "Laporan", icon: LayoutList },
];

/** `pathname` null = belum diketahui (tidak ada item yang aktif). */
function NavContent({ pathname }: { pathname: string | null }) {
  return (
    <SidebarContent>
      <SidebarGroup>
        <SidebarGroupLabel>Atur en wes sak enakmu gi</SidebarGroupLabel>
        <SidebarGroupContent>
          <SidebarMenu>
            {items.map((item) => {
              const active =
                pathname !== null &&
                (item.exact
                  ? pathname === item.href
                  : pathname === item.href || pathname.startsWith(`${item.href}/`));
              return (
                <SidebarMenuItem key={item.href}>
                  <SidebarMenuButton
                    as={Link}
                    href={item.href}
                    isActive={active}
                    tooltip={item.title}
                  >
                    <item.icon />
                    <span>{item.title}</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              );
            })}
          </SidebarMenu>
        </SidebarGroupContent>
      </SidebarGroup>
    </SidebarContent>
  );
}

/** Satu-satunya tempat yang memakai usePathname(), jadi harus dibungkus Suspense. */
function ActiveNavContent() {
  const pathname = usePathname();
  return <NavContent pathname={pathname} />;
}

export function AdminSidebar(props: React.ComponentProps<typeof Sidebar>) {
  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader>
  <SidebarMenu>
    <SidebarMenuItem className="flex items-center gap-2 group-data-[collapsible=icon]:flex-col">
      <SidebarMenuButton
        as={Link}
        href="/admin"
        size="lg"
        className="flex-1 group-data-[collapsible=icon]:flex-none"
      >
        <Image
          src="/logo-cgkn.png"
          alt="Logo CGKN"
          width={32}
          height={32}
          priority
          className="size-8 shrink-0 rounded-md object-contain"
        />
        <div className="grid flex-1 text-left leading-tight group-data-[collapsible=icon]:hidden">
          <span className="truncate text-sm font-semibold">Admin</span>
          <span className="truncate text-xs text-muted">CGKN DIGIMAR</span>
        </div>
      </SidebarMenuButton>

      <SidebarTrigger />
    </SidebarMenuItem>
  </SidebarMenu>
</SidebarHeader>

      <Suspense fallback={<NavContent pathname={null} />}>
        <ActiveNavContent />
      </Suspense>

      <SidebarSeparator />
      <SidebarFooter>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton as={Link} href="/" tooltip="Kembali ke aplikasi">
              <ArrowLeft />
              <span>Kembali ke aplikasi</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
        <form action={logoutAdmin}>
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton type="submit" tooltip="Keluar">
                <LogOut />
                <span>Keluar</span>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </form>
      </SidebarFooter>

      <SidebarRail />
    </Sidebar>
  );
}