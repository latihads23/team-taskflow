import React, { useState, useEffect } from 'react';
import { Calendar, Clock, Star, Target, TrendingUp, CheckCircle, AlertTriangle, Zap } from 'lucide-react';
import { Task, User } from '../types';

interface EatThatFrogProps {
  tasks: Task[];
  currentUser: User | null;
  onUpdateTask: (id: string, updates: Partial<Task>) => void;
  onCompleteTask: (id: string) => void;
}

interface FrogTask extends Task {
  urgencyScore: number;
  impactScore: number;
  totalScore: number;
  reasonsToEat: string[];
}

const EatThatFrog: React.FC<EatThatFrogProps> = ({
  tasks,
  currentUser,
  onUpdateTask,
  onCompleteTask
}) => {
  const [selectedFrog, setSelectedFrog] = useState<FrogTask | null>(null);
  const [showReasons, setShowReasons] = useState(false);
  const [dailyProgress, setDailyProgress] = useState({
    frogsEaten: 0,
    totalFrogs: 0,
    streak: 0
  });

  // Calculate urgency and impact scores for tasks
  const calculateTaskScores = (task: Task): FrogTask => {
    let urgencyScore = 0;
    let impactScore = 0;
    const reasonsToEat: string[] = [];

    // Urgency factors
    if (task.dueDate) {
      const daysUntilDue = Math.ceil((new Date(task.dueDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
      if (daysUntilDue <= 1) {
        urgencyScore += 40;
        reasonsToEat.push(`Due ${daysUntilDue === 0 ? 'today' : 'tomorrow'}`);
      } else if (daysUntilDue <= 3) {
        urgencyScore += 25;
        reasonsToEat.push(`Due in ${daysUntilDue} days`);
      } else if (daysUntilDue <= 7) {
        urgencyScore += 15;
        reasonsToEat.push(`Due this week`);
      }
    }

    // Priority-based urgency
    switch (task.priority) {
      case 'Urgent':
        urgencyScore += 30;
        reasonsToEat.push('Marked as urgent priority');
        break;
      case 'High':
        urgencyScore += 20;
        reasonsToEat.push('High priority task');
        break;
      case 'Medium':
        urgencyScore += 10;
        break;
    }

    // Impact factors
    if (task.estimatedDuration) {
      if (task.estimatedDuration >= 240) { // 4+ hours
        impactScore += 30;
        reasonsToEat.push('Large, impactful task (4+ hours)');
      } else if (task.estimatedDuration >= 120) { // 2+ hours
        impactScore += 20;
        reasonsToEat.push('Significant task (2+ hours)');
      } else if (task.estimatedDuration >= 60) { // 1+ hour
        impactScore += 15;
        reasonsToEat.push('Substantial task (1+ hours)');
      }
    }

    // Overdue tasks get extra urgency
    if (task.dueDate && new Date(task.dueDate) < new Date()) {
      urgencyScore += 50;
      reasonsToEat.unshift('⚠️ OVERDUE - This is your biggest frog!');
    }

    // Tasks not started in a while
    const daysSinceCreated = Math.ceil((new Date().getTime() - new Date(task.createdAt).getTime()) / (1000 * 60 * 60 * 24));
    if (daysSinceCreated >= 7 && task.status === 'To Do') {
      urgencyScore += 15;
      reasonsToEat.push(`Been pending for ${daysSinceCreated} days`);
    }

    // Blocked or difficult tasks (often avoided)
    if (task.title.toLowerCase().includes('difficult') || 
        task.title.toLowerCase().includes('complex') ||
        task.description?.toLowerCase().includes('challenging')) {
      impactScore += 25;
      reasonsToEat.push('Challenging task that could unlock progress');
    }

    const totalScore = urgencyScore + impactScore;

    return {
      ...task,
      urgencyScore,
      impactScore,
      totalScore,
      reasonsToEat
    };
  };

  // Get today's frog candidates (incomplete tasks only)
  const getFrogCandidates = (): FrogTask[] => {
    const incompleteTasks = tasks.filter(task => 
      task.status !== 'Done' && 
      (!currentUser || task.assigneeId === currentUser.id)
    );

    const scoredTasks = incompleteTasks.map(calculateTaskScores);
    
    return scoredTasks
      .filter(task => task.totalScore >= 15) // Minimum threshold to be a "frog"
      .sort((a, b) => b.totalScore - a.totalScore)
      .slice(0, 5); // Top 5 frogs
  };

  const frogCandidates = getFrogCandidates();
  const biggestFrog = frogCandidates[0];

  // Update daily progress
  useEffect(() => {
    const today = new Date().toISOString().split('T')[0];
    const completedToday = tasks.filter(task => 
      task.status === 'Done' && 
      task.updatedAt && 
      task.updatedAt.startsWith(today) &&
      (!currentUser || task.assigneeId === currentUser.id)
    );
    
    const frogsCompletedToday = completedToday.filter(task => {
      const scored = calculateTaskScores(task);
      return scored.totalScore >= 15;
    });

    setDailyProgress({
      frogsEaten: frogsCompletedToday.length,
      totalFrogs: frogCandidates.length + frogsCompletedToday.length,
      streak: 1 // This would be calculated from historical data in a real app
    });
  }, [tasks, currentUser]);

  const handleEatFrog = (frog: FrogTask) => {
    onCompleteTask(frog.id);
    setSelectedFrog(null);
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'Urgent': return 'text-red-600 bg-red-50 border-red-200';
      case 'High': return 'text-orange-600 bg-orange-50 border-orange-200';
      case 'Medium': return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      case 'Low': return 'text-green-600 bg-green-50 border-green-200';
      default: return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 70) return 'text-red-600 bg-red-100';
    if (score >= 50) return 'text-orange-600 bg-orange-100';
    if (score >= 30) return 'text-yellow-600 bg-yellow-100';
    return 'text-green-600 bg-green-100';
  };

  return (
    <div className="space-y-6">
      {/* Header with Progress */}
      <div className="bg-gradient-to-r from-green-500 to-blue-600 text-white rounded-lg p-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold flex items-center space-x-2">
              <Target className="w-6 h-6" />
              <span>Eat That Frog! 🐸</span>
            </h1>
            <p className="text-green-100 mt-1">
              Tackle your most important and challenging tasks first
            </p>
          </div>
          
          <div className="text-right">
            <div className="text-3xl font-bold">{dailyProgress.frogsEaten}</div>
            <div className="text-green-100">frogs eaten today</div>
            {dailyProgress.streak > 1 && (
              <div className="flex items-center justify-end space-x-1 mt-2">
                <Zap className="w-4 h-4" />
                <span className="text-sm">{dailyProgress.streak} day streak!</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Today's Biggest Frog */}
      {biggestFrog && (
        <div className="bg-white border-2 border-green-200 rounded-lg p-6 shadow-sm">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="flex items-center space-x-2 mb-2">
                <Star className="w-5 h-5 text-yellow-500 fill-current" />
                <h2 className="text-xl font-semibold text-gray-900">Your Biggest Frog Today</h2>
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${getScoreColor(biggestFrog.totalScore)}`}>
                  Score: {biggestFrog.totalScore}
                </span>
              </div>
              
              <h3 className="text-lg font-medium text-gray-800 mb-2">{biggestFrog.title}</h3>
              
              {biggestFrog.description && (
                <p className="text-gray-600 mb-3">{biggestFrog.description}</p>
              )}

              <div className="flex items-center space-x-4 text-sm text-gray-500 mb-3">
                <span className={`px-2 py-1 rounded border ${getPriorityColor(biggestFrog.priority)}`}>
                  {biggestFrog.priority} priority
                </span>
                {biggestFrog.dueDate && (
                  <span className="flex items-center space-x-1">
                    <Calendar className="w-4 h-4" />
                    <span>Due: {new Date(biggestFrog.dueDate).toLocaleDateString()}</span>
                  </span>
                )}
                {biggestFrog.estimatedDuration && (
                  <span className="flex items-center space-x-1">
                    <Clock className="w-4 h-4" />
                    <span>{Math.round(biggestFrog.estimatedDuration / 60)}h estimated</span>
                  </span>
                )}
              </div>

              {biggestFrog.reasonsToEat.length > 0 && (
                <div className="mb-4">
                  <button
                    onClick={() => setShowReasons(!showReasons)}
                    className="text-blue-600 hover:text-blue-800 text-sm font-medium flex items-center space-x-1"
                  >
                    <AlertTriangle className="w-4 h-4" />
                    <span>Why eat this frog? ({biggestFrog.reasonsToEat.length} reasons)</span>
                  </button>
                  
                  {showReasons && (
                    <ul className="mt-2 space-y-1">
                      {biggestFrog.reasonsToEat.map((reason, index) => (
                        <li key={index} className="text-sm text-gray-700 flex items-start space-x-2">
                          <span className="text-green-600 mt-0.5">•</span>
                          <span>{reason}</span>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              )}
            </div>

            <div className="flex flex-col space-y-2 ml-4">
              <button
                onClick={() => handleEatFrog(biggestFrog)}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center space-x-2"
              >
                <CheckCircle className="w-4 h-4" />
                <span>Eat This Frog!</span>
              </button>
              <button
                onClick={() => setSelectedFrog(biggestFrog)}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Start Working
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Other Frog Candidates */}
      {frogCandidates.length > 1 && (
        <div className="bg-white rounded-lg p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center space-x-2">
            <TrendingUp className="w-5 h-5 text-blue-600" />
            <span>Other Frogs to Consider</span>
          </h2>
          
          <div className="space-y-3">
            {frogCandidates.slice(1).map((frog) => (
              <div key={frog.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-sm transition-shadow">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-1">
                      <h3 className="font-medium text-gray-800">{frog.title}</h3>
                      <span className={`px-2 py-1 rounded text-xs font-medium ${getScoreColor(frog.totalScore)}`}>
                        {frog.totalScore}
                      </span>
                    </div>
                    
                    <div className="flex items-center space-x-3 text-xs text-gray-500">
                      <span className={`px-2 py-1 rounded border ${getPriorityColor(frog.priority)}`}>
                        {frog.priority}
                      </span>
                      {frog.dueDate && (
                        <span>Due: {new Date(frog.dueDate).toLocaleDateString()}</span>
                      )}
                      {frog.estimatedDuration && (
                        <span>{Math.round(frog.estimatedDuration / 60)}h</span>
                      )}
                    </div>
                    
                    {frog.reasonsToEat.length > 0 && (
                      <p className="text-xs text-gray-600 mt-1">
                        {frog.reasonsToEat[0]}
                        {frog.reasonsToEat.length > 1 && ` (+${frog.reasonsToEat.length - 1} more)`}
                      </p>
                    )}
                  </div>
                  
                  <div className="flex space-x-2 ml-4">
                    <button
                      onClick={() => handleEatFrog(frog)}
                      className="px-3 py-1 bg-green-600 text-white rounded text-sm hover:bg-green-700 transition-colors"
                    >
                      Complete
                    </button>
                    <button
                      onClick={() => setSelectedFrog(frog)}
                      className="px-3 py-1 bg-blue-600 text-white rounded text-sm hover:bg-blue-700 transition-colors"
                    >
                      Start
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* No Frogs State */}
      {frogCandidates.length === 0 && (
        <div className="bg-white rounded-lg p-12 text-center shadow-sm">
          <div className="text-6xl mb-4">🎉</div>
          <h2 className="text-2xl font-semibold text-gray-900 mb-2">No Big Frogs Today!</h2>
          <p className="text-gray-600 mb-4">
            Congratulations! You either don't have any challenging tasks right now,
            or you've eaten all your frogs already.
          </p>
          <p className="text-sm text-gray-500">
            This is the perfect time to work on smaller tasks or plan ahead for tomorrow.
          </p>
        </div>
      )}

      {/* Working Modal */}
      {selectedFrog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Working on: {selectedFrog.title}
            </h3>
            
            <div className="space-y-4">
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <h4 className="font-medium text-green-800 mb-2">🐸 Frog-Eating Tips:</h4>
                <ul className="text-sm text-green-700 space-y-1">
                  <li>• Break this into smaller chunks if needed</li>
                  <li>• Focus on this one task until completion</li>
                  <li>• Avoid distractions and multitasking</li>
                  <li>• Celebrate when you finish!</li>
                </ul>
              </div>
              
              <div className="flex space-x-2">
                <button
                  onClick={() => handleEatFrog(selectedFrog)}
                  className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                >
                  Mark Complete
                </button>
                <button
                  onClick={() => setSelectedFrog(null)}
                  className="flex-1 px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 transition-colors"
                >
                  Continue Later
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default EatThatFrog;