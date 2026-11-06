import { Suspense } from "react";

import { TeamManager } from "@/app/components/admin/team-manager";
import { requireAdmin } from "@/lib/admin-auth";
import { getMembers } from "@/lib/admin-queries";

export default function MembersPage() {
  return (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold">Anggota Tim</h2>
      <Suspense fallback={<p className="text-sm text-muted">Memuat...</p>}>
        <Content />
      </Suspense>
    </div>
  );
}

async function Content() {
  await requireAdmin();
  const members = await getMembers();
  return <TeamManager members={members} />;
}