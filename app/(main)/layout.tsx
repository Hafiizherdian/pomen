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
import { getProjectGroups, getProjects, getPeriodeYears } from "@/lib/queries";
import { getAccountOptions } from "@/lib/pilar-queries";
import { PeriodeFilter } from "@/app/components/periode-filter";
import { getPeriodeFilter } from "@/lib/periode-filter";

export const metadata: Metadata = {
  title: "CGKN DIGIMAR",
  description: "DIGIMAR UYE",
};

async function SidebarLoader() {
  // Sesi yang tidak valid lagi (akun dinonaktifkan, dihapus) dikembalikan ke login.
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const periode = await getPeriodeFilter();
  const [projects, groups, accounts] = await Promise.all([
    getProjects(periode),
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


  async function PeriodeFilterLoader() {
  const [value, years] = await Promise.all([getPeriodeFilter(), getPeriodeYears()]);
  return <PeriodeFilter value={value} years={years} />;
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
              <header className="flex h-12 items-center gap-2 px-4">
                <SidebarTrigger className="md:hidden" />
                <div className="ml-auto flex items-center gap-2">
                  <Suspense fallback={<div className="h-8 w-[17rem]" />}>
                    <PeriodeFilterLoader />
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