"use client";

import { useCallback, useState, useTransition } from "react";
import type { ActionResult } from "@/lib/admin-types";

/** Menjalankan server action admin, menampung status "menyimpan" dan pesan error. */
export function useAdminAction() {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const run = useCallback((action: () => Promise<ActionResult>) => {
    setError(null);
    return new Promise<boolean>((resolve) => {
      startTransition(async () => {
        try {
          const result = await action();
          if (!result.ok) setError(result.error);
          resolve(result.ok);
        } catch {
          setError("Terjadi kesalahan. Coba lagi.");
          resolve(false);
        }
      });
    });
  }, []);

  return { pending, error, run };
}

export type RunAction = ReturnType<typeof useAdminAction>["run"];