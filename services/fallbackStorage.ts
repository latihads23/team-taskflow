import { Task, User, Category, TaskData, TimeEntry, TimeBox } from '../types';

// Fallback localStorage service untuk demo purposes
export class FallbackStorageService {
  private getFromStorage<T>(key: string, defaultValue: T): T {
    try {
      const item = localStorage.getItem(key);
      return item ? JSON.parse(item) : defaultValue;
    } catch {
      return defaultValue;
    }
  }

  private setToStorage<T>(key: string, data: T): void {
    try {
      localStorage.setItem(key, JSON.stringify(data));
    } catch (error) {
      console.error('Failed to save to localStorage:', error);
    }
  }

  private generateId(): string {
    return Date.now().toString() + Math.random().toString(36).substr(2, 9);
  }

  // Tasks
  getTasks(): Task[] {
    return this.getFromStorage('taskflow_tasks', []);
  }

  addTask(taskData: TaskData): string {
    const tasks = this.getTasks();
    const newTask: Task = {
      ...taskData,
      id: this.generateId(),
    };
    tasks.push(newTask);
    this.setToStorage('taskflow_tasks', tasks);
    return newTask.id;
  }

  updateTask(taskId: string, updates: Partial<Task>): void {
    const tasks = this.getTasks();
    const index = tasks.findIndex(t => t.id === taskId);
    if (index !== -1) {
      tasks[index] = { ...tasks[index], ...updates, updatedAt: new Date().toISOString() };
      this.setToStorage('taskflow_tasks', tasks);
    }
  }

  deleteTask(taskId: string): void {
    const tasks = this.getTasks();
    const filtered = tasks.filter(t => t.id !== taskId);
    this.setToStorage('taskflow_tasks', filtered);
  }

  deleteRecurringSeries(originalTaskId: string): void {
    const tasks = this.getTasks();
    const filtered = tasks.filter(t => t.originalTaskId !== originalTaskId && t.id !== originalTaskId);
    this.setToStorage('taskflow_tasks', filtered);
  }

  // Users
  getUsers(): User[] {
    return this.getFromStorage('taskflow_users', []);
  }

  addUser(userData: Omit<User, 'id' | 'createdAt' | 'updatedAt'>): User {
    const users = this.getUsers();
    const newUser: User = {
      ...userData,
      id: this.generateId(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    users.push(newUser);
    this.setToStorage('taskflow_users', users);
    return newUser;
  }

  updateUser(userId: string, updates: Partial<User>): User | null {
    const users = this.getUsers();
    const index = users.findIndex(u => u.id === userId);
    if (index !== -1) {
      users[index] = { ...users[index], ...updates, updatedAt: new Date().toISOString() };
      this.setToStorage('taskflow_users', users);
      return users[index];
    }
    return null;
  }

  deleteUser(userId: string): void {
    const users = this.getUsers();
    const filtered = users.filter(u => u.id !== userId);
    this.setToStorage('taskflow_users', filtered);
  }

  // Categories
  getCategories(): Category[] {
    return this.getFromStorage('taskflow_categories', []);
  }

  addCategory(categoryData: Omit<Category, 'id' | 'createdAt' | 'updatedAt'>): Category {
    const categories = this.getCategories();
    const newCategory: Category = {
      ...categoryData,
      id: this.generateId(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    categories.push(newCategory);
    this.setToStorage('taskflow_categories', categories);
    return newCategory;
  }

  updateCategory(categoryId: string, updates: Partial<Category>): Category | null {
    const categories = this.getCategories();
    const index = categories.findIndex(c => c.id === categoryId);
    if (index !== -1) {
      categories[index] = { ...categories[index], ...updates, updatedAt: new Date().toISOString() };
      this.setToStorage('taskflow_categories', categories);
      return categories[index];
    }
    return null;
  }

  deleteCategory(categoryId: string): void {
    const categories = this.getCategories();
    const filtered = categories.filter(c => c.id !== categoryId);
    this.setToStorage('taskflow_categories', filtered);
  }

  // Time Entries
  getTimeEntries(): TimeEntry[] {
    return this.getFromStorage('taskflow_time_entries', []);
  }

  addTimeEntry(entryData: Omit<TimeEntry, 'id'>): TimeEntry {
    const entries = this.getTimeEntries();
    const newEntry: TimeEntry = {
      ...entryData,
      id: this.generateId(),
    };
    entries.push(newEntry);
    this.setToStorage('taskflow_time_entries', entries);
    return newEntry;
  }

  updateTimeEntry(entryId: string, updates: Partial<TimeEntry>): TimeEntry | null {
    const entries = this.getTimeEntries();
    const index = entries.findIndex(e => e.id === entryId);
    if (index !== -1) {
      entries[index] = { ...entries[index], ...updates };
      this.setToStorage('taskflow_time_entries', entries);
      return entries[index];
    }
    return null;
  }

  deleteTimeEntry(entryId: string): void {
    const entries = this.getTimeEntries();
    const filtered = entries.filter(e => e.id !== entryId);
    this.setToStorage('taskflow_time_entries', filtered);
  }

  // Time Boxes
  getTimeBoxes(): TimeBox[] {
    return this.getFromStorage('taskflow_time_boxes', []);
  }

  addTimeBox(timeBoxData: Omit<TimeBox, 'id'>): TimeBox {
    const timeBoxes = this.getTimeBoxes();
    const newTimeBox: TimeBox = {
      ...timeBoxData,
      id: this.generateId(),
    };
    timeBoxes.push(newTimeBox);
    this.setToStorage('taskflow_time_boxes', timeBoxes);
    return newTimeBox;
  }

  updateTimeBox(timeBoxId: string, updates: Partial<TimeBox>): TimeBox | null {
    const timeBoxes = this.getTimeBoxes();
    const index = timeBoxes.findIndex(tb => tb.id === timeBoxId);
    if (index !== -1) {
      timeBoxes[index] = { ...timeBoxes[index], ...updates };
      this.setToStorage('taskflow_time_boxes', timeBoxes);
      return timeBoxes[index];
    }
    return null;
  }

  deleteTimeBox(timeBoxId: string): void {
    const timeBoxes = this.getTimeBoxes();
    const filtered = timeBoxes.filter(tb => tb.id !== timeBoxId);
    this.setToStorage('taskflow_time_boxes', filtered);
  }

  // Subscribe to changes (simple polling simulation for real-time feel)
  onTasksChange(callback: (tasks: Task[]) => void): () => void {
    const poll = () => {
      callback(this.getTasks());
    };
    
    // Initial call
    poll();
    
    // Poll every 100ms for changes (simulating real-time)
    const interval = setInterval(poll, 100);
    
    return () => clearInterval(interval);
  }
}

export const fallbackStorage = new FallbackStorageService();