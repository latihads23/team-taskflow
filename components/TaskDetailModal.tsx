
import React, { useState, useEffect, useRef } from 'react';
import { Task, User, Priority, Status, Category } from '../types';
import { CloseIcon, EditIcon, TrashIcon, CalendarIcon, FlagIcon, UserIcon, BellIcon, ChevronDownIcon, SparklesIcon, RefreshCwIcon, TagIcon } from './Icons';
import { formatDueDate } from './TaskCard';

interface TaskDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  onEdit: () => void;
  onDelete: () => void;
  task: Task | null;
  user?: User;
  category?: Category;
  onStatusChange: (taskId: string, newStatus: Status) => void;
  onAskAI: (task: Task) => void;
}

const priorityConfig: { [key in Priority]: { bg: string; text: string; border: string } } = {
  [Priority.Low]: { bg: 'bg-green-100', text: 'text-green-800', border: 'border-green-200' },
  [Priority.Medium]: { bg: 'bg-yellow-100', text: 'text-yellow-800', border: 'border-yellow-200' },
  [Priority.High]: { bg: 'bg-orange-100', text: 'text-orange-800', border: 'border-orange-200' },
  [Priority.Urgent]: { bg: 'bg-red-100', text: 'text-red-800', border: 'border-red-200' },
};

const statusDisplayConfig: { [key in Status]: { bg: string; text: string; border: string; dot: string; } } = {
    [Status.ToDo]: { bg: 'bg-slate-100', text: 'text-slate-800', border: 'border-slate-200', dot: 'bg-slate-500' },
    [Status.InProgress]: { bg: 'bg-blue-100', text: 'text-blue-800', border: 'border-blue-200', dot: 'bg-blue-500' },
    [Status.Done]: { bg: 'bg-green-100', text: 'text-green-800', border: 'border-green-200', dot: 'bg-green-500' },
};

const DetailItem: React.FC<{ icon: React.ReactNode; label: string; children: React.ReactNode }> = ({ icon, label, children }) => (
    <div>
        <dt className="text-sm font-medium text-slate-500 flex items-center space-x-2">
            {icon}
            <span>{label}</span>
        </dt>
        <dd className="mt-1 text-sm text-slate-900">{children}</dd>
    </div>
);

