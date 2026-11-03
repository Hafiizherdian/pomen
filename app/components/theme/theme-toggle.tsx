"use client";

import { Button, Dropdown, Label, type Selection } from "@heroui/react";
import { Monitor, Moon, Sun } from "lucide-react";

import { useTheme, type Theme } from "@/app/components/theme/theme-provider";

/**
 * Ikon dipilih lewat CSS (`in-[.dark]`), bukan state JS, jadi tidak ada
 * hydration mismatch dan ikon langsung benar sejak render pertama.
 */
function ThemeIcon({ className = "size-4" }: { className?: string }) {
  return (
    <>
      <Sun className={`${className} in-[.dark]:hidden`} />
      <Moon className={`${className} hidden in-[.dark]:block`} />
    </>
  );
}

/** Dropdown: Terang / Gelap / Sistem. */
export function ThemeToggle({ className }: { className?: string }) {
  const { theme, setTheme } = useTheme();

  const onSelectionChange = (keys: Selection) => {
    if (keys === "all") return;
    const next = [...keys][0];
    if (next === "light" || next === "dark" || next === "system") {
      setTheme(next as Theme);
    }
  };

  return (
    <Dropdown>
      <Dropdown.Trigger
        aria-label="Ganti tema"
        className={`inline-flex size-8 items-center justify-center rounded-lg text-foreground outline-none transition-colors hover:bg-default focus-visible:ring-2 focus-visible:ring-focus ${className ?? ""}`}
      >
        <ThemeIcon />
      </Dropdown.Trigger>
      <Dropdown.Popover placement="bottom end" className="min-w-40">
        <Dropdown.Menu
          selectionMode="single"
          selectedKeys={new Set([theme])}
          onSelectionChange={onSelectionChange}
        >
          <Dropdown.Item id="light" textValue="Terang">
            <Sun className="size-4 shrink-0 text-muted" />
            <Label>Terang</Label>
            <Dropdown.ItemIndicator />
          </Dropdown.Item>
          <Dropdown.Item id="dark" textValue="Gelap">
            <Moon className="size-4 shrink-0 text-muted" />
            <Label>Gelap</Label>
            <Dropdown.ItemIndicator />
          </Dropdown.Item>
          <Dropdown.Item id="system" textValue="Sistem">
            <Monitor className="size-4 shrink-0 text-muted" />
            <Label>Sistem</Label>
            <Dropdown.ItemIndicator />
          </Dropdown.Item>
        </Dropdown.Menu>
      </Dropdown.Popover>
    </Dropdown>
  );
}

/** Tombol sederhana: sekali klik bolak-balik terang ⇄ gelap. */
export function ThemeSwitch({ className }: { className?: string }) {
  const { resolvedTheme, setTheme } = useTheme();

  return (
    <Button
      isIconOnly
      size="sm"
      variant="ghost"
      aria-label="Ganti tema"
      className={`size-8 ${className ?? ""}`}
      onPress={() => setTheme(resolvedTheme === "dark" ? "light" : "dark")}
    >
      <ThemeIcon />
    </Button>
  );
}