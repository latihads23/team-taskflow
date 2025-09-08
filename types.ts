
export enum Priority {
  Low = 'Low',
  Medium = 'Medium',
  High = 'High',
  Urgent = 'Urgent',
}

export enum Status {
  ToDo = 'To Do',
  InProgress = 'In Progress',
  Done = 'Done',
}

export enum ViewType {
  Board = 'board',
  Calendar = 'calendar',
}

export interface User {
  id: string;
  name: string;
  avatarUrl: string;
  email?: string;
}

export interface Task {
  id: string;
  title: string;
  description: string;
  assigneeId: string;
  dueDate: string; // YYYY-MM-DD
  priority: Priority;
  status: Status;
  reminderAt?: string; // ISO string for date and time
  isRecurring?: boolean;
  recurrenceRule?: 'daily' | 'weekly' | 'monthly';
  recurrenceEndDate?: string; // YYYY-MM-DD
  originalTaskId?: string; // ID of the first task in a series
}

// Represents the shape of task data stored in Firestore, before it gets an ID.
export type TaskData = Omit<Task, 'id'>;


export interface ChatMessage {
  role: 'user' | 'model';
  content: string;
}

export interface Toast {
    id: string;
    message: string;
    type: 'info' | 'success' | 'warning';
}

export interface ActivityLog {
    id:string;
    message: string;
    timestamp: string; // ISO string
}