const TaskDetailModal: React.FC<TaskDetailModalProps> = ({ isOpen, onClose, onEdit, onDelete, task, user, category, onStatusChange, onAskAI }) => {
  const [isStatusMenuOpen, setStatusMenuOpen] = useState(false);
  const statusMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (statusMenuRef.current && !statusMenuRef.current.contains(event.target as Node)) {
        setStatusMenuOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen]);

  if (!isOpen || !task) return null;

  const { text: dateText, color: dateColor } = formatDueDate(task.dueDate);
  const pConfig = priorityConfig[task.priority];
  const sCnfig = statusDisplayConfig[task.status];

  const handleDelete = () => {
    onDelete();
  }

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg transform transition-all" onClick={(e) => e.stopPropagation()}>
        <div className="p-6">
          <div className="flex justify-between items-start pb-4 border-b border-slate-200">
            <div>
                 <div className="relative inline-block text-left" ref={statusMenuRef}>
                    <button
                        type="button"
                        onClick={() => setStatusMenuOpen(!isStatusMenuOpen)}
                        className={`inline-flex items-center justify-center w-full px-3 py-1 text-xs font-semibold rounded-md ${sCnfig.bg} ${sCnfig.text} border ${sCnfig.border} focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-brand-500`}
                    >
                        {task.status}
                        <ChevronDownIcon className="w-4 h-4 ml-2 -mr-1" />
                    </button>

                    {isStatusMenuOpen && (
                        <div className="origin-top-left absolute left-0 mt-2 w-40 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5 z-10">
                            <div className="py-1" role="menu" aria-orientation="vertical">
                                {Object.values(Status).map(statusValue => (
                                    <button
                                        key={statusValue}
                                        onClick={() => {
                                            onStatusChange(task.id, statusValue);
                                            setStatusMenuOpen(false);
                                        }}
                                        className="w-full text-left flex items-center px-4 py-2 text-sm text-slate-700 hover:bg-slate-100"
                                        role="menuitem"
                                    >
                                        <span className={`h-2 w-2 rounded-full mr-3 ${statusDisplayConfig[statusValue].dot}`}></span>
                                        {statusValue}
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
                <h2 className="text-xl font-semibold text-slate-800 mt-2">{task.title}</h2>
            </div>
            <button type="button" onClick={onClose} className="p-2 rounded-full hover:bg-slate-100 text-slate-500">
              <CloseIcon className="h-5 w-5" />
            </button>
          </div>
          
          <div className="mt-6 space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <DetailItem icon={<UserIcon className="h-4 w-4" />} label="Assignee">
                    {user ? (
                        <div className="flex items-center space-x-2">
                            <img src={user.avatarUrl} alt={user.name} className="h-6 w-6 rounded-full" />
                            <span className="font-medium">{user.name}</span>
                        </div>
                    ) : (<span>Unassigned</span>)}
                </DetailItem>
                <DetailItem icon={<CalendarIcon className="h-4 w-4" />} label="Due Date">
                    <span className={`font-medium ${dateColor}`}>{dateText}</span>
                </DetailItem>
                <DetailItem icon={<FlagIcon className="h-4 w-4" />} label="Priority">
                    <span className={`inline-block px-2 py-0.5 text-xs font-medium rounded-full ${pConfig.bg} ${pConfig.text}`}>
                        {task.priority}
                    </span>
                </DetailItem>
                {category && (
                    <DetailItem icon={<TagIcon className="h-4 w-4" />} label="Category">
                        <div className="flex items-center space-x-2">
                            <span 
                                className="w-3 h-3 rounded-full flex-shrink-0" 
                                style={{ backgroundColor: category.color }}
                            ></span>
                            <span className="font-medium">{category.name}</span>
                        </div>
                    </DetailItem>
                )}
                 {task.reminderAt && (
                   <DetailItem icon={<BellIcon className="h-4 w-4" />} label="Reminder">
                        <span className="font-medium text-slate-800">
                            {new Date(task.reminderAt).toLocaleString(undefined, {
                                year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
                            })}
                        </span>
                    </DetailItem>
                )}
                {task.isRecurring && (
                    <DetailItem icon={<RefreshCwIcon className="h-4 w-4" />} label="Recurring">
                        <span className="font-medium text-slate-800 capitalize">
                            Repeats {task.recurrenceRule}
                            {task.recurrenceEndDate && ` until ${new Date(task.recurrenceEndDate + 'T00:00:00').toLocaleDateString()}`}
                        </span>
                    </DetailItem>
                )}
            </div>
            
            <div>
                <p className="text-sm text-slate-700 whitespace-pre-wrap break-words bg-slate-50 p-3 rounded-md border border-slate-200">
                    {task.description || <span className="text-slate-500">No description provided.</span>}
                </p>
            </div>
          </div>
        </div>
        
        <div className="bg-slate-50 px-6 py-4 rounded-b-xl flex justify-between items-center">
            <div>
                <button 
                    onClick={handleDelete}
                    className="flex items-center space-x-2 px-3 py-2 text-sm font-medium text-red-600 hover:bg-red-100 rounded-md transition-colors"
                >
                    <TrashIcon className="h-4 w-4" />
                    <span>Delete</span>
                </button>
            </div>
            <div className="flex items-center space-x-3">
                <button type="button" onClick={onClose} className="px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-md hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-500">Cancel</button>
                <button
                    onClick={() => onAskAI(task)}
                    className="inline-flex items-center space-x-2 px-4 py-2 text-sm font-medium text-brand-700 bg-brand-100 border border-transparent rounded-md hover:bg-brand-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-500"
                >
                    <SparklesIcon className="h-4 w-4" />
                    <span>Ask AI</span>
                </button>
                <button 
                    onClick={onEdit}
                    className="inline-flex items-center space-x-2 px-4 py-2 text-sm font-medium text-white bg-brand-600 border border-transparent rounded-md shadow-sm hover:bg-brand-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-500"
                >
                    <EditIcon className="h-4 w-4" />
                    <span>Edit Task</span>
                </button>
            </div>
        </div>
      </div>
    </div>
  );
};

export default TaskDetailModal;
