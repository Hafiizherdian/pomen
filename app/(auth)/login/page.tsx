import { Suspense } from "react";
import { redirect } from "next/navigation";

import { LoginForm } from "@/app/components/admin/login-form";
import { getCurrentUser } from "@/lib/admin-auth";

export default function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>;
}) {
  return (
    <div className="flex flex-1 items-start justify-center p-6 pt-16">
      <div className="w-full max-w-sm space-y-4">
        <div>
          <h1 className="text-2xl font-semibold">Masuk</h1>
          <p className="text-sm text-muted">CGKN DIGIMAR</p>
        </div>
        <Suspense fallback={null}>
          <LoginContent searchParams={searchParams} />
        </Suspense>
      </div>
    </div>
  );
}

async function LoginContent({ searchParams }: { searchParams: Promise<{ next?: string }> }) {
  if (await getCurrentUser()) redirect("/");
  const { next } = await searchParams;

  return (
    <>
      {!process.env.SESSION_SECRET && (
        <p role="alert" className="rounded-lg border border-border bg-surface p-3 text-sm text-danger">
          SESSION_SECRET belum diatur di .env.local, jadi login belum bisa dipakai.
        </p>
      )}
      <LoginForm next={next ?? ""} />
    </>
  );
}