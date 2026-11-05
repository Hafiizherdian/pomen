"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { X } from "lucide-react";

import { FolderIcon } from "@/app/components/ui/folder-icon";

export type ProgressProject = {
  id: string;
  name: string;
  slug: string;
  total: number;
  done: number;
  overdue: number;
};

export type GroupProgress = {
  id: string;
  name: string;
  color: string;
  projects: ProgressProject[];
};

function summarize(projects: ProgressProject[]) {
  const total = projects.reduce((n, p) => n + p.total, 0);
  const done = projects.reduce((n, p) => n + p.done, 0);
  const overdue = projects.reduce((n, p) => n + p.overdue, 0);
  const pct = total ? Math.round((done / total) * 100) : 0;
  return { total, done, overdue, pct };
}

function ProgressBar({ pct }: { pct: number }) {
  return (
    <div className="h-2 overflow-hidden rounded-full bg-default">
      <div className="h-full rounded-full bg-accent" style={{ width: `${pct}%` }} />
    </div>
  );
}

function GroupModal({ group, onClose }: { group: GroupProgress; onClose: () => void }) {
  const summary = summarize(group.projects);

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label={`Project di ${group.name}`}
        className="w-full max-w-lg rounded-xl border border-border bg-surface p-5 shadow-xl"
      >
        <div className="flex items-start gap-3">
          <FolderIcon color={group.color} className="w-12 shrink-0" />
          <div className="min-w-0 flex-1">
            <h2 className="truncate text-lg font-semibold">{group.name}</h2>
            <p className="text-sm text-muted tabular-nums">
              {group.projects.length} project · {summary.done}/{summary.total} task selesai (
              {summary.pct}%)
            </p>
          </div>
          <button
            type="button"
            aria-label="Tutup"
            title="Tutup"
            onClick={onClose}
            className="rounded-md p-1 text-muted transition-colors hover:bg-default hover:text-foreground"
          >
            <X className="size-4" />
          </button>
        </div>

        <div className="mt-4 max-h-[60vh] space-y-2 overflow-y-auto">
          {group.projects.length === 0 && (
            <p className="py-6 text-center text-sm text-muted">Belum ada project di group ini.</p>
          )}
          {group.projects.map((project) => {
            const pct = project.total ? Math.round((project.done / project.total) * 100) : 0;
            return (
              <Link
                key={project.id}
                href={`/projects/${project.slug}`}
                className="block space-y-2 rounded-lg border border-border p-3 transition-colors hover:bg-default"
              >
                <div className="flex items-center justify-between gap-2 text-sm">
                  <span className="truncate font-medium">{project.name}</span>
                  <span className="shrink-0 text-muted tabular-nums">
                    {project.done}/{project.total} selesai
                  </span>
                </div>
                <ProgressBar pct={pct} />
                {project.overdue > 0 && (
                  <p className="text-xs text-danger tabular-nums">
                    {project.overdue} lewat tenggat
                  </p>
                )}
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
}

export function GroupProgressList({ groups }: { groups: GroupProgress[] }) {
  const [openId, setOpenId] = useState<string | null>(null);
  const openGroup = groups.find((group) => group.id === openId) ?? null;

  return (
    <>
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {groups.map((group) => {
          const summary = summarize(group.projects);
          return (
            <button
              key={group.id}
              type="button"
              onClick={() => setOpenId(group.id)}
              className="flex w-full items-center gap-4 rounded-xl border border-border bg-surface p-4 text-left transition-colors hover:bg-default"
            >
              <FolderIcon color={group.color} className="w-14 shrink-0" />
              <div className="min-w-0 flex-1 space-y-2">
                <div className="flex items-center justify-between gap-2 text-sm">
                  <span className="truncate font-medium">{group.name}</span>
                  <span className="shrink-0 text-muted tabular-nums">
                    {summary.done}/{summary.total} selesai
                  </span>
                </div>
                <ProgressBar pct={summary.pct} />
                <p className="text-xs text-muted tabular-nums">
                  {group.projects.length} project
                  {summary.overdue > 0 && ` · ${summary.overdue} lewat tenggat`}
                </p>
              </div>
            </button>
          );
        })}
      </div>

      {openGroup && <GroupModal group={openGroup} onClose={() => setOpenId(null)} />}
    </>
  );
}