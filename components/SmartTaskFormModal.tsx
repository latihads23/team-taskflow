
import React, { useState } from 'react';
import { CloseIcon, SparklesIcon } from './Icons';

interface SmartTaskFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAdd: (prompt: string) => Promise<void>;
}

const SmartTaskFormModal: React.FC<SmartTaskFormModalProps> = ({ isOpen, onClose, onAdd }) => {
  const [prompt, setPrompt] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!prompt.trim()) return;

    setIsLoading(true);
    try {
      await onAdd(prompt);
      setPrompt('');
    } catch (error) {
      // Error is handled in App.tsx, this just resets loading state
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg transform transition-all" onClick={(e) => e.stopPropagation()}>
        <form onSubmit={handleSubmit}>
          <div className="p-6">
            <div className="flex justify-between items-center pb-4 border-b border-slate-200">
              <div className="flex items-center space-x-2">
                <SparklesIcon className="h-6 w-6 text-brand-600" />
                <h2 className="text-xl font-semibold text-slate-800">Smart Add Task</h2>
              </div>
              <button type="button" onClick={onClose} className="p-2 rounded-full hover:bg-slate-100 text-slate-500">
                <CloseIcon className="h-5 w-5" />
              </button>
            </div>
            <div className="mt-6">
              <label htmlFor="smart-prompt" className="block text-sm font-medium text-slate-700 mb-1">
                Describe the task in one sentence.
              </label>
              <textarea
                id="smart-prompt"
                name="smart-prompt"
                rows={4}
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder="e.g., Remind Alex to deploy the new feature to staging by next Friday, it's a high priority."
                className="w-full border-slate-300 rounded-md shadow-sm focus:ring-brand-500 focus:border-brand-500"
                disabled={isLoading}
              />
            </div>
          </div>
          <div className="bg-slate-50 px-6 py-4 rounded-b-xl flex justify-end space-x-3">
            <button type="button" onClick={onClose} disabled={isLoading} className="px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-md hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-500 disabled:opacity-50">
              Cancel
            </button>
            <button type="submit" disabled={isLoading || !prompt.trim()} className="px-4 py-2 text-sm font-medium text-white bg-brand-600 border border-transparent rounded-md shadow-sm hover:bg-brand-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-500 disabled:opacity-50 disabled:cursor-not-allowed flex items-center">
              {isLoading && (
                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
              )}
              {isLoading ? 'Creating...' : 'Add Task'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default SmartTaskFormModal;
