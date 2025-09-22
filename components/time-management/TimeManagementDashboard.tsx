import React, { useState, useEffect } from 'react';
import { Task, TimeEntry, TimeBox, PomodoroSession, TimeManagementSettings, User } from '../../types';
import PomodoroTimer from './PomodoroTimer';
import TimeTracker from './TimeTracker';
import EatThatFrog from './EatThatFrog';
import DailyPlanner from './DailyPlanner';
import EisenhowerMatrix from './EisenhowerMatrix';

interface TimeManagementDashboardProps {
  tasks: Task[];
  users: User[];
  onTaskUpdate: (taskId: string, updates: Partial<Task>) => void;
  onTimeEntryAdd: (entry: TimeEntry) => void;
  onTimeEntryUpdate: (entryId: string, entry: Partial<TimeEntry>) => void;
  onTimeEntryDelete: (entryId: string) => void;
  onTimeBoxAdd: (timeBox: TimeBox) => void;
  onTimeBoxUpdate: (timeBoxId: string, updates: Partial<TimeBox>) => void;
  onTimeBoxDelete: (timeBoxId: string) => void;
  timeEntries?: TimeEntry[];
  timeBoxes?: TimeBox[];
}

const DEFAULT_SETTINGS: TimeManagementSettings = {
  pomodoroWorkDuration: 25,
  pomodoroShortBreak: 5,
  pomodoroLongBreak: 15,
  pomodorosUntilLongBreak: 4,
  autoStartBreaks: false,
  autoStartWork: false,
  showNotifications: true,
  defaultTaskDuration: 30,
  workingHoursStart: '09:00',
  workingHoursEnd: '17:00',
};

