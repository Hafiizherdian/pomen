import { Suspense } from "react";

import { MasterOptionsManager } from "@/app/components/admin/master-options-manager";
import { requireAdmin } from "@/lib/admin-auth";
import { getOptionsWithUsage } from "@/lib/admin-queries";

export default function MasterDataPage() {
  return (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold">Data status & jenis</h2>
      <Suspense fallback={<p className="text-sm text-muted">Memuat...</p>}>
        <Content />
      </Suspense>
    </div>
  );
}

async function Content() {
  await requireAdmin();
  const options = await getOptionsWithUsage();
  return <MasterOptionsManager options={options} />;
}