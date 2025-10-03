import React, { useState, useEffect } from 'react';
import { BellIcon, BellSlashIcon, CheckCircleIcon, ExclamationTriangleIcon } from './Icons';
import notificationService from '../services/notificationService';

interface NotificationSettingsProps {
  isOpen: boolean;
  onClose: () => void;
}

interface NotificationStatus {
  supported: boolean;
  permission: NotificationPermission;
  scheduledCount: number;
}

const NotificationSettings: React.FC<NotificationSettingsProps> = ({ isOpen, onClose }) => {
  const [status, setStatus] = useState<NotificationStatus>({ 
    supported: false, 
    permission: 'default', 
    scheduledCount: 0 
  });
  const [isRequesting, setIsRequesting] = useState(false);

  // Load notification status
  useEffect(() => {
    if (isOpen) {
      const currentStatus = notificationService.getNotificationStatus();
      setStatus(currentStatus);
    }
  }, [isOpen]);

  const handleRequestPermission = async () => {
    setIsRequesting(true);
    try {
      const permission = await notificationService.requestPermission();
      setStatus(prev => ({ ...prev, permission }));
      
      if (permission === 'granted') {
        // Test notification
        await notificationService.showNotification({
          title: '🔔 Notifications Enabled!',
          body: 'You\'ll now receive reminders for your tasks and deadlines.',
          tag: 'notification-test'
        });
      }
    } catch (error) {
      console.error('Failed to request notification permission:', error);
    } finally {
      setIsRequesting(false);
    }
  };

  const handleTestNotification = async () => {
    const success = await notificationService.showNotification({
      title: '🧪 Test Notification',
      body: 'This is a test notification from Team TaskFlow!',
      tag: 'test-notification'
    });
    
    if (!success) {
      alert('Failed to show notification. Please check your browser settings.');
    }
  };

  const handleClearAllNotifications = () => {
    notificationService.clearAllNotifications();
    setStatus(prev => ({ ...prev, scheduledCount: 0 }));
  };

  const getPermissionStatus = () => {
    switch (status.permission) {
      case 'granted':
        return {
          icon: <CheckCircleIcon className="h-5 w-5 text-green-500" />,
          text: 'Enabled',
          color: 'text-green-600',
          bgColor: 'bg-green-50'
        };
      case 'denied':
        return {
          icon: <BellSlashIcon className="h-5 w-5 text-red-500" />,
          text: 'Blocked',
          color: 'text-red-600',
          bgColor: 'bg-red-50'
        };
      default:
        return {
          icon: <ExclamationTriangleIcon className="h-5 w-5 text-yellow-500" />,
          text: 'Not Set',
          color: 'text-yellow-600',
          bgColor: 'bg-yellow-50'
        };
    }
  };

  const permissionStatus = getPermissionStatus();

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl max-w-md w-full max-h-[80vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center space-x-2">
            <BellIcon className="h-6 w-6 text-blue-600" />
            <h2 className="text-xl font-semibold text-gray-800">Notification Settings</h2>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Browser Support Status */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium text-gray-800">Browser Support</h3>
            <div className={`p-4 rounded-lg ${status.supported ? 'bg-green-50' : 'bg-red-50'}`}>
              <div className="flex items-center space-x-2">
                {status.supported ? (
                  <CheckCircleIcon className="h-5 w-5 text-green-500" />
                ) : (
                  <ExclamationTriangleIcon className="h-5 w-5 text-red-500" />
                )}
                <span className={`font-medium ${status.supported ? 'text-green-600' : 'text-red-600'}`}>
                  {status.supported ? 'Browser notifications supported' : 'Browser notifications not supported'}
                </span>
              </div>
            </div>
          </div>

          {status.supported && (
            <>
              {/* Permission Status */}
              <div className="space-y-4">
                <h3 className="text-lg font-medium text-gray-800">Permission Status</h3>
                <div className={`p-4 rounded-lg ${permissionStatus.bgColor}`}>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      {permissionStatus.icon}
                      <span className={`font-medium ${permissionStatus.color}`}>
                        {permissionStatus.text}
                      </span>
                    </div>
                    {status.permission !== 'granted' && (
                      <button
                        onClick={handleRequestPermission}
                        disabled={isRequesting || status.permission === 'denied'}
                        className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
                          status.permission === 'denied'
                            ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                            : 'bg-blue-600 text-white hover:bg-blue-700'
                        }`}
                      >
                        {isRequesting ? 'Requesting...' : 'Enable Notifications'}
                      </button>
                    )}
                  </div>
                </div>
                
                {status.permission === 'denied' && (
                  <div className="text-sm text-gray-600 bg-gray-50 p-3 rounded-lg">
                    <p>Notifications are blocked. To enable:</p>
                    <ol className="list-decimal list-inside mt-2 space-y-1">
                      <li>Click the lock icon in your browser's address bar</li>
                      <li>Select "Allow" for notifications</li>
                      <li>Refresh this page</li>
                    </ol>
                  </div>
                )}
              </div>

              {/* Scheduled Notifications */}
              {status.permission === 'granted' && (
                <div className="space-y-4">
                  <h3 className="text-lg font-medium text-gray-800">Active Notifications</h3>
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-700">
                          Scheduled Reminders: {status.scheduledCount}
                        </p>
                        <p className="text-xs text-gray-500 mt-1">
                          Task reminders and deadline notifications
                        </p>
                      </div>
                      {status.scheduledCount > 0 && (
                        <button
                          onClick={handleClearAllNotifications}
                          className="px-3 py-1 text-sm text-red-600 hover:text-red-700 hover:bg-red-50 rounded-md transition-colors"
                        >
                          Clear All
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* Test Notification */}
              {status.permission === 'granted' && (
                <div className="space-y-4">
                  <h3 className="text-lg font-medium text-gray-800">Test Notification</h3>
                  <button
                    onClick={handleTestNotification}
                    className="w-full bg-blue-50 text-blue-600 border border-blue-200 px-4 py-3 rounded-lg hover:bg-blue-100 transition-colors"
                  >
                    Send Test Notification
                  </button>
                </div>
              )}

              {/* Notification Types */}
              <div className="space-y-4">
                <h3 className="text-lg font-medium text-gray-800">Notification Types</h3>
                <div className="grid grid-cols-1 gap-3">
                  {[
                    { icon: '⏰', title: 'Task Reminders', desc: 'Reminders based on task priority' },
                    { icon: '🚨', title: 'Deadline Alerts', desc: 'Urgent notifications for due tasks' },
                    { icon: '🎉', title: 'Completion', desc: 'Celebrate when tasks are done' },
                    { icon: '🍅', title: 'Pomodoro', desc: 'Timer completion notifications' },
                    { icon: '🐸', title: 'Eat That Frog', desc: 'Most important task reminders' }
                  ].map((type, index) => (
                    <div key={index} className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                      <span className="text-xl">{type.icon}</span>
                      <div>
                        <p className="text-sm font-medium text-gray-700">{type.title}</p>
                        <p className="text-xs text-gray-500">{type.desc}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}
        </div>

        {/* Footer */}
        <div className="flex justify-end p-6 border-t border-gray-200">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default NotificationSettings;