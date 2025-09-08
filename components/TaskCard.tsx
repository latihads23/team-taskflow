
import React from 'react';
import { Task, User, Priority } from '../types';
import { RefreshCwIcon } from './Icons';

interface TaskCardProps {
  task: Task;
  user?: User;
  onClick: () => void;
  onDragStart: (e: React.DragEvent) => void;
  onDragEnd: () => void;
  isDragging: boolean;
}

const priorityConfig: { [key in Priority]: { dot: string; bg: string; text: string } } = {
  [Priority.Low]: { dot: 'bg-green-500', bg: 'bg-green-100', text: 'text-green-800' },
  [Priority.Medium]: { dot: 'bg-yellow-500', bg: 'bg-yellow-100', text: 'text-yellow-800' },
  [Priority.High]: { dot: 'bg-orange-500', bg: 'bg-orange-100', text: 'text-orange-800' },
  [Priority.Urgent]: { dot: 'bg-red-500', bg: 'bg-red-100', text: 'text-red-800' },
};

const dayDiff = (d1: Date, d2: Date): number => {
    const msPerDay = 1000 * 60 * 60 * 24;
    const utc1 = Date.UTC(d1.getFullYear(), d1.getMonth(), d1.getDate());
    const utc2 = Date.UTC(d2.getFullYear(), d2.getMonth(), d2.getDate());
    return Math.floor((utc2 - utc1) / msPerDay);
};

export const formatDueDate = (dateString: string) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0); 
    const dueDate = new Date(dateString + 'T00:00:00');

    const diff = dayDiff(today, dueDate);

    let text = '';
    let color = 'text-slate-500';

    if (diff < -1) {
        text = `${Math.abs(diff)} days ago`;
        color = 'text-red-600';
    } else if (diff === -1) {
        text = 'Yesterday';
        color = 'text-red-600';
    } else if (diff === 0) {
        text = 'Today';
        color = 'text-blue-600 font-semibold';
    } else if (diff === 1) {
        text = 'Tomorrow';
        color = 'text-blue-600';
    } else if (diff > 1 && diff <= 7) {
        text = `In ${diff} days`;
        color = 'text-slate-500';
    } else {
        text = dueDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
        color = 'text-slate-500';
    }
    
    return { text, color };
};

const TaskCard: React.FC<TaskCardProps> = ({ task, user, onClick, onDragStart, onDragEnd, isDragging }) => {
  const { title, description, dueDate, priority } = task;
  const config = priorityConfig[priority];
  const { text: dateText, color: dateColor } = formatDueDate(dueDate);

  return (
    <div
      draggable
      onDragStart={onDragStart}
      onDragEnd={onDragEnd}
      onClick={onClick}
      className={`w-full text-left bg-white rounded-lg shadow-sm border border-slate-200 p-4 space-y-3 hover:shadow-md hover:border-brand-300 focus:outline-none focus:ring-2 focus:ring-brand-500 transition-all duration-200 cursor-grab ${
        isDragging ? 'opacity-50 ring-2 ring-brand-500 ring-offset-2' : ''
      }`}
    >
      <div className="flex justify-between items-start">
        <h3 className="font-semibold text-slate-800 pr-2">{title}</h3>
         {task.isRecurring && <RefreshCwIcon className="h-4 w-4 text-slate-400 flex-shrink-0" title="Recurring Task"/>}
      </div>
      <p className="text-sm text-slate-600 line-clamp-2">{description}</p>
      <div className="flex justify-between items-center pt-2">
        <div className="flex items-center space-x-2">
          {user && (
            <img src={user.avatarUrl} alt={user.name} className="h-6 w-6 rounded-full ring-2 ring-white" />
          )}
          <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${config.bg} ${config.text}`}>
            {priority}
          </span>
        </div>
        <span className={`text-xs font-medium ${dateColor}`}>{dateText}</span>
      </div>
    </div>
  );
};

export default TaskCard;
