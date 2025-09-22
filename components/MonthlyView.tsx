
import React, { useState } from 'react';
import { Task, User, Priority, Category } from '../types';
import { ChevronLeftIcon, ChevronRightIcon } from './Icons';

interface MonthlyViewProps {
  tasks: Task[];
  usersMap: Map<string, User>;
  categoriesMap: Map<string, Category>;
  onViewDetails: (task: Task) => void;
}

const priorityColors: { [key in Priority]: string } = {
  [Priority.Low]: 'bg-green-500',
  [Priority.Medium]: 'bg-yellow-500',
  [Priority.High]: 'bg-orange-500',
  [Priority.Urgent]: 'bg-red-500',
};

const MonthlyView: React.FC<MonthlyViewProps> = ({ tasks, usersMap, categoriesMap, onViewDetails }) => {
  const [currentDate, setCurrentDate] = useState(new Date());

  const startOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
  const endOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);
  const startDate = new Date(startOfMonth);
  startDate.setDate(startDate.getDate() - startOfMonth.getDay());
  const endDate = new Date(endOfMonth);
  endDate.setDate(endDate.getDate() + (6 - endOfMonth.getDay()));

  const days = [];
  let day = new Date(startDate);
  while (day <= endDate) {
    days.push(new Date(day));
    day.setDate(day.getDate() + 1);
  }

  const handlePrevMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  };
  const handleNextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
  };
  
  const isToday = (date: Date) => {
    const today = new Date();
    return date.getDate() === today.getDate() &&
           date.getMonth() === today.getMonth() &&
           date.getFullYear() === today.getFullYear();
  };

  return (
    <div className="bg-white p-4 sm:p-6 rounded-xl shadow-sm border border-slate-200">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-slate-800">
          {currentDate.toLocaleString('default', { month: 'long', year: 'numeric' })}
        </h2>
        <div className="flex items-center space-x-2">
          <button onClick={handlePrevMonth} className="p-2 rounded-full hover:bg-slate-100 text-slate-500">
            <ChevronLeftIcon className="h-5 w-5" />
          </button>
          <button onClick={handleNextMonth} className="p-2 rounded-full hover:bg-slate-100 text-slate-500">
            <ChevronRightIcon className="h-5 w-5" />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-7 gap-px border-l border-t border-slate-200 bg-slate-200">
        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(dayName => (
          <div key={dayName} className="text-center py-2 text-xs font-semibold text-slate-600 bg-slate-50">
            {dayName}
          </div>
        ))}
        {days.map(d => {
          const dateString = d.toISOString().split('T')[0];
          const tasksForDay = tasks.filter(task => task.dueDate === dateString);
          return (
            <div
              key={d.toString()}
              className={`p-2 h-32 flex flex-col bg-white border-r border-b border-slate-200 ${d.getMonth() !== currentDate.getMonth() ? 'bg-slate-50' : ''}`}
            >
              <span className={`font-medium text-sm ${isToday(d) ? 'bg-brand-600 text-white rounded-full h-6 w-6 flex items-center justify-center' : 'text-slate-600'}`}>
                {d.getDate()}
              </span>
              <div className="mt-1 space-y-1 overflow-y-auto">
                {tasksForDay.map(task => {
                  const category = task.categoryId ? categoriesMap.get(task.categoryId) : undefined;
                  return (
                    <button 
                      key={task.id} 
                      onClick={() => onViewDetails(task)} 
                      className="w-full text-left text-xs p-1 rounded-md bg-slate-100 hover:bg-slate-200 flex flex-col space-y-0.5 truncate"
                    >
                      <div className="flex items-center space-x-1.5">
                        <div className={`h-1.5 w-1.5 rounded-full flex-shrink-0 ${priorityColors[task.priority]}`}></div>
                        <span className="truncate text-slate-700 font-medium">{task.title}</span>
                      </div>
                      {category && (
                        <div className="flex items-center space-x-1 ml-3">
                          <div 
                            className="w-1 h-1 rounded-full flex-shrink-0" 
                            style={{ backgroundColor: category.color }}
                          ></div>
                          <span className="truncate text-slate-500 text-xs">{category.name}</span>
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default MonthlyView;
