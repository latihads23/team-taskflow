// Browser Notification Service for Team TaskFlow
import { Task, Priority } from '../types';
import { formatDateTimeWIB, getCurrentWIBDate } from '../constants';

export interface NotificationOptions {
  title: string;
  body: string;
  icon?: string;
  tag?: string;
  requireInteraction?: boolean;
  data?: any;
}

export interface ScheduledNotification {
  id: string;
  taskId: string;
  title: string;
  body: string;
  scheduledTime: Date;
  type: 'reminder' | 'deadline' | 'overdue' | 'pomodoro' | 'activity';
  isActive: boolean;
  createdAt: Date;
}

class NotificationService {
  private permission: NotificationPermission = 'default';
  private scheduledNotifications: Map<string, ScheduledNotification> = new Map();
  private notificationTimers: Map<string, NodeJS.Timeout> = new Map();

  constructor() {
    this.initializeService();
  }

  // Initialize notification service
  private async initializeService() {
    if ('Notification' in window) {
      this.permission = Notification.permission;
      
      // Load scheduled notifications from localStorage
      this.loadScheduledNotifications();
      
      // Start notification scheduler
      this.startScheduler();
    }
  }

  // Request permission for notifications
  async requestPermission(): Promise<NotificationPermission> {
    if (!('Notification' in window)) {
      console.warn('Browser does not support notifications');
      return 'denied';
    }

    if (this.permission === 'default') {
      const permission = await Notification.requestPermission();
      this.permission = permission;
      return permission;
    }

    return this.permission;
  }

  // Check if notifications are supported and permitted
  isSupported(): boolean {
    return 'Notification' in window;
  }

  isPermissionGranted(): boolean {
    return this.permission === 'granted';
  }

  // Show immediate notification
  async showNotification(options: NotificationOptions): Promise<boolean> {
    if (!this.isSupported()) {
      console.warn('Notifications not supported');
      return false;
    }

    if (!this.isPermissionGranted()) {
      const permission = await this.requestPermission();
      if (permission !== 'granted') {
        console.warn('Notification permission denied');
        return false;
      }
    }

    try {
      const notification = new Notification(options.title, {
        body: options.body,
        icon: options.icon || '/favicon.ico',
        tag: options.tag,
        requireInteraction: options.requireInteraction || false,
        data: options.data
      });

      // Auto close after 5 seconds if not requiring interaction
      if (!options.requireInteraction) {
        setTimeout(() => {
          notification.close();
        }, 5000);
      }

      // Handle notification click
      notification.onclick = (event) => {
        window.focus();
        notification.close();
        
        // Handle specific actions based on data
        if (options.data?.taskId) {
          this.handleTaskNotificationClick(options.data.taskId);
        }
      };

      return true;
    } catch (error) {
      console.error('Failed to show notification:', error);
      return false;
    }
  }

  // Schedule notification for later
  scheduleNotification(
    id: string,
    taskId: string,
    title: string,
    body: string,
    scheduledTime: Date,
    type: ScheduledNotification['type'] = 'reminder'
  ): boolean {
    if (!this.isSupported()) {
      return false;
    }

    // Cancel existing notification with same ID
    this.cancelScheduledNotification(id);

    const scheduledNotif: ScheduledNotification = {
      id,
      taskId,
      title,
      body,
      scheduledTime,
      type,
      isActive: true,
      createdAt: getCurrentWIBDate()
    };

    this.scheduledNotifications.set(id, scheduledNotif);
    this.saveScheduledNotifications();

    // Calculate delay until scheduled time
    const now = getCurrentWIBDate().getTime();
    const delay = scheduledTime.getTime() - now;

    if (delay > 0) {
      const timer = setTimeout(() => {
        this.showScheduledNotification(id);
      }, delay);

      this.notificationTimers.set(id, timer);
      return true;
    } else {
      // Time has passed, remove the notification
      this.scheduledNotifications.delete(id);
      this.saveScheduledNotifications();
      return false;
    }
  }

