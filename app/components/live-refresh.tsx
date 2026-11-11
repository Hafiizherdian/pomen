"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export function LiveRefresh({ interval = 10_000 }: { interval?: number }) {
  const router = useRouter();

  useEffect(() => {
    const tick = () => {
      if (document.visibilityState !== "visible") return;
      const el = document.activeElement;
      // Jangan refresh saat user sedang mengedit sel/form
      if (el && ["INPUT", "TEXTAREA", "SELECT"].includes(el.tagName)) return;
      router.refresh();
    };

    const id = setInterval(tick, interval);
    document.addEventListener("visibilitychange", tick);
    window.addEventListener("focus", tick);
    return () => {
      clearInterval(id);
      document.removeEventListener("visibilitychange", tick);
      window.removeEventListener("focus", tick);
    };
  }, [router, interval]);

  return null;
}