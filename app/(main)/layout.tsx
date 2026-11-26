import type { Metadata } from "next";
import { Suspense } from "react";
import { redirect } from "next/navigation";
import "../globals.css";
import { ThemeProvider } from "@/app/components/theme/theme-provider";
import { ThemeScript } from "@/app/components/theme/theme-script";
import { ThemeToggle } from "@/app/components/theme/theme-toggle";
import {
  SidebarProvider,
  SidebarInset,
  SidebarTrigger,
} from "@/app/components/ui/sidebar";
import { AppSidebar } from "@/app/components/app-sidebar";
import { geistMono, geistSans } from "@/app/fonts";
import { getCurrentUser } from "@/lib/admin-auth";
import { getProjectGroups, getProjects, getPeriodeYears, getProfiles } from "@/lib/queries";
import { getAccountOptions } from "@/lib/pilar-queries";
import { PeriodeFilter } from "@/app/components/periode-filter";
import { ProjectFilters } from "@/app/components/project-filter";
import { getProjectFilter } from "@/lib/periode-filter";
import { getMasterOptions } from "@/lib/master-queries";

export const metadata: Metadata = {
  title: "CGKN DIGIMAR",
  description: "DIGIMAR UYE",
};

async function SidebarLoader() {
  // Sesi yang tidak valid lagi (akun dinonaktifkan, dihapus) dikembalikan ke login.
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const filter = await getProjectFilter();
  const [projects, groups, accounts] = await Promise.all([
    getProjects(filter),
    getProjectGroups(),
    getAccountOptions(),
  ]);

  return (
    <AppSidebar
      accounts={accounts}
      projects={projects}
      groups={groups}
      user={{ name: user.full_name || user.username || user.email, role: user.role }}
    />
  );
}

async function HeaderFiltersLoader() {
  const [filter, years, profiles, master] = await Promise.all([
    getProjectFilter(),
    getPeriodeYears(),
    getProfiles(),
    getMasterOptions(),
  ]);

  return (
    <>
      <ProjectFilters
        pic={filter.pic}
        jenis={filter.jenis}
        profiles={profiles}
        jenisOptions={master.jenis}
      />
      <PeriodeFilter value={filter.periode} years={years} />
    </>
  );
}

export default function MainLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="id"
      suppressHydrationWarning
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <head>
        <ThemeScript />
      </head>
      <body className="min-h-full bg-background font-sans text-foreground">
        <ThemeProvider>
          <SidebarProvider>
            <Suspense
              fallback={<AppSidebar projects={[]} groups={[]} accounts={[]} user={null} />}
            >
              <SidebarLoader />
            </Suspense>
            <SidebarInset>
              <header className="sticky top-0 z-20 flex min-h-12 items-center gap-2 border-b border-border bg-background/80 px-4 py-2 backdrop-blur supports-[backdrop-filter]:bg-background/60">
                <SidebarTrigger className="md:hidden" />
                <div className="ml-auto flex flex-wrap items-center justify-end gap-2">
                  <Suspense fallback={<div className="h-8 w-[17rem]" />}>
                    <HeaderFiltersLoader />
                  </Suspense>
                  <ThemeToggle />
                </div>
              </header>
              {children}
            </SidebarInset>
          </SidebarProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}