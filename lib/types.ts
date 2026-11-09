export interface Project {
  id: string;
  name: string;
  description: string | null;
  slug: string;
  group_id: string | null;
  created_at: string;
}

export interface ProjectGroup {
  id: string;
  name: string;
  color: string;
  position: number;
}

export interface ProjectStats extends Project {
  total: number;
  done: number;
  overdue: number;
}

export interface Profile {
  id: string;
  email: string;
  full_name: string | null;
}

export interface Task {
  id: string;
  title: string;
  description: string | null;
  position: number;
  priority: "low" | "medium" | "high";
  due_date: string | null;
  is_done: boolean;
  created_at: string;
  column_id: string;
  created_by: string | null;
  updated_by: string | null;
  assigned_to: string | null;
}

export interface Column {
  id: string;
  name: string;
  position: number;
  tasks: Task[];
}

/** Input form task (semua string; string kosong = null). */
export interface TaskInput {
  title: string;
  description: string;
  priority: Task["priority"];
  due_date: string;
  assigned_to: string;
}

export interface ProjectDetails {
  pilar: string | null;
  jenis: string | null;
  tema: string | null;
  akun: string | null;
  keyword: string | null;
  hook: string | null;
  cta: string | null;
  prod_date: string | null;
  editor_date: string | null;
  selesai_date: string | null;
  upload_date: string | null;
  pic_id: string | null;
  pic_name: string | null;
  pic_email: string | null;
}

export interface ProjectRow {
  id: string;
  name: string;
  slug: string;
  group_id: string | null;
  pilar: string | null;
  jenis: string | null;
  tema: string | null;
  akun: string | null;
  keyword: string | null;
  hook: string | null;
  cta: string | null;
  prod_date: string | null;
  editor_date: string | null;
  selesai_date: string | null;
  upload_date: string | null;
  status: string;
  pic_id: string | null;
  pic_name: string | null;
  pic_email: string | null;
  periode: string | null;
}

export type ProjectWithDetails = Project & ProjectDetails;