  // Show a scheduled notification
  private async showScheduledNotification(id: string) {
    const scheduledNotif = this.scheduledNotifications.get(id);
    if (!scheduledNotif || !scheduledNotif.isActive) {
      return;
    }

    const success = await this.showNotification({
      title: scheduledNotif.title,
      body: scheduledNotif.body,
      tag: `scheduled-${id}`,
      requireInteraction: scheduledNotif.type === 'deadline' || scheduledNotif.type === 'overdue',
      data: { taskId: scheduledNotif.taskId, type: scheduledNotif.type }
    });

    if (success) {
      // Remove from scheduled notifications after showing
      this.scheduledNotifications.delete(id);
      this.notificationTimers.delete(id);
      this.saveScheduledNotifications();
    }
  }

  // Cancel scheduled notification
  cancelScheduledNotification(id: string): boolean {
    const timer = this.notificationTimers.get(id);
    if (timer) {
      clearTimeout(timer);
      this.notificationTimers.delete(id);
    }

    const existed = this.scheduledNotifications.has(id);
    this.scheduledNotifications.delete(id);
    this.saveScheduledNotifications();
    
    return existed;
  }

  // Task-specific notification methods
  async notifyTaskDeadline(task: Task): Promise<boolean> {
    const dueDate = new Date(task.dueDate + 'T23:59:59');
    const timeUntilDue = dueDate.getTime() - getCurrentWIBDate().getTime();
    const hoursUntilDue = Math.ceil(timeUntilDue / (1000 * 60 * 60));

    let urgencyEmoji = '⏰';
    let requireInteraction = false;

    if (hoursUntilDue <= 0) {
      urgencyEmoji = '🚨';
      requireInteraction = true;
    } else if (hoursUntilDue <= 24) {
      urgencyEmoji = '⚠️';
      requireInteraction = true;
    }

    return this.showNotification({
      title: `${urgencyEmoji} Task Deadline Reminder`,
      body: `"${task.title}" - Due: ${formatDateTimeWIB(task.dueDate)}`,
      tag: `deadline-${task.id}`,
      requireInteraction,
      data: { taskId: task.id, type: 'deadline' }
    });
  }

  async notifyTaskCompleted(task: Task): Promise<boolean> {
    return this.showNotification({
      title: '🎉 Task Completed!',
      body: `Great job finishing "${task.title}"!`,
      tag: `completed-${task.id}`,
      data: { taskId: task.id, type: 'completion' }
    });
  }

  async notifyTaskAssigned(task: Task, assigneeName: string): Promise<boolean> {
    return this.showNotification({
      title: '📝 New Task Assigned',
      body: `"${task.title}" has been assigned to ${assigneeName}`,
      tag: `assigned-${task.id}`,
      data: { taskId: task.id, type: 'assignment' }
    });
  }

  async notifyPomodoroComplete(taskTitle?: string): Promise<boolean> {
    return this.showNotification({
      title: '🍅 Pomodoro Complete!',
      body: taskTitle ? `Well done on "${taskTitle}"! Time for a break.` : 'Time for a break! Great focus session.',
      tag: 'pomodoro-complete',
      data: { type: 'pomodoro' }
    });
  }

  async notifyEatThatFrog(task: Task): Promise<boolean> {
    return this.showNotification({
      title: '🐸 Eat That Frog Reminder!',
      body: `Time to tackle your most important task: "${task.title}"`,
      tag: `frog-${task.id}`,
      requireInteraction: true,
      data: { taskId: task.id, type: 'eat-frog' }
    });
  }

