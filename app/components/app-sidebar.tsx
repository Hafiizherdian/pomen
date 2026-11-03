"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import {
  BarChart3,
  ChevronRight,
  ChevronsUpDown,
  FolderKanban,
  Home,
  Inbox,
  LogOut,
  Plus,
  User,
  Users,
} from "lucide-react";

import { Avatar, AvatarFallback, AvatarImage } from "@/app/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/app/components/ui/dropdown-menu";
import {
  Sidebar,
  SidebarCollapsible,
  SidebarCollapsibleContent,
  SidebarCollapsibleTrigger,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupAction,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarInput,
  SidebarMenu,
  SidebarMenuBadge,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
  SidebarRail,
  SidebarSeparator,
  sidebarMenuButtonClassName,
} from "@/app/components/ui/sidebar";

const mainNav = [
  { title: "Dashboard", href: "/", icon: Home },
  { title: "Inbox", href: "/inbox", icon: Inbox, badge: "12" },
  { title: "Laporan", href: "/laporan", icon: BarChart3 },
  { title: "Tim", href: "/tim", icon: Users },
];

const projects = [
  { title: "Post", href: "/projects" },
  { title: "Reels", href: "/projects/2" },
  { title: "Kalender", href: "/projects/3" },
];

export function AppSidebar(props: React.ComponentProps<typeof Sidebar>) {
  const pathname = usePathname();

  return (
    <Sidebar collapsible="icon" {...props}>
      {/* Header */}
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button
                  type="button"
                  className={sidebarMenuButtonClassName({ size: "lg" })}
                >
                  <div className="flex aspect-square size-8 shrink-0 items-center justify-center rounded-lg bg-accent text-accent-foreground">
                    <Image
                      src="/logo-cgkn.png"
                      alt="Logo CGKN"
                      width={32}
                      height={32}
                      priority
                      className="rounded-md"
                    />
                  </div>
                  <div className="grid flex-1 text-left leading-tight group-data-[collapsible=icon]:hidden">
                    <span className="truncate text-sm font-semibold">CGKN</span>
                    <span className="truncate text-xs text-muted-foreground">
                      Project Management
                    </span>
                  </div>
                </button>
              </DropdownMenuTrigger>
              {/* Tempat DropdownMenuContent jika suatu saat dibutuhkan di header */}
            </DropdownMenu>
          </SidebarMenuItem>
        </SidebarMenu>

        <div className="group-data-[collapsible=icon]:hidden">
          <SidebarInput placeholder="Cari..." aria-label="Cari" />
        </div>
      </SidebarHeader>

      {/* Content */}
      <SidebarContent>
        {/* Menu utama */}
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
                  {item.badge && (
                    <SidebarMenuBadge>{item.badge}</SidebarMenuBadge>
                  )}
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarSeparator />

        {/* Group collapsible dengan submenu */}
        <SidebarCollapsible defaultOpen>
          <SidebarGroup>
            <SidebarGroupLabel as={SidebarCollapsibleTrigger}>
              Project
            </SidebarGroupLabel>
            <SidebarGroupAction title="Tambah project">
              <Plus />
              <span className="sr-only">Tambah project</span>
            </SidebarGroupAction>

            <SidebarCollapsibleContent>
              <SidebarGroupContent>
                <SidebarMenu>
                  {/* Item dengan submenu */}
                  <SidebarCollapsible className="group/submenu" defaultOpen>
                    <SidebarMenuItem>
                      <SidebarMenuButton
                        as={SidebarCollapsibleTrigger}
                        tooltip="Semua project"
                      >
                        <FolderKanban />
                        <span>Semua project</span>
                        <ChevronRight className="ml-auto transition-transform group-data-[state=open]/submenu:rotate-90" />
                      </SidebarMenuButton>

                      <SidebarCollapsibleContent>
                        <SidebarMenuSub>
                          {projects.map((project) => (
                            <SidebarMenuSubItem key={project.href}>
                              <SidebarMenuSubButton
                                as={Link}
                                href={project.href}
                                isActive={pathname === project.href}
                              >
                                <span>{project.title}</span>
                              </SidebarMenuSubButton>
                            </SidebarMenuSubItem>
                          ))}
                        </SidebarMenuSub>
                      </SidebarCollapsibleContent>
                    </SidebarMenuItem>
                  </SidebarCollapsible>
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarCollapsibleContent>
          </SidebarGroup>
        </SidebarCollapsible>
      </SidebarContent>

      {/* Footer */}
      <SidebarFooter>
        <SidebarMenu>
          <SidebarMenuItem>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button
                  type="button"
                  className={sidebarMenuButtonClassName({ size: "lg" })}
                >
                  <Avatar className="h-8 w-8 shrink-0 rounded-lg">
                    <AvatarFallback className="rounded-lg bg-primary/10 text-primary">
                      B
                    </AvatarFallback>
                  </Avatar>
                  <div className="grid flex-1 text-left leading-tight group-data-[collapsible=icon]:hidden">
                    <span className="truncate text-sm font-semibold">Test</span>
                    <span className="truncate text-xs text-muted-foreground">
                      Team Test
                    </span>
                  </div>
                  <ChevronsUpDown className="ml-auto size-4 group-data-[collapsible=icon]:hidden" />
                </button>
              </DropdownMenuTrigger>
              
              <DropdownMenuContent side="top" align="start" className="w-56">
                <DropdownMenuItem className="gap-2 cursor-pointer">
                  <User className="size-4 text-muted-foreground" />
                  <span>Profil</span>
                </DropdownMenuItem>
                
                <DropdownMenuItem className="gap-2 cursor-pointer text-destructive focus:bg-destructive/10 focus:text-destructive">
                  <LogOut className="size-4" />
                  <span>Keluar</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>

      <SidebarRail />
    </Sidebar>
  );
}