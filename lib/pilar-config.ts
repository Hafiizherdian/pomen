export type PilarKind = "overview" | "breakdown" | "story" | "target";

export type PilarColumn = { key: string; label: string; className?: string };

export const PILAR_COLUMNS: Record<PilarKind, PilarColumn[]> = {
  overview: [
    { key: "pilar", label: "Pilar Konten", className: "min-w-40" },
    { key: "deskripsi", label: "Deskripsi", className: "min-w-64" },
    {
      key: "contoh",
      label: "Contoh Konten untuk Instagram/TikTok",
      className: "min-w-64",
    },
    { key: "tujuan", label: "Tujuan", className: "min-w-40" },
    { key: "frekuensi", label: "Frekuensi Rekomendasi", className: "min-w-40" },
  ],
  breakdown: [
    { key: "pilar", label: "Pilar Konten", className: "min-w-40" },
    { key: "persen", label: "% Konten", className: "min-w-24" },
    { key: "jenis", label: "Jenis Konten Utama", className: "min-w-48" },
    { key: "target", label: "Target Produksi / Minggu", className: "min-w-40" },
    { key: "campaign", label: "Tujuan Campaign", className: "min-w-40" },
    { key: "niche", label: "Niche Audience", className: "min-w-40" },
  ],
  story: [{ key: "item", label: "Story (Daily)" }],
  target: [
    { key: "jenis", label: "Jenis Konten", className: "min-w-48" },
    { key: "target", label: "Target", className: "min-w-24" },
  ],
};

export const PILAR_PER_ACCOUNT: PilarKind[] = ["breakdown", "story"];

export type PilarAccount = { id: string; name: string; position: number };

export type PilarRow = {
  id: string;
  kind: PilarKind;
  position: number;
  account_id: string | null;
  data: Record<string, string>;
};

export type PilarRows = Record<PilarKind, PilarRow[]>;