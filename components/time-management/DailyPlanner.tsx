import React, { useState, useEffect } from 'react';
import { Task, TimeBox, DailyPlan, TimeManagementSettings } from '../../types';

interface DailyPlannerProps {
  tasks: Task[];
  onTimeBoxAdd: (timeBox: TimeBox) => void;
  onTimeBoxUpdate: (timeBoxId: string, updates: Partial<TimeBox>) => void;
  onTimeBoxDelete: (timeBoxId: string) => void;
  timeBoxes: TimeBox[];
  currentDate?: string; // YYYY-MM-DD format
  settings: TimeManagementSettings;
}

const DailyPlanner: React.FC<DailyPlannerProps> = ({
  tasks,
  onTimeBoxAdd,
  onTimeBoxUpdate,
  onTimeBoxDelete,
  timeBoxes,
  currentDate = new Date().toISOString().split('T')[0],
  settings,
}) => {
  const [selectedDate, setSelectedDate] = useState(currentDate);
  const [showAddModal, setShowAddModal] = useState(false);
  const [newTimeBox, setNewTimeBox] = useState({
    taskId: '',
    title: '',
    startTime: '',
    duration: 30, // minutes
    description: '',
    color: '#0ea5e9', // brand color
  });
  const [viewMode, setViewMode] = useState<'timeline' | 'blocks'>('timeline');

  // Generate time slots for the day (24 hour format)
  const generateTimeSlots = () => {
    const slots = [];
    for (let hour = 0; hour < 24; hour++) {
      for (let minute = 0; minute < 60; minute += 30) { // 30-minute slots
        const time = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
        slots.push(time);
      }
    }
    return slots;
  };

  const timeSlots = generateTimeSlots();

  // Get timeboxes for selected date
  const getDayTimeBoxes = () => {
    const selectedDateObj = new Date(selectedDate);
    return timeBoxes
      .filter(tb => {
        const tbDate = new Date(tb.startTime);
        return tbDate.toDateString() === selectedDateObj.toDateString();
      })
      .sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime());
  };

  const addTimeBox = () => {
    if (!newTimeBox.title || !newTimeBox.startTime) return;

    const [hours, minutes] = newTimeBox.startTime.split(':');
    const startTime = new Date(selectedDate);
    startTime.setHours(parseInt(hours), parseInt(minutes), 0, 0);
    
    const endTime = new Date(startTime.getTime() + newTimeBox.duration * 60 * 1000);

    const timeBox: TimeBox = {
      id: Date.now().toString(),
      taskId: newTimeBox.taskId || undefined,
      title: newTimeBox.title,
      startTime,
      endTime,
      description: newTimeBox.description,
      color: newTimeBox.color,
      isCompleted: false,
    };

    onTimeBoxAdd(timeBox);
    
    // Reset form
    setNewTimeBox({
      taskId: '',
      title: '',
      startTime: '',
      duration: 30,
      description: '',
      color: '#0ea5e9',
    });
    setShowAddModal(false);
  };

  const toggleComplete = (timeBoxId: string) => {
    const timeBox = timeBoxes.find(tb => tb.id === timeBoxId);
    if (timeBox) {
      onTimeBoxUpdate(timeBoxId, { isCompleted: !timeBox.isCompleted });
    }
  };

  const getTimeBoxForSlot = (timeSlot: string) => {
    const [hours, minutes] = timeSlot.split(':');
    const slotTime = new Date(selectedDate);
    slotTime.setHours(parseInt(hours), parseInt(minutes), 0, 0);

    return getDayTimeBoxes().find(tb => {
      const tbStart = new Date(tb.startTime);
      const tbEnd = new Date(tb.endTime);
      return slotTime >= tbStart && slotTime < tbEnd;
    });
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const calculateDayStats = () => {
    const dayTimeBoxes = getDayTimeBoxes();
    const totalPlanned = dayTimeBoxes.reduce((sum, tb) => {
      return sum + (new Date(tb.endTime).getTime() - new Date(tb.startTime).getTime()) / (1000 * 60);
    }, 0);
    
    const completed = dayTimeBoxes.filter(tb => tb.isCompleted).length;
    const total = dayTimeBoxes.length;
    const completionRate = total > 0 ? Math.round((completed / total) * 100) : 0;

    return {
      totalPlanned: Math.round(totalPlanned),
      completionRate,
      completedBoxes: completed,
      totalBoxes: total,
    };
  };

  const stats = calculateDayStats();

  const predefinedColors = [
    '#0ea5e9', // blue
    '#10b981', // emerald
    '#f59e0b', // amber
    '#ef4444', // red
    '#8b5cf6', // violet
    '#06b6d4', // cyan
    '#84cc16', // lime
    '#f97316', // orange
  ];

  const isWorkingHours = (timeSlot: string) => {
    const [hours] = timeSlot.split(':');
    const hour = parseInt(hours);
    const startHour = parseInt(settings.workingHoursStart.split(':')[0]);
    const endHour = parseInt(settings.workingHoursEnd.split(':')[0]);
    return hour >= startHour && hour < endHour;
  };

  return (
    <div className="space-y-6">
      {/* Header with Date Selector and Stats */}
      <div className="bg-white rounded-xl shadow-lg p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
            📅 Daily Planner
          </h2>
          
          <div className="flex items-center gap-3">
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="px-3 py-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-brand-500 focus:border-transparent"
            />
            
            <div className="flex bg-slate-100 rounded-lg p-1">
              <button
                onClick={() => setViewMode('timeline')}
                className={`px-3 py-1 text-sm font-medium rounded ${
                  viewMode === 'timeline' ? 'bg-white text-brand-600 shadow' : 'text-slate-600'
                }`}
              >
                Timeline
              </button>
              <button
                onClick={() => setViewMode('blocks')}
                className={`px-3 py-1 text-sm font-medium rounded ${
                  viewMode === 'blocks' ? 'bg-white text-brand-600 shadow' : 'text-slate-600'
                }`}
              >
                Blocks
              </button>
            </div>
            
            <button
              onClick={() => setShowAddModal(true)}
              className="bg-brand-600 hover:bg-brand-700 text-white px-4 py-2 rounded-lg font-medium transition-colors"
            >
              + Add TimeBox
            </button>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-4 gap-4">
          <div className="bg-blue-50 p-3 rounded-lg text-center">
            <div className="text-xl font-bold text-blue-600">{stats.totalPlanned}m</div>
            <div className="text-sm text-blue-800">Planned Time</div>
          </div>
          <div className="bg-green-50 p-3 rounded-lg text-center">
            <div className="text-xl font-bold text-green-600">{stats.completionRate}%</div>
            <div className="text-sm text-green-800">Completion</div>
          </div>
          <div className="bg-purple-50 p-3 rounded-lg text-center">
            <div className="text-xl font-bold text-purple-600">{stats.completedBoxes}</div>
            <div className="text-sm text-purple-800">Completed</div>
          </div>
          <div className="bg-orange-50 p-3 rounded-lg text-center">
            <div className="text-xl font-bold text-orange-600">{stats.totalBoxes}</div>
            <div className="text-sm text-orange-800">Total Boxes</div>
          </div>
        </div>
      </div>

      {/* Timeline View */}
      {viewMode === 'timeline' && (
        <div className="bg-white rounded-xl shadow-lg overflow-hidden">
          <div className="p-4 bg-slate-50 border-b">
            <h3 className="font-semibold text-slate-800">
              Timeline - {new Date(selectedDate).toLocaleDateString('en-US', { 
                weekday: 'long', 
                year: 'numeric', 
                month: 'long', 
                day: 'numeric' 
              })}
            </h3>
          </div>
          
          <div className="max-h-96 overflow-y-auto">
            {timeSlots.map(timeSlot => {
              const timeBox = getTimeBoxForSlot(timeSlot);
              const isWorking = isWorkingHours(timeSlot);
              
              return (
                <div 
                  key={timeSlot}
                  className={`flex border-b border-slate-100 ${
                    !isWorking ? 'bg-slate-50' : ''
                  }`}
                >
                  <div className="w-20 p-2 text-sm text-slate-600 bg-slate-50 border-r">
                    {timeSlot}
                  </div>
                  
                  <div className="flex-1 p-2 min-h-[40px]">
                    {timeBox && (
                      <div 
                        className={`p-2 rounded text-white text-sm ${
                          timeBox.isCompleted ? 'opacity-75' : ''
                        }`}
                        style={{ backgroundColor: timeBox.color }}
                      >
                        <div className="flex items-center justify-between">
                          <div>
                            <div className="font-medium">{timeBox.title}</div>
                            {timeBox.description && (
                              <div className="text-xs mt-1 opacity-90">{timeBox.description}</div>
                            )}
                            <div className="text-xs mt-1 opacity-80">
                              {formatTime(new Date(timeBox.startTime))} - {formatTime(new Date(timeBox.endTime))}
                            </div>
                          </div>
                          
                          <div className="flex gap-2">
                            <button
                              onClick={() => toggleComplete(timeBox.id)}
                              className={`text-lg ${
                                timeBox.isCompleted ? 'opacity-100' : 'opacity-60 hover:opacity-100'
                              }`}
                            >
                              {timeBox.isCompleted ? '✅' : '⭕'}
                            </button>
                            <button
                              onClick={() => onTimeBoxDelete(timeBox.id)}
                              className="text-lg opacity-60 hover:opacity-100"
                            >
                              🗑️
                            </button>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Blocks View */}
      {viewMode === 'blocks' && (
        <div className="bg-white rounded-xl shadow-lg p-6">
          <h3 className="font-semibold text-slate-800 mb-4">
            Time Blocks - {new Date(selectedDate).toLocaleDateString('en-US', { 
              weekday: 'long', 
              year: 'numeric', 
              month: 'long', 
              day: 'numeric' 
            })}
          </h3>
          
          <div className="grid gap-4">
            {getDayTimeBoxes().length > 0 ? (
              getDayTimeBoxes().map(timeBox => (
                <div 
                  key={timeBox.id}
                  className={`p-4 rounded-lg border-l-4 ${
                    timeBox.isCompleted ? 'bg-slate-50' : 'bg-white'
                  }`}
                  style={{ borderLeftColor: timeBox.color }}
                >
                  <div className="flex items-center justify-between mb-2">
                    <h4 className={`font-semibold ${
                      timeBox.isCompleted ? 'text-slate-500 line-through' : 'text-slate-800'
                    }`}>
                      {timeBox.title}
                    </h4>
                    
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-slate-600">
                        {formatTime(new Date(timeBox.startTime))} - {formatTime(new Date(timeBox.endTime))}
                      </span>
                      <button
                        onClick={() => toggleComplete(timeBox.id)}
                        className="text-lg hover:scale-110 transition-transform"
                      >
                        {timeBox.isCompleted ? '✅' : '⭕'}
                      </button>
                      <button
                        onClick={() => onTimeBoxDelete(timeBox.id)}
                        className="text-red-500 hover:text-red-700 text-sm"
                      >
                        🗑️
                      </button>
                    </div>
                  </div>
                  
                  {timeBox.description && (
                    <p className={`text-sm mb-2 ${
                      timeBox.isCompleted ? 'text-slate-500' : 'text-slate-600'
                    }`}>
                      {timeBox.description}
                    </p>
                  )}
                  
                  {timeBox.taskId && (
                    <div className="text-xs text-slate-500">
                      Linked to task: {tasks.find(t => t.id === timeBox.taskId)?.title || 'Unknown'}
                    </div>
                  )}
                  
                  <div className="flex items-center justify-between mt-2">
                    <div className="text-xs text-slate-500">
                      Duration: {Math.round((new Date(timeBox.endTime).getTime() - new Date(timeBox.startTime).getTime()) / (1000 * 60))} minutes
                    </div>
                    {timeBox.isCompleted && (
                      <div className="text-xs text-green-600 font-medium">
                        ✨ Completed
                      </div>
                    )}
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-8 text-slate-500">
                <div className="text-4xl mb-2">📋</div>
                <p>No time blocks scheduled for this day.</p>
                <p className="text-sm mt-1">Click "Add TimeBox" to start planning!</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Add TimeBox Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 max-w-md w-full mx-4">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-bold text-slate-800">Add Time Block</h3>
              <button
                onClick={() => setShowAddModal(false)}
                className="text-slate-500 hover:text-slate-700 text-xl"
              >
                ✕
              </button>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Title *
                </label>
                <input
                  type="text"
                  value={newTimeBox.title}
                  onChange={(e) => setNewTimeBox(prev => ({ ...prev, title: e.target.value }))}
                  className="w-full px-3 py-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-brand-500 focus:border-transparent"
                  placeholder="What will you work on?"
                />
              </div>
              
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Start Time *
                  </label>
                  <input
                    type="time"
                    value={newTimeBox.startTime}
                    onChange={(e) => setNewTimeBox(prev => ({ ...prev, startTime: e.target.value }))}
                    className="w-full px-3 py-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-brand-500 focus:border-transparent"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Duration (mins)
                  </label>
                  <input
                    type="number"
                    min="15"
                    step="15"
                    value={newTimeBox.duration}
                    onChange={(e) => setNewTimeBox(prev => ({ ...prev, duration: parseInt(e.target.value) }))}
                    className="w-full px-3 py-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-brand-500 focus:border-transparent"
                  />
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Link to Task (optional)
                </label>
                <select
                  value={newTimeBox.taskId}
                  onChange={(e) => setNewTimeBox(prev => ({ ...prev, taskId: e.target.value }))}
                  className="w-full px-3 py-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-brand-500 focus:border-transparent"
                >
                  <option value="">No task linked</option>
                  {tasks
                    .filter(task => task.status !== 'Done')
                    .map(task => (
                      <option key={task.id} value={task.id}>
                        {task.title}
                      </option>
                    ))}
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Description
                </label>
                <textarea
                  value={newTimeBox.description}
                  onChange={(e) => setNewTimeBox(prev => ({ ...prev, description: e.target.value }))}
                  className="w-full px-3 py-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-brand-500 focus:border-transparent"
                  rows={2}
                  placeholder="Additional details..."
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Color
                </label>
                <div className="flex gap-2 flex-wrap">
                  {predefinedColors.map(color => (
                    <button
                      key={color}
                      onClick={() => setNewTimeBox(prev => ({ ...prev, color }))}
                      className={`w-8 h-8 rounded-full border-2 ${
                        newTimeBox.color === color ? 'border-slate-400' : 'border-slate-200'
                      }`}
                      style={{ backgroundColor: color }}
                    />
                  ))}
                </div>
              </div>
            </div>
            
            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setShowAddModal(false)}
                className="flex-1 bg-slate-500 hover:bg-slate-600 text-white py-2 rounded-lg font-medium transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={addTimeBox}
                disabled={!newTimeBox.title || !newTimeBox.startTime}
                className="flex-1 bg-brand-600 hover:bg-brand-700 disabled:bg-slate-400 text-white py-2 rounded-lg font-medium transition-colors"
              >
                Add Block
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DailyPlanner;
