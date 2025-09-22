import { supabase } from '../src/supabaseConfig'
import { Task, TaskData } from '../types'

// Define the database table schema for tasks
export interface TaskRow {
  id: string
  title: string
  description: string
  assignee_id: string
  due_date: string
  priority: string
  status: string
  reminder_at?: string
  is_recurring?: boolean
  recurrence_rule?: string
  recurrence_end_date?: string
  original_task_id?: string
  created_at: string
  updated_at: string
}

// Helper to convert database row to Task object
const rowToTask = (row: TaskRow): Task => {
  return {
    id: row.id,
    title: row.title,
    description: row.description,
    assigneeId: mapUUIDToUserId(row.assignee_id), // Convert UUID back to legacy ID
    dueDate: row.due_date,
    priority: row.priority as Task['priority'],
    status: row.status as Task['status'],
    reminderAt: row.reminder_at,
    isRecurring: row.is_recurring,
    recurrenceRule: row.recurrence_rule as Task['recurrenceRule'],
    recurrenceEndDate: row.recurrence_end_date,
    originalTaskId: row.original_task_id,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }
}

// User ID mapping for legacy compatibility
const USER_ID_MAP = {
  'u1': '00000000-0000-0000-0000-000000000001',
  'u2': '00000000-0000-0000-0000-000000000002', 
  'u3': '00000000-0000-0000-0000-000000000003',
  'u4': '00000000-0000-0000-0000-000000000004'
}

// Helper to convert legacy user IDs to UUIDs
const mapUserIdToUUID = (legacyId: string): string => {
  return USER_ID_MAP[legacyId as keyof typeof USER_ID_MAP] || legacyId
}

// Helper to convert UUIDs back to legacy user IDs for compatibility
const mapUUIDToUserId = (uuid: string): string => {
  const entry = Object.entries(USER_ID_MAP).find(([_, value]) => value === uuid)
  return entry ? entry[0] : uuid
}

// Helper to convert Task data to database row format
const taskToRow = (taskData: TaskData): Omit<TaskRow, 'id' | 'created_at' | 'updated_at'> => {
  return {
    title: taskData.title,
    description: taskData.description,
    assignee_id: mapUserIdToUUID(taskData.assigneeId), // Convert legacy ID to UUID
    due_date: taskData.dueDate,
    priority: taskData.priority,
    status: taskData.status,
    reminder_at: taskData.reminderAt,
    is_recurring: taskData.isRecurring,
    recurrence_rule: taskData.recurrenceRule,
    recurrence_end_date: taskData.recurrenceEndDate,
    original_task_id: taskData.originalTaskId,
  }
}

// Subscribe to real-time changes (using polling as alternative to Firestore's onSnapshot)
export const listenToTasks = (callback: (tasks: Task[]) => void): (() => void) => {
  let isActive = true
  
  const fetchTasks = async () => {
    try {
      const { data, error } = await supabase
        .from('tasks')
        .select('*')
        .order('due_date', { ascending: true })
      
      if (error) {
        console.error('Error fetching tasks:', error)
        throw new Error('Could not fetch tasks from database.')
      }
      
      if (isActive) {
        const tasks = data.map(rowToTask)
        callback(tasks)
      }
    } catch (error) {
      console.error('Error in listenToTasks:', error)
      if (isActive) {
        throw new Error('Could not listen to tasks from database.')
      }
    }
  }

  // Initial fetch
  fetchTasks()
  
  // Set up real-time subscription
  const subscription = supabase
    .channel('tasks_changes')
    .on('postgres_changes', 
      { event: '*', schema: 'public', table: 'tasks' }, 
      () => {
        fetchTasks()
      }
    )
    .subscribe()

  // Return unsubscribe function
  return () => {
    isActive = false
    supabase.removeChannel(subscription)
  }
}

export const addTask = async (taskData: TaskData): Promise<string> => {
  try {
    const rowData = taskToRow(taskData)
    
    const { data, error } = await supabase
      .from('tasks')
      .insert(rowData)
      .select('id')
      .single()
    
    if (error) {
      console.error('Error adding task:', error)
      throw new Error('Could not add task to database.')
    }
    
    return data.id
  } catch (error) {
    console.error('Error in addTask:', error)
    throw new Error('Could not add task to database.')
  }
}

export const updateTask = async (
  taskId: string,
  taskUpdateData: Partial<TaskData>
): Promise<void> => {
  try {
    // Convert update data to database format
    const updateData: Partial<Omit<TaskRow, 'id' | 'created_at' | 'updated_at'>> = {}
    
    if (taskUpdateData.title !== undefined) updateData.title = taskUpdateData.title
    if (taskUpdateData.description !== undefined) updateData.description = taskUpdateData.description
    if (taskUpdateData.assigneeId !== undefined) updateData.assignee_id = taskUpdateData.assigneeId
    if (taskUpdateData.dueDate !== undefined) updateData.due_date = taskUpdateData.dueDate
    if (taskUpdateData.priority !== undefined) updateData.priority = taskUpdateData.priority
    if (taskUpdateData.status !== undefined) updateData.status = taskUpdateData.status
    if (taskUpdateData.reminderAt !== undefined) updateData.reminder_at = taskUpdateData.reminderAt
    if (taskUpdateData.isRecurring !== undefined) updateData.is_recurring = taskUpdateData.isRecurring
    if (taskUpdateData.recurrenceRule !== undefined) updateData.recurrence_rule = taskUpdateData.recurrenceRule
    if (taskUpdateData.recurrenceEndDate !== undefined) updateData.recurrence_end_date = taskUpdateData.recurrenceEndDate
    if (taskUpdateData.originalTaskId !== undefined) updateData.original_task_id = taskUpdateData.originalTaskId

    const { error } = await supabase
      .from('tasks')
      .update(updateData)
      .eq('id', taskId)
    
    if (error) {
      console.error('Error updating task:', error)
      throw new Error('Could not update task in database.')
    }
  } catch (error) {
    console.error('Error in updateTask:', error)
    throw new Error('Could not update task in database.')
  }
}

export const deleteTask = async (taskId: string): Promise<void> => {
  try {
    const { error } = await supabase
      .from('tasks')
      .delete()
      .eq('id', taskId)
    
    if (error) {
      console.error('Error deleting task:', error)
      throw new Error('Could not delete task from database.')
    }
  } catch (error) {
    console.error('Error in deleteTask:', error)
    throw new Error('Could not delete task from database.')
  }
}

export const deleteRecurringSeries = async (originalTaskId: string): Promise<void> => {
  try {
    // First, try to delete all tasks with the given originalTaskId
    const { data: relatedTasks, error: fetchError } = await supabase
      .from('tasks')
      .select('id')
      .eq('original_task_id', originalTaskId)
    
    if (fetchError) {
      console.error('Error fetching related tasks:', fetchError)
      throw new Error('Could not fetch related tasks from database.')
    }
    
    if (relatedTasks.length === 0) {
      console.warn('No tasks found for this recurring series to delete. Deleting original task by ID.')
      await deleteTask(originalTaskId)
      return
    }
    
    // Delete all related tasks
    const { error: deleteError } = await supabase
      .from('tasks')
      .delete()
      .eq('original_task_id', originalTaskId)
    
    if (deleteError) {
      console.error('Error deleting recurring series:', deleteError)
      throw new Error('Could not delete recurring series from database.')
    }
  } catch (error) {
    console.error('Error in deleteRecurringSeries:', error)
    throw new Error('Could not delete recurring series from database.')
  }
}
