/**
 * Membaca data spreadsheet menjadi baris project.
 * Murni (tanpa server-only) supaya bisa dipakai di browser dan di server.
 */

export const IMPORT_FIELDS = [
  "pilar",
  "name",
  "jenis",
  "tema",
  "akun",
  "keyword",
  "hook",
  "cta",
  "prod_date",
  "editor_date",
  "selesai_date",
  "upload_date",
  "pic",
  "status",
] as const;

export type ImportField = (typeof IMPORT_FIELDS)[number];

export const IMPORT_FIELD_LABELS: Record<ImportField, string> = {
  pilar: "Pilar Konten",
  name: "Judul Konten",
  jenis: "Jenis Konten",
  tema: "Tema",
  akun: "Akun",
  keyword: "Fokus Keyword",
  hook: "HOOK",
  cta: "CTA",
  prod_date: "Tgl Produksi",
  editor_date: "Tgl Masuk Editor",
  selesai_date: "Tgl Selesai",
  upload_date: "Tgl Upload",
  pic: "PIC",
  status: "Status",
};

/** Satu baris mentah dari file (semua nilai berupa teks). */
export type RawImportRow = { line: number } & Record<ImportField, string>;

export interface ParsedGrid {
  rows: RawImportRow[];
  mapped: ImportField[];
  missing: ImportField[];
  /** Judul kolom di file yang tidak dipakai. */
  ignored: string[];
  headerLine: number;
}

/* Header */

const RULES: { field: ImportField; test: (h: string) => boolean }[] = [
  { field: "pilar", test: (h) => h === "pilar" || h === "pilarkonten" },
  { field: "name", test: (h) => h === "judul" || h === "judulkonten" },
  { field: "jenis", test: (h) => h === "jenis" || h === "jeniskonten" },
  { field: "tema", test: (h) => h === "tema" },
  { field: "akun", test: (h) => h === "akun" },
  { field: "keyword", test: (h) => h.includes("keyword") },
  { field: "hook", test: (h) => h === "hook" },
  { field: "cta", test: (h) => h === "cta" || h.includes("calltoaction") },
  { field: "prod_date", test: (h) => h.includes("produksi") },
  { field: "editor_date", test: (h) => h.includes("editor") },
  { field: "selesai_date", test: (h) => h === "tglselesai" || h === "tanggalselesai" },
  {
    field: "upload_date",
    test: (h) => (h.includes("tgl") || h.includes("tanggal")) && h.includes("upload"),
  },
  { field: "pic", test: (h) => h === "pic" },
  { field: "status", test: (h) => h === "status" },
];

const norm = (value: unknown) =>
  String(value ?? "")
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "");

/** `grid` = baris-baris sheet (array of array). Header dicari di 15 baris pertama. */
export function parseGrid(grid: unknown[][]): ParsedGrid | { error: string } {
  let headerIndex = -1;
  for (let i = 0; i < Math.min(grid.length, 15); i++) {
    if (grid[i].some((cell) => ["judul", "judulkonten"].includes(norm(cell)))) {
      headerIndex = i;
      break;
    }
  }
  if (headerIndex < 0) {
    return { error: 'Kolom "JUDUL KONTEN" tidak ditemukan di 15 baris pertama sheet ini.' };
  }

  const columns = new Map<ImportField, number>();
  const ignored: string[] = [];
  grid[headerIndex].forEach((cell, col) => {
    const h = norm(cell);
    if (!h || h === "no") return;
    const rule = RULES.find((r) => !columns.has(r.field) && r.test(h));
    if (rule) columns.set(rule.field, col);
    else ignored.push(String(cell).trim());
  });

  const rows: RawImportRow[] = [];
  for (let i = headerIndex + 1; i < grid.length; i++) {
    const row = grid[i];
    const get = (field: ImportField) => {
      const col = columns.get(field);
      return col === undefined ? "" : String(row[col] ?? "").trim();
    };
    if (!get("name")) continue;

    const item = { line: i + 1 } as RawImportRow;
    for (const field of IMPORT_FIELDS) item[field] = get(field);
    rows.push(item);
  }

  return {
    rows,
    mapped: [...columns.keys()],
    missing: IMPORT_FIELDS.filter((f) => !columns.has(f)),
    ignored,
    headerLine: headerIndex + 1,
  };
}

/* Tanggal */

const MONTHS: Record<string, number> = {
  jan: 1, januari: 1, january: 1,
  feb: 2, februari: 2, february: 2,
  mar: 3, maret: 3, march: 3,
  apr: 4, april: 4,
  mei: 5, may: 5,
  jun: 6, juni: 6, june: 6,
  jul: 7, juli: 7, july: 7,
  agu: 8, agt: 8, agustus: 8, aug: 8, august: 8,
  sep: 9, sept: 9, september: 9,
  okt: 10, oktober: 10, oct: 10, october: 10,
  nov: 11, november: 11,
  des: 12, desember: 12, dec: 12, december: 12,
};

const fullYear = (y: number) => (y < 100 ? 2000 + y : y);

