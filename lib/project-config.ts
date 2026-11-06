export const JENIS_KONTEN = ["Carousel", "Single Image", "Video/Reels"] as const;
export const PROJECT_STATUSES = ["Belum", "Proses", "Selesai"] as const;

export type ProjectStatus = (typeof PROJECT_STATUSES)[number];