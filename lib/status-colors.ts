/** Pilihan warna baris status. Kelas ditulis utuh supaya terbaca oleh Tailwind. */
export const STATUS_COLORS = {
  yellow: { label: "Kuning", row: "bg-yellow-200 dark:bg-yellow-500/25" },
  blue: { label: "Biru", row: "bg-blue-200 dark:bg-blue-500/25" },
  green: { label: "Hijau", row: "bg-green-200 dark:bg-green-500/25" },
  red: { label: "Merah", row: "bg-red-200 dark:bg-red-500/25" },
  orange: { label: "Oranye", row: "bg-orange-200 dark:bg-orange-500/25" },
  purple: { label: "Ungu", row: "bg-purple-200 dark:bg-purple-500/25" },
} as const;

export type StatusColor = keyof typeof STATUS_COLORS;

export function isStatusColor(value: unknown): value is StatusColor {
  return typeof value === "string" && Object.hasOwn(STATUS_COLORS, value);
}

/** Tanpa warna pilihan: status "selesai" tetap kuning, lainnya polos. */
export function statusRowClass(color: string | null | undefined, isFinal: boolean) {
  if (isStatusColor(color)) return STATUS_COLORS[color].row;
  return isFinal ? STATUS_COLORS.yellow.row : "";
}