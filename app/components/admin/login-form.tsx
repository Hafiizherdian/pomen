"use client";

// app/components/admin/login-form.tsx
import * as React from "react";
import { useRouter } from "next/navigation";
import { AlertCircle, Eye, EyeOff, Loader2, LogIn, TriangleAlert } from "lucide-react";

/** Hanya izinkan redirect internal (cegah open redirect). */
function safeNext(next: string) {
  return next.startsWith("/") && !next.startsWith("//") ? next : "/";
}

const inputClass =
  "h-11 w-full rounded-xl border border-border bg-surface px-3.5 text-sm text-foreground " +
  "placeholder:text-muted outline-none transition " +
  "focus:border-accent focus:ring-2 focus:ring-accent/25 " +
  "aria-[invalid=true]:border-danger aria-[invalid=true]:ring-danger/20 " +
  "disabled:opacity-60";

export function LoginForm({ next }: { next: string }) {
  const router = useRouter();

  const [username, setUsername] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [showPass, setShowPass] = React.useState(false);
  const [capsLock, setCapsLock] = React.useState(false);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (loading) return;

    if (!username.trim() || !password) {
      setError("Username dan password wajib diisi.");
      return;
    }

    setLoading(true);
    setError("");

    try {
      // Sesuaikan endpoint/server action dengan implementasi login Anda.
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username: username.trim(), password }),
      });
      const data = await res.json().catch(() => ({}));

      if (res.ok) {
        router.replace(safeNext(next));
        router.refresh();
        return; // biarkan loading tetap aktif selama redirect
      }
      setError(data.error || "Username atau password salah.");
    } catch {
      setError("Tidak bisa terhubung ke server. Coba lagi.");
    }
    setLoading(false);
  };

  const hasError = Boolean(error);

  return (
    <form onSubmit={handleSubmit} noValidate className="space-y-5">
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
          value={username}
          onChange={(e) => {
            setUsername(e.target.value);
            setError("");
          }}
          placeholder="Masukkan username"
          autoComplete="username"
          autoCapitalize="none"
          spellCheck={false}
          autoFocus
          disabled={loading}
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
            value={password}
            onChange={(e) => {
              setPassword(e.target.value);
              setError("");
            }}
            onKeyUp={(e) => setCapsLock(e.getModifierState("CapsLock"))}
            onBlur={() => setCapsLock(false)}
            placeholder="Masukkan password"
            autoComplete="current-password"
            disabled={loading}
            aria-invalid={hasError || undefined}
            className={`${inputClass} pr-11`}
          />
          <button
            type="button"
            onClick={() => setShowPass((v) => !v)}
            aria-label={showPass ? "Sembunyikan password" : "Tampilkan password"}
            aria-pressed={showPass}
            className="absolute inset-y-0 right-0 flex w-11 items-center justify-center rounded-r-xl text-muted transition hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/40"
          >
            {showPass ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
          </button>
        </div>
        {capsLock && (
          <p className="flex items-center gap-1.5 text-xs text-muted" role="status">
            <TriangleAlert className="size-3.5 color-alert" aria-hidden />
            Caps Lock aktif
          </p>
        )}
      </div>

      <button
        type="submit"
        disabled={loading}
        className="flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-accent text-sm font-semibold text-accent-foreground transition hover:opacity-90 active:scale-[0.99] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/40 focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:cursor-not-allowed disabled:opacity-60"
      >
        {loading ? (
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