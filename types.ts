
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
  TimeManagement = 'time-management',
  UserManagement = 'user-management',
  CategoryManagement = 'category-management',
}

export interface User {
  id: string;
  name: string;
  avatarUrl: string;
  email: string;
  role: 'admin' | 'user';
  isActive: boolean;
  // Enhanced user fields
  phone?: string;
  department?: string;
  position?: string;
  location?: string;
  bio?: string;
  skills?: string[];
  startDate?: string; // YYYY-MM-DD
  reportingTo?: string; // User ID
  directReports?: string[]; // User IDs
  profilePicture?: string; // URL to profile picture
  socialLinks?: {
    linkedin?: string;
    twitter?: string;
    github?: string;
  };
  preferences?: {
    timezone?: string;
    language?: string;
    notifications?: boolean;
    theme?: 'light' | 'dark' | 'auto';
  };
  createdAt: string;
  updatedAt: string;
}

export interface Category {
  id: string;
  name: string;
  color: string;
  description?: string;
  createdBy: string; // user ID
  createdAt: string;
  updatedAt: string;
}

export interface Task {
  id: string;
  title: string;
  description: string;
  assigneeId: string;
  dueDate: string; // YYYY-MM-DD
  priority: Priority;
  status: Status;
  categoryId?: string; // Category for better organization
  reminderAt?: string; // ISO string for date and time
  isRecurring?: boolean;
  recurrenceRule?: 'daily' | 'weekly' | 'monthly';
  recurrenceEndDate?: string; // YYYY-MM-DD
  originalTaskId?: string; // ID of the first task in a series
  // Time management fields
  estimatedDuration?: number; // in minutes
  actualTimeSpent?: number; // in minutes
  timeEntries?: TimeEntry[];
  isEatThatFrog?: boolean; // Most important task of the day
  eatThatFrogDate?: string; // YYYY-MM-DD - which date this is the frog for
  timeBoxes?: TimeBox[]; // Scheduled time blocks
  createdAt: string;
  updatedAt: string;
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

// Authentication Types
export interface AuthUser {
  id: string;
  email: string;
  name: string;
  avatarUrl?: string;
  role?: 'admin' | 'user';
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface AuthState {
  user: AuthUser | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}

// Time Management Types
export enum PomodoroState {
  Idle = 'idle',
  Work = 'work',
  ShortBreak = 'short-break',
  LongBreak = 'long-break',
}

export interface PomodoroSession {
  id: string;
  taskId?: string;
  state: PomodoroState;
  duration: number; // in seconds
  remainingTime: number; // in seconds
  isActive: boolean;
  startTime?: Date;
  endTime?: Date;
  completedPomodoros: number;
}

export interface TimeEntry {
  id: string;
  taskId: string;
  startTime: Date;
  endTime?: Date;
  duration: number; // in seconds
  description?: string;
  isManual?: boolean; // true if manually added, false if tracked
}

export interface TimeBox {
  id: string;
  taskId?: string;
  title: string;
  startTime: Date;
  endTime: Date;
  description?: string;
  color?: string;
  isCompleted?: boolean;
}

export interface DailyPlan {
  id: string;
  date: string; // YYYY-MM-DD
  userId: string;
  eatThatFrogTaskId?: string; // Most important task
  timeBoxes: TimeBox[];
  totalPlannedMinutes: number;
  actualMinutes?: number;
  notes?: string;
}

export interface TimeTrackingStats {
  totalTimeToday: number; // in minutes
  totalTimeThisWeek: number; // in minutes
  totalTimeThisMonth: number; // in minutes
  averageDailyTime: number; // in minutes
  mostProductiveHour: number; // 0-23
  taskCompletionRate: number; // percentage
  pomodorosCompleted: number;
  eatThatFrogStreak: number; // consecutive days
}

export interface TimeManagementSettings {
  pomodoroWorkDuration: number; // in minutes, default 25
  pomodoroShortBreak: number; // in minutes, default 5
  pomodoroLongBreak: number; // in minutes, default 15
  pomodorosUntilLongBreak: number; // default 4
  autoStartBreaks: boolean;
  autoStartWork: boolean;
  showNotifications: boolean;
  defaultTaskDuration: number; // in minutes, default 30
  workingHoursStart: string; // HH:MM format
  workingHoursEnd: string; // HH:MM format
}
