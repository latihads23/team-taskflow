
import React from 'react';
import { ActivityLog } from '../types';
import { CloseIcon, ActivityIcon } from './Icons';

interface ActivityFeedProps {
  isOpen: boolean;
  onClose: () => void;
  logs: ActivityLog[];
}

const formatTimeAgo = (isoString: string) => {
  const date = new Date(isoString);
  const now = new Date();
  const seconds = Math.round((now.getTime() - date.getTime()) / 1000);
  
  if (seconds < 60) return `${seconds}s ago`;
  const minutes = Math.round(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.round(hours / 24);
  return `${days}d ago`;
};

const ActivityFeed: React.FC<ActivityFeedProps> = ({ isOpen, onClose, logs }) => {
  return (
    <aside className={`fixed top-0 right-0 h-full bg-white border-l border-slate-200 shadow-lg z-30 w-full max-w-sm transform transition-transform duration-300 ease-in-out ${isOpen ? 'translate-x-0' : 'translate-x-full'}`}>
      <div className="flex flex-col h-full">
        <div className="flex items-center justify-between p-4 border-b border-slate-200">
          <div className="flex items-center space-x-2">
            <ActivityIcon className="h-6 w-6 text-brand-600" />
            <h2 className="text-lg font-semibold text-slate-800">Activity Feed</h2>
          </div>
          <button onClick={onClose} className="p-2 rounded-full hover:bg-slate-100 text-slate-500">
            <CloseIcon className="h-5 w-5" />
          </button>
        </div>
        
        <div className="flex-1 overflow-y-auto p-4">
          {logs.length > 0 ? (
            <ul className="space-y-4">
              {logs.map(log => (
                <li key={log.id} className="flex items-start space-x-3">
                  <div className="mt-1 h-2 w-2 rounded-full bg-slate-300 flex-shrink-0"></div>
                  <div>
                    <p className="text-sm text-slate-700">{log.message}</p>
                    <time className="text-xs text-slate-400">{formatTimeAgo(log.timestamp)}</time>
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <div className="text-center py-10 text-slate-500">
              <p>No recent activity.</p>
            </div>
          )}
        </div>
      </div>
    </aside>
  );
};

export default ActivityFeed;
