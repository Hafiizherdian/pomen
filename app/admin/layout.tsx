import type { Metadata } from "next";
import "../globals.css";
import { ThemeProvider } from "@/app/components/theme/theme-provider";
import { ThemeScript } from "@/app/components/theme/theme-script";
import { geistMono, geistSans } from "@/app/fonts";

export const metadata: Metadata = {
  title: "Admin · CGKN DIGIMAR",
  robots: { index: false, follow: false },
};

export default function AdminRootLayout({ children }: { children: React.ReactNode }) {
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
          <div className="flex min-h-svh flex-col">{children}</div>
        </ThemeProvider>
      </body>
    </html>
  );
}