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