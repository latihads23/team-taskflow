import { Task, TaskData, User, Category, TimeEntry, TimeBox } from '../types';
import { fallbackStorage } from './fallbackStorage';

// Check if Supabase is properly configured
let useSupabase = false;
let supabaseClient: any = null;

try {
  const { supabase } = require('../src/supabaseConfig');
  supabaseClient = supabase;
  
  // Test connection with new valid credentials
  supabaseClient
    .from('tasks')
    .select('id')
    .limit(1)
    .then(({ error }: any) => {
      if (!error) {
        useSupabase = true;
        console.log('✅ Supabase connected successfully - using Supabase for data storage');
      } else {
        console.warn('⚠️ Supabase connection failed, using localStorage fallback:', error);
      }
    })
    .catch((err: any) => {
      console.warn('⚠️ Supabase connection error, using localStorage fallback:', err);
    });
  
  // Initially assume Supabase will work with valid credentials
  useSupabase = true;
} catch (error) {
  console.warn('⚠️ Supabase config not found, using localStorage fallback');
}

// Task Management
export const listenToTasks = (callback: (tasks: Task[]) => void): (() => void) => {
  if (useSupabase && supabaseClient) {
    try {
      // Try Supabase real-time
      const { listenToTasks: supabaseListenToTasks } = require('./supabaseService');
      return supabaseListenToTasks(callback);
    } catch (error) {
      console.warn('Supabase listener failed, falling back to localStorage:', error);
      return fallbackStorage.onTasksChange(callback);
    }
  } else {
    return fallbackStorage.onTasksChange(callback);
  }
};

export const addTask = async (taskData: TaskData): Promise<string> => {
  if (useSupabase && supabaseClient) {
    try {
      const { addTask: supabaseAddTask } = require('./supabaseService');
      return await supabaseAddTask(taskData);
    } catch (error) {
      console.warn('Supabase addTask failed, falling back to localStorage:', error);
      return fallbackStorage.addTask(taskData);
    }
  } else {
    return fallbackStorage.addTask(taskData);
  }
};

export const updateTask = async (taskId: string, updates: Partial<Task>): Promise<void> => {
  if (useSupabase && supabaseClient) {
    try {
      const { updateTask: supabaseUpdateTask } = require('./supabaseService');
      return await supabaseUpdateTask(taskId, updates);
    } catch (error) {
      console.warn('Supabase updateTask failed, falling back to localStorage:', error);
      fallbackStorage.updateTask(taskId, updates);
    }
  } else {
    fallbackStorage.updateTask(taskId, updates);
  }
};

export const deleteTask = async (taskId: string): Promise<void> => {
  if (useSupabase && supabaseClient) {
    try {
      const { deleteTask: supabaseDeleteTask } = require('./supabaseService');
      return await supabaseDeleteTask(taskId);
    } catch (error) {
      console.warn('Supabase deleteTask failed, falling back to localStorage:', error);
      fallbackStorage.deleteTask(taskId);
    }
  } else {
    fallbackStorage.deleteTask(taskId);
  }
};

export const deleteRecurringSeries = async (originalTaskId: string): Promise<void> => {
  if (useSupabase && supabaseClient) {
    try {
      const { deleteRecurringSeries: supabaseDeleteSeries } = require('./supabaseService');
      return await supabaseDeleteSeries(originalTaskId);
    } catch (error) {
      console.warn('Supabase deleteRecurringSeries failed, falling back to localStorage:', error);
      fallbackStorage.deleteRecurringSeries(originalTaskId);
    }
  } else {
    fallbackStorage.deleteRecurringSeries(originalTaskId);
  }
};

