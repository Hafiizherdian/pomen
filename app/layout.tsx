import type { Metadata } from "next";
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

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "CGKN DIGIMAR",
  description: "DIGIMAR UYE",
};

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
      <body className="min-h-full bg-background text-foreground">
        <ThemeProvider>
          <SidebarProvider>
            <AppSidebar />
            <SidebarInset>
              <header className="flex h-12 items-center gap-2 px-4">
                <SidebarTrigger />
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