"use client";

// app/components/admin/login-theme-toggle.tsx
import * as React from "react";
import { Monitor, Moon, Sun } from "lucide-react";

import { useTheme, type Theme } from "@/app/components/theme/theme-provider";

const options: { value: Theme; label: string; icon: typeof Sun }[] = [
  { value: "light", label: "Terang", icon: Sun },
  { value: "dark", label: "Gelap", icon: Moon },
  { value: "system", label: "Sistem", icon: Monitor },
];

export function LoginThemeToggle() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = React.useState(false);
  React.useEffect(() => setMounted(true), []);

  return (
    <div
      role="radiogroup"
      aria-label="Tema tampilan"
      className="flex items-center gap-0.5 rounded-full border border-border bg-surface p-0.5"
    >
      {options.map(({ value, label, icon: Icon }) => {
        // sebelum mounted, jangan tandai aktif agar tidak hydration mismatch
        const active = mounted && theme === value;
        return (
          <button
            key={value}
            type="button"
            role="radio"
            aria-checked={active}
            aria-label={label}
            title={label}
            onClick={() => setTheme(value)}
            className={`flex size-7 items-center justify-center rounded-full transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/40 ${
              active ? "bg-accent text-accent-foreground" : "text-muted hover:text-foreground"
            }`}
          >
            <Icon className="size-3.5" />
          </button>
        );
      })}
    </div>
  );
}