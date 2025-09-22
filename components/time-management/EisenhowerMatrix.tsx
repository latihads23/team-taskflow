import React, { useState, useMemo } from 'react';
import { Task, User, Priority, Status } from '../../types';
import { AlertCircle, Clock, Zap, Archive, ChevronRight, Target, TrendingUp } from 'lucide-react';

interface EisenhowerMatrixProps {
  tasks: Task[];
  users: User[];
  onTaskUpdate: (id: string, updates: Partial<Task>) => void;
  onViewTask: (task: Task) => void;
}

interface QuadrantTask extends Task {
  urgencyScore: number;
  importanceScore: number;
}

const EisenhowerMatrix: React.FC<EisenhowerMatrixProps> = ({
  tasks,
  users,
  onTaskUpdate,
  onViewTask
}) => {
  const [selectedQuadrant, setSelectedQuadrant] = useState<number | null>(null);

  // Calculate urgency and importance scores for tasks
  const calculateTaskScores = (task: Task): QuadrantTask => {
    let urgencyScore = 0;
    let importanceScore = 0;

    // Urgency factors
    if (task.dueDate) {
      const daysUntilDue = Math.ceil((new Date(task.dueDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
      if (daysUntilDue <= 1) urgencyScore += 40;
      else if (daysUntilDue <= 3) urgencyScore += 25;
      else if (daysUntilDue <= 7) urgencyScore += 15;
    }

    // Priority-based urgency
    switch (task.priority) {
      case 'Urgent': urgencyScore += 30; break;
      case 'High': urgencyScore += 20; break;
      case 'Medium': urgencyScore += 10; break;
    }

    // Overdue tasks are extremely urgent
    if (task.dueDate && new Date(task.dueDate) < new Date()) {
      urgencyScore += 50;
    }

    // Importance factors
    // High priority tasks are generally important
    switch (task.priority) {
      case 'Urgent': importanceScore += 25; break;
      case 'High': importanceScore += 35; break;
      case 'Medium': importanceScore += 15; break;
    }

    // Tasks with longer estimated duration might be more important
    if (task.estimatedDuration) {
      if (task.estimatedDuration >= 240) importanceScore += 30; // 4+ hours
      else if (task.estimatedDuration >= 120) importanceScore += 20; // 2+ hours
      else if (task.estimatedDuration >= 60) importanceScore += 10; // 1+ hours
    }

    // Eat That Frog tasks are highly important
    if (task.isEatThatFrog) {
      importanceScore += 40;
    }

    return {
      ...task,
      urgencyScore,
      importanceScore
    };
  };

  // Categorize tasks into quadrants
  const categorizedTasks = useMemo(() => {
    const incompleteTasks = tasks
      .filter(task => task.status !== 'Done')
      .map(calculateTaskScores);

    const quadrants = {
      1: [], // Urgent & Important (Do First)
      2: [], // Not Urgent & Important (Schedule)  
      3: [], // Urgent & Not Important (Delegate)
      4: []  // Not Urgent & Not Important (Eliminate)
    };

    incompleteTasks.forEach(task => {
      const isUrgent = task.urgencyScore >= 25;
      const isImportant = task.importanceScore >= 25;

      if (isUrgent && isImportant) quadrants[1].push(task);
      else if (!isUrgent && isImportant) quadrants[2].push(task);
      else if (isUrgent && !isImportant) quadrants[3].push(task);
      else quadrants[4].push(task);
    });

    return quadrants;
  }, [tasks]);

  const getQuadrantInfo = (quadrant: number) => {
    const info = {
      1: {
        title: 'Do First',
        subtitle: 'Urgent & Important',
        description: 'Crisis situations, emergency issues, last-minute items',
        color: 'bg-red-500',
        lightColor: 'bg-red-50 border-red-200',
        textColor: 'text-red-700',
        icon: AlertCircle,
        action: 'DO NOW'
      },
      2: {
        title: 'Schedule',
        subtitle: 'Important & Not Urgent', 
        description: 'Long-term goals, planning, prevention, development',
        color: 'bg-blue-500',
        lightColor: 'bg-blue-50 border-blue-200',
        textColor: 'text-blue-700',
        icon: Target,
        action: 'PLAN IT'
      },
      3: {
        title: 'Delegate',
        subtitle: 'Urgent & Not Important',
        description: 'Interruptions, some emails, phone calls, meetings',
        color: 'bg-yellow-500',
        lightColor: 'bg-yellow-50 border-yellow-200',
        textColor: 'text-yellow-700',
        icon: Clock,
        action: 'DELEGATE'
      },
      4: {
        title: 'Eliminate',
        subtitle: 'Not Urgent & Not Important',
        description: 'Time wasters, busy work, excessive social media',
        color: 'bg-gray-500',
        lightColor: 'bg-gray-50 border-gray-200',
        textColor: 'text-gray-700',
        icon: Archive,
        action: 'DELETE'
      }
    };
    return info[quadrant as keyof typeof info];
  };

  const getPriorityColor = (priority: Priority) => {
    switch (priority) {
      case 'Urgent': return 'text-red-600 bg-red-50 border-red-200';
      case 'High': return 'text-orange-600 bg-orange-50 border-orange-200';
      case 'Medium': return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      case 'Low': return 'text-green-600 bg-green-50 border-green-200';
      default: return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  const handleQuadrantAction = (quadrant: number, task: QuadrantTask) => {
    switch (quadrant) {
      case 1: // Do First - Mark as high priority
        onTaskUpdate(task.id, { priority: 'Urgent' as Priority });
        break;
      case 2: // Schedule - Add to daily planner
        onTaskUpdate(task.id, { priority: 'High' as Priority });
        break;
      case 3: // Delegate - Could assign to another user
        onTaskUpdate(task.id, { priority: 'Medium' as Priority });
        break;
      case 4: // Eliminate - Mark as low priority or delete
        onTaskUpdate(task.id, { priority: 'Low' as Priority });
        break;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-xl shadow-lg p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 bg-purple-100 rounded-lg">
            <TrendingUp className="w-6 h-6 text-purple-600" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-slate-800">Eisenhower Matrix</h2>
            <p className="text-slate-600">Prioritize tasks by urgency and importance</p>
          </div>
        </div>
        
        {/* Stats */}
        <div className="grid grid-cols-4 gap-4">
          {[1, 2, 3, 4].map(quadrant => {
            const info = getQuadrantInfo(quadrant);
            const Icon = info.icon;
            return (
              <div key={quadrant} className={`p-4 rounded-lg border-2 ${info.lightColor}`}>
                <div className="flex items-center gap-2 mb-2">
                  <Icon className={`w-5 h-5 ${info.textColor}`} />
                  <span className="text-xs font-medium text-slate-500">{info.action}</span>
                </div>
                <div className={`text-2xl font-bold ${info.textColor}`}>
                  {categorizedTasks[quadrant as keyof typeof categorizedTasks].length}
                </div>
                <div className={`text-sm ${info.textColor}`}>{info.title}</div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Matrix Grid */}
      <div className="grid grid-cols-2 gap-4">
        {[1, 2, 3, 4].map(quadrant => {
          const info = getQuadrantInfo(quadrant);
          const Icon = info.icon;
          const quadrantTasks = categorizedTasks[quadrant as keyof typeof categorizedTasks];
          
          return (
            <div
              key={quadrant}
              className={`bg-white rounded-xl shadow-lg overflow-hidden border-2 ${
                selectedQuadrant === quadrant ? 'ring-2 ring-purple-500 border-purple-200' : 'border-gray-200'
              }`}
            >
              {/* Quadrant Header */}
              <div className={`${info.color} p-4 text-white`}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Icon className="w-5 h-5" />
                    <div>
                      <h3 className="font-bold">{info.title}</h3>
                      <p className="text-sm opacity-90">{info.subtitle}</p>
                    </div>
                  </div>
                  <div className="text-xs bg-white/20 px-2 py-1 rounded">
                    {quadrantTasks.length} tasks
                  </div>
                </div>
                <p className="text-xs mt-2 opacity-75">{info.description}</p>
              </div>

              {/* Tasks List */}
              <div className="p-4 space-y-3 max-h-96 overflow-y-auto">
                {quadrantTasks.length === 0 ? (
                  <div className="text-center py-8 text-slate-400">
                    <Icon className="w-8 h-8 mx-auto mb-2 opacity-50" />
                    <p className="text-sm">No tasks in this quadrant</p>
                    <p className="text-xs">Great job staying organized!</p>
                  </div>
                ) : (
                  quadrantTasks.map(task => (
                    <div
                      key={task.id}
                      className="border border-slate-200 rounded-lg p-3 hover:shadow-sm transition-all cursor-pointer hover:border-slate-300"
                      onClick={() => onViewTask(task)}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h4 className="font-medium text-slate-800 text-sm line-clamp-2">
                            {task.title}
                          </h4>
                          
                          <div className="flex items-center gap-2 mt-2">
                            <span className={`px-2 py-1 text-xs font-medium rounded-full ${getPriorityColor(task.priority)}`}>
                              {task.priority}
                            </span>
                            
                            {task.dueDate && (
                              <span className="text-xs text-slate-500 flex items-center gap-1">
                                <Clock className="w-3 h-3" />
                                {new Date(task.dueDate).toLocaleDateString()}
                              </span>
                            )}
                            
                            {task.isEatThatFrog && (
                              <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full">
                                🐸 Frog
                              </span>
                            )}
                          </div>

                          {/* Urgency/Importance Scores */}
                          <div className="flex gap-4 mt-2 text-xs">
                            <span className="text-red-600">
                              Urgency: {task.urgencyScore}
                            </span>
                            <span className="text-blue-600">
                              Importance: {task.importanceScore}
                            </span>
                          </div>
                        </div>
                        
                        <div className="flex flex-col gap-1 ml-2">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleQuadrantAction(quadrant, task);
                            }}
                            className={`px-2 py-1 text-xs font-medium rounded ${info.lightColor} ${info.textColor} hover:opacity-80`}
                          >
                            {info.action}
                          </button>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Legend */}
      <div className="bg-white rounded-xl shadow-lg p-6">
        <h3 className="font-bold text-slate-800 mb-4">How to Use the Eisenhower Matrix</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h4 className="font-semibold text-slate-700 mb-2">Quadrant Actions:</h4>
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-red-500 rounded"></div>
                <span className="text-sm"><strong>Do First:</strong> Handle immediately</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-blue-500 rounded"></div>
                <span className="text-sm"><strong>Schedule:</strong> Plan dedicated time</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-yellow-500 rounded"></div>
                <span className="text-sm"><strong>Delegate:</strong> Assign to others if possible</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-gray-500 rounded"></div>
                <span className="text-sm"><strong>Eliminate:</strong> Consider removing or deprioritizing</span>
              </div>
            </div>
          </div>
          <div>
            <h4 className="font-semibold text-slate-700 mb-2">Scoring Factors:</h4>
            <div className="text-sm text-slate-600 space-y-1">
              <p><strong>Urgency:</strong> Due date proximity, priority level, overdue status</p>
              <p><strong>Importance:</strong> Task priority, estimated duration, Eat That Frog status</p>
              <p className="text-xs mt-2 italic">Tasks are automatically categorized based on calculated scores</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EisenhowerMatrix;