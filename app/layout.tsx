import type { Metadata } from "next";
import { Suspense } from "react";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/app/components/theme/theme-provider";
import { ThemeScript } from "@/app/components/theme/theme-script";
import { ThemeToggle } from "@/app/components/theme/theme-toggle";
import {
  SidebarProvider,
  SidebarInset,
  SidebarTrigger,
} from "@/app/components/ui/sidebar";
import { AppSidebar } from "@/app/components/app-sidebar";
import { getProjectGroups, getProjects } from "@/lib/queries";

const geistSans = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });
const geistMono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"] });

export const metadata: Metadata = {
  title: "CGKN DIGIMAR",
  description: "DIGIMAR UYE",
};

async function SidebarLoader() {
  const [projects, groups] = await Promise.all([getProjects(), getProjectGroups()]);
  return <AppSidebar projects={projects} groups={groups} />;
}

export default function RootLayout({ children }: LayoutProps<"/">) {
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
            <Suspense fallback={<AppSidebar projects={[]} groups={[]} />}>
              <SidebarLoader />
            </Suspense>
            <SidebarInset>
              <header className="flex h-12 items-center gap-2 px-4">
                {/* <SidebarTrigger /> */}
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