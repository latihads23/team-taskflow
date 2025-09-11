
import React, { useState, useMemo, useCallback, useRef } from 'react';
import { Task, User, Status } from '../types';
import TaskCard from './TaskCard';

interface TaskBoardProps {
  tasks: Task[];
  usersMap: Map<string, User>;
  onViewDetails: (task: Task) => void;
  onStatusChange: (taskId: string, newStatus: Status) => void;
}

const statusConfig: { [key in Status]: { title: string; color: string } } = {
  [Status.ToDo]: { title: "To Do", color: "bg-slate-200" },
  [Status.InProgress]: { title: "In Progress", color: "bg-blue-200" },
  [Status.Done]: { title: "Done", color: "bg-green-200" },
};

const TaskBoard: React.FC<TaskBoardProps> = ({ tasks, usersMap, onViewDetails, onStatusChange }) => {
  const [draggedTaskId, setDraggedTaskId] = useState<string | null>(null);
  const [dragOverStatus, setDragOverStatus] = useState<Status | null>(null);
  const dragTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Memoized columns
  const columns = useMemo(() => {
    return Object.values(Status).map(status => ({
      status,
      tasks: tasks
        .filter(task => task.status === status)
        .sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime())
    }));
  }, [tasks]);

  const handleDragStart = useCallback((e: React.DragEvent, taskId: string) => {
    e.dataTransfer.setData('taskId', taskId);
    e.dataTransfer.effectAllowed = 'move';
    setDraggedTaskId(taskId);
    
    // Clear any previous timeout
    if (dragTimeoutRef.current) {
      clearTimeout(dragTimeoutRef.current);
    }
  }, []);

  const handleDragEnd = useCallback(() => {
    // Add small delay for smooth animation
    dragTimeoutRef.current = setTimeout(() => {
      setDraggedTaskId(null);
      setDragOverStatus(null);
    }, 150);
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  }, []);

  const handleDrop = useCallback((e: React.DragEvent, status: Status) => {
    e.preventDefault();
    
    const taskId = e.dataTransfer.getData('taskId');
    const task = tasks.find(t => t.id === taskId);
    
    if (task && task.status !== status) {
      // Just call the status change handler - no optimistic updates
      // The parent component will handle the state update
      onStatusChange(taskId, status);
    }
    
    if (dragTimeoutRef.current) {
      clearTimeout(dragTimeoutRef.current);
    }
    setDraggedTaskId(null);
    setDragOverStatus(null);
  }, [tasks, onStatusChange]);

  const handleDragEnter = useCallback((status: Status) => {
    setDragOverStatus(status);
  }, []);

  // Cleanup timeout on unmount
  React.useEffect(() => {
    return () => {
      if (dragTimeoutRef.current) {
        clearTimeout(dragTimeoutRef.current);
      }
    };
  }, []);

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      {columns.map(({ status, tasks }) => (
        <div 
          key={status}
          onDragOver={handleDragOver}
          onDrop={(e) => handleDrop(e, status)}
          onDragEnter={() => handleDragEnter(status)}
          className={`bg-slate-100 rounded-xl p-4 flex flex-col transition-all duration-300 ease-in-out transform ${
            dragOverStatus === status 
              ? 'bg-brand-100 scale-105 shadow-lg ring-2 ring-brand-300 ring-opacity-50' 
              : 'hover:shadow-md'
          }`}
        >
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-2">
              <span className={`h-2 w-2 rounded-full ${statusConfig[status].color} transition-all duration-200`}></span>
              <h2 className="font-semibold text-slate-700">{statusConfig[status].title}</h2>
            </div>
            <span className={`text-sm font-medium rounded-full px-2 py-0.5 transition-all duration-200 ${
              dragOverStatus === status 
                ? 'bg-brand-200 text-brand-700' 
                : 'bg-slate-200 text-slate-600'
            }`}>
              {tasks.length}
            </span>
          </div>
          <div className="space-y-3 overflow-y-auto flex-1 min-h-[100px] scrollbar-thin scrollbar-thumb-slate-300 scrollbar-track-slate-100">
            {tasks.length > 0 ? (
              tasks.map(task => (
                <TaskCard
                  key={task.id}
                  task={task}
                  user={usersMap.get(task.assigneeId)}
                  onClick={() => onViewDetails(task)}
                  onDragStart={(e) => handleDragStart(e, task.id)}
                  onDragEnd={handleDragEnd}
                  isDragging={draggedTaskId === task.id}
                />
              ))
            ) : (
              <div className="text-center py-8 text-slate-500 text-sm transition-opacity duration-300">
                {dragOverStatus === status ? '✨ Drop here to move task' : 'No tasks here'}
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  );
};

export default TaskBoard;
