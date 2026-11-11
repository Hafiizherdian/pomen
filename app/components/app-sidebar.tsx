"use client";

import { Suspense } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { AtSign, Home, LayoutList, Layers } from "lucide-react";

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

type SidebarProject = {
  id: string;
  name: string;
  slug: string;
  group_id: string | null;
  akun: string | null;
};
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
  accounts,
  pathname,
}: {
  projects: SidebarProject[];
  groups: SidebarGroupData[];
  accounts: string[];
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

  // Satu bagian per akun: urutan dari halaman Pilar Konten, lalu akun lain yang ada di data project, lalu project tanpa akun.
  const groupColor = new Map(groups.map((g) => [g.id, g.color]));
  const extraAkun = [...new Set(projects.map((p) => p.akun?.trim() ?? "").filter(Boolean))]
    .filter((name) => !accounts.includes(name))
    .sort();
  const akunSections: { name: string | null; items: SidebarProject[] }[] = [
    ...[...accounts, ...extraAkun].map((name) => ({
      name: name as string | null,
      items: projects.filter((p) => p.akun?.trim() === name),
    })),
    { name: null, items: projects.filter((p) => !p.akun?.trim()) },
  ].filter((section) => section.items.length > 0);

  return (
    <SidebarContent>
      {/* MENU UTAMA */}
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

      {/* MENU AKUN */}
      {akunSections.length > 0 && (
        <>
          <SidebarSeparator />

          <SidebarGroup>
            <SidebarGroupLabel>Akun</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {akunSections.map((section) => {
                  // Folder akun otomatis terbuka jika berisi project yang sedang dibuka.
                  const hasActive = section.items.some(
                    (p) => pathname === `/projects/${p.slug}`,
                  );
                  return (
                    <SidebarMenuItem key={`akun:${section.name ?? "none"}`}>
                      <SidebarCollapsible defaultOpen={hasActive}>
                        <SidebarMenuButton as={SidebarCollapsibleTrigger} className="font-medium">
                          <AtSign />
                          <span>{section.name ?? "Tanpa akun"}</span>
                        </SidebarMenuButton>

                        <SidebarCollapsibleContent>
                          <SidebarMenuSub>
                            {section.items.map((project) => {
                              const href = `/projects/${project.slug}`;
                              const color = project.group_id
                                ? groupColor.get(project.group_id)
                                : undefined;
                              return (
                                <SidebarMenuSubItem key={project.id}>
                                  <SidebarMenuSubButton
                                    as={Link}
                                    href={href}
                                    isActive={pathname === href}
                                  >
                                    {color && (
                                      <FolderIcon color={color} className="size-4 shrink-0" />
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
                  );
                })}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>

      <SidebarSeparator />

        {/* MENU PROJECT */}
        <SidebarGroup>
            <SidebarGroupLabel>Platform</SidebarGroupLabel>
            <SidebarGroupContent>
            <SidebarMenu>
                {sections.map((section) => {
                  // Tambahkan pengecekan apakah ada project aktif di dalam folder ini
                  const hasActive = section.items.some(
                    (p) => pathname === `/projects/${p.slug}`
                  );

                  return (
                    <SidebarMenuItem key={section.id ?? "none"}>
                        {/* Ubah defaultOpen menjadi defaultOpen={hasActive} */}
                        <SidebarCollapsible defaultOpen={hasActive}>
                        
                        {/* TRIGGER (TOMBOL FOLDER) */}
                        {section.name && (
                            <SidebarMenuButton as={SidebarCollapsibleTrigger} className="font-medium">
                            {section.color && (
                                <FolderIcon color={section.color} className="size-4 shrink-0" />
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
                                        <FolderIcon color={section.color} className="size-4 shrink-0" />
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
                  );
                })}
            </SidebarMenu>
            </SidebarGroupContent>
        </SidebarGroup>
        </>
      )}
    </SidebarContent>
  );
}

/** Satu-satunya tempat yang memakai usePathname(), jadi harus dibungkus Suspense. */
function ActiveNavContent({
  projects,
  groups,
  accounts,
}: {
  projects: SidebarProject[];
  groups: SidebarGroupData[];
  accounts: string[];
}) {
  const pathname = usePathname();
  return (
    <NavContent projects={projects} groups={groups} accounts={accounts} pathname={pathname} />
  );
}

export function AppSidebar({
  accounts,
  projects,
  groups,
  ...props
}: React.ComponentProps<typeof Sidebar> & {
  accounts: string[];
  projects: SidebarProject[];
  groups: SidebarGroupData[];
  
}) {
  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem className="flex items-center gap-2 group-data-[collapsible=icon]:flex-col">
            <SidebarMenuButton
              as={Link}
              href="/"
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
                <span className="truncate text-sm font-semibold">CGKN</span>
                <span className="truncate text-xs text-muted">DIGIMON</span>
              </div>
            </SidebarMenuButton>

            <SidebarTrigger />
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>

      <Suspense
        fallback={
          <NavContent accounts={accounts} projects={projects} groups={groups} pathname={null} />
        }
      >
        <ActiveNavContent  accounts={accounts} projects={projects} groups={groups} />
      </Suspense>

      <SidebarRail />
    </Sidebar>
  );
}