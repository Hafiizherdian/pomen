import { Suspense } from "react";

import { ProjectImporter } from "@/app/components/admin/project-importer";
import { requireAdmin } from "@/lib/admin-auth";
import { getMasterOptions } from "@/lib/master-queries";
import { currentPeriode } from "@/lib/periode";
import { getProfiles, getProjectGroups } from "@/lib/queries";

export default function ImportPage() {
  return (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold">Impor data</h2>
      <Suspense fallback={<p className="text-sm text-muted">Memuat...</p>}>
        <Content />
      </Suspense>
    </div>
  );
}

async function Content() {
  await requireAdmin();
  const [members, master, groups] = await Promise.all([
    getProfiles(),
    getMasterOptions(),
    getProjectGroups(),
  ]);

  return (
    <ProjectImporter
      members={members}
      jenisOptions={master.jenis}
      statusOptions={master.statuses}
      groups={groups.map((g) => ({ id: g.id, name: g.name || "Tanpa nama" }))}
      defaultPeriode={currentPeriode()}
    />
  );
}