export type ActionResult = { ok: true } | { ok: false; error: string };
export type LoginState = { error?: string } | undefined;

/* Master data */

export type MasterKind = "status" | "jenis";

export interface MasterOption {
  id: string;
  kind: MasterKind;
  value: string;
  position: number;
  /** Hanya untuk status: dihitung sebagai "selesai" (highlight tabel + laporan). */
  is_final: boolean;
}

export interface OptionRow extends MasterOption {
  /** Jumlah konten yang memakai pilihan ini. */
  usage: number;
}

/* Anggota tim */

export interface MemberRow {
  id: string;
  email: string;
  full_name: string | null;
  created_at: string;
  project_count: number;
  task_count: number;
}

/* Group */

export interface GroupProject {
  id: string;
  name: string;
  akun: string | null;
  group_id: string | null;
}

/* Ringkasan & laporan */

export interface AdminCounts {
  members: number;
  projects: number;
  groups: number;
  statuses: number;
  jenis: number;
}

export type ReportRange = "minggu" | "bulan" | "semua";

export interface CountRow {
  label: string;
  total: number;
  done: number;
}

export interface AkunRow extends CountRow {
  /** Target produksi per minggu; null jika tidak berlaku. */
  target: number | null;
}

export interface Report {
  range: ReportRange;
  from: string | null;
  to: string | null;
  total: number;
  done: number;
  targetTotal: number | null;
  byStatus: CountRow[];
  byAkun: AkunRow[];
  byPilar: CountRow[];
  byPic: CountRow[];
  byJenis: CountRow[];
}

/* Impor */

export interface ImportSummary {
  inserted: number;
  skipped: number;
  newPics: string[];
  newJenis: string[];
  newStatus: string[];
}

export type ImportResult = { ok: true; data: ImportSummary } | { ok: false; error: string };