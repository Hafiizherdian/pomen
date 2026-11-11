"use client";

import { useMemo, useRef, useState, useTransition } from "react";
import { FileSpreadsheet } from "lucide-react";
import type { WorkBook } from "xlsx";

import { importProjects } from "@/app/admin-import-actions";
import { inputClass } from "@/app/components/admin/admin-ui";
import type { ImportSummary } from "@/lib/admin-types";
import {
  IMPORT_FIELD_LABELS,
  inferPeriode,
  parseGrid,
  planImport,
  type ImportMember,
  type ParsedGrid,
} from "@/lib/import-parse";
import { formatPeriode } from "@/lib/periode";

const PREVIEW_LIMIT = 100;

export function ProjectImporter({
  members,
  jenisOptions,
  statusOptions,
  groups,
  defaultPeriode,
}: {
  members: ImportMember[];
  jenisOptions: string[];
  statusOptions: string[];
  groups: { id: string; name: string }[];
  defaultPeriode: string;
}) {
  const workbook = useRef<WorkBook | null>(null);
  const [fileName, setFileName] = useState("");
  const [sheets, setSheets] = useState<string[]>([]);
  const [sheet, setSheet] = useState("");
  const [parsed, setParsed] = useState<ParsedGrid | null>(null);
  const [parseError, setParseError] = useState<string | null>(null);
  const [periode, setPeriode] = useState(defaultPeriode);
  const [groupId, setGroupId] = useState("");
  const [skipExisting, setSkipExisting] = useState(true);
  const [result, setResult] = useState<ImportSummary | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const plan = useMemo(
    () =>
      parsed
        ? planImport(parsed.rows, { members, jenis: jenisOptions, statuses: statusOptions })
        : null,
    [parsed, members, jenisOptions, statusOptions],
  );

  const additions = plan
    ? [
        plan.newPics.length > 0 &&
          `PIC baru (email sementara @import.local): ${plan.newPics.join(", ")}`,
        plan.newJenis.length > 0 && `Jenis Konten baru: ${plan.newJenis.join(", ")}`,
        plan.newStatus.length > 0 && `Status baru: ${plan.newStatus.join(", ")}`,
      ].filter((line): line is string => Boolean(line))
    : [];
  const withIssues = plan ? plan.rows.filter((r) => r.issues.length > 0).length : 0;

  async function loadSheet(name: string) {
    const XLSX = await import("xlsx");
    const ws = workbook.current?.Sheets[name];
    if (!ws) return;

    const grid = XLSX.utils.sheet_to_json<string[]>(ws, {
      header: 1,
      raw: false,
      defval: "",
      blankrows: true,
      dateNF: "yyyy-mm-dd",
    });
    setSheet(name);

    const res = parseGrid(grid);
    if ("error" in res) {
      setParsed(null);
      setParseError(res.error);
      return;
    }
    setParseError(null);
    setParsed(res);
    const inferred = inferPeriode(res.rows);
    if (inferred) setPeriode(inferred);
  }

  async function handleFile(file: File | undefined) {
    setResult(null);
    setError(null);
    if (!file) return;

    try {
      const XLSX = await import("xlsx");
      const wb = /\.csv$/i.test(file.name)
        ? XLSX.read(await file.text(), { type: "string", raw: true })
        : XLSX.read(await file.arrayBuffer(), { type: "array", cellDates: true });
      workbook.current = wb;
      setFileName(file.name);
      setSheets(wb.SheetNames);
      await loadSheet(wb.SheetNames[0]);
    } catch {
      setParsed(null);
      setParseError("File tidak bisa dibaca. Pastikan formatnya .xlsx, .xls, atau .csv.");
    }
  }

    function handleImport() {
    if (!parsed) return;
    setError(null);
    startTransition(async () => {
      const res = await importProjects({
        rows: parsed.rows,
        periode,
        groupId,
        skipExisting,
        fileName,
        sheetName: sheet,
      });
      if (res.ok) {
        setResult(res.data);
        setParsed(null);
        setFileName("");
        setSheets([]);
      } else {
        setError(res.error);
      }
    });
  }

  return (
    <div className="space-y-6">
      {result && (
        <div role="status" className="space-y-1 rounded-xl border border-border bg-surface p-4 text-sm">
          <p className="font-medium">
            {result.inserted} konten berhasil diimpor
            {result.skipped > 0 && `, ${result.skipped} dilewati karena sudah ada`}.
          </p>
          {result.newPics.length > 0 && (
            <p className="text-muted">PIC baru dibuat: {result.newPics.join(", ")}</p>
          )}
          {result.newJenis.length > 0 && (
            <p className="text-muted">Jenis Konten baru: {result.newJenis.join(", ")}</p>
          )}
          {result.newStatus.length > 0 && (
            <p className="text-muted">Status baru: {result.newStatus.join(", ")}</p>
          )}
          <a href={`/projects?bulan=${periode}`} className="inline-block underline">
            Lihat di halaman Project
          </a>
        </div>
      )}

      <section className="space-y-3 rounded-xl border border-border bg-surface p-4">
        <div>
          <h2 className="text-base font-semibold">Pilih file</h2>
          <p className="text-xs text-muted">
            Format .xlsx, .xls, atau .csv. Judul kolom dicari otomatis, jadi tidak harus di baris
            pertama.
          </p>
        </div>

        <label className="flex cursor-pointer items-center gap-3 rounded-lg border-2 border-dashed border-border p-4 text-sm text-muted transition-colors hover:bg-default/60">
          <FileSpreadsheet className="size-5 shrink-0" />
          <span className="truncate">{fileName || "Klik untuk memilih file"}</span>
          <input
            type="file"
            accept=".xlsx,.xls,.csv"
            className="sr-only"
            onChange={(e) => {
              const file = e.target.files?.[0];
              e.target.value = "";
              handleFile(file);
            }}
          />
        </label>

        {sheets.length > 1 && (
          <label className="grid max-w-xs gap-1 text-xs font-medium text-muted">
            <span>Sheet</span>
            <select value={sheet} onChange={(e) => loadSheet(e.target.value)} className={inputClass}>
              {sheets.map((name) => (
                <option key={name} value={name}>
                  {name}
                </option>
              ))}
            </select>
          </label>
        )}

        {parseError && (
          <p role="alert" className="text-sm text-danger">
            {parseError}
          </p>
        )}

        {parsed && (
          <div className="space-y-1 text-xs text-muted">
            <p>
              Header di baris {parsed.headerLine}. Kolom dikenali:{" "}
              {parsed.mapped.map((f) => IMPORT_FIELD_LABELS[f]).join(", ")}.
            </p>
            {parsed.missing.length > 0 && (
              <p>Tidak ada di file: {parsed.missing.map((f) => IMPORT_FIELD_LABELS[f]).join(", ")}.</p>
            )}
            {parsed.ignored.length > 0 && <p>Kolom diabaikan: {parsed.ignored.join(", ")}.</p>}
          </div>
        )}
      </section>

      {parsed && plan && (
        <>
          <section className="space-y-3 rounded-xl border border-border bg-surface p-4">
            <h2 className="text-base font-semibold">Pengaturan</h2>
            <div className="grid gap-3 sm:grid-cols-2">
              <label className="grid gap-1 text-xs font-medium text-muted">
                <span>Bulan untuk semua konten ini *</span>
                <input
                  type="month"
                  required
                  value={periode}
                  onChange={(e) => setPeriode(e.target.value)}
                  className={inputClass}
                />
              </label>
              <label className="grid gap-1 text-xs font-medium text-muted">
                <span>Masukkan ke group</span>
                <select
                  value={groupId}
                  onChange={(e) => setGroupId(e.target.value)}
                  className={inputClass}
                >
                  <option value="">Tanpa group</option>
                  {groups.map((g) => (
                    <option key={g.id} value={g.id}>
                      {g.name}
                    </option>
                  ))}
                </select>
              </label>
            </div>
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={skipExisting}
                onChange={(e) => setSkipExisting(e.target.checked)}
              />
              Lewati konten yang sudah ada (judul, akun, dan bulan sama)
            </label>
          </section>

          <section className="space-y-3">
            <div>
              <h2 className="text-base font-semibold">
                Pratinjau: {plan.rows.length} konten
                {periode && ` untuk ${formatPeriode(periode)}`}
              </h2>
              {withIssues > 0 && (
                <p className="text-xs text-muted">
                  {withIssues} baris punya catatan. Baris tetap diimpor, nilai yang tidak terbaca
                  dikosongkan.
                </p>
              )}
              {additions.map((line) => (
                <p key={line} className="text-xs text-muted">
                  {line}
                </p>
              ))}
            </div>

            <div className="max-h-[28rem] overflow-auto rounded-xl border border-border bg-surface">
              <table className="w-full min-w-[60rem] border-collapse text-sm">
                <thead className="sticky top-0 bg-default text-left">
                  <tr>
                    {["Baris", "Judul", "Pilar", "Jenis", "Akun", "Tgl Produksi", "PIC", "Status", "Catatan"].map(
                      (h) => (
                        <th key={h} className="border-b border-border px-3 py-2.5 font-semibold">
                          {h}
                        </th>
                      ),
                    )}
                  </tr>
                </thead>
                <tbody>
                  {plan.rows.slice(0, PREVIEW_LIMIT).map((row) => (
                    <tr key={row.line} className="border-b border-border align-top last:border-b-0">
                      <td className="px-3 py-2 tabular-nums text-muted">{row.line}</td>
                      <td className="min-w-56 px-3 py-2">{row.name}</td>
                      <td className="px-3 py-2">{row.pilar || "-"}</td>
                      <td className="px-3 py-2">{row.jenis || "-"}</td>
                      <td className="px-3 py-2">{row.akun || "-"}</td>
                      <td className="px-3 py-2 tabular-nums">{row.prod_date ?? "-"}</td>
                      <td className="px-3 py-2">{row.pic || "-"}</td>
                      <td className="px-3 py-2">{row.status}</td>
                      <td className="min-w-48 px-3 py-2 text-xs text-danger">
                        {row.issues.join("; ")}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {plan.rows.length > PREVIEW_LIMIT && (
              <p className="text-xs text-muted">
                Menampilkan {PREVIEW_LIMIT} baris pertama. Semua {plan.rows.length} baris akan
                diimpor.
              </p>
            )}

            {error && (
              <p role="alert" className="text-sm text-danger">
                {error}
              </p>
            )}

            <button
              type="button"
              disabled={pending || plan.rows.length === 0 || !periode}
              onClick={handleImport}
              className="h-9 rounded-lg bg-accent px-4 text-sm font-medium text-accent-foreground disabled:opacity-50"
            >
              {pending ? "Mengimpor..." : `Impor ${plan.rows.length} konten`}
            </button>
          </section>
        </>
      )}
    </div>
  );
}