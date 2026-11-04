"use client";

import { Suspense } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { FolderKanban, Home, LayoutList, Layers } from "lucide-react";

import {
  Sidebar,
  SidebarCollapsible,
  SidebarCollapsibleContent,
  SidebarCollapsibleTrigger,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
  SidebarSeparator,
} from "@/app/components/ui/sidebar";

type SidebarProject = { id: string; name: string; slug: string };

const mainNav = [
  { title: "Dashboard", href: "/", icon: Home },
  { title: "Pilar Konten", href: "/pilar", icon: Layers },
  { title: "Project", href: "/projects", icon: LayoutList },
];

/** Isi menu. `pathname` null = belum diketahui (tidak ada item yang aktif). */
function NavContent({
  projects,
  pathname,
}: {
  projects: SidebarProject[];
  pathname: string | null;
}) {
  return (
    <SidebarContent>
      <SidebarGroup>
        <SidebarGroupLabel>Menu</SidebarGroupLabel>
        <SidebarGroupContent>
          <SidebarMenu>
            {mainNav.map((item) => (
              <SidebarMenuItem key={item.href}>
                <SidebarMenuButton
                  as={Link}
                  href={item.href}
                  isActive={pathname === item.href}
                  tooltip={item.title}
                >
                  <item.icon />
                  <span>{item.title}</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
            ))}
          </SidebarMenu>
        </SidebarGroupContent>
      </SidebarGroup>

      <SidebarSeparator />

      <SidebarCollapsible defaultOpen>
        <SidebarGroup>
          <SidebarGroupLabel as={SidebarCollapsibleTrigger}>Project</SidebarGroupLabel>
          <SidebarCollapsibleContent>
            <SidebarGroupContent>
              <SidebarMenu>
                {projects.map((project) => {
                  const href = `/projects/${project.slug}`;
                  return (
                    <SidebarMenuItem key={project.id}>
                      <SidebarMenuButton
                        as={Link}
                        href={href}
                        isActive={pathname === href}
                        tooltip={project.name}
                      >
                        <FolderKanban />
                        <span>{project.name}</span>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  );
                })}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarCollapsibleContent>
        </SidebarGroup>
      </SidebarCollapsible>
    </SidebarContent>
  );
}

/** Satu-satunya tempat yang memakai usePathname(), jadi harus dibungkus Suspense. */
function ActiveNavContent({ projects }: { projects: SidebarProject[] }) {
  const pathname = usePathname();
  return <NavContent projects={projects} pathname={pathname} />;
}

export function AppSidebar({
  projects,
  ...props
}: React.ComponentProps<typeof Sidebar> & { projects: SidebarProject[] }) {
  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton as={Link} href="/" size="lg">
              <Image
                src="/logo-cgkn.png"
                alt="Logo CGKN"
                width={32}
                height={32}
                priority
                className="size-8 shrink-0 rounded-md object-contain"
              />
              <div className="grid flex-1 text-left leading-tight group-data-[collapsible=icon]:hidden">
                <span className="truncate text-sm font-semibold">CGKN</span>
                <span className="truncate text-xs text-muted">Project Management</span>
              </div>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>

      <Suspense fallback={<NavContent projects={projects} pathname={null} />}>
        <ActiveNavContent projects={projects} />
      </Suspense>

      <SidebarRail />
    </Sidebar>
  );
}