"use client";

// app/components/admin/login-form.tsx
import * as React from "react";
import { AlertCircle, Eye, EyeOff, Loader2, LogIn, TriangleAlert } from "lucide-react";

import { login } from "@/app/auth-actions";

const inputClass =
  "h-11 w-full rounded-xl border border-border bg-surface px-3.5 text-sm text-foreground " +
  "placeholder:text-muted outline-none transition " +
  "focus:border-accent focus:ring-2 focus:ring-accent/25 " +
  "aria-[invalid=true]:border-danger aria-[invalid=true]:ring-danger/20 " +
  "disabled:opacity-60";

export function LoginForm({ next }: { next: string }) {
  // `login` adalah server action; redirect setelah sukses ditangani di server.
  const [state, formAction, pending] = React.useActionState(login, undefined);

  const [username, setUsername] = React.useState("");
  const [showPass, setShowPass] = React.useState(false);
  const [capsLock, setCapsLock] = React.useState(false);

  const error = state?.error;
  const hasError = Boolean(error);

  return (
    <form action={formAction} className="space-y-5">
      <input type="hidden" name="next" value={next} />

      {hasError && (
        <div
          role="alert"
          className="flex items-start gap-2.5 rounded-xl border border-danger/30 bg-danger/10 px-3.5 py-3 text-sm text-danger"
        >
          <AlertCircle className="mt-0.5 size-4 shrink-0" aria-hidden />
          <span>{error}</span>
        </div>
      )}

      <div className="space-y-1.5">
        <label htmlFor="username" className="text-sm font-medium">
          Username
        </label>
        <input
          id="username"
          name="username"
          type="text"
          required
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          placeholder="Masukkan username"
          autoComplete="username"
          autoCapitalize="none"
          spellCheck={false}
          autoFocus
          readOnly={pending}
          aria-invalid={hasError || undefined}
          className={inputClass}
        />
      </div>

      <div className="space-y-1.5">
        <label htmlFor="password" className="text-sm font-medium">
          Password
        </label>
        <div className="relative">
          <input
            id="password"
            name="password"
            type={showPass ? "text" : "password"}
            required
            onKeyUp={(e) => setCapsLock(e.getModifierState("CapsLock"))}
            onBlur={() => setCapsLock(false)}
            placeholder="Masukkan password"
            autoComplete="current-password"
            readOnly={pending}
            aria-invalid={hasError || undefined}
            className={`${inputClass} pr-11`}
          />
          <button
            type="button"
            onClick={() => setShowPass((v) => !v)}
            aria-label={showPass ? "Sembunyikan password" : "Tampilkan password"}
            aria-pressed={showPass}
            className="absolute inset-y-0 right-0 flex w-11 items-center justify-center rounded-r-xl text-muted transition hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/40 cursor-pointer"
          >
            {showPass ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
          </button>
        </div>
        {capsLock && (
          <p className="flex items-center gap-1.5 text-xs text-warning" role="status">
            <TriangleAlert className="size-3.5" aria-hidden />
            Caps Lock aktif
          </p>
        )}
      </div>

      <button
        type="submit"
        disabled={pending}
        className="flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-accent text-sm font-semibold text-accent-foreground transition hover:opacity-90 active:scale-[0.99] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/40 focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:cursor-not-allowed disabled:opacity-60"
      >
        {pending ? (
          <>
            <Loader2 className="size-4 animate-spin" aria-hidden /> Memproses…
          </>
        ) : (
          <>
            <LogIn className="size-4" aria-hidden /> Masuk
          </>
        )}
      </button>
    </form>
  );
}