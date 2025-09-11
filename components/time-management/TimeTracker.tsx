import React, { useState, useEffect, useCallback } from 'react';
import { Task, TimeEntry, TimeTrackingStats } from '../../types';

interface TimeTrackerProps {
  tasks: Task[];
  onTimeEntryAdd: (entry: TimeEntry) => void;
  onTimeEntryUpdate: (entryId: string, entry: Partial<TimeEntry>) => void;
  onTimeEntryDelete: (entryId: string) => void;
  timeEntries: TimeEntry[];
}

const TimeTracker: React.FC<TimeTrackerProps> = ({
  tasks,
  onTimeEntryAdd,
  onTimeEntryUpdate,
  onTimeEntryDelete,
  timeEntries,
}) => {
  const [activeEntry, setActiveEntry] = useState<TimeEntry | null>(null);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [currentTime, setCurrentTime] = useState(Date.now());
  const [showManualEntry, setShowManualEntry] = useState(false);
  const [manualEntry, setManualEntry] = useState({
    taskId: '',
    duration: '',
    description: '',
    date: new Date().toISOString().split('T')[0],
  });

  // Update current time every second for active timer
  useEffect(() => {
    let interval: NodeJS.Timeout;
    
    if (activeEntry) {
      interval = setInterval(() => {
        setCurrentTime(Date.now());
      }, 1000);
    }

    return () => clearInterval(interval);
  }, [activeEntry]);

  const formatDuration = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    
    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${minutes}:${secs.toString().padStart(2, '0')}`;
  };

  const getCurrentDuration = () => {
    if (!activeEntry || !activeEntry.startTime) return 0;
    return Math.floor((currentTime - activeEntry.startTime.getTime()) / 1000);
  };

  const startTracking = (task: Task) => {
    // Stop current tracking if any
    if (activeEntry) {
      stopTracking();
    }

    const newEntry: TimeEntry = {
      id: Date.now().toString(),
      taskId: task.id,
      startTime: new Date(),
      duration: 0,
      isManual: false,
    };

    setActiveEntry(newEntry);
    setSelectedTask(task);
  };

  const stopTracking = useCallback(() => {
    if (!activeEntry) return;

    const endTime = new Date();
    const duration = Math.floor((endTime.getTime() - activeEntry.startTime.getTime()) / 1000);

    const completedEntry: TimeEntry = {
      ...activeEntry,
      endTime,
      duration,
    };

    onTimeEntryAdd(completedEntry);
    setActiveEntry(null);
    setSelectedTask(null);
  }, [activeEntry, onTimeEntryAdd]);

  const addManualEntry = () => {
    if (!manualEntry.taskId || !manualEntry.duration) return;

    const durationInSeconds = parseInt(manualEntry.duration) * 60; // Convert minutes to seconds
    const startTime = new Date(`${manualEntry.date}T12:00:00`); // Default to noon
    const endTime = new Date(startTime.getTime() + durationInSeconds * 1000);

    const entry: TimeEntry = {
      id: Date.now().toString(),
      taskId: manualEntry.taskId,
      startTime,
      endTime,
      duration: durationInSeconds,
      description: manualEntry.description,
      isManual: true,
    };

    onTimeEntryAdd(entry);
    
    // Reset form
    setManualEntry({
      taskId: '',
      duration: '',
      description: '',
      date: new Date().toISOString().split('T')[0],
    });
    setShowManualEntry(false);
  };

  const calculateStats = (): TimeTrackingStats => {
    const today = new Date();
    const startOfWeek = new Date(today.getFullYear(), today.getMonth(), today.getDate() - today.getDay());
    const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);

    const todayEntries = timeEntries.filter(entry => {
      const entryDate = new Date(entry.startTime);
      return entryDate.toDateString() === today.toDateString();
    });

    const weekEntries = timeEntries.filter(entry => {
      const entryDate = new Date(entry.startTime);
      return entryDate >= startOfWeek;
    });

    const monthEntries = timeEntries.filter(entry => {
      const entryDate = new Date(entry.startTime);
      return entryDate >= startOfMonth;
    });

    const totalTimeToday = todayEntries.reduce((sum, entry) => sum + entry.duration, 0) / 60;
    const totalTimeThisWeek = weekEntries.reduce((sum, entry) => sum + entry.duration, 0) / 60;
    const totalTimeThisMonth = monthEntries.reduce((sum, entry) => sum + entry.duration, 0) / 60;

    // Calculate most productive hour
    const hourlyStats: { [hour: number]: number } = {};
    timeEntries.forEach(entry => {
      const hour = new Date(entry.startTime).getHours();
      hourlyStats[hour] = (hourlyStats[hour] || 0) + entry.duration;
    });
    const mostProductiveHour = Object.keys(hourlyStats).reduce((a, b) => 
      hourlyStats[parseInt(a)] > hourlyStats[parseInt(b)] ? a : b, '9'
    );

    // Calculate completion rate
    const completedTasks = tasks.filter(task => task.status === 'Done').length;
    const totalTasks = tasks.length;
    const taskCompletionRate = totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0;

    // Calculate average daily time (last 7 days)
    const last7Days = Array.from({ length: 7 }, (_, i) => {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      return date.toDateString();
    });

    const dailyTimes = last7Days.map(dateStr => {
      return timeEntries
        .filter(entry => new Date(entry.startTime).toDateString() === dateStr)
        .reduce((sum, entry) => sum + entry.duration, 0) / 60;
    });

    const averageDailyTime = dailyTimes.reduce((sum, time) => sum + time, 0) / 7;

    return {
      totalTimeToday: Math.round(totalTimeToday),
      totalTimeThisWeek: Math.round(totalTimeThisWeek),
      totalTimeThisMonth: Math.round(totalTimeThisMonth),
      averageDailyTime: Math.round(averageDailyTime),
      mostProductiveHour: parseInt(mostProductiveHour),
      taskCompletionRate: Math.round(taskCompletionRate),
      pomodorosCompleted: 0, // This would be calculated from PomodoroTimer
      eatThatFrogStreak: 0, // This would be calculated from EatThatFrog component
    };
  };

  const stats = calculateStats();

  const getTodayEntries = () => {
    const today = new Date().toDateString();
    return timeEntries
      .filter(entry => new Date(entry.startTime).toDateString() === today)
      .sort((a, b) => new Date(b.startTime).getTime() - new Date(a.startTime).getTime());
  };

  const getTaskById = (taskId: string) => {
    return tasks.find(task => task.id === taskId);
  };

  const formatTime = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (hours > 0) {
      return `${hours}h ${mins}m`;
    }
    return `${mins}m`;
  };

  return (
    <div className="space-y-6">
      {/* Active Timer Section */}
      <div className="bg-white rounded-xl shadow-lg p-6">
        <h2 className="text-2xl font-bold text-slate-800 mb-4 flex items-center gap-2">
          ⏱️ Time Tracker
        </h2>

        {activeEntry && selectedTask ? (
          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <div className="flex items-center justify-between mb-3">
              <div>
                <h3 className="font-semibold text-green-800">{selectedTask.title}</h3>
                <p className="text-sm text-green-600">Currently tracking</p>
              </div>
              <div className="text-right">
                <div className="text-2xl font-mono font-bold text-green-800">
                  {formatDuration(getCurrentDuration())}
                </div>
                <button
                  onClick={stopTracking}
                  className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg text-sm font-medium mt-2 transition-colors"
                >
                  ⏹️ Stop Tracking
                </button>
              </div>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <p className="text-slate-600">Select a task to start tracking time:</p>
            <div className="grid gap-2 max-h-60 overflow-y-auto">
              {tasks
                .filter(task => task.status !== 'Done')
                .map(task => (
                  <button
                    key={task.id}
                    onClick={() => startTracking(task)}
                    className="text-left p-3 bg-slate-50 hover:bg-slate-100 rounded-lg border border-slate-200 transition-colors"
                  >
                    <h4 className="font-medium text-slate-800">{task.title}</h4>
                    <p className="text-sm text-slate-600">{task.description}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <span className={`px-2 py-0.5 text-xs rounded-full ${
                        task.priority === 'Urgent' ? 'bg-red-100 text-red-800' :
                        task.priority === 'High' ? 'bg-orange-100 text-orange-800' :
                        task.priority === 'Medium' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-green-100 text-green-800'
                      }`}>
                        {task.priority}
                      </span>
                      <span className="text-xs text-slate-500">{task.dueDate}</span>
                    </div>
                  </button>
                ))}
            </div>
          </div>
        )}
      </div>

      {/* Stats Overview */}
      <div className="bg-white rounded-xl shadow-lg p-6">
        <h3 className="text-xl font-bold text-slate-800 mb-4">📊 Time Statistics</h3>
        
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-blue-50 p-4 rounded-lg text-center">
            <div className="text-2xl font-bold text-blue-600">{formatTime(stats.totalTimeToday)}</div>
            <div className="text-sm text-blue-800">Today</div>
          </div>
          
          <div className="bg-green-50 p-4 rounded-lg text-center">
            <div className="text-2xl font-bold text-green-600">{formatTime(stats.totalTimeThisWeek)}</div>
            <div className="text-sm text-green-800">This Week</div>
          </div>
          
          <div className="bg-purple-50 p-4 rounded-lg text-center">
            <div className="text-2xl font-bold text-purple-600">{formatTime(stats.averageDailyTime)}</div>
            <div className="text-sm text-purple-800">Daily Average</div>
          </div>
          
          <div className="bg-orange-50 p-4 rounded-lg text-center">
            <div className="text-2xl font-bold text-orange-600">{stats.taskCompletionRate}%</div>
            <div className="text-sm text-orange-800">Completion Rate</div>
          </div>
        </div>

        <div className="text-center text-sm text-slate-600">
          Most productive hour: <span className="font-semibold">{stats.mostProductiveHour}:00</span>
        </div>
      </div>

      {/* Manual Entry */}
      <div className="bg-white rounded-xl shadow-lg p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xl font-bold text-slate-800">✏️ Manual Entry</h3>
          <button
            onClick={() => setShowManualEntry(!showManualEntry)}
            className="bg-slate-600 hover:bg-slate-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
          >
            {showManualEntry ? 'Cancel' : 'Add Manual Entry'}
          </button>
        </div>

        {showManualEntry && (
          <div className="bg-slate-50 p-4 rounded-lg space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Task</label>
                <select
                  value={manualEntry.taskId}
                  onChange={(e) => setManualEntry(prev => ({ ...prev, taskId: e.target.value }))}
                  className="w-full px-3 py-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-brand-500 focus:border-transparent"
                >
                  <option value="">Select a task</option>
                  {tasks.map(task => (
                    <option key={task.id} value={task.id}>{task.title}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Duration (minutes)</label>
                <input
                  type="number"
                  value={manualEntry.duration}
                  onChange={(e) => setManualEntry(prev => ({ ...prev, duration: e.target.value }))}
                  className="w-full px-3 py-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-brand-500 focus:border-transparent"
                  placeholder="e.g., 30"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Date</label>
                <input
                  type="date"
                  value={manualEntry.date}
                  onChange={(e) => setManualEntry(prev => ({ ...prev, date: e.target.value }))}
                  className="w-full px-3 py-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-brand-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Description (optional)</label>
                <input
                  type="text"
                  value={manualEntry.description}
                  onChange={(e) => setManualEntry(prev => ({ ...prev, description: e.target.value }))}
                  className="w-full px-3 py-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-brand-500 focus:border-transparent"
                  placeholder="What did you work on?"
                />
              </div>
            </div>

            <button
              onClick={addManualEntry}
              disabled={!manualEntry.taskId || !manualEntry.duration}
              className="bg-brand-600 hover:bg-brand-700 disabled:bg-slate-400 text-white px-6 py-2 rounded-lg font-medium transition-colors"
            >
              Add Entry
            </button>
          </div>
        )}
      </div>

      {/* Today's Entries */}
      <div className="bg-white rounded-xl shadow-lg p-6">
        <h3 className="text-xl font-bold text-slate-800 mb-4">📅 Today's Time Entries</h3>
        
        <div className="space-y-3">
          {getTodayEntries().length > 0 ? (
            getTodayEntries().map(entry => {
              const task = getTaskById(entry.taskId);
              return (
                <div key={entry.id} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                  <div className="flex-1">
                    <h4 className="font-medium text-slate-800">{task?.title || 'Unknown Task'}</h4>
                    <p className="text-sm text-slate-600">
                      {new Date(entry.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      {entry.endTime && ` - ${new Date(entry.endTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`}
                      {entry.isManual && ' (manual)'}
                    </p>
                    {entry.description && (
                      <p className="text-xs text-slate-500 mt-1">{entry.description}</p>
                    )}
                  </div>
                  
                  <div className="flex items-center gap-3">
                    <span className="font-mono font-semibold text-slate-800">
                      {formatTime(Math.round(entry.duration / 60))}
                    </span>
                    <button
                      onClick={() => onTimeEntryDelete(entry.id)}
                      className="text-red-500 hover:text-red-700 text-sm"
                    >
                      🗑️
                    </button>
                  </div>
                </div>
              );
            })
          ) : (
            <div className="text-center py-8 text-slate-500">
              No time entries recorded today.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default TimeTracker;
