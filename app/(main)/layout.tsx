import type { Metadata } from "next";
import { Suspense } from "react";
import "../globals.css";
import { ThemeProvider } from "@/app/components/theme/theme-provider";
import { ThemeScript } from "@/app/components/theme/theme-script";
import { ThemeToggle } from "@/app/components/theme/theme-toggle";
import { SidebarProvider, SidebarInset } from "@/app/components/ui/sidebar";
import { AppSidebar } from "@/app/components/app-sidebar";
import { geistMono, geistSans } from "@/app/fonts";
import { getProjectGroups, getProjects } from "@/lib/queries";
import { getAccountOptions } from "@/lib/pilar-queries";

export const metadata: Metadata = {
  title: "CGKN DIGIMAR",
  description: "DIGIMAR UYE",
};

async function SidebarLoader() {
  const [projects, groups, accounts] = await Promise.all([
    getProjects(),
    getProjectGroups(),
    getAccountOptions(),
  ]);
  return <AppSidebar accounts={accounts} projects={projects} groups={groups}  />;
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
             <Suspense fallback={<AppSidebar projects={[]} groups={[]} accounts={[]} />}>
              <SidebarLoader />
            </Suspense>
            <SidebarInset>
              <header className="flex h-12 items-center gap-2 px-4">
                <ThemeToggle className="ml-auto" />
              </header>
              {children}
            </SidebarInset>
          </SidebarProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}