// User Management Services
export const userService = {
  async getUsers(): Promise<User[]> {
    if (useSupabase && supabaseClient) {
      try {
        const { userService: supabaseUserService } = require('./supabase');
        return await supabaseUserService.getUsers();
      } catch (error) {
        console.warn('Supabase getUsers failed, falling back to localStorage:', error);
        return fallbackStorage.getUsers();
      }
    } else {
      return fallbackStorage.getUsers();
    }
  },

  async createUser(userData: Omit<User, 'id' | 'createdAt' | 'updatedAt'>): Promise<User> {
    if (useSupabase && supabaseClient) {
      try {
        const { userService: supabaseUserService } = require('./supabase');
        return await supabaseUserService.createUser(userData);
      } catch (error) {
        console.warn('Supabase createUser failed, falling back to localStorage:', error);
        return fallbackStorage.addUser(userData);
      }
    } else {
      return fallbackStorage.addUser(userData);
    }
  },

  async updateUser(id: string, updates: Partial<User>): Promise<User> {
    if (useSupabase && supabaseClient) {
      try {
        const { userService: supabaseUserService } = require('./supabase');
        return await supabaseUserService.updateUser(id, updates);
      } catch (error) {
        console.warn('Supabase updateUser failed, falling back to localStorage:', error);
        const result = fallbackStorage.updateUser(id, updates);
        if (!result) throw new Error('User not found');
        return result;
      }
    } else {
      const result = fallbackStorage.updateUser(id, updates);
      if (!result) throw new Error('User not found');
      return result;
    }
  },

  async deleteUser(id: string): Promise<void> {
    if (useSupabase && supabaseClient) {
      try {
        const { userService: supabaseUserService } = require('./supabase');
        return await supabaseUserService.deleteUser(id);
      } catch (error) {
        console.warn('Supabase deleteUser failed, falling back to localStorage:', error);
        fallbackStorage.deleteUser(id);
      }
    } else {
      fallbackStorage.deleteUser(id);
    }
  }
};

// Category Management Services
export const categoryService = {
  async getCategories(): Promise<Category[]> {
    if (useSupabase && supabaseClient) {
      try {
        const { categoryService: supabaseCategoryService } = require('./supabase');
        return await supabaseCategoryService.getCategories();
      } catch (error) {
        console.warn('Supabase getCategories failed, falling back to localStorage:', error);
        return fallbackStorage.getCategories();
      }
    } else {
      return fallbackStorage.getCategories();
    }
  },

  async createCategory(categoryData: Omit<Category, 'id' | 'createdAt' | 'updatedAt'>): Promise<Category> {
    if (useSupabase && supabaseClient) {
      try {
        const { categoryService: supabaseCategoryService } = require('./supabase');
        return await supabaseCategoryService.createCategory(categoryData);
      } catch (error) {
        console.warn('Supabase createCategory failed, falling back to localStorage:', error);
        return fallbackStorage.addCategory(categoryData);
      }
    } else {
      return fallbackStorage.addCategory(categoryData);
    }
  },

  async updateCategory(id: string, updates: Partial<Category>): Promise<Category> {
    if (useSupabase && supabaseClient) {
      try {
        const { categoryService: supabaseCategoryService } = require('./supabase');
        return await supabaseCategoryService.updateCategory(id, updates);
      } catch (error) {
        console.warn('Supabase updateCategory failed, falling back to localStorage:', error);
        const result = fallbackStorage.updateCategory(id, updates);
        if (!result) throw new Error('Category not found');
        return result;
      }
    } else {
      const result = fallbackStorage.updateCategory(id, updates);
      if (!result) throw new Error('Category not found');
      return result;
    }
  },

  async deleteCategory(id: string): Promise<void> {
    if (useSupabase && supabaseClient) {
      try {
        const { categoryService: supabaseCategoryService } = require('./supabase');
        return await supabaseCategoryService.deleteCategory(id);
      } catch (error) {
        console.warn('Supabase deleteCategory failed, falling back to localStorage:', error);
        fallbackStorage.deleteCategory(id);
      }
    } else {
      fallbackStorage.deleteCategory(id);
    }
  }
};

// Task-specific services for Eat That Frog feature
export const taskService = {
  async updateTask(id: string, updates: Partial<Task>): Promise<Task> {
    await updateTask(id, updates);
    // Return updated task (for now, just return the updates with id)
    return { id, ...updates } as Task;
  },

  async eatFrog(taskId: string): Promise<void> {
    await updateTask(taskId, {
      status: 'Done' as any,
      isEatThatFrog: true,
      updatedAt: new Date().toISOString()
    });
  }
};

