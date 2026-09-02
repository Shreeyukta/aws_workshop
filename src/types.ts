// Enum-like string literals
export type Status = "To Do" | "In Progress" | "Done";
export type Priority = "Low" | "Medium" | "High";

// Core domain types
export interface Task {
  id: string;           // UUID (crypto.randomUUID)
  listId: string;       // FK → TaskList.id (never null; defaults to Inbox id)
  title: string;        // non-empty, max 500 chars
  description?: string;
  status: Status;       // "To Do" | "In Progress" | "Done"
  priority: Priority;   // "Low" | "Medium" | "High"
  dueDate?: string;     // ISO 8601 date string, optional
  createdAt: string;    // ISO 8601 timestamp
  updatedAt: string;    // ISO 8601 timestamp
}

export interface TaskList {
  id: string;           // UUID
  name: string;         // non-empty
  isInbox: boolean;     // true for the auto-created Inbox list
  createdAt: string;
  updatedAt: string;
}

export interface AppState {
  tasks: Task[];
  lists: TaskList[];
}

export interface StatusSummary {
  todo: number;
  inProgress: number;
  done: number;
}

// Filter and sort interfaces
export interface TaskFilter {
  status?: Status;
  priority?: Priority;
  dueDate?: string;     // ISO 8601 date — filter tasks due on or before this date
  listId?: string;
}

export interface TaskSort {
  by: "dueDate" | "priority" | "createdAt";
  order: "asc" | "desc";
}

// Input types for store actions
export interface NewTaskInput {
  title: string;
  description?: string;
  status?: Status;
  priority?: Priority;
  dueDate?: string;
  listId?: string;
}

export interface TaskInput {
  title?: string;
  description?: string;
  status?: Status;
  priority?: Priority;
  dueDate?: string;
  listId?: string;
}

// Validation
export type ValidationResult =
  | { ok: true }
  | { ok: false; message: string };