const TimeManagementDashboard: React.FC<TimeManagementDashboardProps> = ({
  tasks,
  users,
  onTaskUpdate,
  onTimeEntryAdd,
  onTimeEntryUpdate,
  onTimeEntryDelete,
  onTimeBoxAdd,
  onTimeBoxUpdate,
  onTimeBoxDelete,
  timeEntries = [],
  timeBoxes = [],
}) => {
  const [activeTab, setActiveTab] = useState<'overview' | 'pomodoro' | 'tracker' | 'planner' | 'frog' | 'matrix'>('overview');
  const [settings, setSettings] = useState<TimeManagementSettings>(DEFAULT_SETTINGS);
  const [currentTask, setCurrentTask] = useState<Task | null>(null);

  // Load settings from localStorage on mount
  useEffect(() => {
    const savedSettings = localStorage.getItem('timeManagementSettings');
    if (savedSettings) {
      setSettings({ ...DEFAULT_SETTINGS, ...JSON.parse(savedSettings) });
    }
  }, []);

  // Save settings to localStorage when changed
  const handleSettingsChange = (newSettings: Partial<TimeManagementSettings>) => {
    const updatedSettings = { ...settings, ...newSettings };
    setSettings(updatedSettings);
    localStorage.setItem('timeManagementSettings', JSON.stringify(updatedSettings));
  };

  const handlePomodoroSessionComplete = (session: PomodoroSession) => {
    // Convert pomodoro session to time entry
    if (session.taskId && session.startTime && session.endTime) {
      const timeEntry: TimeEntry = {
        id: Date.now().toString(),
        taskId: session.taskId,
        startTime: session.startTime,
        endTime: session.endTime,
        duration: session.duration,
        description: `Pomodoro session - ${session.state}`,
        isManual: false,
      };
      onTimeEntryAdd(timeEntry);
    }
  };

  const handleEatThatFrogComplete = () => {
    // Add celebration or streak tracking logic here
    console.log('Frog eaten! 🎉');
  };

  // Calculate overview stats
  const calculateOverviewStats = () => {
    const today = new Date().toISOString().split('T')[0];
    
    // Today's time entries
    const todayEntries = timeEntries.filter(entry => 
      new Date(entry.startTime).toISOString().split('T')[0] === today
    );
    const todayMinutes = todayEntries.reduce((sum, entry) => sum + entry.duration / 60, 0);
    
    // Today's timeboxes
    const todayBoxes = timeBoxes.filter(box => 
      new Date(box.startTime).toISOString().split('T')[0] === today
    );
    const completedBoxes = todayBoxes.filter(box => box.isCompleted).length;
    
    // Task stats
    const totalTasks = tasks.length;
    const completedTasks = tasks.filter(task => task.status === 'Done').length;
    const inProgressTasks = tasks.filter(task => task.status === 'In Progress').length;
    const urgentTasks = tasks.filter(task => task.priority === 'Urgent' && task.status !== 'Done').length;
    
    // Frog task
    const currentFrog = tasks.find(task => task.isEatThatFrog && task.dueDate === today);
    
    return {
      todayMinutes: Math.round(todayMinutes),
      todayBoxes: todayBoxes.length,
      completedBoxes,
      boxCompletionRate: todayBoxes.length > 0 ? Math.round((completedBoxes / todayBoxes.length) * 100) : 0,
      totalTasks,
      completedTasks,
      inProgressTasks,
      urgentTasks,
      taskCompletionRate: totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0,
      hasFrog: !!currentFrog,
      frogCompleted: currentFrog?.status === 'Done',
    };
  };

  const stats = calculateOverviewStats();

  const tabs = [
    { id: 'overview', label: '🏠 Overview', emoji: '🏠' },
    { id: 'frog', label: '🐸 Eat That Frog', emoji: '🐸' },
    { id: 'matrix', label: '📊 Eisenhower Matrix', emoji: '📊' },
    { id: 'pomodoro', label: '🍅 Pomodoro', emoji: '🍅' },
    { id: 'tracker', label: '⏱️ Time Tracker', emoji: '⏱️' },
    { id: 'planner', label: '📅 Daily Planner', emoji: '📅' },
  ] as const;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-brand-600 to-brand-700 rounded-xl shadow-lg p-6 text-white">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold mb-2">⏰ Time Management</h1>
            <p className="text-brand-100">
              Master your time, master your life. Take control of your productivity!
            </p>
          </div>
          <div className="text-right">
            <div className="text-2xl font-bold">{stats.todayMinutes}m</div>
            <div className="text-brand-100 text-sm">Tracked Today</div>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="bg-white rounded-xl shadow-lg overflow-hidden">
        <div className="flex border-b border-slate-200">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex-1 px-4 py-3 text-sm font-medium transition-colors ${
                activeTab === tab.id
                  ? 'bg-brand-50 text-brand-700 border-b-2 border-brand-600'
                  : 'text-slate-600 hover:text-slate-800 hover:bg-slate-50'
              }`}
            >
              <span className="mr-2">{tab.emoji}</span>
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Tab Content */}
      <div>
        {activeTab === 'overview' && (
          <div className="space-y-6">
            {/* Quick Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <div className="bg-white rounded-xl shadow-lg p-6 text-center">
                <div className="text-3xl mb-2">⏱️</div>
                <div className="text-2xl font-bold text-slate-800">{stats.todayMinutes}m</div>
                <div className="text-sm text-slate-600">Time Tracked Today</div>
              </div>
              
              <div className="bg-white rounded-xl shadow-lg p-6 text-center">
                <div className="text-3xl mb-2">📋</div>
                <div className="text-2xl font-bold text-slate-800">{stats.boxCompletionRate}%</div>
                <div className="text-sm text-slate-600">TimeBox Completion</div>
                <div className="text-xs text-slate-500 mt-1">
                  {stats.completedBoxes}/{stats.todayBoxes} completed
                </div>
              </div>
              
              <div className="bg-white rounded-xl shadow-lg p-6 text-center">
                <div className="text-3xl mb-2">✅</div>
                <div className="text-2xl font-bold text-slate-800">{stats.taskCompletionRate}%</div>
                <div className="text-sm text-slate-600">Task Completion</div>
                <div className="text-xs text-slate-500 mt-1">
                  {stats.completedTasks}/{stats.totalTasks} completed
                </div>
              </div>
              
              <div className="bg-white rounded-xl shadow-lg p-6 text-center">
                <div className="text-3xl mb-2">🚨</div>
                <div className="text-2xl font-bold text-red-600">{stats.urgentTasks}</div>
                <div className="text-sm text-slate-600">Urgent Tasks</div>
                <div className="text-xs text-slate-500 mt-1">Need attention</div>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="bg-white rounded-xl shadow-lg p-6">
              <h3 className="text-lg font-semibold text-slate-800 mb-4">🚀 Quick Actions</h3>
              <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                <button
                  onClick={() => setActiveTab('frog')}
                  className={`p-4 rounded-lg border-2 transition-colors ${
                    stats.hasFrog && !stats.frogCompleted
                      ? 'border-green-300 bg-green-50 text-green-800'
                      : stats.frogCompleted
                        ? 'border-gray-300 bg-gray-50 text-gray-600'
                        : 'border-orange-300 bg-orange-50 text-orange-800 hover:bg-orange-100'
                  }`}
                >
                  <div className="text-2xl mb-1">
                    {stats.frogCompleted ? '✅' : stats.hasFrog ? '🐸' : '🎯'}
                  </div>
                  <div className="text-sm font-medium">
                    {stats.frogCompleted 
                      ? 'Frog Eaten!' 
                      : stats.hasFrog 
                        ? 'Complete Frog' 
                        : 'Pick Your Frog'
                    }
                  </div>
                </button>
                
                <button
                  onClick={() => setActiveTab('matrix')}
                  className="p-4 rounded-lg border-2 border-purple-300 bg-purple-50 text-purple-800 hover:bg-purple-100 transition-colors"
                >
                  <div className="text-2xl mb-1">📊</div>
                  <div className="text-sm font-medium">Prioritize Tasks</div>
                </button>
                
                <button
                  onClick={() => setActiveTab('pomodoro')}
                  className="p-4 rounded-lg border-2 border-red-300 bg-red-50 text-red-800 hover:bg-red-100 transition-colors"
                >
                  <div className="text-2xl mb-1">🍅</div>
                  <div className="text-sm font-medium">Start Pomodoro</div>
                </button>
                
                <button
                  onClick={() => setActiveTab('tracker')}
                  className="p-4 rounded-lg border-2 border-blue-300 bg-blue-50 text-blue-800 hover:bg-blue-100 transition-colors"
                >
                  <div className="text-2xl mb-1">⏱️</div>
                  <div className="text-sm font-medium">Track Time</div>
                </button>
                
                <button
                  onClick={() => setActiveTab('planner')}
                  className="p-4 rounded-lg border-2 border-indigo-300 bg-indigo-50 text-indigo-800 hover:bg-indigo-100 transition-colors"
                >
                  <div className="text-2xl mb-1">📅</div>
                  <div className="text-sm font-medium">Plan Day</div>
                </button>
              </div>
            </div>

            {/* Today's Focus */}
            <div className="bg-white rounded-xl shadow-lg p-6">
              <h3 className="text-lg font-semibold text-slate-800 mb-4">🎯 Today's Focus</h3>
              
              {stats.hasFrog ? (
                <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-4">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-lg">🐸</span>
                    <span className="font-medium text-green-800">Eat That Frog</span>
                    {stats.frogCompleted && <span className="text-green-600">✅</span>}
                  </div>
                  <p className="text-green-700 text-sm">
                    {stats.frogCompleted 
                      ? "Great job! You've completed your most important task today!"
                      : "You have a frog task selected. Complete it first for maximum impact!"
                    }
                  </p>
                </div>
              ) : (
                <div className="bg-orange-50 border border-orange-200 rounded-lg p-4 mb-4">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-lg">⚠️</span>
                    <span className="font-medium text-orange-800">No Frog Selected</span>
                  </div>
                  <p className="text-orange-700 text-sm">
                    Choose your most important task for today to maximize productivity!
                  </p>
                </div>
              )}
              
              {/* In Progress Tasks */}
              {stats.inProgressTasks > 0 && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-lg">🔄</span>
                    <span className="font-medium text-blue-800">In Progress</span>
                  </div>
                  <p className="text-blue-700 text-sm">
                    You have {stats.inProgressTasks} task{stats.inProgressTasks > 1 ? 's' : ''} in progress. 
                    Focus on completing them before starting new ones!
                  </p>
                </div>
              )}
            </div>

            {/* Motivational Quote */}
            <div className="bg-gradient-to-r from-slate-100 to-slate-200 rounded-xl shadow-lg p-6 text-center">
              <div className="text-2xl mb-2">💡</div>
              <blockquote className="text-lg font-medium text-slate-800 mb-2">
                "Time is what we want most, but what we use worst."
              </blockquote>
              <cite className="text-sm text-slate-600">— William Penn</cite>
            </div>
          </div>
        )}

        {activeTab === 'pomodoro' && (
          <PomodoroTimer
            currentTask={currentTask}
            onSessionComplete={handlePomodoroSessionComplete}
            settings={settings}
            onSettingsChange={handleSettingsChange}
          />
        )}

        {activeTab === 'tracker' && (
          <TimeTracker
            tasks={tasks}
            onTimeEntryAdd={onTimeEntryAdd}
            onTimeEntryUpdate={onTimeEntryUpdate}
            onTimeEntryDelete={onTimeEntryDelete}
            timeEntries={timeEntries}
          />
        )}

        {activeTab === 'planner' && (
          <DailyPlanner
            tasks={tasks}
            onTimeBoxAdd={onTimeBoxAdd}
            onTimeBoxUpdate={onTimeBoxUpdate}
            onTimeBoxDelete={onTimeBoxDelete}
            timeBoxes={timeBoxes}
            settings={settings}
          />
        )}

        {activeTab === 'frog' && (
          <EatThatFrog
            tasks={tasks}
            onTaskUpdate={onTaskUpdate}
            onEatThatFrogComplete={handleEatThatFrogComplete}
          />
        )}
        
        {activeTab === 'matrix' && (
          <EisenhowerMatrix
            tasks={tasks}
            users={users}
            onTaskUpdate={onTaskUpdate}
            onViewTask={(task) => {
              // Handle view task - could open task detail modal
              console.log('Viewing task:', task);
            }}
          />
        )}
      </div>

      {/* Task Selector for Pomodoro */}
      {activeTab === 'pomodoro' && (
        <div className="bg-white rounded-xl shadow-lg p-4">
          <h4 className="font-medium text-slate-800 mb-3">Select Task for Pomodoro:</h4>
          <div className="grid gap-2 max-h-40 overflow-y-auto">
            <button
              onClick={() => setCurrentTask(null)}
              className={`text-left p-2 rounded border transition-colors ${
                !currentTask 
                  ? 'border-brand-300 bg-brand-50' 
                  : 'border-slate-200 bg-slate-50 hover:bg-slate-100'
              }`}
            >
              <span className="text-sm text-slate-600">No specific task (free session)</span>
            </button>
            {tasks
              .filter(task => task.status !== 'Done')
              .slice(0, 5) // Show only first 5 tasks
              .map(task => (
                <button
                  key={task.id}
                  onClick={() => setCurrentTask(task)}
                  className={`text-left p-2 rounded border transition-colors ${
                    currentTask?.id === task.id
                      ? 'border-brand-300 bg-brand-50' 
                      : 'border-slate-200 bg-slate-50 hover:bg-slate-100'
                  }`}
                >
                  <div className="font-medium text-slate-800 text-sm">{task.title}</div>
                  <div className="text-xs text-slate-500 flex items-center gap-2">
                    <span className={`px-1 py-0.5 rounded text-xs ${
                      task.priority === 'Urgent' ? 'bg-red-100 text-red-700' :
                      task.priority === 'High' ? 'bg-orange-100 text-orange-700' :
                      task.priority === 'Medium' ? 'bg-yellow-100 text-yellow-700' :
                      'bg-green-100 text-green-700'
                    }`}>
                      {task.priority}
                    </span>
                    <span>Due: {task.dueDate}</span>
                  </div>
                </button>
              ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default TimeManagementDashboard;
