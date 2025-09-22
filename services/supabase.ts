import { supabase } from '../src/supabaseConfig';
import { Task, User, Category } from '../types';

// User Management Services
export const userService = {
  // Get all users
  async getUsers(): Promise<User[]> {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .order('createdAt', { ascending: false });

    if (error) {
      console.error('Error fetching users:', error);
      throw error;
    }

    return data || [];
  },

  // Get user by ID
  async getUserById(id: string): Promise<User | null> {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      console.error('Error fetching user:', error);
      return null;
    }

    return data;
  },

  // Create new user
  async createUser(userData: Omit<User, 'id' | 'createdAt' | 'updatedAt'>): Promise<User> {
    const { data, error } = await supabase
      .from('users')
      .insert([{
        ...userData,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }])
      .select()
      .single();

    if (error) {
      console.error('Error creating user:', error);
      throw error;
    }

    return data;
  },

  // Update user
  async updateUser(id: string, updates: Partial<User>): Promise<User> {
    const { data, error } = await supabase
      .from('users')
      .update({
        ...updates,
        updatedAt: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Error updating user:', error);
      throw error;
    }

    return data;
  },

  // Delete user
  async deleteUser(id: string): Promise<void> {
    const { error } = await supabase
      .from('users')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error deleting user:', error);
      throw error;
    }
  },

  // Toggle user activation
  async toggleUserActivation(id: string): Promise<User> {
    const user = await this.getUserById(id);
    if (!user) throw new Error('User not found');

    return this.updateUser(id, { isActive: !user.isActive });
  }
};

// Category Management Services
export const categoryService = {
  // Get all categories
  async getCategories(): Promise<Category[]> {
    const { data, error } = await supabase
      .from('categories')
      .select('*')
      .order('name');

    if (error) {
      console.error('Error fetching categories:', error);
      throw error;
    }

    return data || [];
  },

  // Get category by ID
  async getCategoryById(id: string): Promise<Category | null> {
    const { data, error } = await supabase
      .from('categories')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      console.error('Error fetching category:', error);
      return null;
    }

    return data;
  },

  // Create new category
  async createCategory(categoryData: Omit<Category, 'id' | 'createdAt' | 'updatedAt'>): Promise<Category> {
    const { data, error } = await supabase
      .from('categories')
      .insert([{
        ...categoryData,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }])
      .select()
      .single();

    if (error) {
      console.error('Error creating category:', error);
      throw error;
    }

    return data;
  },

  // Update category
  async updateCategory(id: string, updates: Partial<Category>): Promise<Category> {
    const { data, error } = await supabase
      .from('categories')
      .update({
        ...updates,
        updatedAt: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Error updating category:', error);
      throw error;
    }

    return data;
  },

  // Delete category
  async deleteCategory(id: string): Promise<void> {
    const { error } = await supabase
      .from('categories')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error deleting category:', error);
      throw error;
    }
  }
};

