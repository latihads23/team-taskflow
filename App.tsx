import React, { useState, useCallback, useMemo, useEffect } from 'react';
import { Task, User, ViewType, Status, Priority, ChatMessage, Toast, ActivityLog, TaskData, AuthUser } from './types';
import Header from './components/Header';
import TaskBoard from './components/TaskBoard';
import MonthlyView from './components/MonthlyView';
import TaskFormModal from './components/TaskFormModal';
import SmartTaskFormModal from './components/SmartTaskFormModal';
import { parseTaskFromString, chatWithAI, resetChat } from './services/geminiService';
import { listenToTasks, addTask, updateTask, deleteTask, deleteRecurringSeries } from './services/firebaseService';
import TaskDetailModal from './components/TaskDetailModal';
import AIAssistant from './components/AIAssistant';
import ToastContainer from './components/ToastContainer';
import ActivityFeed from './components/ActivityFeed';
import UserProfileModal from './components/UserProfileModal';
import Login from './components/Login';
import { authService } from './services/authService';

// Mock Data for Users (can be moved to Firebase/Auth later)
const MOCK_USERS: User[] = [
  { id: 'u1', name: 'Alex Johnson', email: 'alex.johnson@example.com', avatarUrl: 'https://i.pravatar.cc/150?u=u1' },
  { id: 'u2', name: 'Maria Garcia', email: 'maria.garcia@example.com', avatarUrl: 'https://i.pravatar.cc/150?u=u2' },
  { id: 'u3', name: 'James Smith', email: 'james.smith@example.com', avatarUrl: 'https://i.pravatar.cc/150?u=u3' },
  { id: 'u4', name: 'Li Wei', email: 'li.wei@example.com', avatarUrl: 'https://i.pravatar.cc/150?u=u4' },
];

const CURRENT_USER_ID = 'u1'; // Let's assume Alex is the current user

export const App: React.FC = () => {
  // Authentication state
  const [authUser, setAuthUser] = useState<AuthUser | null>(null);
  const [isAuthLoading, setIsAuthLoading] = useState(true);
  
  const [tasks, setTasks] = useState<Task[]>([]);
  const [users] = useState<User[]>(MOCK_USERS);
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

  useEffect(() => {
    const unsubscribe = listenToTasks(setTasks);
    return () => unsubscribe();
  }, []);

  // Initialize authentication state on app start
  useEffect(() => {
    const initAuth = () => {
      const user = authService.getCurrentUser();
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
    addTask(taskData).then(taskId => {
        addToast("Task created successfully!", "success");
        addActivityLog(`Created task: "${taskData.title}"`);
        setTaskFormOpen(false);
        setSelectedTask(null);
    }).catch(e => addToast(e.message, 'warning'));
  };

  const handleUpdateTask = (taskData: Task) => {
    updateTask(taskData.id, taskData).then(() => {
        addToast("Task updated successfully!", "success");
        addActivityLog(`Updated task: "${taskData.title}"`);
        setTaskFormOpen(false);
        setDetailModalOpen(false);
        setSelectedTask(null);
    }).catch(e => addToast(e.message, 'warning'));
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
            await addTask(parsedTask);
            addToast("Smart task added successfully!", 'success');
            addActivityLog(`Created task via Smart Add: "${parsedTask.title}"`);
            setSmartTaskFormOpen(false);
        } else {
            addToast("AI couldn't determine a user. Please check your prompt.", 'warning');
        }
    } catch (error) {
        console.error(error);
        addToast("Failed to add smart task. Please try again.", 'warning');
    }
  };

  const handleStatusChange = (taskId: string, newStatus: Status) => {
    const task = tasks.find(t => t.id === taskId);
    if(task && task.status !== newStatus) {
        updateTask(taskId, { status: newStatus }).then(() => {
            addToast(`Task moved to ${newStatus}`, "info");
            addActivityLog(`Moved task "${task.title}" to ${newStatus}`);
        }).catch(e => addToast(e.message, 'warning'));
    }
  };
  
  const handleDeleteTask = () => {
    if (!selectedTask) return;
    
    if (selectedTask.isRecurring && selectedTask.originalTaskId) {
        const userResponse = confirm("This is a recurring task. Do you want to delete the entire series?");
        if (userResponse) {
            deleteRecurringSeries(selectedTask.originalTaskId).then(() => {
                addToast("Recurring series deleted.", "success");
                addActivityLog(`Deleted recurring series for "${selectedTask.title}"`);
            }).catch(e => addToast(e.message, 'warning'));
        } else {
             deleteTask(selectedTask.id).then(() => {
                addToast("Task instance deleted.", "success");
                addActivityLog(`Deleted one instance of "${selectedTask.title}"`);
            }).catch(e => addToast(e.message, 'warning'));
        }
    } else {
        deleteTask(selectedTask.id).then(() => {
            addToast("Task deleted.", "success");
            addActivityLog(`Deleted task "${selectedTask.title}"`);
        }).catch(e => addToast(e.message, 'warning'));
    }
    
    setDetailModalOpen(false);
    setSelectedTask(null);
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
          ) : (
            <MonthlyView
              tasks={filteredTasks}
              usersMap={usersMap}
              onViewDetails={handleViewDetails}
            />
          )}
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
