
import React, { useState, useEffect } from 'react';
import { Task, User, Priority, Status } from '../types';
import { CloseIcon, RefreshCwIcon } from './Icons';

interface TaskFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (task: Omit<Task, 'id'> | Task) => void;
  users: User[];
  task: Task | null;
}

type RecurrenceRule = 'daily' | 'weekly' | 'monthly';

const TaskFormModal: React.FC<TaskFormModalProps> = ({ isOpen, onClose, onSave, users, task }) => {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    assigneeId: '',
    dueDate: '',
    priority: Priority.Medium,
    status: Status.ToDo,
  });
  
  const [isReminderEnabled, setIsReminderEnabled] = useState(false);
  const [reminderDate, setReminderDate] = useState('');
  const [reminderTime, setReminderTime] = useState('09:00');

  const [isRecurring, setIsRecurring] = useState(false);
  const [recurrenceRule, setRecurrenceRule] = useState<RecurrenceRule>('weekly');
  const [recurrenceEndDate, setRecurrenceEndDate] = useState('');


  useEffect(() => {
    const today = new Date().toISOString().split('T')[0];
    let oneYearFromNow = new Date();
    oneYearFromNow.setFullYear(oneYearFromNow.getFullYear() + 1);
    const defaultEndDate = oneYearFromNow.toISOString().split('T')[0];

    if (task) {
      setFormData({
        title: task.title,
        description: task.description,
        assigneeId: task.assigneeId,
        dueDate: task.dueDate,
        priority: task.priority,
        status: task.status,
      });
      // Reminder State
      if (task.reminderAt) {
        const reminder = new Date(task.reminderAt);
        setIsReminderEnabled(true);
        setReminderDate(reminder.toISOString().split('T')[0]);
        setReminderTime(reminder.toTimeString().slice(0, 5));
      } else {
        setIsReminderEnabled(false);
        setReminderDate(task.dueDate || today);
      }
      // Recurrence State
      setIsRecurring(task.isRecurring || false);
      setRecurrenceRule(task.recurrenceRule || 'weekly');
      setRecurrenceEndDate(task.recurrenceEndDate || '');

    } else {
      setFormData({
        title: '',
        description: '',
        assigneeId: users[0]?.id || '',
        dueDate: today,
        priority: Priority.Medium,
        status: Status.ToDo,
      });
      setIsReminderEnabled(false);
      setReminderDate(today);
      setIsRecurring(false);
      setRecurrenceRule('weekly');
      setRecurrenceEndDate('');
    }
  }, [task, users]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const taskData: Omit<Task, 'id'> | Task = {
        ...formData,
        reminderAt: isReminderEnabled && reminderDate && reminderTime 
            ? new Date(`${reminderDate}T${reminderTime}`).toISOString() 
            : undefined,
        isRecurring: isRecurring,
        recurrenceRule: isRecurring ? recurrenceRule : undefined,
        recurrenceEndDate: isRecurring && recurrenceEndDate ? recurrenceEndDate : undefined,
    };

    if (task) {
      onSave({ ...task, ...taskData });
    } else {
      onSave(taskData);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg transform transition-all" onClick={(e) => e.stopPropagation()}>
        <form onSubmit={handleSubmit}>
          <div className="p-6 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center pb-4 border-b border-slate-200">
              <h2 className="text-xl font-semibold text-slate-800">{task ? 'Edit Task' : 'Create Task'}</h2>
              <button type="button" onClick={onClose} className="p-2 rounded-full hover:bg-slate-100 text-slate-500">
                <CloseIcon className="h-5 w-5" />
              </button>
            </div>
            <div className="mt-6 space-y-4">
              <div>
                <label htmlFor="title" className="block text-sm font-medium text-slate-700 mb-1">Title</label>
                <input type="text" name="title" id="title" value={formData.title} onChange={handleChange} required className="w-full border-slate-300 rounded-md shadow-sm focus:ring-brand-500 focus:border-brand-500" />
              </div>
              <div>
                <label htmlFor="description" className="block text-sm font-medium text-slate-700 mb-1">Description</label>
                <textarea name="description" id="description" value={formData.description} onChange={handleChange} rows={3} className="w-full border-slate-300 rounded-md shadow-sm focus:ring-brand-500 focus:border-brand-500"></textarea>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                    <label htmlFor="assigneeId" className="block text-sm font-medium text-slate-700 mb-1">Assignee</label>
                    <select name="assigneeId" id="assigneeId" value={formData.assigneeId} onChange={handleChange} className="w-full border-slate-300 rounded-md shadow-sm focus:ring-brand-500 focus:border-brand-500">
                        {users.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
                    </select>
                </div>
                 <div>
                    <label htmlFor="dueDate" className="block text-sm font-medium text-slate-700 mb-1">Due Date</label>
                    <input type="date" name="dueDate" id="dueDate" value={formData.dueDate} onChange={handleChange} required className="w-full border-slate-300 rounded-md shadow-sm focus:ring-brand-500 focus:border-brand-500" />
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                 <div>
                    <label htmlFor="priority" className="block text-sm font-medium text-slate-700 mb-1">Priority</label>
                    <select name="priority" id="priority" value={formData.priority} onChange={handleChange} className="w-full border-slate-300 rounded-md shadow-sm focus:ring-brand-500 focus:border-brand-500">
                        {Object.values(Priority).map(p => <option key={p} value={p}>{p}</option>)}
                    </select>
                </div>
                <div>
                    <label htmlFor="status" className="block text-sm font-medium text-slate-700 mb-1">Status</label>
                    <select name="status" id="status" value={formData.status} onChange={handleChange} className="w-full border-slate-300 rounded-md shadow-sm focus:ring-brand-500 focus:border-brand-500">
                        {Object.values(Status).map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                </div>
              </div>

              {/* Recurring Task Section */}
               <div className="bg-slate-50 p-4 rounded-md border border-slate-200">
                <div className="flex items-center">
                  <input
                    id="recurring"
                    name="recurring"
                    type="checkbox"
                    checked={isRecurring}
                    onChange={(e) => setIsRecurring(e.target.checked)}
                    className="h-4 w-4 rounded border-slate-300 text-brand-600 focus:ring-brand-500"
                    disabled={!!task} // Disable changing recurrence for existing tasks for simplicity
                  />
                  <label htmlFor="recurring" className="ml-3 block text-sm font-medium text-slate-700">
                    Set Recurrence {task ? <span className="text-xs text-slate-400">(Cannot change on existing task)</span> : ''}
                  </label>
                </div>
                {isRecurring && (
                  <div className="mt-4 grid grid-cols-2 gap-4">
                     <div>
                        <label htmlFor="recurrenceRule" className="block text-xs font-medium text-slate-600 mb-1">Repeats</label>
                        <select id="recurrenceRule" value={recurrenceRule} onChange={(e) => setRecurrenceRule(e.target.value as RecurrenceRule)} className="w-full text-sm border-slate-300 rounded-md shadow-sm focus:ring-brand-500 focus:border-brand-500" disabled={!!task}>
                          <option value="daily">Daily</option>
                          <option value="weekly">Weekly</option>
                          <option value="monthly">Monthly</option>
                        </select>
                     </div>
                     <div>
                        <label htmlFor="recurrenceEndDate" className="block text-xs font-medium text-slate-600 mb-1">End Date (Optional)</label>
                        <input type="date" id="recurrenceEndDate" value={recurrenceEndDate} onChange={(e) => setRecurrenceEndDate(e.target.value)} className="w-full text-sm border-slate-300 rounded-md shadow-sm focus:ring-brand-500 focus:border-brand-500" disabled={!!task}/>
                     </div>
                  </div>
                )}
              </div>
              
              <div className="bg-slate-50 p-4 rounded-md border border-slate-200">
                <div className="flex items-center">
                  <input
                    id="reminder"
                    name="reminder"
                    type="checkbox"
                    checked={isReminderEnabled}
                    onChange={(e) => setIsReminderEnabled(e.target.checked)}
                    className="h-4 w-4 rounded border-slate-300 text-brand-600 focus:ring-brand-500"
                  />
                  <label htmlFor="reminder" className="ml-3 block text-sm font-medium text-slate-700">Set Reminder</label>
                </div>
                {isReminderEnabled && (
                  <div className="mt-4 grid grid-cols-2 gap-4">
                     <div>
                        <label htmlFor="reminderDate" className="block text-xs font-medium text-slate-600 mb-1">Date</label>
                        <input type="date" id="reminderDate" value={reminderDate} onChange={(e) => setReminderDate(e.target.value)} className="w-full text-sm border-slate-300 rounded-md shadow-sm focus:ring-brand-500 focus:border-brand-500"/>
                     </div>
                     <div>
                        <label htmlFor="reminderTime" className="block text-xs font-medium text-slate-600 mb-1">Time</label>
                        <input type="time" id="reminderTime" value={reminderTime} onChange={(e) => setReminderTime(e.target.value)} className="w-full text-sm border-slate-300 rounded-md shadow-sm focus:ring-brand-500 focus:border-brand-500"/>
                     </div>
                  </div>
                )}
              </div>
            </div>
          </div>
          <div className="bg-slate-50 px-6 py-4 rounded-b-xl flex justify-end space-x-3">
            <button type="button" onClick={onClose} className="px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-md hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-500">Cancel</button>
            <button type="submit" className="px-4 py-2 text-sm font-medium text-white bg-brand-600 border border-transparent rounded-md shadow-sm hover:bg-brand-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-500">{task ? 'Save Changes' : 'Create Task'}</button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default TaskFormModal;
