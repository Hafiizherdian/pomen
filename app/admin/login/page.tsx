import { Suspense } from "react";
import { redirect } from "next/navigation";

import { LoginForm } from "@/app/components/admin/login-form";
import { isAdmin } from "@/lib/admin-auth";

export default function AdminLoginPage() {
  return (
    <div className="flex flex-1 items-start justify-center p-6 pt-16">
      <div className="w-full max-w-sm space-y-4">
        <div>
          <h1 className="text-2xl font-semibold">Masuk admin</h1>
          <p className="text-sm text-muted">Halaman ini hanya untuk pengelola aplikasi.</p>
        </div>
        <Suspense fallback={null}>
          <LoginContent />
        </Suspense>
      </div>
    </div>
  );
}

async function LoginContent() {
  if (await isAdmin()) redirect("/admin");

  return (
    <>
      {!process.env.ADMIN_PASSWORD && (
        <p role="alert" className="rounded-lg border border-border bg-surface p-3 text-sm text-danger">
          ADMIN_PASSWORD belum diatur di .env.local, jadi halaman admin belum bisa dipakai.
        </p>
      )}
      <LoginForm />
    </>
  );
}