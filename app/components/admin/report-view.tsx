import Link from "next/link";

import type { AkunRow, CountRow, Report, ReportRange } from "@/lib/admin-types";
import { cn } from "@/lib/utils";

const RANGES: { key: ReportRange; label: string }[] = [
  { key: "minggu", label: "Minggu ini" },
  { key: "bulan", label: "Bulan ini" },
  { key: "semua", label: "Semua" },
];

const pct = (n: number, d: number) => (d ? Math.round((n / d) * 100) : 0);

function formatDate(date: string) {
  return new Date(`${date}T00:00:00`).toLocaleDateString("id-ID", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function Bar({ value }: { value: number }) {
  return (
    <div className="h-2 overflow-hidden rounded-full bg-default">
      <div
        className="h-full rounded-full bg-accent"
        style={{ width: `${Math.min(100, value)}%` }}
      />
    </div>
  );
}

export function RangeTabs({ current }: { current: ReportRange }) {
  return (
    <div role="tablist" aria-label="Periode laporan" className="inline-flex rounded-lg bg-default/60 p-1">
      {RANGES.map((range) => (
        <Link
          key={range.key}
          href={`/admin/laporan?periode=${range.key}`}
          role="tab"
          aria-selected={current === range.key}
          className={cn(
            "rounded-md px-3 py-1.5 text-sm transition-colors",
            current === range.key
              ? "bg-background font-medium shadow-sm"
              : "text-muted hover:text-foreground",
          )}
        >
          {range.label}
        </Link>
      ))}
    </div>
  );
}

function Th({ children, right }: { children?: React.ReactNode; right?: boolean }) {
  return (
    <th
      className={cn("border-b border-border px-4 py-2.5 font-semibold", right && "text-right")}
    >
      {children}
    </th>
  );
}

function CountTable({
  title,
  firstLabel,
  rows,
}: {
  title: string;
  firstLabel: string;
  rows: CountRow[];
}) {
  return (
    <section className="space-y-2">
      <h2 className="text-sm font-semibold">{title}</h2>
      <div className="overflow-x-auto rounded-xl border border-border bg-surface">
        <table className="w-full min-w-[28rem] border-collapse text-sm">
          <thead className="bg-default/60 text-left">
            <tr>
              <Th>{firstLabel}</Th>
              <Th right>Konten</Th>
              <Th right>Selesai</Th>
              <th className="w-40 border-b border-border px-4 py-2.5 font-semibold">Progres</th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr>
                <td colSpan={4} className="px-4 py-6 text-center text-muted">
                  Belum ada data.
                </td>
              </tr>
            ) : (
              rows.map((row) => (
                <tr key={row.label} className="border-b border-border last:border-b-0">
                  <td className="px-4 py-2.5">{row.label}</td>
                  <td className="px-4 py-2.5 text-right tabular-nums">{row.total}</td>
                  <td className="px-4 py-2.5 text-right tabular-nums">{row.done}</td>
                  <td className="px-4 py-2.5">
                    <Bar value={pct(row.done, row.total)} />
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}

function AkunTable({ rows, withTarget }: { rows: AkunRow[]; withTarget: boolean }) {
  const colSpan = withTarget ? 6 : 4;

  return (
    <section className="space-y-2">
      <h2 className="text-sm font-semibold">Per akun</h2>
      <div className="overflow-x-auto rounded-xl border border-border bg-surface">
        <table className="w-full min-w-[34rem] border-collapse text-sm">
          <thead className="bg-default/60 text-left">
            <tr>
              <Th>Akun</Th>
              <Th right>Konten</Th>
              <Th right>Selesai</Th>
              {withTarget && <Th right>Target</Th>}
              {withTarget && (
                <th className="w-44 border-b border-border px-4 py-2.5 font-semibold">
                  Pencapaian target
                </th>
              )}
              {!withTarget && (
                <th className="w-40 border-b border-border px-4 py-2.5 font-semibold">Progres</th>
              )}
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr>
                <td colSpan={colSpan} className="px-4 py-6 text-center text-muted">
                  Belum ada data.
                </td>
              </tr>
            ) : (
              rows.map((row) => {
                const achieved = row.target ? pct(row.total, row.target) : null;
                return (
                  <tr key={row.label} className="border-b border-border last:border-b-0">
                    <td className="px-4 py-2.5">{row.label}</td>
                    <td className="px-4 py-2.5 text-right tabular-nums">{row.total}</td>
                    <td className="px-4 py-2.5 text-right tabular-nums">{row.done}</td>
                    {withTarget && (
                      <td className="px-4 py-2.5 text-right tabular-nums">
                        {row.target ?? "-"}
                      </td>
                    )}
                    <td className="px-4 py-2.5">
                      {withTarget ? (
                        achieved === null ? (
                          <span className="text-muted">Belum ada target</span>
                        ) : (
                          <div className="flex items-center gap-2">
                            <div className="flex-1">
                              <Bar value={achieved} />
                            </div>
                            <span className="w-10 text-right text-xs tabular-nums text-muted">
                              {achieved}%
                            </span>
                          </div>
                        )
                      ) : (
                        <Bar value={pct(row.done, row.total)} />
                      )}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}

export function ReportView({ report }: { report: Report }) {
  const withTarget = report.targetTotal !== null;
  const realisasi = report.byAkun
    .filter((a) => a.target !== null)
    .reduce((n, a) => n + a.total, 0);

  const period =
    report.from && report.to
      ? `${formatDate(report.from)} sampai ${formatDate(report.to)}`
      : "Semua periode";

  const stats = [
    { label: "Total konten", value: String(report.total) },
    { label: "Selesai", value: String(report.done) },
    { label: "Persentase selesai", value: `${pct(report.done, report.total)}%` },
    ...(withTarget
      ? [{ label: "Target minggu ini", value: `${realisasi}/${report.targetTotal}` }]
      : []),
  ];

  return (
    <div className="space-y-6">
      <div>
        <p className="text-sm font-medium">{period}</p>
        {report.range !== "semua" && (
          <p className="text-xs text-muted">
            Dihitung dari Tgl Produksi. Konten tanpa Tgl Produksi tidak ikut dihitung.
          </p>
        )}
      </div>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {stats.map((s) => (
          <div key={s.label} className="rounded-xl border border-border bg-surface p-4">
            <p className="text-xs text-muted">{s.label}</p>
            <p className="mt-1 text-2xl font-semibold tabular-nums">{s.value}</p>
          </div>
        ))}
      </div>

      <section className="space-y-2">
        <h2 className="text-sm font-semibold">Per status</h2>
        {report.byStatus.length === 0 ? (
          <p className="text-sm text-muted">Belum ada data.</p>
        ) : (
          <div className="flex flex-wrap gap-2">
            {report.byStatus.map((s) => (
              <span
                key={s.label}
                className="inline-flex items-center gap-2 rounded-full border border-border bg-surface px-3 py-1 text-sm"
              >
                {s.label}
                <span className="font-semibold tabular-nums">{s.total}</span>
              </span>
            ))}
          </div>
        )}
      </section>

      <AkunTable rows={report.byAkun} withTarget={withTarget} />
      <CountTable title="Per pilar konten" firstLabel="Pilar" rows={report.byPilar} />
      <CountTable title="Per PIC" firstLabel="PIC" rows={report.byPic} />
      <CountTable title="Per jenis konten" firstLabel="Jenis" rows={report.byJenis} />
    </div>
  );
}