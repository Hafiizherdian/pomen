import { Suspense } from "react";

import { ProjectImporter } from "@/app/components/admin/project-importer";
import { requireAdmin } from "@/lib/admin-auth";
import { getImportLogs } from "@/lib/admin-queries";
import type { ImportLogRow } from "@/lib/admin-types";
import { getMasterOptions } from "@/lib/master-queries";
import { currentPeriode, formatPeriode } from "@/lib/periode";
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

function formatDateTime(value: string) {
  return new Date(value).toLocaleString("id-ID", {
    timeZone: "Asia/Jakarta",
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function ImportHistory({ logs }: { logs: ImportLogRow[] }) {
  return (
    <section className="space-y-2">
      <div>
        <h2 className="text-base font-semibold">Riwayat impor</h2>
        <p className="text-xs text-muted">20 impor terakhir. Yang tercatat hanya data ringkasnya, bukan isi file.</p>
      </div>
      <div className="overflow-x-auto rounded-xl border border-border bg-surface">
        <table className="w-full min-w-[44rem] border-collapse text-sm">
          <thead className="bg-default/60 text-left">
            <tr>
              <th className="border-b border-border px-4 py-2.5 font-semibold">Waktu</th>
              <th className="border-b border-border px-4 py-2.5 font-semibold">File</th>
              <th className="border-b border-border px-4 py-2.5 font-semibold">Bulan</th>
              <th className="border-b border-border px-4 py-2.5 font-semibold">Group</th>
              <th className="border-b border-border px-4 py-2.5 text-right font-semibold">Masuk</th>
              <th className="border-b border-border px-4 py-2.5 text-right font-semibold">Dilewati</th>
            </tr>
          </thead>
          <tbody>
            {logs.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-4 py-6 text-center text-muted">
                  Belum ada riwayat impor.
                </td>
              </tr>
            ) : (
              logs.map((log) => (
                <tr key={log.id} className="border-b border-border last:border-b-0">
                  <td className="whitespace-nowrap px-4 py-2.5 tabular-nums text-muted">
                    {formatDateTime(log.created_at)}
                  </td>
                  <td className="px-4 py-2.5">
                    <p className="font-medium">{log.file_name}</p>
                    {log.sheet_name && <p className="text-xs text-muted">Sheet: {log.sheet_name}</p>}
                  </td>
                  <td className="px-4 py-2.5">{log.periode ? formatPeriode(log.periode) : "-"}</td>
                  <td className="px-4 py-2.5 text-muted">{log.group_name ?? "Tanpa group"}</td>
                  <td className="px-4 py-2.5 text-right tabular-nums">
                    {log.inserted}/{log.total_rows}
                  </td>
                  <td className="px-4 py-2.5 text-right tabular-nums text-muted">{log.skipped}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}

async function Content() {
  await requireAdmin();
  const [members, master, groups, logs] = await Promise.all([
    getProfiles(),
    getMasterOptions(),
    getProjectGroups(),
    getImportLogs(),
  ]);

  return (
    <div className="space-y-8">
      <ProjectImporter
        members={members}
        jenisOptions={master.jenis}
        statusOptions={master.statuses}
        groups={groups.map((g) => ({ id: g.id, name: g.name || "Tanpa nama" }))}
        defaultPeriode={currentPeriode()}
      />
      <ImportHistory logs={logs} />
    </div>
  );
}