  // Schedule task reminders based on priority and due date
  scheduleTaskReminders(task: Task) {
    const dueDate = new Date(task.dueDate + 'T09:00:00'); // 9 AM on due date
    const now = getCurrentWIBDate();

    // Schedule reminders based on priority
    const reminderTimes: { hours: number; label: string }[] = [];

    switch (task.priority) {
      case Priority.Urgent:
        reminderTimes.push(
          { hours: 48, label: '2 days before' },
          { hours: 24, label: '1 day before' },
          { hours: 4, label: '4 hours before' },
          { hours: 1, label: '1 hour before' }
        );
        break;
      case Priority.High:
        reminderTimes.push(
          { hours: 48, label: '2 days before' },
          { hours: 24, label: '1 day before' },
          { hours: 4, label: '4 hours before' }
        );
        break;
      case Priority.Medium:
        reminderTimes.push(
          { hours: 24, label: '1 day before' },
          { hours: 4, label: '4 hours before' }
        );
        break;
      case Priority.Low:
        reminderTimes.push(
          { hours: 24, label: '1 day before' }
        );
        break;
    }

    // Schedule each reminder
    reminderTimes.forEach(({ hours, label }) => {
      const reminderTime = new Date(dueDate.getTime() - (hours * 60 * 60 * 1000));
      
      if (reminderTime > now) {
        const reminderId = `task-reminder-${task.id}-${hours}h`;
        this.scheduleNotification(
          reminderId,
          task.id,
          `⏰ Task Reminder (${label})`,
          `"${task.title}" is due ${formatDateTimeWIB(task.dueDate)}`,
          reminderTime,
          'reminder'
        );
      }
    });
  }

  // Handle notification click actions
  private handleTaskNotificationClick(taskId: string) {
    // Dispatch custom event that App.tsx can listen to
    window.dispatchEvent(new CustomEvent('notificationTaskClick', {
      detail: { taskId }
    }));
  }

  // Start the notification scheduler
  private startScheduler() {
    // Check for due notifications every minute
    setInterval(() => {
      this.checkScheduledNotifications();
    }, 60000);
  }

  // Check and show due scheduled notifications
  private checkScheduledNotifications() {
    const now = getCurrentWIBDate().getTime();
    
    this.scheduledNotifications.forEach((notification, id) => {
      if (notification.isActive && notification.scheduledTime.getTime() <= now) {
        this.showScheduledNotification(id);
      }
    });
  }

  // Persistence methods
  private saveScheduledNotifications() {
    const notifications = Array.from(this.scheduledNotifications.entries()).map(([id, notif]) => [
      id,
      {
        ...notif,
        scheduledTime: notif.scheduledTime.toISOString(),
        createdAt: notif.createdAt.toISOString()
      }
    ]);
    
    localStorage.setItem('teamTaskFlow_scheduledNotifications', JSON.stringify(notifications));
  }

  private loadScheduledNotifications() {
    try {
      const saved = localStorage.getItem('teamTaskFlow_scheduledNotifications');
      if (saved) {
        const notifications = JSON.parse(saved);
        notifications.forEach(([id, notif]: [string, any]) => {
          const scheduledNotif: ScheduledNotification = {
            ...notif,
            scheduledTime: new Date(notif.scheduledTime),
            createdAt: new Date(notif.createdAt)
          };
          
          // Only load future notifications
          if (scheduledNotif.scheduledTime > getCurrentWIBDate()) {
            this.scheduledNotifications.set(id, scheduledNotif);
            
            // Reschedule the timer
            const delay = scheduledNotif.scheduledTime.getTime() - getCurrentWIBDate().getTime();
            if (delay > 0) {
              const timer = setTimeout(() => {
                this.showScheduledNotification(id);
              }, delay);
              this.notificationTimers.set(id, timer);
            }
          }
        });
      }
    } catch (error) {
      console.error('Failed to load scheduled notifications:', error);
    }
  }

  // Get notification settings/status
  getNotificationStatus() {
    return {
      supported: this.isSupported(),
      permission: this.permission,
      scheduledCount: this.scheduledNotifications.size
    };
  }

  // Clear all notifications
  clearAllNotifications() {
    // Clear all timers
    this.notificationTimers.forEach(timer => clearTimeout(timer));
    this.notificationTimers.clear();
    
    // Clear scheduled notifications
    this.scheduledNotifications.clear();
    this.saveScheduledNotifications();
  }
}

// Export singleton instance
export const notificationService = new NotificationService();
export default notificationService;