function validDate(y: number, m: number, d: number) {
  if (m < 1 || m > 12 || d < 1 || d > 31) return null;
  const date = new Date(Date.UTC(y, m - 1, d));
  if (date.getUTCFullYear() !== y || date.getUTCMonth() !== m - 1 || date.getUTCDate() !== d) {
    return null;
  }
  return `${y}-${String(m).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
}

/** Mengenali "2026-09-01", "1-Sep-2026", "1 September 2026", dan "01/09/2026" (hari/bulan/tahun). */
export function parseImportDate(input: string): string | null {
  const s = String(input ?? "").trim();
  if (!s) return null;

  let m = s.match(/^(\d{4})-(\d{1,2})-(\d{1,2})(?:[T\s].*)?$/);
  if (m) return validDate(+m[1], +m[2], +m[3]);

  m = s.match(/^(\d{1,2})[\s.\/\-]+([A-Za-z]+)\.?[\s.,\/\-]+(\d{2,4})$/);
  if (m) {
    const month = MONTHS[m[2].toLowerCase()];
    return month ? validDate(fullYear(+m[3]), month, +m[1]) : null;
  }

  m = s.match(/^(\d{1,2})[.\/\-](\d{1,2})[.\/\-](\d{2,4})$/);
  if (m) return validDate(fullYear(+m[3]), +m[2], +m[1]);

  return null;
}

/** Bulan yang paling banyak muncul di Tgl Produksi (atau Tgl Upload). */
export function inferPeriode(rows: RawImportRow[]): string | null {
  const counts = new Map<string, number>();
  for (const row of rows) {
    const date = parseImportDate(row.prod_date) ?? parseImportDate(row.upload_date);
    if (date) counts.set(date.slice(0, 7), (counts.get(date.slice(0, 7)) ?? 0) + 1);
  }
  let best: string | null = null;
  let max = 0;
  for (const [periode, n] of counts) {
    if (n > max) {
      best = periode;
      max = n;
    }
  }
  return best;
}

/* Rencana impor */

export interface ImportMember {
  id: string;
  email: string;
  full_name: string | null;
}

export interface ImportContext {
  members: ImportMember[];
  jenis: string[];
  statuses: string[];
}

export interface ImportRow {
  line: number;
  name: string;
  pilar: string;
  jenis: string;
  tema: string;
  akun: string;
  keyword: string;
  hook: string;
  cta: string;
  prod_date: string | null;
  editor_date: string | null;
  selesai_date: string | null;
  upload_date: string | null;
  pic: string;
  status: string;
  issues: string[];
}

export interface ImportPlan {
  rows: ImportRow[];
  newPics: string[];
  newJenis: string[];
  newStatus: string[];
}

const key = (s: string) => s.trim().toLowerCase();
const clip = (s: string, max: number) => String(s ?? "").trim().slice(0, max);

/** Cocokkan nama PIC di file dengan anggota (nama lengkap, email, atau bagian depan email). */
export function matchMember(name: string, members: ImportMember[]) {
  const k = key(name);
  if (!k) return null;
  return (
    members.find(
      (m) =>
        key(m.full_name ?? "") === k || key(m.email) === k || key(m.email.split("@")[0]) === k,
    ) ?? null
  );
}

/** Membersihkan baris, menyamakan Jenis/Status dengan master data, dan mendata apa yang baru. */
export function planImport(raw: RawImportRow[], ctx: ImportContext): ImportPlan {
  const jenisByKey = new Map(ctx.jenis.map((v) => [key(v), v]));
  const statusByKey = new Map(ctx.statuses.map((v) => [key(v), v]));
  const newJenis = new Map<string, string>();
  const newStatus = new Map<string, string>();
  const newPics = new Map<string, string>();
  const defaultStatus = ctx.statuses[0] ?? "Belum";

  const rows = raw.map((r): ImportRow => {
    const issues: string[] = [];

    const date = (field: ImportField, label: string) => {
      const parsed = parseImportDate(r[field]);
      if (r[field].trim() && !parsed) issues.push(`${label} tidak terbaca: "${clip(r[field], 20)}"`);
      return parsed;
    };

    let jenis = "";
    const jenisRaw = clip(r.jenis, 100);
    if (jenisRaw) {
      const k = key(jenisRaw);
      const found = jenisByKey.get(k) ?? newJenis.get(k);
      if (found) jenis = found;
      else {
        newJenis.set(k, jenisRaw);
        jenis = jenisRaw;
      }
    }

    let status = defaultStatus;
    const statusRaw = clip(r.status, 100);
    if (statusRaw) {
      const k = key(statusRaw);
      const found = statusByKey.get(k) ?? newStatus.get(k);
      if (found) status = found;
      else {
        newStatus.set(k, statusRaw);
        status = statusRaw;
      }
    }

    const pic = clip(r.pic, 100);
    if (pic && !matchMember(pic, ctx.members) && !newPics.has(key(pic))) {
      newPics.set(key(pic), pic);
    }

    if (!r.pilar.trim()) issues.push("Pilar kosong");
    if (!r.akun.trim()) issues.push("Akun kosong");

    return {
      line: r.line,
      name: clip(r.name, 200),
      pilar: clip(r.pilar, 500),
      jenis,
      tema: clip(r.tema, 500),
      akun: clip(r.akun, 500),
      keyword: clip(r.keyword, 500),
      hook: clip(r.hook, 500),
      cta: clip(r.cta, 500),
      prod_date: date("prod_date", "Tgl Produksi"),
      editor_date: date("editor_date", "Tgl Masuk Editor"),
      selesai_date: date("selesai_date", "Tgl Selesai"),
      upload_date: date("upload_date", "Tgl Upload"),
      pic,
      status,
      issues,
    };
  });

  return {
    rows,
    newPics: [...newPics.values()],
    newJenis: [...newJenis.values()],
    newStatus: [...newStatus.values()],
  };
}