import React, { useState, useCallback, useMemo, useEffect } from 'react';
import { Task, User, ViewType, Status, Priority, ChatMessage, Toast, ActivityLog, TaskData, AuthUser, TimeEntry, TimeBox, Category } from './types';
import Header from './components/Header';
import TaskBoard from './components/TaskBoard';
import MonthlyView from './components/MonthlyView';
import TimeManagementDashboard from './components/time-management/TimeManagementDashboard';
import TaskFormModal from './components/TaskFormModal';
import SmartTaskFormModal from './components/SmartTaskFormModal';
import { parseTaskFromString, chatWithAI, resetChat } from './services/geminiService';
import { listenToTasks, addTask, updateTask, deleteTask, deleteRecurringSeries } from './services/hybridStorage';
import TaskDetailModal from './components/TaskDetailModal';
import AIAssistant from './components/AIAssistant';
import ToastContainer from './components/ToastContainer';
import ActivityFeed from './components/ActivityFeed';
import UserProfileModal from './components/UserProfileModal';
import Login from './components/Login';
import { authService } from './services/authService';
// New imports for enhanced features
import UserManagement from './components/admin/UserManagement';
import CategoryManagement from './components/CategoryManagement';
import { userService, categoryService, taskService, timeEntryService, timeBoxService } from './services/hybridStorage';

// Mock Data for Users (can be moved to Supabase Auth later)
const MOCK_USERS: User[] = [
  { 
    id: 'u1', 
    name: 'Alex Johnson', 
    email: 'alex.johnson@example.com', 
    avatarUrl: 'https://i.pravatar.cc/150?u=u1', 
    role: 'admin', 
    isActive: true, 
    phone: '+1-555-0123',
    department: 'Engineering',
    position: 'Lead Developer',
    location: 'San Francisco, CA',
    bio: 'Experienced full-stack developer with passion for clean code and team leadership.',
    skills: ['React', 'TypeScript', 'Node.js', 'Leadership'],
    startDate: '2022-01-15',
    profilePicture: 'https://i.pravatar.cc/150?u=u1',
    socialLinks: {
      linkedin: 'https://linkedin.com/in/alexjohnson',
      github: 'https://github.com/alexjohnson'
    },
    preferences: {
      timezone: 'America/Los_Angeles',
      language: 'en',
      notifications: true,
      theme: 'light'
    },
    createdAt: new Date().toISOString(), 
    updatedAt: new Date().toISOString() 
  },
  { 
    id: 'u2', 
    name: 'Maria Garcia', 
    email: 'maria.garcia@example.com', 
    avatarUrl: 'https://i.pravatar.cc/150?u=u2', 
    role: 'user', 
    isActive: true, 
    phone: '+1-555-0124',
    department: 'Design',
    position: 'UX Designer',
    location: 'New York, NY',
    bio: 'Creative UX designer focused on user-centered design and accessibility.',
    skills: ['Figma', 'Adobe Creative Suite', 'User Research', 'Prototyping'],
    startDate: '2022-03-01',
    reportingTo: 'u1',
    profilePicture: 'https://i.pravatar.cc/150?u=u2',
    socialLinks: {
      linkedin: 'https://linkedin.com/in/mariagarcia'
    },
    preferences: {
      timezone: 'America/New_York',
      language: 'en',
      notifications: true,
      theme: 'light'
    },
    createdAt: new Date().toISOString(), 
    updatedAt: new Date().toISOString() 
  },
  { 
    id: 'u3', 
    name: 'James Smith', 
    email: 'james.smith@example.com', 
    avatarUrl: 'https://i.pravatar.cc/150?u=u3', 
    role: 'user', 
    isActive: true, 
    phone: '+1-555-0125',
    department: 'Engineering',
    position: 'Frontend Developer',
    location: 'Austin, TX',
    bio: 'Frontend specialist with expertise in modern React applications.',
    skills: ['React', 'JavaScript', 'CSS', 'Testing'],
    startDate: '2023-06-15',
    reportingTo: 'u1',
    profilePicture: 'https://i.pravatar.cc/150?u=u3',
    socialLinks: {
      github: 'https://github.com/jamessmith'
    },
    preferences: {
      timezone: 'America/Chicago',
      language: 'en',
      notifications: false,
      theme: 'dark'
    },
    createdAt: new Date().toISOString(), 
    updatedAt: new Date().toISOString() 
  },
  { 
    id: 'u4', 
    name: 'Li Wei', 
    email: 'li.wei@example.com', 
    avatarUrl: 'https://i.pravatar.cc/150?u=u4', 
    role: 'user', 
    isActive: true, 
    phone: '+1-555-0126',
    department: 'Product',
    position: 'Product Manager',
    location: 'Seattle, WA',
    bio: 'Product manager with background in data analysis and user experience.',
    skills: ['Product Strategy', 'Analytics', 'Agile', 'Roadmapping'],
    startDate: '2023-01-10',
    profilePicture: 'https://i.pravatar.cc/150?u=u4',
    socialLinks: {
      linkedin: 'https://linkedin.com/in/liwei'
    },
    preferences: {
      timezone: 'America/Los_Angeles',
      language: 'en',
      notifications: true,
      theme: 'auto'
    },
    createdAt: new Date().toISOString(), 
    updatedAt: new Date().toISOString() 
  },
];

