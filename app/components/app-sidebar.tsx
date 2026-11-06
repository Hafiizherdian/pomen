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
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
  SidebarTrigger,
} from "@/app/components/ui/sidebar";
import { FolderIcon } from "@/app/components/ui/folder-icon";

type SidebarProject = { id: string; name: string; slug: string; group_id: string | null };
type SidebarGroupData = { id: string; name: string; color: string };

const mainNav = [
  { title: "Dashboard", href: "/", icon: Home },
  { title: "Pilar Konten", href: "/pilar", icon: Layers },
  { title: "Project", href: "/projects", icon: LayoutList },
];

/** Isi menu. `pathname` null = belum diketahui (tidak ada item yang aktif). */
function NavContent({
  projects,
  groups,
  pathname,
}: {
  projects: SidebarProject[];
  groups: SidebarGroupData[];
  pathname: string | null;
}) {
  // Satu bagian per group (yang berisi project), lalu project tanpa group.
  const sections = [
    ...groups.map((group) => ({
      id: group.id as string | null,
      name: group.name as string | null,
      color: group.color as string | null,
      items: projects.filter((p) => p.group_id === group.id),
    })),
    {
      id: null as string | null,
      name: groups.length > 0 ? "Tanpa group" : null,
      color: null as string | null,
      items: projects.filter((p) => !p.group_id),
    },
  ].filter((section) => section.items.length > 0);

  return (
    <SidebarContent>
      {/* --- MENU UTAMA --- */}
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

      {/* --- MENU PROJECT (BISA DI-COLLAPSE PER FOLDER) --- */}
      <SidebarGroup>
        <SidebarGroupLabel>Project</SidebarGroupLabel>
        <SidebarGroupContent>
          <SidebarMenu>
            {sections.map((section) => (
              <SidebarMenuItem key={section.id ?? "none"}>
                <SidebarCollapsible defaultOpen>
                  
                  {/* TRIGGER (TOMBOL FOLDER) */}
                    {section.name && (
                    <SidebarMenuButton as={SidebarCollapsibleTrigger} className="font-medium">
                        {section.color && (
                        <FolderIcon 
                            color={section.color} 
                            className="size-4 shrink-0" 
                        />
                        )}
                        <span>{section.name}</span>
                    </SidebarMenuButton>
                    )}
                  
                  {/* ISI FOLDER (DAFTAR PROJECT) */}
                  <SidebarCollapsibleContent>
                    <SidebarMenuSub>
                      {section.items.map((project) => {
                        const href = `/projects/${project.slug}`;
                        return (
                          <SidebarMenuSubItem key={project.id}>
                            <SidebarMenuSubButton
                              as={Link}
                              href={href}
                              isActive={pathname === href}
                            >
                              {section.color && (
                                <FolderIcon 
                                    color={section.color} 
                                    className="size-4 shrink-0" 
                                />
                                )}
                              <span>{project.name}</span>
                            </SidebarMenuSubButton>
                          </SidebarMenuSubItem>
                        );
                      })}
                    </SidebarMenuSub>
                  </SidebarCollapsibleContent>
                  
                </SidebarCollapsible>
              </SidebarMenuItem>
            ))}

          </SidebarMenu>

        </SidebarGroupContent>
      </SidebarGroup>
    </SidebarContent>
  );
}

/** Satu-satunya tempat yang memakai usePathname(), jadi harus dibungkus Suspense. */
function ActiveNavContent({
  projects,
  groups,
}: {
  projects: SidebarProject[];
  groups: SidebarGroupData[];
}) {
  const pathname = usePathname();
  return <NavContent projects={projects} groups={groups} pathname={pathname} />;
}

export function AppSidebar({
  projects,
  groups,
  ...props
}: React.ComponentProps<typeof Sidebar> & {
  projects: SidebarProject[];
  groups: SidebarGroupData[];
}) {
  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem className="flex items-center gap-2">
            {/* Link dipisah dari Trigger */}
            <SidebarMenuButton as={Link} href="/" size="lg" className="flex-1">
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
                <span className="truncate text-xs text-muted">DIGIMONSTAH</span>
              </div>
            </SidebarMenuButton>
            
            {/* Posisikan Trigger di luar SidebarMenuButton (Link) */}
            <SidebarTrigger />
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>

      <Suspense
        fallback={<NavContent projects={projects} groups={groups} pathname={null} />}
      >
        <ActiveNavContent projects={projects} groups={groups} />
      </Suspense>

      <SidebarRail />
    </Sidebar>
  );
}