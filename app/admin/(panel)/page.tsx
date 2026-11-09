import Link from "next/link";
import { Suspense } from "react";
import { FolderKanban, Layers, LayoutList, Upload, Users } from "lucide-react";

import { requireAdmin } from "@/lib/admin-auth";
import { getAdminCounts } from "@/lib/admin-queries";

export default function AdminHome() {
  return (
    <Suspense fallback={<p className="text-sm text-muted">Memuat...</p>}>
      <Overview />
    </Suspense>
  );
}

async function Overview() {
  await requireAdmin();
  const counts = await getAdminCounts();

  const sections = [
    {
      href: "/admin/anggota",
      title: "Anggota Tim",
      icon: Users,
      stat: `${counts.members} anggota`,
      text: "Tambah, ubah, atau hapus anggota yang bisa dipilih sebagai PIC dan penerima task.",
    },
    {
      href: "/admin/master-data",
      title: "Data status & jenis",
      icon: Layers,
      stat: `${counts.statuses} status, ${counts.jenis} jenis konten`,
      text: "Atur pilihan Status dan Jenis Konten tanpa mengubah kode.",
    },
    {
      href: "/admin/group",
      title: "Group",
      icon: FolderKanban,
      stat: `${counts.groups} group, ${counts.projects} project`,
      text: "Urutkan group dan pindahkan banyak project sekaligus.",
    },
    {
      href: "/admin/impor",
      title: "Impor data",
      icon: Upload,
      stat: "Excel atau CSV",
      text: "Unggah data konten dari spreadsheet ke database.",
    },
    {
      href: "/admin/laporan",
      title: "Laporan",
      icon: LayoutList,
      stat: `${counts.projects} konten`,
      text: "Ringkasan konten per akun, pilar, PIC, dan status, dibandingkan dengan target mingguan.",
    },
  ];

  return (
    <div className="grid gap-4 sm:grid-cols-2">
      {sections.map((s) => (
        <Link
          key={s.href}
          href={s.href}
          className="flex gap-3 rounded-xl border border-border bg-surface p-4 transition-colors hover:bg-default/60"
        >
          <s.icon className="mt-0.5 size-5 shrink-0 text-muted" />
          <div className="space-y-1">
            <p className="font-medium">{s.title}</p>
            <p className="text-xs tabular-nums text-muted">{s.stat}</p>
            <p className="text-sm text-muted">{s.text}</p>
          </div>
        </Link>
      ))}
    </div>
  );
}