const CURRENT_USER_ID = 'u1'; // Let's assume Alex is the current user

export const App: React.FC = () => {
  // Authentication state
  const [authUser, setAuthUser] = useState<AuthUser | null>(null);
  const [isAuthLoading, setIsAuthLoading] = useState(true);
  
  const [tasks, setTasks] = useState<Task[]>([]);
  const [users, setUsers] = useState<User[]>(MOCK_USERS);
  const [categories, setCategories] = useState<Category[]>([]);
  const usersMap = useMemo(() => new Map(users.map(u => [u.id, u])), [users]);
  const [currentUser, setCurrentUser] = useState<User>(() => usersMap.get(CURRENT_USER_ID)!);
  
  const [currentView, setCurrentView] = useState<ViewType>(ViewType.Board);
  const [isTaskFormOpen, setTaskFormOpen] = useState(false);
  const [isSmartTaskFormOpen, setSmartTaskFormOpen] = useState(false);
  const [isDetailModalOpen, setDetailModalOpen] = useState(false);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);

  const [isAIAssistantOpen, setAIAssistantOpen] = useState(false);
  const [aiChatHistory, setAiChatHistory] = useState<ChatMessage[]>([]);
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [aiTaskContext, setAiTaskContext] = useState<Task | null>(null);

  const [toasts, setToasts] = useState<Toast[]>([]);
  const [activityLogs, setActivityLogs] = useState<ActivityLog[]>([]);
  const [isActivityFeedOpen, setActivityFeedOpen] = useState(false);
  const [isUserProfileOpen, setUserProfileOpen] = useState(false);

  // Time Management state
  const [timeEntries, setTimeEntries] = useState<TimeEntry[]>([]);
  const [timeBoxes, setTimeBoxes] = useState<TimeBox[]>([]);

  // New state for filtering
  const [filters, setFilters] = useState<{ assignees: string[]; priorities: Priority[] }>({
    assignees: [],
    priorities: [],
  });

  const addToast = useCallback((message: string, type: 'info' | 'success' | 'warning' = 'info') => {
    const id = Date.now().toString();
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 4000);
  }, []);
  
  const addActivityLog = useCallback((message: string) => {
      const newLog: ActivityLog = {
        id: Date.now().toString(),
        message,
        timestamp: new Date().toISOString(),
      };
      setActivityLogs(prev => [newLog, ...prev].slice(0, 50)); // Keep last 50 logs
  }, []);

  // Load initial data on mount
  useEffect(() => {
    const loadData = async () => {
      try {
        // Load tasks with real-time listener
        const { listenToTasks } = await import('./services/hybridStorage');
        const unsubscribe = listenToTasks(setTasks);
        
        // Load users and categories
        const loadedUsers = await userService.getUsers();
        const loadedCategories = await categoryService.getCategories();
        
        // Load time management data
        const loadedTimeEntries = await timeEntryService.getTimeEntries();
        const loadedTimeBoxes = await timeBoxService.getTimeBoxes();
        
        setUsers(loadedUsers.length > 0 ? loadedUsers : MOCK_USERS);
        setCategories(loadedCategories);
        setTimeEntries(loadedTimeEntries);
        setTimeBoxes(loadedTimeBoxes);
        
        return unsubscribe;
      } catch (error) {
        console.error('Error loading data:', error);
        addToast('Failed to load application data', 'warning');
        // Fallback to mock data
        setUsers(MOCK_USERS);
      }
    };
    
    loadData();
  }, [addToast]);

  // Initialize authentication state on app start
  useEffect(() => {
    const initAuth = async () => {
      let user = authService.getCurrentUser();
      
      // Auto-login as admin untuk demo purposes
      if (!user) {
        try {
          const loginResult = await authService.login({ 
            email: 'latihads@gmail.com', 
            password: '123' 
          });
          user = loginResult.user;
          console.log('Auto-logged in as admin for demo');
        } catch (error) {
          console.error('Auto-login failed:', error);
        }
      }
      
      setAuthUser(user);
      setIsAuthLoading(false);
    };
    
    initAuth();
  }, []);

  // Authentication handlers
  const handleLoginSuccess = useCallback((user: AuthUser) => {
    setAuthUser(user);
    addToast(`Welcome back, ${user.name}!`, 'success');
    addActivityLog(`User logged in: ${user.name}`);
  }, [addToast, addActivityLog]);

  const handleLogout = useCallback(async () => {
    if (!authUser) return;
    
    const userName = authUser.name;
    await authService.logout();
    setAuthUser(null);
    addToast(`Goodbye, ${userName}!`, 'info');
    addActivityLog(`User logged out: ${userName}`);
  }, [authUser, addToast, addActivityLog]);

  const handleLoginError = useCallback((message: string) => {
    addToast(message, 'warning');
  }, [addToast]);

  const handleAddTask = (taskData: TaskData) => {
    // Create temporary task with ID for immediate UI update
    const tempId = `temp_${Date.now()}`;
    const tempTask: Task = {
      ...taskData,
      id: tempId,
    };
    
    // Optimistic update - immediate UI response
    setTasks(prevTasks => [...prevTasks, tempTask]);
    
    // Show immediate feedback
    addToast("Task created successfully!", "success");
    addActivityLog(`Created task: "${taskData.title}"`);
    setTaskFormOpen(false);
    setSelectedTask(null);
    
    // Add to database and replace temp task with real one
    addTask(taskData).then(taskId => {
        setTasks(prevTasks => 
          prevTasks.map(t => 
            t.id === tempId ? { ...taskData, id: taskId } : t
          )
        );
    }).catch(e => {
        // Remove temp task on failure
        setTasks(prevTasks => prevTasks.filter(t => t.id !== tempId));
        addToast(`Failed to create task: ${e.message}`, 'warning');
    });
  };

  const handleUpdateTask = (taskData: Task) => {
    // Optimistic update - immediate UI response
    setTasks(prevTasks => 
      prevTasks.map(t => 
        t.id === taskData.id ? { ...taskData } : t
      )
    );
    
    // Show immediate feedback
    addToast("Task updated successfully!", "success");
    addActivityLog(`Updated task: "${taskData.title}"`);
    setTaskFormOpen(false);
    setDetailModalOpen(false);
    setSelectedTask(null);
    
    // Update in database (if fails, we'll show error)
    updateTask(taskData.id, taskData).catch(e => {
        addToast(`Failed to update task: ${e.message}`, 'warning');
        // Note: We could implement revert logic here if needed
    });
  };

  const handleSaveTask = (taskData: Omit<Task, 'id'> | Task) => {
    if ('id' in taskData) {
      handleUpdateTask(taskData);
    } else {
      handleAddTask(taskData as TaskData);
    }
  };
  
  const handleAddSmartTask = async (prompt: string) => {
    try {
        const parsedTask = await parseTaskFromString(prompt, users);
        if (parsedTask) {
            // Create complete TaskData with timestamps
            const taskData: TaskData = {
                ...parsedTask,
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString()
            };
            await addTask(taskData);
            addToast("Smart task added successfully!", 'success');
            addActivityLog(`Created task via Smart Add: "${taskData.title}"`);
            setSmartTaskFormOpen(false);
        } else {
            addToast("AI couldn't determine a user. Please check your prompt.", 'warning');
        }
    } catch (error) {
        console.error(error);
        addToast("Failed to add smart task. Please try again.", 'warning');
    }
  };

  const handleStatusChange = useCallback((taskId: string, newStatus: Status) => {
    const task = tasks.find(t => t.id === taskId);
    if(task && task.status !== newStatus) {
        // Optimistic update - immediate UI response
        setTasks(prevTasks => 
          prevTasks.map(t => 
            t.id === taskId ? { ...t, status: newStatus } : t
          )
        );
        
        // Show immediate feedback
        addToast(`Task moved to ${newStatus}`, "success");
        addActivityLog(`Moved task "${task.title}" to ${newStatus}`);
        
        // Update in database (if fails, we'll revert)
        updateTask(taskId, { status: newStatus }).catch(e => {
            // Revert optimistic update on failure
            setTasks(prevTasks => 
              prevTasks.map(t => 
                t.id === taskId ? { ...t, status: task.status } : t
              )
            );
            addToast(`Failed to move task: ${e.message}`, 'warning');
        });
    }
  }, [tasks, addToast, addActivityLog]);
  
  const handleDeleteTask = () => {
    if (!selectedTask) return;
    
    // Immediate UI update
    const taskToDelete = selectedTask;
    setDetailModalOpen(false);
    setSelectedTask(null);
    
    if (selectedTask.isRecurring && selectedTask.originalTaskId) {
        const userResponse = confirm("This is a recurring task. Do you want to delete the entire series?");
        if (userResponse) {
            // Optimistic update - remove all tasks with same originalTaskId
            setTasks(prevTasks => 
              prevTasks.filter(t => t.originalTaskId !== selectedTask.originalTaskId && t.id !== selectedTask.id)
            );
            addToast("Recurring series deleted.", "success");
            addActivityLog(`Deleted recurring series for "${selectedTask.title}"`);
            
            deleteRecurringSeries(selectedTask.originalTaskId).catch(e => {
                addToast(`Failed to delete series: ${e.message}`, 'warning');
                // Could implement revert logic here
            });
        } else {
            // Optimistic update - remove single task
            setTasks(prevTasks => prevTasks.filter(t => t.id !== selectedTask.id));
            addToast("Task instance deleted.", "success");
            addActivityLog(`Deleted one instance of "${selectedTask.title}"`);
            
            deleteTask(selectedTask.id).catch(e => {
                addToast(`Failed to delete task: ${e.message}`, 'warning');
                // Could implement revert logic here
            });
        }
    } else {
        // Optimistic update - remove single task
        setTasks(prevTasks => prevTasks.filter(t => t.id !== selectedTask.id));
        addToast("Task deleted.", "success");
        addActivityLog(`Deleted task "${selectedTask.title}"`);
        
        deleteTask(selectedTask.id).catch(e => {
            addToast(`Failed to delete task: ${e.message}`, 'warning');
            // Could implement revert logic here
        });
    }
  };
  
  const handleViewDetails = (task: Task) => {
    setSelectedTask(task);
    setDetailModalOpen(true);
  };
  
  const handleOpenEditModal = () => {
    setDetailModalOpen(false);
    setTaskFormOpen(true);
  };

  const handleSendMessageToAI = async (message: string) => {
    setAiChatHistory(prev => [...prev, { role: 'user', content: message }]);
    setIsAiLoading(true);
    try {
        const response = await chatWithAI(message);
        setAiChatHistory(prev => [...prev, { role: 'model', content: response }]);
    } catch (error) {
        addToast("Error communicating with AI.", "warning");
    } finally {
        setIsAiLoading(false);
    }
  };

  const handleSummarizeTask = useCallback(() => {
    if (!aiTaskContext) return;
    const prompt = `Please provide a brief summary of the following task and suggest the next logical step to complete it.\n\nTask Title: ${aiTaskContext.title}\nDescription: ${aiTaskContext.description}\nAssignee: ${usersMap.get(aiTaskContext.assigneeId)?.name}\nDue Date: ${aiTaskContext.dueDate}\nPriority: ${aiTaskContext.priority}`;
    handleSendMessageToAI(prompt);
  }, [aiTaskContext, usersMap]);

  const handleAskAIWithContext = (task: Task) => {
    setAiTaskContext(task);
    setAIAssistantOpen(true);
    addToast("AI Assistant opened with task context.", "info");
  };

  const handleClearChat = () => {
    resetChat();
    setAiChatHistory([]);
    setAiTaskContext(null);
    addToast("AI chat history cleared.", "info");
  };
  
  const handleSaveAvatar = (userId: string, newAvatarUrl: string) => {
      // In a real app, you would save this to the user's profile in your database.
      // Here, we'll just update the local state for demonstration.
      setCurrentUser(prev => ({...prev, avatarUrl: newAvatarUrl}));
      addToast("Avatar updated!", "success");
      setUserProfileOpen(false);
  };

  // New handlers for filtering
  const handleFilterChange = useCallback((type: 'assignees' | 'priorities', value: string) => {
    setFilters(prev => {
      const currentValues = prev[type] as string[];
      const newValues = currentValues.includes(value)
        ? currentValues.filter(v => v !== value)
        : [...currentValues, value];
      return { ...prev, [type]: newValues };
    });
  }, []);

  const handleClearFilters = useCallback(() => {
    setFilters({ assignees: [], priorities: [] });
  }, []);

  // Time Management handlers
  const handleTimeEntryAdd = useCallback(async (entry: TimeEntry) => {
    try {
      const newEntry = await timeEntryService.addTimeEntry(entry);
      setTimeEntries(prev => [...prev, newEntry]);
      addToast('Time entry added', 'success');
      addActivityLog(`Added time entry: ${Math.round(entry.duration / 60)} minutes`);
    } catch (error) {
      console.error('Error adding time entry:', error);
      addToast('Failed to add time entry', 'warning');
    }
  }, [addToast, addActivityLog]);

  const handleTimeEntryUpdate = useCallback(async (entryId: string, updates: Partial<TimeEntry>) => {
    try {
      const updatedEntry = await timeEntryService.updateTimeEntry(entryId, updates);
      setTimeEntries(prev => prev.map(entry => 
        entry.id === entryId ? updatedEntry : entry
      ));
      addToast('Time entry updated', 'success');
    } catch (error) {
      console.error('Error updating time entry:', error);
      addToast('Failed to update time entry', 'warning');
    }
  }, [addToast]);

  const handleTimeEntryDelete = useCallback(async (entryId: string) => {
    try {
      await timeEntryService.deleteTimeEntry(entryId);
      setTimeEntries(prev => prev.filter(entry => entry.id !== entryId));
      addToast('Time entry deleted', 'success');
    } catch (error) {
      console.error('Error deleting time entry:', error);
      addToast('Failed to delete time entry', 'warning');
    }
  }, [addToast]);

  const handleTimeBoxAdd = useCallback(async (timeBox: TimeBox) => {
    try {
      const newTimeBox = await timeBoxService.addTimeBox(timeBox);
      setTimeBoxes(prev => [...prev, newTimeBox]);
      addToast('Time block added', 'success');
      addActivityLog(`Scheduled time block: "${timeBox.title}"`);
    } catch (error) {
      console.error('Error adding time box:', error);
      addToast('Failed to add time block', 'warning');
    }
  }, [addToast, addActivityLog]);

  const handleTimeBoxUpdate = useCallback(async (timeBoxId: string, updates: Partial<TimeBox>) => {
    try {
      const updatedTimeBox = await timeBoxService.updateTimeBox(timeBoxId, updates);
      setTimeBoxes(prev => prev.map(timeBox => 
        timeBox.id === timeBoxId ? updatedTimeBox : timeBox
      ));
      if (updates.isCompleted) {
        addToast(`Time block "${updatedTimeBox.title}" completed! 🎉`, 'success');
        addActivityLog(`Completed time block: "${updatedTimeBox.title}"`);
      }
    } catch (error) {
      console.error('Error updating time box:', error);
      addToast('Failed to update time block', 'warning');
    }
  }, [addToast, addActivityLog]);

  const handleTimeBoxDelete = useCallback(async (timeBoxId: string) => {
    try {
      const timeBox = timeBoxes.find(tb => tb.id === timeBoxId);
      await timeBoxService.deleteTimeBox(timeBoxId);
      setTimeBoxes(prev => prev.filter(timeBox => timeBox.id !== timeBoxId));
      if (timeBox) {
        addToast('Time block deleted', 'success');
        addActivityLog(`Deleted time block: "${timeBox.title}"`);
      }
    } catch (error) {
      console.error('Error deleting time box:', error);
      addToast('Failed to delete time block', 'warning');
    }
  }, [timeBoxes, addToast, addActivityLog]);

  // User Management handlers
  const handleAddUser = useCallback(async (userData: Omit<User, 'id' | 'createdAt' | 'updatedAt'>) => {
    try {
      const newUser = await userService.createUser(userData);
      setUsers(prev => [...prev, newUser]);
      addToast(`User ${userData.name} added successfully!`, 'success');
      addActivityLog(`Added new user: ${userData.name}`);
    } catch (error) {
      console.error('Error adding user:', error);
      addToast('Failed to add user', 'warning');
    }
  }, [addToast, addActivityLog]);

  const handleUpdateUser = useCallback(async (id: string, userData: Partial<User>) => {
    try {
      const updatedUser = await userService.updateUser(id, userData);
      setUsers(prev => prev.map(u => u.id === id ? updatedUser : u));
      addToast(`User updated successfully!`, 'success');
      addActivityLog(`Updated user: ${updatedUser.name}`);
    } catch (error) {
      console.error('Error updating user:', error);
      addToast('Failed to update user', 'warning');
    }
  }, [addToast, addActivityLog]);

  const handleDeleteUser = useCallback(async (id: string) => {
    try {
      const user = users.find(u => u.id === id);
      await userService.deleteUser(id);
      setUsers(prev => prev.filter(u => u.id !== id));
      addToast(`User ${user?.name} deleted successfully!`, 'success');
      addActivityLog(`Deleted user: ${user?.name}`);
    } catch (error) {
      console.error('Error deleting user:', error);
      addToast('Failed to delete user', 'warning');
    }
  }, [users, addToast, addActivityLog]);

  // Category Management handlers
  const handleAddCategory = useCallback(async (categoryData: Omit<Category, 'id' | 'createdAt' | 'updatedAt'>) => {
    try {
      const newCategory = await categoryService.createCategory(categoryData);
      setCategories(prev => [...prev, newCategory]);
      addToast(`Category "${categoryData.name}" added successfully!`, 'success');
      addActivityLog(`Added new category: ${categoryData.name}`);
    } catch (error) {
      console.error('Error adding category:', error);
      addToast('Failed to add category', 'warning');
    }
  }, [addToast, addActivityLog]);

  const handleUpdateCategory = useCallback(async (id: string, categoryData: Partial<Category>) => {
    try {
      const updatedCategory = await categoryService.updateCategory(id, categoryData);
      setCategories(prev => prev.map(c => c.id === id ? updatedCategory : c));
      addToast(`Category updated successfully!`, 'success');
      addActivityLog(`Updated category: ${updatedCategory.name}`);
    } catch (error) {
      console.error('Error updating category:', error);
      addToast('Failed to update category', 'warning');
    }
  }, [addToast, addActivityLog]);

  const handleDeleteCategory = useCallback(async (id: string) => {
    try {
      const category = categories.find(c => c.id === id);
      await categoryService.deleteCategory(id);
      setCategories(prev => prev.filter(c => c.id !== id));
      addToast(`Category "${category?.name}" deleted successfully!`, 'success');
      addActivityLog(`Deleted category: ${category?.name}`);
    } catch (error) {
      console.error('Error deleting category:', error);
      addToast('Failed to delete category', 'warning');
    }
  }, [categories, addToast, addActivityLog]);

  // Eat That Frog handlers
  const handleCompleteTask = useCallback(async (taskId: string) => {
    try {
      const task = tasks.find(t => t.id === taskId);
      if (!task) return;
      
      // Optimistic update
      setTasks(prev => prev.map(t => 
        t.id === taskId ? { ...t, status: 'done' as Status, updatedAt: new Date().toISOString() } : t
      ));
      
      // Update in database
      await taskService.updateTask(taskId, { 
        status: 'done' as Status, 
        updatedAt: new Date().toISOString()
      });
      
      addToast(`🎉 Great job completing "${task.title}"!`, 'success');
      addActivityLog(`Completed task: "${task.title}"`);
    } catch (error) {
      console.error('Error completing task:', error);
      addToast('Failed to complete task', 'warning');
    }
  }, [tasks, addToast, addActivityLog]);

  const handleEatFrog = useCallback(async (taskId: string) => {
    try {
      const task = tasks.find(t => t.id === taskId);
      if (!task) return;
      
      // Optimistic update with special frog flag
      setTasks(prev => prev.map(t => 
        t.id === taskId ? { 
          ...t, 
          status: 'done' as Status, 
          updatedAt: new Date().toISOString(),
          isEatThatFrog: true 
        } : t
      ));
      
      // Update in database with frog flag
      await taskService.eatFrog(taskId);
      
      addToast(`🐸 Awesome! You ate that frog: "${task.title}"!`, 'success');
      addActivityLog(`🐸 Ate the frog: "${task.title}"`);
    } catch (error) {
      console.error('Error eating frog:', error);
      addToast('Failed to eat frog', 'warning');
    }
  }, [tasks, addToast, addActivityLog]);

  // New memo for filtered tasks
  const filteredTasks = useMemo(() => {
    const { assignees, priorities } = filters;
    if (assignees.length === 0 && priorities.length === 0) {
      return tasks;
    }
    return tasks.filter(task => {
      const assigneeMatch = assignees.length === 0 || assignees.includes(task.assigneeId);
      const priorityMatch = priorities.length === 0 || priorities.includes(task.priority);
      return assigneeMatch && priorityMatch;
    });
  }, [tasks, filters]);

  // Show loading screen while checking authentication
  if (isAuthLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-100">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading Team TaskFlow...</p>
        </div>
      </div>
    );
  }

  // Show login screen if not authenticated
  if (!authUser) {
    return (
      <>
        <Login 
          onLoginSuccess={handleLoginSuccess}
          onError={handleLoginError}
        />
        <ToastContainer toasts={toasts} />
      </>
    );
  }

  // Show main app when authenticated
  return (
    <div className="min-h-screen bg-slate-100 flex flex-col">
      <Header
        onAddTask={() => { setSelectedTask(null); setTaskFormOpen(true); }}
        onAddSmartTask={() => setSmartTaskFormOpen(true)}
        currentView={currentView}
        onViewChange={setCurrentView}
        onToggleActivityFeed={() => setActivityFeedOpen(prev => !prev)}
        currentUser={currentUser}
        onOpenProfile={() => setUserProfileOpen(true)}
        users={users}
        filters={filters}
        onFilterChange={handleFilterChange}
        onClearFilters={handleClearFilters}
        authUser={authUser}
        onLogout={handleLogout}
      />
      <main className="flex-1 p-4 sm:p-6 lg:p-8">
        <div className="mx-auto max-w-7xl">
          {currentView === ViewType.Board ? (
            <TaskBoard
              tasks={filteredTasks}
              usersMap={usersMap}
              onViewDetails={handleViewDetails}
              onStatusChange={handleStatusChange}
            />
          ) : currentView === ViewType.Calendar ? (
            <MonthlyView
              tasks={filteredTasks}
              usersMap={usersMap}
              onViewDetails={handleViewDetails}
            />
          ) : currentView === ViewType.TimeManagement ? (
            <TimeManagementDashboard
              tasks={filteredTasks}
              users={users}
              onTaskUpdate={handleUpdateTask}
              onTimeEntryAdd={handleTimeEntryAdd}
              onTimeEntryUpdate={handleTimeEntryUpdate}
              onTimeEntryDelete={handleTimeEntryDelete}
              onTimeBoxAdd={handleTimeBoxAdd}
              onTimeBoxUpdate={handleTimeBoxUpdate}
              onTimeBoxDelete={handleTimeBoxDelete}
              timeEntries={timeEntries}
              timeBoxes={timeBoxes}
            />
          ) : currentView === ViewType.UserManagement ? (
            <UserManagement
              users={users}
              onAddUser={handleAddUser}
              onUpdateUser={handleUpdateUser}
              onDeleteUser={handleDeleteUser}
            />
          ) : currentView === ViewType.CategoryManagement ? (
            <CategoryManagement
              categories={categories}
              onAddCategory={handleAddCategory}
              onUpdateCategory={handleUpdateCategory}
              onDeleteCategory={handleDeleteCategory}
            />
          ) : null}
        </div>
      </main>
      
      <TaskFormModal
        isOpen={isTaskFormOpen}
        onClose={() => setTaskFormOpen(false)}
        onSave={handleSaveTask}
        users={users}
        task={selectedTask}
      />
      <SmartTaskFormModal
        isOpen={isSmartTaskFormOpen}
        onClose={() => setSmartTaskFormOpen(false)}
        onAdd={handleAddSmartTask}
      />
      <TaskDetailModal
        isOpen={isDetailModalOpen}
        onClose={() => setDetailModalOpen(false)}
        onEdit={handleOpenEditModal}
        onDelete={handleDeleteTask}
        task={selectedTask}
        user={selectedTask ? usersMap.get(selectedTask.assigneeId) : undefined}
        onStatusChange={handleStatusChange}
        onAskAI={handleAskAIWithContext}
      />
      <UserProfileModal
        isOpen={isUserProfileOpen}
        onClose={() => setUserProfileOpen(false)}
        user={currentUser}
        onSaveAvatar={handleSaveAvatar}
      />
      <AIAssistant 
        history={aiChatHistory}
        onSendMessage={handleSendMessageToAI}
        isLoading={isAiLoading}
        onClearChat={handleClearChat}
        isOpen={isAIAssistantOpen}
        onVisibilityChange={setAIAssistantOpen}
        taskContext={aiTaskContext}
        onSummarizeTask={handleSummarizeTask}
      />
      <ActivityFeed 
        isOpen={isActivityFeedOpen}
        onClose={() => setActivityFeedOpen(false)}
        logs={activityLogs}
      />
      <ToastContainer toasts={toasts} />
    </div>
  );
};
