"use client";

import * as React from "react";

export type Theme = "light" | "dark" | "system";
export type ResolvedTheme = "light" | "dark";

const STORAGE_KEY = "theme";

type ThemeContextProps = {
  /** Pilihan user: light, dark, atau system. */
  theme: Theme;
  /** Tema yang benar-benar aktif saat ini. */
  resolvedTheme: ResolvedTheme;
  setTheme: (theme: Theme) => void;
};

const ThemeContext = React.createContext<ThemeContextProps | null>(null);

export function useTheme() {
  const ctx = React.useContext(ThemeContext);
  if (!ctx) throw new Error("useTheme harus dipakai di dalam <ThemeProvider />.");
  return ctx;
}

function isTheme(value: unknown): value is Theme {
  return value === "light" || value === "dark" || value === "system";
}

function readStoredTheme(fallback: Theme): Theme {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    return isTheme(stored) ? stored : fallback;
  } catch {
    return fallback;
  }
}

/** Pasang class + data-theme + color-scheme di <html>, kembalikan tema yang aktif. */
function applyTheme(theme: Theme): ResolvedTheme {
  const resolved: ResolvedTheme =
    theme === "system"
      ? window.matchMedia("(prefers-color-scheme: dark)").matches
        ? "dark"
        : "light"
      : theme;

  const root = document.documentElement;
  root.classList.remove("light", "dark");
  root.classList.add(resolved);
  root.setAttribute("data-theme", resolved);
  root.style.colorScheme = resolved;

  return resolved;
}

export function ThemeProvider({
  children,
  defaultTheme = "system",
}: {
  children: React.ReactNode;
  defaultTheme?: Theme;
}) {
  const [theme, setThemeState] = React.useState<Theme>(() =>
    typeof window === "undefined" ? defaultTheme : readStoredTheme(defaultTheme),
  );
  const [resolvedTheme, setResolvedTheme] = React.useState<ResolvedTheme>("light");

  // Terapkan tema; kalau "system", ikuti perubahan pengaturan OS.
  React.useEffect(() => {
    const apply = () => setResolvedTheme(applyTheme(theme));
    apply();

    if (theme !== "system") return;
    const mql = window.matchMedia("(prefers-color-scheme: dark)");
    mql.addEventListener("change", apply);
    return () => mql.removeEventListener("change", apply);
  }, [theme]);

  // Sinkron antar tab.
  React.useEffect(() => {
    const onStorage = (event: StorageEvent) => {
      if (event.key === STORAGE_KEY && isTheme(event.newValue)) {
        setThemeState(event.newValue);
      }
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  const setTheme = React.useCallback((next: Theme) => {
    setThemeState(next);
    try {
      localStorage.setItem(STORAGE_KEY, next);
    } catch {
      /* abaikan jika storage diblokir */
    }
  }, []);

  const value = React.useMemo(
    () => ({ theme, resolvedTheme, setTheme }),
    [theme, resolvedTheme, setTheme],
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}