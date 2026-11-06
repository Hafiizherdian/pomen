import { Suspense } from "react";

import { RangeTabs, ReportView } from "@/app/components/admin/report-view";
import { requireAdmin } from "@/lib/admin-auth";
import { getReport } from "@/lib/admin-queries";
import type { ReportRange } from "@/lib/admin-types";
import { getMasterOptions } from "@/lib/master-queries";

function parseRange(value?: string): ReportRange {
  return value === "bulan" || value === "semua" ? value : "minggu";
}

export default function ReportPage({
  searchParams,
}: {
  searchParams: Promise<{ periode?: string }>;
}) {
  return (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold">Laporan</h2>
      <Suspense fallback={<p className="text-sm text-muted">Memuat...</p>}>
        <Content searchParams={searchParams} />
      </Suspense>
    </div>
  );
}

async function Content({ searchParams }: { searchParams: Promise<{ periode?: string }> }) {
  await requireAdmin();
  const range = parseRange((await searchParams).periode);
  const master = await getMasterOptions();
  const report = await getReport(range, master.statuses, master.doneStatuses);

  return (
    <div className="space-y-6">
      <RangeTabs current={range} />
      <ReportView report={report} />
    </div>
  );
}