
import React, { useState } from 'react';
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

  const columns = Object.values(Status).map(status => ({
    status,
    tasks: tasks.filter(task => task.status === status)
  }));

  const handleDragStart = (e: React.DragEvent, taskId: string) => {
    e.dataTransfer.setData('taskId', taskId);
    setDraggedTaskId(taskId);
  };

  const handleDragEnd = () => {
    setDraggedTaskId(null);
    setDragOverStatus(null);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent, status: Status) => {
    e.preventDefault();
    const taskId = e.dataTransfer.getData('taskId');
    const task = tasks.find(t => t.id === taskId);
    if (task && task.status !== status) {
      onStatusChange(taskId, status);
    }
    setDraggedTaskId(null);
    setDragOverStatus(null);
  };

  const handleDragEnter = (status: Status) => {
    setDragOverStatus(status);
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      {columns.map(({ status, tasks }) => (
        <div 
          key={status}
          onDragOver={handleDragOver}
          onDrop={(e) => handleDrop(e, status)}
          onDragEnter={() => handleDragEnter(status)}
          className={`bg-slate-100 rounded-xl p-4 flex flex-col transition-colors duration-200 ${dragOverStatus === status ? 'bg-brand-100' : ''}`}
        >
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-2">
              <span className={`h-2 w-2 rounded-full ${statusConfig[status].color}`}></span>
              <h2 className="font-semibold text-slate-700">{statusConfig[status].title}</h2>
            </div>
            <span className="text-sm font-medium bg-slate-200 text-slate-600 rounded-full px-2 py-0.5">
              {tasks.length}
            </span>
          </div>
          <div className="space-y-4 overflow-y-auto flex-1 min-h-[100px]">
            {tasks.length > 0 ? (
              tasks
                .sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime())
                .map(task => (
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
              <div className="text-center py-8 text-slate-500 text-sm">No tasks here.</div>
            )}
          </div>
        </div>
      ))}
    </div>
  );
};

export default TaskBoard;
