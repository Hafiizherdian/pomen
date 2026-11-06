import { Suspense } from "react";

import { GroupManager } from "@/app/components/admin/group-manager";
import { requireAdmin } from "@/lib/admin-auth";
import { getProjectGroups, getProjectRows } from "@/lib/queries";

export default function GroupAdminPage() {
  return (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold">Group</h2>
      <Suspense fallback={<p className="text-sm text-muted">Memuat...</p>}>
        <Content />
      </Suspense>
    </div>
  );
}

async function Content() {
  await requireAdmin();
  const [groups, rows] = await Promise.all([getProjectGroups(), getProjectRows()]);
  const projects = rows.map(({ id, name, akun, group_id }) => ({ id, name, akun, group_id }));
  return <GroupManager groups={groups} projects={projects} />;
}