// Enhanced Task Management Services
export const taskService = {
  // Get all tasks with user and category info
  async getTasks(): Promise<Task[]> {
    const { data, error } = await supabase
      .from('tasks')
      .select(`
        *,
        assignee:users!tasks_assignedTo_fkey(id, name, email),
        category:categories!tasks_categoryId_fkey(id, name, color)
      `)
      .order('createdAt', { ascending: false });

    if (error) {
      console.error('Error fetching tasks:', error);
      throw error;
    }

    return (data || []).map(task => ({
      ...task,
      assignedTo: task.assignee?.id || task.assignedTo,
      categoryId: task.category?.id || task.categoryId
    }));
  },

  // Get tasks by user
  async getTasksByUser(userId: string): Promise<Task[]> {
    const { data, error } = await supabase
      .from('tasks')
      .select(`
        *,
        assignee:users!tasks_assignedTo_fkey(id, name, email),
        category:categories!tasks_categoryId_fkey(id, name, color)
      `)
      .eq('assignedTo', userId)
      .order('createdAt', { ascending: false });

    if (error) {
      console.error('Error fetching user tasks:', error);
      throw error;
    }

    return data || [];
  },

  // Get tasks by category
  async getTasksByCategory(categoryId: string): Promise<Task[]> {
    const { data, error } = await supabase
      .from('tasks')
      .select(`
        *,
        assignee:users!tasks_assignedTo_fkey(id, name, email),
        category:categories!tasks_categoryId_fkey(id, name, color)
      `)
      .eq('categoryId', categoryId)
      .order('createdAt', { ascending: false });

    if (error) {
      console.error('Error fetching category tasks:', error);
      throw error;
    }

    return data || [];
  },

  // Get task by ID
  async getTaskById(id: string): Promise<Task | null> {
    const { data, error } = await supabase
      .from('tasks')
      .select(`
        *,
        assignee:users!tasks_assignedTo_fkey(id, name, email),
        category:categories!tasks_categoryId_fkey(id, name, color)
      `)
      .eq('id', id)
      .single();

    if (error) {
      console.error('Error fetching task:', error);
      return null;
    }

    return data;
  },

  // Create new task
  async createTask(taskData: Omit<Task, 'id' | 'createdAt' | 'updatedAt'>): Promise<Task> {
    const { data, error } = await supabase
      .from('tasks')
      .insert([{
        ...taskData,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }])
      .select()
      .single();

    if (error) {
      console.error('Error creating task:', error);
      throw error;
    }

    return data;
  },

  // Update task
  async updateTask(id: string, updates: Partial<Task>): Promise<Task> {
    const { data, error } = await supabase
      .from('tasks')
      .update({
        ...updates,
        updatedAt: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Error updating task:', error);
      throw error;
    }

    return data;
  },

  // Delete task
  async deleteTask(id: string): Promise<void> {
    const { error } = await supabase
      .from('tasks')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error deleting task:', error);
      throw error;
    }
  },

  // Bulk update tasks (useful for drag & drop)
  async bulkUpdateTasks(updates: Array<{ id: string; updates: Partial<Task> }>): Promise<Task[]> {
    const promises = updates.map(({ id, updates }) => this.updateTask(id, updates));
    return Promise.all(promises);
  },

  // Get tasks with time tracking data
  async getTasksWithTimeTracking(): Promise<Task[]> {
    const { data, error } = await supabase
      .from('tasks')
      .select(`
        *,
        assignee:users!tasks_assignedTo_fkey(id, name, email),
        category:categories!tasks_categoryId_fkey(id, name, color),
        time_entries(*)
      `)
      .order('createdAt', { ascending: false });

    if (error) {
      console.error('Error fetching tasks with time tracking:', error);
      throw error;
    }

    return data || [];
  },

  // Mark task as "frog eaten" (completed with special flag)
  async eatFrog(id: string): Promise<Task> {
    return this.updateTask(id, {
      status: 'done',
      completedAt: new Date().toISOString(),
      eatThatFrog: true, // Special flag for frog completion
    });
  },

  // Get completed frogs for today
  async getTodaysFrogs(userId?: string): Promise<Task[]> {
    const today = new Date().toISOString().split('T')[0];
    
    let query = supabase
      .from('tasks')
      .select(`
        *,
        assignee:users!tasks_assignedTo_fkey(id, name, email),
        category:categories!tasks_categoryId_fkey(id, name, color)
      `)
      .eq('status', 'done')
      .eq('eatThatFrog', true)
      .gte('completedAt', today)
      .lt('completedAt', today + 'T23:59:59');

    if (userId) {
      query = query.eq('assignedTo', userId);
    }

    const { data, error } = await query.order('completedAt', { ascending: false });

    if (error) {
      console.error('Error fetching today\'s frogs:', error);
      throw error;
    }

    return data || [];
  }
};

// Real-time subscriptions
export const subscriptions = {
  // Subscribe to task changes
  subscribeToTasks(callback: (payload: any) => void) {
    return supabase
      .channel('tasks-channel')
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'tasks' },
        callback
      )
      .subscribe();
  },

  // Subscribe to user changes
  subscribeToUsers(callback: (payload: any) => void) {
    return supabase
      .channel('users-channel')
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'users' },
        callback
      )
      .subscribe();
  },

  // Subscribe to category changes
  subscribeToCategories(callback: (payload: any) => void) {
    return supabase
      .channel('categories-channel')
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'categories' },
        callback
      )
      .subscribe();
  },

  // Unsubscribe from all channels
  unsubscribeAll() {
    return supabase.removeAllChannels();
  }
};

// Analytics and reporting services
export const analyticsService = {
  // Get user task completion stats
  async getUserStats(userId: string, days: number = 30): Promise<any> {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const { data, error } = await supabase
      .from('tasks')
      .select('status, completedAt, eatThatFrog, priority')
      .eq('assignedTo', userId)
      .gte('createdAt', startDate.toISOString());

    if (error) {
      console.error('Error fetching user stats:', error);
      throw error;
    }

    return {
      totalTasks: data.length,
      completedTasks: data.filter(t => t.status === 'done').length,
      frogsEaten: data.filter(t => t.eatThatFrog && t.status === 'done').length,
      urgentCompleted: data.filter(t => t.priority === 'urgent' && t.status === 'done').length
    };
  },

  // Get team productivity stats
  async getTeamStats(days: number = 30): Promise<any> {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const { data, error } = await supabase
      .from('tasks')
      .select(`
        status, completedAt, eatThatFrog, priority,
        assignee:users!tasks_assignedTo_fkey(id, name)
      `)
      .gte('createdAt', startDate.toISOString());

    if (error) {
      console.error('Error fetching team stats:', error);
      throw error;
    }

    // Process data for team insights
    const userStats = data.reduce((acc: any, task: any) => {
      const userId = task.assignee?.id;
      if (!userId) return acc;

      if (!acc[userId]) {
        acc[userId] = {
          name: task.assignee.name,
          totalTasks: 0,
          completedTasks: 0,
          frogsEaten: 0
        };
      }

      acc[userId].totalTasks++;
      if (task.status === 'done') {
        acc[userId].completedTasks++;
        if (task.eatThatFrog) {
          acc[userId].frogsEaten++;
        }
      }

      return acc;
    }, {});

    return {
      totalTasks: data.length,
      completedTasks: data.filter(t => t.status === 'done').length,
      totalFrogsEaten: data.filter(t => t.eatThatFrog && t.status === 'done').length,
      userStats: Object.values(userStats)
    };
  }
};