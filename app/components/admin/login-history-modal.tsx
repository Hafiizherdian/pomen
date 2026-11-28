"use client";

import { useEffect, useRef, useState } from "react";
import { X } from "lucide-react";

import { getLoginHistoryByAccount } from "@/app/account-actions";
import type { LoginHistoryRow } from "@/lib/login-history";

const formatTime = new Intl.DateTimeFormat("id-ID", {
  dateStyle: "medium",
  timeStyle: "short",
  timeZone: "Asia/Jakarta",
});

/** Ringkasan user agent: "Chrome · Windows". */
function device(ua: string | null) {
  if (!ua) return "-";
  const browser = /Edg/.test(ua) ? "Edge" : /OPR/.test(ua) ? "Opera" : /Firefox|FxiOS/.test(ua) ? "Firefox"
    : /Chrome|CriOS/.test(ua) ? "Chrome" : /Safari/.test(ua) ? "Safari" : "Lainnya";
  const os = /Android/.test(ua) ? "Android" : /iPhone|iPad/.test(ua) ? "iOS" : /Windows/.test(ua) ? "Windows"
    : /Mac OS/.test(ua) ? "macOS" : /Linux/.test(ua) ? "Linux" : "Lainnya";
  return `${browser} · ${os}`;
}

const th = "sticky top-0 border-b border-border bg-surface px-4 py-2.5 font-semibold";

export function LoginHistoryModal({
  accountId,
  accountName,
  onClose,
}: {
  accountId: string;
  accountName: string;
  onClose: () => void;
}) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [rows, setRows] = useState<LoginHistoryRow[] | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    const dialog = dialogRef.current;
    if (dialog && !dialog.open) dialog.showModal();
  }, []);

  useEffect(() => {
    let active = true;
    getLoginHistoryByAccount(accountId)
      .then((data) => active && setRows(data))
      .catch(() => active && setError("Gagal memuat riwayat. Coba lagi."));
    return () => {
      active = false;
    };
  }, [accountId]);

  const message = error || (!rows ? "Memuat..." : rows.length === 0 ? "Belum ada riwayat." : "");

  return (
    <dialog
      ref={dialogRef}
      onClose={onClose}
      // Klik di area gelap (di luar isi) menutup modal.
      onClick={(e) => e.target === e.currentTarget && e.currentTarget.close()}
      aria-labelledby="login-history-title"
      className="m-auto w-[min(42rem,calc(100vw-2rem))] rounded-xl border border-border bg-surface p-0 text-foreground backdrop:bg-black/50"
    >
      <div className="flex items-center justify-between gap-3 border-b border-border px-4 py-3">
        <div>
          <h3 id="login-history-title" className="font-semibold">Riwayat login</h3>
          <p className="text-xs text-muted">{accountName} · 50 percobaan terakhir, waktu WIB</p>
        </div>
        <button
          type="button"
          aria-label="Tutup"
          onClick={() => dialogRef.current?.close()}
          className="inline-flex size-8 items-center justify-center rounded-md transition-colors hover:bg-default"
        >
          <X className="size-4" />
        </button>
      </div>

      <div className="max-h-[60vh] overflow-auto">
        {message ? (
          <p className="px-4 py-8 text-center text-sm text-muted">{message}</p>
        ) : (
          <table className="w-full min-w-[30rem] border-collapse text-left text-sm">
            <thead>
              <tr>
                <th className={th}>Waktu</th>
                <th className={th}>Hasil</th>
                <th className={th}>Alamat IP</th>
                <th className={th}>Perangkat</th>
              </tr>
            </thead>
            <tbody>
              {rows?.map((row) => (
                <tr key={row.id} className="border-b border-border last:border-b-0">
                  <td className="whitespace-nowrap px-4 py-2.5">
                    {formatTime.format(new Date(row.created_at))}
                  </td>
                  <td className="px-4 py-2.5">{row.success ? "Berhasil" : "Gagal"}</td>
                  <td className="px-4 py-2.5 text-muted">{row.ip_address || "-"}</td>
                  <td className="px-4 py-2.5 text-muted">{device(row.user_agent)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </dialog>
  );
}