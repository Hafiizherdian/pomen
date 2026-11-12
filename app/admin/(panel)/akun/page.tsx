import { Suspense } from "react";

import { AccountManager } from "@/app/components/admin/account-manager";
import { requireRole } from "@/lib/admin-auth";
import { getAccounts } from "@/lib/admin-queries";

export default function AccountsPage() {
  return (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold">Akun & peran</h2>
      <Suspense fallback={<p className="text-sm text-muted">Memuat...</p>}>
        <Content />
      </Suspense>
    </div>
  );
}

async function Content() {
  const me = await requireRole("root");
  const accounts = await getAccounts();
  return <AccountManager accounts={accounts} currentUserId={me.id} />;
}