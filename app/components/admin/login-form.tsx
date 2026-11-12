"use client";

import { useActionState } from "react";
import { login } from "@/app/auth-actions";
import { inputClass } from "@/app/components/admin/admin-ui";
import type { LoginState } from "@/lib/admin-types";

export function LoginForm({ next }: { next: string }) {
  const [state, action, pending] = useActionState<LoginState, FormData>(login, undefined);

  return (
    <form action={action} className="w-full space-y-4 rounded-xl border border-border bg-surface p-5">
      <input type="hidden" name="next" value={next} />

      <label className="block space-y-1 text-sm">
        <span className="font-medium">Email</span>
        <input
          type="email"
          name="email"
          required
          autoFocus
          autoComplete="username"
          className={inputClass}
        />
      </label>

      <label className="block space-y-1 text-sm">
        <span className="font-medium">Password</span>
        <input
          type="password"
          name="password"
          required
          autoComplete="current-password"
          className={inputClass}
        />
      </label>

      {state?.error && (
        <p role="alert" className="text-sm text-danger">
          {state.error}
        </p>
      )}

      <button
        type="submit"
        disabled={pending}
        className="h-9 w-full rounded-lg bg-accent px-4 text-sm font-medium text-accent-foreground disabled:opacity-50"
      >
        {pending ? "Memeriksa..." : "Masuk"}
      </button>
    </form>
  );
}