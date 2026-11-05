"use client";

import { useState, useTransition } from "react";
import {
  DragDropContext,
  Draggable,
  Droppable,
  type DropResult,
} from "@hello-pangea/dnd";
import { Calendar, Check, Flag, Pencil, Plus, Trash2, User, X } from "lucide-react";

import {
  createColumn,
  createTask,
  deleteColumn,
  deleteTask,
  renameColumn,
  reorderTasks,
  toggleTaskDone,
  updateTask,
} from "@/app/actions";
import type { Column, Profile, Task, TaskInput } from "@/lib/types";
import { cn } from "@/lib/utils";

const inputClass =
  "w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-focus";

const priorityStyle: Record<Task["priority"], string> = {
  high: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300",
  medium: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300",
  low: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300",
};

const priorityLabel: Record<Task["priority"], string> = {
  high: "Tinggi",
  medium: "Sedang",
  low: "Rendah",
};

type DialogState =
  | { mode: "create"; columnId: string }
  | { mode: "edit"; task: Task }
  | null;

function formatDate(date: string) {
  return new Date(`${date}T00:00:00`).toLocaleDateString("id-ID", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export function KanbanBoard({
  projectId,
  columns: initialColumns,
  profiles,
}: {
  projectId: string;
  columns: Column[];
  profiles: Profile[];
}) {
  const [columns, setColumns] = useState(initialColumns);
  const [prevInitial, setPrevInitial] = useState(initialColumns);
  // Sinkron ulang state lokal saat server mengirim data baru.
  if (prevInitial !== initialColumns) {
    setPrevInitial(initialColumns);
    setColumns(initialColumns);
  }

  const [dialog, setDialog] = useState<DialogState>(null);
  const [newColumn, setNewColumn] = useState("");
  const [, startTransition] = useTransition();

  const profileById = new Map(profiles.map((p) => [p.id, p]));

  function handleDragEnd(result: DropResult) {
    const { source, destination } = result;
    if (!destination) return;
    if (source.droppableId === destination.droppableId && source.index === destination.index) {
      return;
    }

    const next = columns.map((c) => ({ ...c, tasks: [...c.tasks] }));
    const from = next.find((c) => c.id === source.droppableId);
    const to = next.find((c) => c.id === destination.droppableId);
    if (!from || !to) return;

    const [moved] = from.tasks.splice(source.index, 1);
    to.tasks.splice(destination.index, 0, { ...moved, column_id: to.id });
    setColumns(next);

    const touched = from.id === to.id ? [to] : [from, to];
    startTransition(() =>
      reorderTasks(touched.map((c) => ({ columnId: c.id, taskIds: c.tasks.map((t) => t.id) }))),
    );
  }

  function handleToggle(task: Task) {
    const isDone = !task.is_done;
    setColumns((cols) =>
      cols.map((c) => ({
        ...c,
        tasks: c.tasks.map((t) => (t.id === task.id ? { ...t, is_done: isDone } : t)),
      })),
    );
    startTransition(() => toggleTaskDone(task.id, isDone));
  }

  function handleDeleteTask(task: Task) {
    if (!confirm(`Hapus task "${task.title}"?`)) return;
    setColumns((cols) =>
      cols.map((c) => ({ ...c, tasks: c.tasks.filter((t) => t.id !== task.id) })),
    );
    startTransition(() => deleteTask(task.id));
  }

  function handleRenameColumn(column: Column) {
    const name = prompt("Nama kolom baru:", column.name);
    if (name && name.trim() && name.trim() !== column.name) {
      startTransition(() => renameColumn(column.id, name));
    }
  }

  function handleDeleteColumn(column: Column) {
    const extra = column.tasks.length ? ` (${column.tasks.length} task ikut terhapus)` : "";
    if (!confirm(`Hapus kolom "${column.name}"${extra}?`)) return;
    startTransition(() => deleteColumn(column.id));
  }

  function handleAddColumn(e: React.FormEvent) {
    e.preventDefault();
    const name = newColumn.trim();
    if (!name) return;
    setNewColumn("");
    startTransition(() => createColumn(projectId, name));
  }

  function handleSubmitTask(input: TaskInput) {
    if (!dialog) return;
    const current = dialog;
    setDialog(null);
    startTransition(() =>
      current.mode === "create"
        ? createTask(current.columnId, input)
        : updateTask(current.task.id, input),
    );
  }

  return (
    <>
      <DragDropContext onDragEnd={handleDragEnd}>
        <div className="flex items-start gap-4 overflow-x-auto pb-4">
          {columns.map((column) => (
            <div
              key={column.id}
              className="w-80 shrink-0 rounded-xl border border-border bg-default/40"
            >
              <div className="flex items-center justify-between gap-2 p-3">
                <div className="flex min-w-0 items-center gap-2">
                  <h3 className="truncate text-sm font-medium">{column.name}</h3>
                  <span className="rounded-full bg-default px-2 py-0.5 text-xs tabular-nums text-muted">
                    {column.tasks.length}
                  </span>
                </div>
                <div className="flex items-center">
                  <IconButton label="Ganti nama kolom" onClick={() => handleRenameColumn(column)}>
                    <Pencil className="size-3.5" />
                  </IconButton>
                  <IconButton
                    label="Hapus kolom"
                    onClick={() => handleDeleteColumn(column)}
                    danger
                  >
                    <Trash2 className="size-3.5" />
                  </IconButton>
                </div>
              </div>

              <Droppable droppableId={column.id}>
                {(provided, snapshot) => (
                  <div
                    ref={provided.innerRef}
                    {...provided.droppableProps}
                    className={cn(
                      "min-h-12 space-y-2 px-3 pb-2 transition-colors",
                      snapshot.isDraggingOver && "bg-default/60",
                    )}
                  >
                    {column.tasks.map((task, index) => {
                      const assignee = task.assigned_to ? profileById.get(task.assigned_to) : null;
                      return (
                        <Draggable key={task.id} draggableId={task.id} index={index}>
                          {(dragProvided, dragSnapshot) => (
                            <div
                              ref={dragProvided.innerRef}
                              {...dragProvided.draggableProps}
                              {...dragProvided.dragHandleProps}
                              className={cn(
                                "space-y-2 rounded-lg border border-border bg-surface p-3 text-sm shadow-sm",
                                dragSnapshot.isDragging && "ring-2 ring-accent",
                                task.is_done && "opacity-70",
                              )}
                            >
                              <div className="flex items-start gap-2">
                                <button
                                  type="button"
                                  aria-label="Tandai selesai"
                                  onClick={() => handleToggle(task)}
                                  className={cn(
                                    "mt-0.5 flex size-4 shrink-0 items-center justify-center rounded border-2 transition-colors",
                                    task.is_done
                                      ? "border-accent bg-accent text-accent-foreground"
                                      : "border-muted/50 hover:border-accent",
                                  )}
                                >
                                  {task.is_done && <Check className="size-3" />}
                                </button>
                                <p
                                  className={cn(
                                    "flex-1 font-medium leading-tight",
                                    task.is_done && "text-muted line-through",
                                  )}
                                >
                                  {task.title}
                                </p>
                                <IconButton
                                  label="Edit task"
                                  onClick={() => setDialog({ mode: "edit", task })}
                                >
                                  <Pencil className="size-3.5" />
                                </IconButton>
                                <IconButton
                                  label="Hapus task"
                                  onClick={() => handleDeleteTask(task)}
                                  danger
                                >
                                  <Trash2 className="size-3.5" />
                                </IconButton>
                              </div>

                              {task.description && (
                                <p className="line-clamp-2 text-xs text-muted">{task.description}</p>
                              )}

                              <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-muted">
                                <span
                                  className={cn(
                                    "inline-flex items-center gap-1 rounded-full px-2 py-0.5",
                                    priorityStyle[task.priority],
                                  )}
                                >
                                  <Flag className="size-3" />
                                  {priorityLabel[task.priority]}
                                </span>
                                <span className="inline-flex items-center gap-1">
                                  <User className="size-3" />
                                  {assignee ? assignee.full_name || assignee.email : "Belum ditugaskan"}
                                </span>
                              </div>

                              {task.due_date && (
                                <div className="flex items-center justify-end gap-1 text-xs text-muted">
                                  <Calendar className="size-3" />
                                  {formatDate(task.due_date)}
                                </div>
                              )}
                            </div>
                          )}
                        </Draggable>
                      );
                    })}
                    {provided.placeholder}
                  </div>
                )}
              </Droppable>

              <div className="p-2 pt-0">
                <button
                  type="button"
                  onClick={() => setDialog({ mode: "create", columnId: column.id })}
                  className="flex w-full items-center gap-2 rounded-lg px-2 py-2 text-sm text-muted transition-colors hover:bg-default hover:text-foreground"
                >
                  <Plus className="size-4" />
                  Tambah task
                </button>
              </div>
            </div>
          ))}

        </div>
      </DragDropContext>

      {dialog && (
        <TaskDialog
          key={dialog.mode === "edit" ? dialog.task.id : `new-${dialog.columnId}`}
          title={dialog.mode === "edit" ? "Edit task" : "Task baru"}
          initial={dialog.mode === "edit" ? dialog.task : undefined}
          profiles={profiles}
          onClose={() => setDialog(null)}
          onSubmit={handleSubmitTask}
        />
      )}
    </>
  );
}

function IconButton({
  label,
  onClick,
  danger,
  children,
}: {
  label: string;
  onClick: () => void;
  danger?: boolean;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      onClick={onClick}
      className={cn(
        "rounded-md p-1 text-muted transition-colors hover:bg-default",
        danger ? "hover:text-danger" : "hover:text-foreground",
      )}
    >
      {children}
    </button>
  );
}

function TaskDialog({
  title,
  initial,
  profiles,
  onClose,
  onSubmit,
}: {
  title: string;
  initial?: Task;
  profiles: Profile[];
  onClose: () => void;
  onSubmit: (input: TaskInput) => void;
}) {
  const [form, setForm] = useState<TaskInput>({
    title: initial?.title ?? "",
    description: initial?.description ?? "",
    priority: initial?.priority ?? "medium",
    due_date: initial?.due_date ?? "",
    assigned_to: initial?.assigned_to ?? "",
  });

  function set<K extends keyof TaskInput>(key: K, value: TaskInput[K]) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <form
        onSubmit={(e) => {
          e.preventDefault();
          if (form.title.trim()) onSubmit(form);
        }}
        className="w-full max-w-md space-y-4 rounded-xl border border-border bg-surface p-5 shadow-xl"
      >
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">{title}</h2>
          <IconButton label="Tutup" onClick={onClose}>
            <X className="size-4" />
          </IconButton>
        </div>

        <label className="block space-y-1 text-sm">
          <span className="font-medium">Judul</span>
          <input
            autoFocus
            required
            value={form.title}
            onChange={(e) => set("title", e.target.value)}
            className={inputClass}
          />
        </label>

        <label className="block space-y-1 text-sm">
          <span className="font-medium">Deskripsi</span>
          <textarea
            rows={3}
            value={form.description}
            onChange={(e) => set("description", e.target.value)}
            className={inputClass}
          />
        </label>

        <div className="grid grid-cols-2 gap-3">
          <label className="block space-y-1 text-sm">
            <span className="font-medium">Prioritas</span>
            <select
              value={form.priority}
              onChange={(e) => set("priority", e.target.value as Task["priority"])}
              className={inputClass}
            >
              <option value="low">Rendah</option>
              <option value="medium">Sedang</option>
              <option value="high">Tinggi</option>
            </select>
          </label>
          <label className="block space-y-1 text-sm">
            <span className="font-medium">Tenggat</span>
            <input
              type="date"
              value={form.due_date}
              onChange={(e) => set("due_date", e.target.value)}
              className={inputClass}
            />
          </label>
        </div>

        <label className="block space-y-1 text-sm">
          <span className="font-medium">Ditugaskan ke</span>
          <select
            value={form.assigned_to}
            onChange={(e) => set("assigned_to", e.target.value)}
            className={inputClass}
          >
            <option value="">Belum ditugaskan</option>
            {profiles.map((p) => (
              <option key={p.id} value={p.id}>
                {p.full_name || p.email}
              </option>
            ))}
          </select>
        </label>

        <div className="flex justify-end gap-2 pt-2">
          <button
            type="button"
            onClick={onClose}
            className="h-9 rounded-lg px-4 text-sm transition-colors hover:bg-default"
          >
            Batal
          </button>
          <button
            type="submit"
            className="h-9 rounded-lg bg-accent px-4 text-sm font-medium text-accent-foreground"
          >
            Simpan
          </button>
        </div>
      </form>
    </div>
  );
}