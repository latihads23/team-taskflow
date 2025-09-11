import React, { useState, useRef, useEffect } from 'react';
import { ViewType, User, Priority, AuthUser } from '../types';
import { AppIcon, CalendarIcon, LayoutGridIcon, SparklesIcon, ActivityIcon, FilterIcon } from './Icons';

interface HeaderProps {
  onAddTask: () => void;
  onAddSmartTask: () => void;
  currentView: ViewType;
  onViewChange: (view: ViewType) => void;
  onToggleActivityFeed: () => void;
  currentUser: User;
  onOpenProfile: () => void;
  // New props for filtering
  users: User[];
  filters: { assignees: string[]; priorities: Priority[] };
  onFilterChange: (type: 'assignees' | 'priorities', value: string) => void;
  onClearFilters: () => void;
  // Authentication props
  authUser: AuthUser;
  onLogout: () => void;
}

const Header: React.FC<HeaderProps> = ({ 
  onAddTask, 
  onAddSmartTask, 
  currentView, 
  onViewChange, 
  onToggleActivityFeed, 
  currentUser, 
  onOpenProfile,
  users,
  filters,
  onFilterChange,
  onClearFilters,
  authUser,
  onLogout,
}) => {
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const filterRef = useRef<HTMLDivElement>(null);
  const userMenuRef = useRef<HTMLDivElement>(null);

  const viewButtonClasses = (view: ViewType) => 
    `inline-flex items-center justify-center p-2 rounded-md transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-500 ${
      currentView === view 
        ? 'bg-brand-600 text-white shadow-inner' 
        : 'text-slate-500 hover:bg-slate-200'
    }`;
    
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (filterRef.current && !filterRef.current.contains(event.target as Node)) {
        setIsFilterOpen(false);
      }
      if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
        setIsUserMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);
  
  const areFiltersActive = filters.assignees.length > 0 || filters.priorities.length > 0;

  return (
    <header className="bg-white/80 backdrop-blur-lg border-b border-slate-200 sticky top-0 z-20">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center space-x-4">
            <div className="flex-shrink-0 flex items-center space-x-2 text-brand-600">
              <AppIcon className="h-8 w-8" />
              <span className="text-2xl font-bold text-slate-800">TaskFlow</span>
            </div>
            <div className="hidden md:flex items-center bg-slate-100 rounded-lg p-1">
                <button onClick={() => onViewChange(ViewType.Board)} className={viewButtonClasses(ViewType.Board)}>
                    <LayoutGridIcon className="h-5 w-5" />
                    <span className="ml-2 text-sm font-medium">Board</span>
                </button>
                <button onClick={() => onViewChange(ViewType.Calendar)} className={viewButtonClasses(ViewType.Calendar)}>
                    <CalendarIcon className="h-5 w-5" />
                    <span className="ml-2 text-sm font-medium">Calendar</span>
                </button>
                <button onClick={() => onViewChange(ViewType.TimeManagement)} className={viewButtonClasses(ViewType.TimeManagement)}>
                    ⏰
                    <span className="ml-2 text-sm font-medium">Time Mgmt</span>
                </button>
            </div>
          </div>
          <div className="flex items-center space-x-3">
            <div className="relative" ref={filterRef}>
              <button
                onClick={() => setIsFilterOpen(prev => !prev)}
                className={`relative hidden sm:inline-flex items-center justify-center px-4 py-2 border text-sm font-medium rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-500 transition-colors ${areFiltersActive ? 'bg-brand-100 text-brand-700 border-brand-200' : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-50'}`}
              >
                <FilterIcon className="h-5 w-5 mr-2" />
                Filter
                {areFiltersActive && <span className="absolute -top-1 -right-1 flex h-3 w-3"><span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-brand-400 opacity-75"></span><span className="relative inline-flex rounded-full h-3 w-3 bg-brand-500"></span></span>}
              </button>
              {isFilterOpen && (
                <div className="absolute right-0 mt-2 w-64 bg-white rounded-md shadow-lg ring-1 ring-black ring-opacity-5 z-30">
                  <div className="p-4 border-b border-slate-200 flex justify-between items-center">
                    <h3 className="text-sm font-semibold text-slate-900">Filter Tasks</h3>
                    {areFiltersActive && (
                      <button onClick={() => { onClearFilters(); setIsFilterOpen(false); }} className="text-xs font-medium text-brand-600 hover:text-brand-800">Clear All</button>
                    )}
                  </div>
                  <div className="p-4 space-y-4 max-h-80 overflow-y-auto">
                    <div>
                      <h4 className="text-xs font-semibold text-slate-500 mb-2">ASSIGNEE</h4>
                      <div className="space-y-2">
                        {users.map(user => (
                          <label key={user.id} className="flex items-center space-x-3 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={filters.assignees.includes(user.id)}
                              onChange={() => onFilterChange('assignees', user.id)}
                              className="h-4 w-4 rounded border-slate-300 text-brand-600 focus:ring-brand-500"
                            />
                            <span className="text-sm text-slate-700">{user.name}</span>
                          </label>
                        ))}
                      </div>
                    </div>
                    <div>
                      <h4 className="text-xs font-semibold text-slate-500 mb-2 mt-4">PRIORITY</h4>
                      <div className="space-y-2">
                        {Object.values(Priority).map(priority => (
                          <label key={priority} className="flex items-center space-x-3 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={filters.priorities.includes(priority)}
                              onChange={() => onFilterChange('priorities', priority)}
                              className="h-4 w-4 rounded border-slate-300 text-brand-600 focus:ring-brand-500"
                            />
                            <span className="text-sm text-slate-700">{priority}</span>
                          </label>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
             <button
              onClick={onAddSmartTask}
              className={`hidden sm:inline-flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-brand-700 bg-brand-100 hover:bg-brand-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-500 transition-all`}
            >
              <SparklesIcon className="h-5 w-5 mr-2" />
              Smart Add
            </button>
            <button
              onClick={onAddTask}
              className={`inline-flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-brand-600 hover:bg-brand-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-500 transition-all`}
            >
              Add Task
            </button>
             <div className="w-px h-6 bg-slate-200 hidden sm:block"></div>
             <button
              onClick={onToggleActivityFeed}
              className={`p-2 rounded-full text-slate-500 hover:bg-slate-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-500 transition-colors`}
              aria-label="Toggle activity feed"
            >
              <ActivityIcon className="h-5 w-5" />
            </button>
            <div className="relative" ref={userMenuRef}>
              <button 
                onClick={() => setIsUserMenuOpen(prev => !prev)}
                className={`w-9 h-9 rounded-full focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-500 ${
                  isUserMenuOpen ? 'ring-2 ring-brand-500' : ''
                }`}
                aria-label="Open user menu"
              >
                <img src={authUser.avatarUrl || currentUser.avatarUrl} alt={authUser.name} className="w-full h-full rounded-full object-cover" />
              </button>
              {isUserMenuOpen && (
                <div className="absolute right-0 mt-2 w-56 bg-white rounded-md shadow-lg ring-1 ring-black ring-opacity-5 z-30">
                  <div className="p-4 border-b border-slate-200">
                    <div className="flex items-center space-x-3">
                      <img src={authUser.avatarUrl || currentUser.avatarUrl} alt={authUser.name} className="w-10 h-10 rounded-full object-cover" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-slate-900 truncate">{authUser.name}</p>
                        <p className="text-xs text-slate-500 truncate">{authUser.email}</p>
                        {authUser.role && (
                          <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium mt-1 ${
                            authUser.role === 'admin' 
                              ? 'bg-red-100 text-red-800' 
                              : 'bg-green-100 text-green-800'
                          }`}>
                            {authUser.role}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="py-1">
                    <button
                      onClick={() => {
                        onOpenProfile();
                        setIsUserMenuOpen(false);
                      }}
                      className="w-full text-left px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 transition-colors flex items-center space-x-2"
                    >
                      <svg className="h-4 w-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                      </svg>
                      <span>Profile Settings</span>
                    </button>
                    <button
                      onClick={() => {
                        onLogout();
                        setIsUserMenuOpen(false);
                      }}
                      className="w-full text-left px-4 py-2 text-sm text-red-700 hover:bg-red-50 transition-colors flex items-center space-x-2"
                    >
                      <svg className="h-4 w-4 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                      </svg>
                      <span>Sign Out</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
