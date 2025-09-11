import React, { useState, useEffect, useCallback } from 'react';
import { PomodoroSession, PomodoroState, Task, TimeManagementSettings } from '../../types';

interface PomodoroTimerProps {
  currentTask?: Task;
  onSessionComplete: (session: PomodoroSession) => void;
  settings: TimeManagementSettings;
  onSettingsChange: (settings: Partial<TimeManagementSettings>) => void;
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

const PomodoroTimer: React.FC<PomodoroTimerProps> = ({ 
  currentTask, 
  onSessionComplete, 
  settings = DEFAULT_SETTINGS,
  onSettingsChange 
}) => {
  const [session, setSession] = useState<PomodoroSession>({
    id: '',
    state: PomodoroState.Idle,
    duration: settings.pomodoroWorkDuration * 60,
    remainingTime: settings.pomodoroWorkDuration * 60,
    isActive: false,
    completedPomodoros: 0,
  });

  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  // Update session when settings change
  useEffect(() => {
    if (session.state === PomodoroState.Idle) {
      setSession(prev => ({
        ...prev,
        duration: settings.pomodoroWorkDuration * 60,
        remainingTime: settings.pomodoroWorkDuration * 60,
      }));
    }
  }, [settings.pomodoroWorkDuration, session.state]);

  // Timer countdown effect
  useEffect(() => {
    let interval: NodeJS.Timeout;
    
    if (session.isActive && session.remainingTime > 0) {
      interval = setInterval(() => {
        setSession(prev => ({
          ...prev,
          remainingTime: prev.remainingTime - 1,
        }));
      }, 1000);
    } else if (session.isActive && session.remainingTime === 0) {
      handleSessionComplete();
    }

    return () => clearInterval(interval);
  }, [session.isActive, session.remainingTime]);

  const handleSessionComplete = useCallback(() => {
    const completedSession = {
      ...session,
      endTime: new Date(),
      isActive: false,
    };

    onSessionComplete(completedSession);

    // Determine next session type
    let nextState: PomodoroState;
    let nextDuration: number;
    let newCompletedPomodoros = session.completedPomodoros;

    if (session.state === PomodoroState.Work) {
      newCompletedPomodoros++;
      if (newCompletedPomodoros % settings.pomodorosUntilLongBreak === 0) {
        nextState = PomodoroState.LongBreak;
        nextDuration = settings.pomodoroLongBreak * 60;
      } else {
        nextState = PomodoroState.ShortBreak;
        nextDuration = settings.pomodoroShortBreak * 60;
      }
    } else {
      nextState = PomodoroState.Work;
      nextDuration = settings.pomodoroWorkDuration * 60;
    }

    // Show notification
    if (settings.showNotifications && 'Notification' in window) {
      const message = session.state === PomodoroState.Work 
        ? 'Pomodoro complete! Time for a break 🎉'
        : 'Break over! Ready to focus? 💪';
      
      new Notification('Team TaskFlow', {
        body: message,
        icon: '/favicon.ico',
      });
    }

    // Update session
    setSession({
      id: Date.now().toString(),
      taskId: currentTask?.id,
      state: nextState,
      duration: nextDuration,
      remainingTime: nextDuration,
      isActive: settings.autoStartBreaks || (session.state !== PomodoroState.Work && settings.autoStartWork),
      startTime: settings.autoStartBreaks || (session.state !== PomodoroState.Work && settings.autoStartWork) ? new Date() : undefined,
      completedPomodoros: newCompletedPomodoros,
    });
  }, [session, currentTask, settings, onSessionComplete]);

  const handleStart = () => {
    setSession(prev => ({
      ...prev,
      isActive: true,
      startTime: new Date(),
      id: prev.id || Date.now().toString(),
    }));
  };

  const handlePause = () => {
    setSession(prev => ({
      ...prev,
      isActive: false,
    }));
  };

  const handleReset = () => {
    const duration = session.state === PomodoroState.Work 
      ? settings.pomodoroWorkDuration * 60
      : session.state === PomodoroState.ShortBreak 
        ? settings.pomodoroShortBreak * 60
        : settings.pomodoroLongBreak * 60;

    setSession(prev => ({
      ...prev,
      isActive: false,
      remainingTime: duration,
      startTime: undefined,
    }));
  };

  const handleSkip = () => {
    handleSessionComplete();
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const getStateColor = () => {
    switch (session.state) {
      case PomodoroState.Work:
        return 'text-red-600';
      case PomodoroState.ShortBreak:
        return 'text-green-600';
      case PomodoroState.LongBreak:
        return 'text-blue-600';
      default:
        return 'text-slate-600';
    }
  };

  const getStateEmoji = () => {
    switch (session.state) {
      case PomodoroState.Work:
        return '🍅';
      case PomodoroState.ShortBreak:
        return '☕';
      case PomodoroState.LongBreak:
        return '🌴';
      default:
        return '⏰';
    }
  };

  const getProgressPercentage = () => {
    return ((session.duration - session.remainingTime) / session.duration) * 100;
  };

  const requestNotificationPermission = () => {
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }
  };

  useEffect(() => {
    requestNotificationPermission();
  }, []);

  return (
    <div className="bg-white rounded-xl shadow-lg p-6 max-w-md mx-auto">
      {/* Header */}
      <div className="text-center mb-6">
        <h2 className="text-2xl font-bold text-slate-800 flex items-center justify-center gap-2">
          {getStateEmoji()} Pomodoro Timer
        </h2>
        {currentTask && (
          <p className="text-sm text-slate-600 mt-2 truncate">
            Working on: <span className="font-medium">{currentTask.title}</span>
          </p>
        )}
      </div>

      {/* Timer Display */}
      <div className="text-center mb-8">
        <div className={`text-6xl font-mono font-bold ${getStateColor()} mb-2`}>
          {formatTime(session.remainingTime)}
        </div>
        <p className="text-lg capitalize text-slate-600">
          {session.state === PomodoroState.Idle ? 'Ready to start' : session.state.replace('-', ' ')}
        </p>
        
        {/* Progress Bar */}
        <div className="w-full bg-slate-200 rounded-full h-2 mt-4">
          <div 
            className={`h-2 rounded-full transition-all duration-1000 ${
              session.state === PomodoroState.Work 
                ? 'bg-red-500' 
                : session.state === PomodoroState.ShortBreak
                  ? 'bg-green-500'
                  : 'bg-blue-500'
            }`}
            style={{ width: `${getProgressPercentage()}%` }}
          ></div>
        </div>
      </div>

      {/* Controls */}
      <div className="flex justify-center gap-3 mb-6">
        {!session.isActive ? (
          <button
            onClick={handleStart}
            className="bg-brand-600 hover:bg-brand-700 text-white px-6 py-3 rounded-lg font-medium flex items-center gap-2 transition-colors"
          >
            ▶️ Start
          </button>
        ) : (
          <button
            onClick={handlePause}
            className="bg-yellow-600 hover:bg-yellow-700 text-white px-6 py-3 rounded-lg font-medium flex items-center gap-2 transition-colors"
          >
            ⏸️ Pause
          </button>
        )}
        
        <button
          onClick={handleReset}
          className="bg-slate-600 hover:bg-slate-700 text-white px-4 py-3 rounded-lg font-medium transition-colors"
        >
          🔄 Reset
        </button>
        
        <button
          onClick={handleSkip}
          className="bg-orange-600 hover:bg-orange-700 text-white px-4 py-3 rounded-lg font-medium transition-colors"
        >
          ⏭️ Skip
        </button>
      </div>

      {/* Stats */}
      <div className="bg-slate-50 rounded-lg p-4 mb-4">
        <div className="grid grid-cols-2 gap-4 text-center">
          <div>
            <div className="text-2xl font-bold text-slate-800">{session.completedPomodoros}</div>
            <div className="text-sm text-slate-600">Completed Today</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-slate-800">
              {Math.floor(session.completedPomodoros / settings.pomodorosUntilLongBreak)}
            </div>
            <div className="text-sm text-slate-600">Full Cycles</div>
          </div>
        </div>
      </div>

      {/* Settings Toggle */}
      <button
        onClick={() => setIsSettingsOpen(!isSettingsOpen)}
        className="w-full bg-slate-100 hover:bg-slate-200 text-slate-700 py-2 rounded-lg font-medium transition-colors"
      >
        ⚙️ {isSettingsOpen ? 'Hide Settings' : 'Show Settings'}
      </button>

      {/* Settings Panel */}
      {isSettingsOpen && (
        <div className="mt-4 p-4 bg-slate-50 rounded-lg space-y-4">
          <h3 className="font-semibold text-slate-800">Timer Settings</h3>
          
          <div className="grid grid-cols-1 gap-3">
            <div>
              <label className="block text-sm text-slate-600 mb-1">Work Duration (minutes)</label>
              <input
                type="number"
                min="1"
                max="60"
                value={settings.pomodoroWorkDuration}
                onChange={(e) => onSettingsChange({ pomodoroWorkDuration: parseInt(e.target.value) })}
                className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm focus:ring-2 focus:ring-brand-500 focus:border-transparent"
              />
            </div>
            
            <div>
              <label className="block text-sm text-slate-600 mb-1">Short Break (minutes)</label>
              <input
                type="number"
                min="1"
                max="30"
                value={settings.pomodoroShortBreak}
                onChange={(e) => onSettingsChange({ pomodoroShortBreak: parseInt(e.target.value) })}
                className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm focus:ring-2 focus:ring-brand-500 focus:border-transparent"
              />
            </div>
            
            <div>
              <label className="block text-sm text-slate-600 mb-1">Long Break (minutes)</label>
              <input
                type="number"
                min="1"
                max="60"
                value={settings.pomodoroLongBreak}
                onChange={(e) => onSettingsChange({ pomodoroLongBreak: parseInt(e.target.value) })}
                className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm focus:ring-2 focus:ring-brand-500 focus:border-transparent"
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={settings.autoStartBreaks}
                onChange={(e) => onSettingsChange({ autoStartBreaks: e.target.checked })}
                className="rounded border-slate-300 text-brand-600 focus:ring-brand-500"
              />
              <span className="text-sm text-slate-700">Auto-start breaks</span>
            </label>
            
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={settings.autoStartWork}
                onChange={(e) => onSettingsChange({ autoStartWork: e.target.checked })}
                className="rounded border-slate-300 text-brand-600 focus:ring-brand-500"
              />
              <span className="text-sm text-slate-700">Auto-start work sessions</span>
            </label>
            
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={settings.showNotifications}
                onChange={(e) => onSettingsChange({ showNotifications: e.target.checked })}
                className="rounded border-slate-300 text-brand-600 focus:ring-brand-500"
              />
              <span className="text-sm text-slate-700">Show notifications</span>
            </label>
          </div>
        </div>
      )}
    </div>
  );
};

export default PomodoroTimer;
