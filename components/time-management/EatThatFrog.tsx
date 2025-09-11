import React, { useState, useEffect } from 'react';
import { Task, Priority } from '../../types';

interface EatThatFrogProps {
  tasks: Task[];
  onTaskUpdate: (taskId: string, updates: Partial<Task>) => void;
  onEatThatFrogComplete: () => void;
  currentDate?: string; // YYYY-MM-DD format
}

const EatThatFrog: React.FC<EatThatFrogProps> = ({
  tasks,
  onTaskUpdate,
  onEatThatFrogComplete,
  currentDate = new Date().toISOString().split('T')[0],
}) => {
  const [selectedFrogId, setSelectedFrogId] = useState<string | null>(null);
  const [showSelector, setShowSelector] = useState(false);
  const [motivationalQuote, setMotivationalQuote] = useState('');

  // Get current frog task
  const currentFrog = tasks.find(task => task.isEatThatFrog && task.dueDate === currentDate);
  
  // Get potential frog tasks (high priority, not completed, due today or overdue)
  const getPotentialFrogTasks = () => {
    const today = new Date().toISOString().split('T')[0];
    
    return tasks
      .filter(task => {
        const isDueToday = task.dueDate === today;
        const isOverdue = task.dueDate < today;
        const isNotCompleted = task.status !== 'Done';
        const isHighPriority = task.priority === Priority.Urgent || task.priority === Priority.High;
        
        return isNotCompleted && (isDueToday || isOverdue) && isHighPriority;
      })
      .sort((a, b) => {
        // Sort by priority (Urgent first, then High)
        const priorityOrder = { 'Urgent': 0, 'High': 1, 'Medium': 2, 'Low': 3 };
        return priorityOrder[a.priority] - priorityOrder[b.priority];
      });
  };

  const motivationalQuotes = [
    "If you eat a frog first thing in the morning, nothing worse will happen to you the rest of the day! 🐸",
    "Mark Twain said it best: Tackle your biggest challenge first! 💪",
    "Your most important task deserves your best energy. Start strong! ⚡",
    "The frog you're avoiding the most is probably the one you need to eat first! 🎯",
    "Every accomplishment starts with the decision to try. Pick your frog! 🚀",
    "The hardest part about eating a frog is getting started. You've got this! 💯",
    "Success is often just one tough task away. Make it count! 🏆",
    "Champions don't become champions in the ring. They become champions in their preparation! 🥇",
  ];

  useEffect(() => {
    // Set random motivational quote
    const randomQuote = motivationalQuotes[Math.floor(Math.random() * motivationalQuotes.length)];
    setMotivationalQuote(randomQuote);
  }, [currentDate]);

  const setEatThatFrog = (taskId: string) => {
    // First, clear any existing frog for today
    tasks.forEach(task => {
      if (task.isEatThatFrog && task.dueDate === currentDate) {
        onTaskUpdate(task.id, { isEatThatFrog: false });
      }
    });

    // Set new frog
    onTaskUpdate(taskId, { isEatThatFrog: true });
    setSelectedFrogId(null);
    setShowSelector(false);
  };

  const completeFrogTask = () => {
    if (currentFrog) {
      onTaskUpdate(currentFrog.id, { 
        status: 'Done' as any,
        isEatThatFrog: false 
      });
      onEatThatFrogComplete();
    }
  };

  const clearFrog = () => {
    if (currentFrog) {
      onTaskUpdate(currentFrog.id, { isEatThatFrog: false });
    }
  };

  const getFrogProgress = () => {
    if (!currentFrog) return 0;
    
    // Simple progress based on status
    switch (currentFrog.status) {
      case 'To Do':
        return 0;
      case 'In Progress':
        return 50;
      case 'Done':
        return 100;
      default:
        return 0;
    }
  };

  const getStreakCount = () => {
    // This would normally be calculated from historical data
    // For demo purposes, returning a sample number
    return Math.floor(Math.random() * 15) + 1;
  };

  const potentialTasks = getPotentialFrogTasks();
  const progress = getFrogProgress();
  const streakCount = getStreakCount();

  return (
    <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl shadow-lg p-6 border border-green-200">
      {/* Header */}
      <div className="text-center mb-6">
        <h2 className="text-3xl font-bold text-green-800 mb-2 flex items-center justify-center gap-2">
          🐸 Eat That Frog!
        </h2>
        <p className="text-green-700 text-lg font-medium">
          Most Important Task Today
        </p>
        <p className="text-sm text-green-600 mt-2 italic">
          {motivationalQuote}
        </p>
      </div>

      {/* Current Frog Display */}
      {currentFrog ? (
        <div className="bg-white rounded-lg p-6 mb-6 border-2 border-green-300 shadow-md">
          <div className="flex items-start justify-between mb-4">
            <div className="flex-1">
              <h3 className="text-xl font-bold text-slate-800 mb-2">{currentFrog.title}</h3>
              <p className="text-slate-600 mb-3">{currentFrog.description}</p>
              
              <div className="flex items-center gap-3 mb-4">
                <span className={`px-3 py-1 text-sm font-medium rounded-full ${
                  currentFrog.priority === 'Urgent' 
                    ? 'bg-red-100 text-red-800' 
                    : 'bg-orange-100 text-orange-800'
                }`}>
                  {currentFrog.priority} Priority
                </span>
                
                <span className={`px-3 py-1 text-sm font-medium rounded-full ${
                  currentFrog.status === 'To Do' 
                    ? 'bg-slate-100 text-slate-800'
                    : currentFrog.status === 'In Progress'
                      ? 'bg-blue-100 text-blue-800'
                      : 'bg-green-100 text-green-800'
                }`}>
                  {currentFrog.status}
                </span>
                
                <span className="text-sm text-slate-500">
                  Due: {new Date(currentFrog.dueDate).toLocaleDateString()}
                </span>
              </div>

              {/* Progress Bar */}
              <div className="mb-4">
                <div className="flex justify-between text-sm text-slate-600 mb-1">
                  <span>Progress</span>
                  <span>{progress}%</span>
                </div>
                <div className="w-full bg-slate-200 rounded-full h-3">
                  <div 
                    className="bg-gradient-to-r from-green-500 to-emerald-500 h-3 rounded-full transition-all duration-500"
                    style={{ width: `${progress}%` }}
                  ></div>
                </div>
              </div>
            </div>
            
            <div className="ml-4 flex flex-col gap-2">
              <button
                onClick={() => setShowSelector(true)}
                className="bg-slate-500 hover:bg-slate-600 text-white px-3 py-1 rounded-lg text-sm font-medium transition-colors"
              >
                Change Frog
              </button>
              <button
                onClick={clearFrog}
                className="bg-gray-400 hover:bg-gray-500 text-white px-3 py-1 rounded-lg text-sm font-medium transition-colors"
              >
                Clear
              </button>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3">
            {currentFrog.status !== 'In Progress' && currentFrog.status !== 'Done' && (
              <button
                onClick={() => onTaskUpdate(currentFrog.id, { status: 'In Progress' as any })}
                className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-medium flex items-center gap-2 transition-colors"
              >
                🚀 Start Working
              </button>
            )}
            
            {currentFrog.status !== 'Done' && (
              <button
                onClick={completeFrogTask}
                className="bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-lg font-medium flex items-center gap-2 transition-colors"
              >
                ✅ Complete Frog
              </button>
            )}
            
            {currentFrog.status === 'Done' && (
              <div className="flex items-center gap-2 text-green-600 font-medium">
                🎉 Frog eaten! Great job!
              </div>
            )}
          </div>
        </div>
      ) : (
        /* No Frog Selected */
        <div className="bg-white rounded-lg p-8 mb-6 border-2 border-dashed border-green-300 text-center">
          <div className="text-6xl mb-4">🐸</div>
          <h3 className="text-xl font-semibold text-slate-800 mb-2">
            No Frog Selected Yet
          </h3>
          <p className="text-slate-600 mb-4">
            Choose your most important task to tackle first today!
          </p>
          <button
            onClick={() => setShowSelector(true)}
            className="bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-lg font-medium transition-colors"
          >
            🎯 Pick Your Frog
          </button>
        </div>
      )}

      {/* Task Selector Modal */}
      {showSelector && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 max-w-2xl w-full mx-4 max-h-96 overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-bold text-slate-800">Choose Your Frog 🐸</h3>
              <button
                onClick={() => setShowSelector(false)}
                className="text-slate-500 hover:text-slate-700 text-xl"
              >
                ✕
              </button>
            </div>
            
            <p className="text-slate-600 mb-4">
              Select the most important or challenging task to focus on first:
            </p>

            <div className="space-y-3">
              {potentialTasks.length > 0 ? (
                potentialTasks.map(task => (
                  <button
                    key={task.id}
                    onClick={() => setEatThatFrog(task.id)}
                    className="w-full text-left p-4 bg-slate-50 hover:bg-green-50 border border-slate-200 hover:border-green-300 rounded-lg transition-colors"
                  >
                    <h4 className="font-semibold text-slate-800 mb-1">{task.title}</h4>
                    <p className="text-sm text-slate-600 mb-2">{task.description}</p>
                    <div className="flex items-center gap-2">
                      <span className={`px-2 py-0.5 text-xs rounded-full ${
                        task.priority === 'Urgent' 
                          ? 'bg-red-100 text-red-800' 
                          : 'bg-orange-100 text-orange-800'
                      }`}>
                        {task.priority}
                      </span>
                      <span className="text-xs text-slate-500">Due: {task.dueDate}</span>
                      {task.dueDate < new Date().toISOString().split('T')[0] && (
                        <span className="text-xs bg-red-100 text-red-800 px-2 py-0.5 rounded-full">
                          Overdue
                        </span>
                      )}
                    </div>
                  </button>
                ))
              ) : (
                <div className="text-center py-8 text-slate-500">
                  <div className="text-4xl mb-2">🎉</div>
                  <p>No high-priority tasks for today!</p>
                  <p className="text-sm mt-1">All caught up or check your task priorities.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Stats Section */}
      <div className="bg-white rounded-lg p-4">
        <div className="grid grid-cols-2 gap-4 text-center">
          <div>
            <div className="text-2xl font-bold text-green-600">{streakCount}</div>
            <div className="text-sm text-slate-600">Day Streak</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-emerald-600">
              {tasks.filter(t => t.isEatThatFrog && t.status === 'Done').length}
            </div>
            <div className="text-sm text-slate-600">Frogs Eaten</div>
          </div>
        </div>
        
        <div className="mt-4 text-center">
          <p className="text-xs text-slate-500">
            💡 Tip: Choose tasks that are important but challenging - those you tend to procrastinate on!
          </p>
        </div>
      </div>
    </div>
  );
};

export default EatThatFrog;
