// app/login/page.tsx
import { Suspense } from "react";
import { redirect } from "next/navigation";
import { KanbanSquare, ShieldCheck, Users, LayoutDashboard } from "lucide-react";
import Image from "next/image";

import { LoginForm } from "@/app/components/admin/login-form";
import { LoginThemeToggle } from "@/app/components/admin/login-theme-toggle";
import { getCurrentUser } from "@/lib/admin-auth";

export default function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>;
}) {
  return (
    <div className="grid min-h-dvh bg-background text-foreground lg:grid-cols-[minmax(420px,520px)_1fr]">
      {/* ── Kolom form ── */}
      <div className="flex min-h-dvh flex-col px-6 py-6 sm:px-10">
        <header className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            {/* <span className="flex size-9 items-center justify-center rounded-xl bg-accent text-accent-foreground">
              <KanbanSquare className="size-5" aria-hidden />
            </span> */}
            <Image
                            src="/logo-cgkn.png"
                            alt="Logo CGKN"
                            width={32}
                            height={32}
                            priority
                            className="size-8 shrink-0 rounded-md object-contain"
                          />
            <span className="text-sm font-semibold tracking-tight">CGKN DIGIMAR</span>
          </div>
          <LoginThemeToggle />
        </header>

        <main className="flex flex-1 items-center justify-center py-10">
          <div className="w-full max-w-sm space-y-6">
            <div className="space-y-1.5">
              <h1 className="text-2xl font-semibold tracking-tight">DIGIMAR</h1>
              {/* <p className="text-sm text-muted">
                Masuk untuk mengelola proyek dan papan Kanban tim Anda.
              </p> */}
            </div>

            <Suspense fallback={<FormSkeleton />}>
              <LoginContent searchParams={searchParams} />
            </Suspense>
          </div>
        </main>

        <footer className="text-center text-xs text-muted">
          Lupa password? Hubungi olgi.
        </footer>
      </div>

      {/* ── Panel brand (desktop saja) ── */}
      <aside
        aria-hidden
        className="relative hidden overflow-hidden bg-accent text-accent-foreground lg:flex lg:items-center lg:justify-center"
      >
        {/* pola grid halus */}
        <div
          className="absolute inset-0 opacity-[0.12]"
          style={{
            backgroundImage:
              "linear-gradient(currentColor 1px, transparent 1px), linear-gradient(90deg, currentColor 1px, transparent 1px)",
            backgroundSize: "44px 44px",
            maskImage: "radial-gradient(ellipse at center, black 30%, transparent 75%)",
            WebkitMaskImage: "radial-gradient(ellipse at center, black 30%, transparent 75%)",
          }}
        />

        <div className="relative z-10 w-full max-w-xl space-y-10 p-12">
          {/* <div className="space-y-3">
            <h2 className="text-3xl font-semibold leading-tight tracking-tight">
              Semua proyek, satu papan kerja.
            </h2>
            <p className="max-w-md text-sm opacity-80">
              Pantau progres, bagi tugas, dan diskusikan pekerjaan bersama tim — tanpa
              berpindah-pindah aplikasi.
            </p>
          </div> */}

          <KanbanPreview />

          {/* <ul className="grid grid-cols-3 gap-4 text-xs">
            <Feature icon={LayoutDashboard} label="Kanban board" />
            <Feature icon={Users} label="Anggota & komentar" />
            <Feature icon={ShieldCheck} label="Akses aman" />
          </ul> */}
        </div>
      </aside>
    </div>
  );
}

async function LoginContent({ searchParams }: { searchParams: Promise<{ next?: string }> }) {
  if (await getCurrentUser()) redirect("/");
  const { next } = await searchParams;

  return (
    <>
      {!process.env.SESSION_SECRET && (
        <p
          role="alert"
          className="rounded-lg border border-border bg-surface p-3 text-sm text-danger"
        >
          SESSION_SECRET belum diatur di .env.local, jadi login belum bisa dipakai.
        </p>
      )}
      <LoginForm next={next ?? ""} />
    </>
  );
}

function FormSkeleton() {
  return (
    <div className="space-y-4" aria-hidden>
      <div className="h-16 animate-pulse rounded-xl bg-surface" />
      <div className="h-16 animate-pulse rounded-xl bg-surface" />
      <div className="h-11 animate-pulse rounded-xl bg-surface" />
    </div>
  );
}

function Feature({
  icon: Icon,
  label,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
}) {
  return (
    <li className="flex items-center gap-2 opacity-90">
      <Icon className="size-4 shrink-0" />
      {label}
    </li>
  );
}

/** Ilustrasi mini Kanban, murni div — tidak butuh aset gambar. */
function KanbanPreview() {
  const columns = [
    { title: "To do", cards: ["test", "test1"] },
    { title: "Progress", cards: ["progres"] },
    { title: "Selesai", cards: ["do", "done"] },
  ];

  return (
    <div className="rotate-[-2deg] rounded-2xl border border-white/20 bg-white/10 p-4 shadow-2xl backdrop-blur-sm">
      <div className="grid grid-cols-3 gap-3">
        {columns.map((col) => (
          <div key={col.title} className="space-y-2">
            <div className="flex items-center justify-between px-1 text-[11px] font-medium uppercase tracking-wider opacity-80">
              {col.title}
              <span className="rounded-full bg-white/20 px-1.5">{col.cards.length}</span>
            </div>
            {col.cards.map((c) => (
              <div
                key={c}
                className="space-y-2 rounded-lg bg-white/95 p-2.5 text-[11px] font-medium text-neutral-800 shadow-sm"
              >
                {c}
                <div className="flex -space-x-1.5">
                  <span className="size-4 rounded-full border border-white bg-neutral-300" />
                  <span className="size-4 rounded-full border border-white bg-neutral-400" />
                </div>
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}