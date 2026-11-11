import { Suspense } from "react";

import { requireAdmin } from "@/lib/admin-auth";
import { getAdminCounts } from "@/lib/admin-queries";

export default function AdminHome() {
  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-lg font-semibold">Ringkasan</h2>
        <p className="text-sm text-muted">
          Kelola anggota tim, master data, group, impor data, dan laporan lewat menu di samping.
        </p>
      </div>
      <Suspense fallback={<p className="text-sm text-muted">Memuat...</p>}>
        <Overview />
      </Suspense>
    </div>
  );
}

async function Overview() {
  await requireAdmin();
  const counts = await getAdminCounts();

  const stats = [
    { label: "Anggota tim", value: counts.members },
    { label: "Konten", value: counts.projects },
    { label: "Group", value: counts.groups },
    { label: "Status", value: counts.statuses },
    { label: "Jenis konten", value: counts.jenis },
  ];

  return (
    <div className="grid grid-cols-2 gap-4 lg:grid-cols-5">
      {stats.map((s) => (
        <div key={s.label} className="rounded-xl border border-border bg-surface p-4">
          <p className="text-xs text-muted">{s.label}</p>
          <p className="mt-1 text-2xl font-semibold tabular-nums">{s.value}</p>
        </div>
      ))}
    </div>
  );
}