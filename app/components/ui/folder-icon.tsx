import type { CSSProperties } from "react";

/** Ikon folder dua warna. Warna belakang otomatis dibuat lebih gelap dari `color`. */
export function FolderIcon({ color, className }: { color: string; className?: string }) {
  const vars = {
    "--folder": color,
    "--folder-back": `color-mix(in srgb, ${color} 82%, black)`,
  } as CSSProperties;

  return (
    <svg viewBox="70 110 600 520" aria-hidden="true" className={className} style={vars}>
      <path
        d="M82 168C82 140 100 122 128 122H260L325 168H608C638 168 655 186 655 216V320H82Z"
        style={{ fill: "var(--folder-back)" }}
      />
      <rect x="82" y="212" width="573" height="400" rx="48" style={{ fill: "var(--folder)" }} />
    </svg>
  );
}