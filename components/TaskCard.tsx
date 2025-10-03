
import React from 'react';
import { Task, User, Priority, Category } from '../types';
import { RefreshCwIcon } from './Icons';
import { formatDateWIB, TIMEZONE, getCurrentWIBDate } from '../constants';

interface TaskCardProps {
  task: Task;
  user?: User;
  category?: Category;
  categories: Category[]; // All categories for hierarchy lookup
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
    const today = getCurrentWIBDate();
    today.setHours(0, 0, 0, 0); 
    const dueDate = new Date(dateString + 'T00:00:00');
    dueDate.setHours(0, 0, 0, 0);

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
        text = dueDate.toLocaleDateString('id-ID', { 
            timeZone: TIMEZONE,
            month: 'short', 
            day: 'numeric' 
        });
        color = 'text-slate-500';
    }
    
    return { text, color };
};

const TaskCard: React.FC<TaskCardProps> = React.memo(({ task, user, category, categories, onClick, onDragStart, onDragEnd, isDragging }) => {
  const { title, description, dueDate, priority } = task;
  const config = priorityConfig[priority];
  const { text: dateText, color: dateColor } = React.useMemo(() => formatDueDate(dueDate), [dueDate]);

  // Helper functions untuk hierarchy
  const getMainCategory = (categoryId: string): Category | undefined => {
    const cat = categories.find(c => c.id === categoryId);
    if (!cat) return undefined;
    
    if (cat.type === 'main') return cat;
    if (cat.parentId) {
      return categories.find(c => c.id === cat.parentId);
    }
    return undefined;
  };
  
  const getSubCategory = (categoryId: string): Category | undefined => {
    const cat = categories.find(c => c.id === categoryId);
    return cat?.type === 'sub' ? cat : undefined;
  };
  
  const mainCategory = category ? getMainCategory(category.id) : undefined;
  const subCategory = category ? getSubCategory(category.id) : undefined;
  const displayCategory = subCategory || category; // Show subcategory first, fallback to category

  const handleClick = React.useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    onClick();
  }, [onClick]);

  const handleDragStart = React.useCallback((e: React.DragEvent) => {
    e.stopPropagation();
    onDragStart(e);
  }, [onDragStart]);

  // Convert hex to rgba with opacity
  const hexToRgba = (hex: string, opacity: number) => {
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    return `rgba(${r}, ${g}, ${b}, ${opacity})`;
  };

  // Main category background style
  const cardStyle = mainCategory ? {
    background: `linear-gradient(135deg, ${hexToRgba(mainCategory.color, 0.08)} 0%, ${hexToRgba(mainCategory.color, 0.02)} 100%)`,
    borderColor: hexToRgba(mainCategory.color, 0.2)
  } : {};

  return (
    <div
      draggable
      onDragStart={handleDragStart}
      onDragEnd={onDragEnd}
      onClick={handleClick}
      style={cardStyle}
      className={`w-full text-left bg-white rounded-lg shadow-sm border-2 p-4 space-y-3 hover:shadow-md focus:outline-none focus:ring-2 focus:ring-brand-500 transition-all duration-300 cursor-grab transform ${
        isDragging 
          ? 'opacity-70 ring-2 ring-brand-400 ring-offset-2 scale-105 rotate-2 shadow-xl z-50' 
          : 'hover:scale-102 active:scale-98 hover:shadow-lg'
      } ${
        mainCategory ? 'border-opacity-30' : 'border-slate-200 hover:border-brand-300'
      }`}
    >
      {/* Main category strip at top if exists */}
      {mainCategory && (
        <div 
          className="-mx-4 -mt-4 mb-3 px-4 py-2 rounded-t-lg flex items-center space-x-2"
          style={{ backgroundColor: hexToRgba(mainCategory.color, 0.15) }}
        >
          {mainCategory.icon && (
            <span className="text-sm">{mainCategory.icon}</span>
          )}
          <span className="text-xs font-semibold" style={{ color: mainCategory.color }}>
            {mainCategory.name}
          </span>
        </div>
      )}
      
      <div className="flex justify-between items-start">
        <div className="flex-1 pr-2">
          <h3 className="font-semibold text-slate-800 mb-1">{title}</h3>
          {displayCategory && (
            <div className="flex items-center space-x-1 mb-1">
              {displayCategory.icon && (
                <span className="text-xs">{displayCategory.icon}</span>
              )}
              <span 
                className="w-2 h-2 rounded-full flex-shrink-0" 
                style={{ backgroundColor: displayCategory.color }}
              ></span>
              <span className="text-xs text-slate-600 font-medium">{displayCategory.name}</span>
              {subCategory && mainCategory && (
                <span className="text-xs text-slate-400">• {mainCategory.name}</span>
              )}
            </div>
          )}
        </div>
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
}, (prevProps, nextProps) => {
  // Custom comparison for better performance
  return (
    prevProps.task.id === nextProps.task.id &&
    prevProps.task.title === nextProps.task.title &&
    prevProps.task.description === nextProps.task.description &&
    prevProps.task.dueDate === nextProps.task.dueDate &&
    prevProps.task.priority === nextProps.task.priority &&
    prevProps.task.status === nextProps.task.status &&
    prevProps.task.categoryId === nextProps.task.categoryId &&
    prevProps.isDragging === nextProps.isDragging &&
    prevProps.user?.id === nextProps.user?.id &&
    prevProps.category?.id === nextProps.category?.id &&
    prevProps.categories.length === nextProps.categories.length
  );
});

TaskCard.displayName = 'TaskCard';

export default TaskCard;