// Time Entry Management Services
export const timeEntryService = {
  async getTimeEntries(): Promise<TimeEntry[]> {
    if (useSupabase && supabaseClient) {
      try {
        const { timeEntryService: supabaseTimeEntryService } = require('./supabase');
        return await supabaseTimeEntryService.getTimeEntries();
      } catch (error) {
        console.warn('Supabase getTimeEntries failed, falling back to localStorage:', error);
        return fallbackStorage.getTimeEntries();
      }
    } else {
      return fallbackStorage.getTimeEntries();
    }
  },

  async addTimeEntry(entryData: Omit<TimeEntry, 'id'>): Promise<TimeEntry> {
    if (useSupabase && supabaseClient) {
      try {
        const { timeEntryService: supabaseTimeEntryService } = require('./supabase');
        return await supabaseTimeEntryService.addTimeEntry(entryData);
      } catch (error) {
        console.warn('Supabase addTimeEntry failed, falling back to localStorage:', error);
        return fallbackStorage.addTimeEntry(entryData);
      }
    } else {
      return fallbackStorage.addTimeEntry(entryData);
    }
  },

  async updateTimeEntry(id: string, updates: Partial<TimeEntry>): Promise<TimeEntry> {
    if (useSupabase && supabaseClient) {
      try {
        const { timeEntryService: supabaseTimeEntryService } = require('./supabase');
        return await supabaseTimeEntryService.updateTimeEntry(id, updates);
      } catch (error) {
        console.warn('Supabase updateTimeEntry failed, falling back to localStorage:', error);
        const result = fallbackStorage.updateTimeEntry(id, updates);
        if (!result) throw new Error('Time entry not found');
        return result;
      }
    } else {
      const result = fallbackStorage.updateTimeEntry(id, updates);
      if (!result) throw new Error('Time entry not found');
      return result;
    }
  },

  async deleteTimeEntry(id: string): Promise<void> {
    if (useSupabase && supabaseClient) {
      try {
        const { timeEntryService: supabaseTimeEntryService } = require('./supabase');
        return await supabaseTimeEntryService.deleteTimeEntry(id);
      } catch (error) {
        console.warn('Supabase deleteTimeEntry failed, falling back to localStorage:', error);
        fallbackStorage.deleteTimeEntry(id);
      }
    } else {
      fallbackStorage.deleteTimeEntry(id);
    }
  }
};

// Time Box Management Services
export const timeBoxService = {
  async getTimeBoxes(): Promise<TimeBox[]> {
    if (useSupabase && supabaseClient) {
      try {
        const { timeBoxService: supabaseTimeBoxService } = require('./supabase');
        return await supabaseTimeBoxService.getTimeBoxes();
      } catch (error) {
        console.warn('Supabase getTimeBoxes failed, falling back to localStorage:', error);
        return fallbackStorage.getTimeBoxes();
      }
    } else {
      return fallbackStorage.getTimeBoxes();
    }
  },

  async addTimeBox(timeBoxData: Omit<TimeBox, 'id'>): Promise<TimeBox> {
    if (useSupabase && supabaseClient) {
      try {
        const { timeBoxService: supabaseTimeBoxService } = require('./supabase');
        return await supabaseTimeBoxService.addTimeBox(timeBoxData);
      } catch (error) {
        console.warn('Supabase addTimeBox failed, falling back to localStorage:', error);
        return fallbackStorage.addTimeBox(timeBoxData);
      }
    } else {
      return fallbackStorage.addTimeBox(timeBoxData);
    }
  },

  async updateTimeBox(id: string, updates: Partial<TimeBox>): Promise<TimeBox> {
    if (useSupabase && supabaseClient) {
      try {
        const { timeBoxService: supabaseTimeBoxService } = require('./supabase');
        return await supabaseTimeBoxService.updateTimeBox(id, updates);
      } catch (error) {
        console.warn('Supabase updateTimeBox failed, falling back to localStorage:', error);
        const result = fallbackStorage.updateTimeBox(id, updates);
        if (!result) throw new Error('Time box not found');
        return result;
      }
    } else {
      const result = fallbackStorage.updateTimeBox(id, updates);
      if (!result) throw new Error('Time box not found');
      return result;
    }
  },

  async deleteTimeBox(id: string): Promise<void> {
    if (useSupabase && supabaseClient) {
      try {
        const { timeBoxService: supabaseTimeBoxService } = require('./supabase');
        return await supabaseTimeBoxService.deleteTimeBox(id);
      } catch (error) {
        console.warn('Supabase deleteTimeBox failed, falling back to localStorage:', error);
        fallbackStorage.deleteTimeBox(id);
      }
    } else {
      fallbackStorage.deleteTimeBox(id);
    }
  }
};
