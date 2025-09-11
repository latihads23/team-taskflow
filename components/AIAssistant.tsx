
import React, { useState, useRef, useEffect, useCallback } from 'react';
import { ChatMessage, Task } from '../types';
import { RobotIcon, CloseIcon, SendIcon, RefreshCwIcon, CopyIcon, CheckIcon } from './Icons';

interface AIAssistantProps {
  history: ChatMessage[];
  onSendMessage: (message: string) => void;
  isLoading: boolean;
  onClearChat: () => void;
  isOpen: boolean;
  onVisibilityChange: (isOpen: boolean) => void;
  taskContext: Task | null;
  onSummarizeTask: () => void;
}

const AIAssistant: React.FC<AIAssistantProps> = ({ 
  history, 
  onSendMessage, 
  isLoading, 
  onClearChat,
  isOpen,
  onVisibilityChange,
  taskContext,
  onSummarizeTask
}) => {
  const [position, setPosition] = useState(() => {
    // Smart initial positioning
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;
    const margin = 20;
    
    return {
      x: viewportWidth - 80 - margin, // 80 = button width + margin
      y: viewportHeight - 80 - margin  // 80 = button height + margin
    };
  });
  const [message, setMessage] = useState('');
  const [copiedMessageIndex, setCopiedMessageIndex] = useState<number | null>(null);
  
  const dragRef = useRef<{ isDragging: boolean; offset: { x: number; y: number } }>({ isDragging: false, offset: { x: 0, y: 0 } });
  const nodeRef = useRef<HTMLDivElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(scrollToBottom, [history]);

  const handleCopy = (content: string, index: number) => {
    navigator.clipboard.writeText(content).then(() => {
      setCopiedMessageIndex(index);
      setTimeout(() => {
        setCopiedMessageIndex(null);
      }, 2000);
    });
  };

  const handleMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    e.preventDefault();
    if (nodeRef.current) {
      const rect = nodeRef.current.getBoundingClientRect();
      dragRef.current = {
        isDragging: true,
        offset: {
          x: e.clientX - rect.left,
          y: e.clientY - rect.top,
        },
      };
      // Add grabbing cursor to body during drag
      document.body.style.cursor = 'grabbing';
      document.body.style.userSelect = 'none'; // Prevent text selection
    }
  };

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!dragRef.current.isDragging || !nodeRef.current) return;
    e.preventDefault();
    
    // Calculate new position with improved constraints
    let newX = e.clientX - dragRef.current.offset.x;
    let newY = e.clientY - dragRef.current.offset.y;
    
    // Get current viewport dimensions (handles resize)
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;
    const margin = 10; // Safety margin from edges
    
    // Dynamic element size based on current state
    const elementWidth = isOpen ? 320 : 64; // w-80 = 320px, button = 64px
    const elementHeight = isOpen ? 448 : 64; // h-[28rem] = 448px, button = 64px
    
    // Smart viewport constraints with margins
    const maxX = viewportWidth - elementWidth - margin;
    const maxY = viewportHeight - elementHeight - margin;
    
    newX = Math.max(margin, Math.min(maxX, newX));
    newY = Math.max(margin, Math.min(maxY, newY));
    
    // Use requestAnimationFrame for smoother dragging
    requestAnimationFrame(() => {
      setPosition({ x: newX, y: newY });
    });
  }, [isOpen]);

  const handleMouseUp = useCallback(() => {
    dragRef.current.isDragging = false;
    // Reset cursor and user select
    document.body.style.cursor = '';
    document.body.style.userSelect = '';
  }, []);

  useEffect(() => {
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [handleMouseMove, handleMouseUp]);

  // Handle window resize to keep AI Assistant in viewport
  useEffect(() => {
    const handleResize = () => {
      const viewportWidth = window.innerWidth;
      const viewportHeight = window.innerHeight;
      const margin = 10;
      const elementWidth = isOpen ? 320 : 64;
      const elementHeight = isOpen ? 448 : 64;
      
      setPosition(prevPosition => ({
        x: Math.max(margin, Math.min(viewportWidth - elementWidth - margin, prevPosition.x)),
        y: Math.max(margin, Math.min(viewportHeight - elementHeight - margin, prevPosition.y))
      }));
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [isOpen]);

  // Auto-adjust position when opening/closing to prevent viewport clipping
  useEffect(() => {
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;
    const margin = 10;
    const elementWidth = isOpen ? 320 : 64;
    const elementHeight = isOpen ? 448 : 64;
    
    // Check if current position would clip and adjust if needed
    const maxX = viewportWidth - elementWidth - margin;
    const maxY = viewportHeight - elementHeight - margin;
    
    if (position.x > maxX || position.y > maxY) {
      setPosition(prev => ({
        x: Math.max(margin, Math.min(maxX, prev.x)),
        y: Math.max(margin, Math.min(maxY, prev.y))
      }));
    }
  }, [isOpen, position.x, position.y]);
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (message.trim() && !isLoading) {
      onSendMessage(message);
      setMessage('');
    }
  };

  return (
    <div
      ref={nodeRef}
      className="fixed z-50 transition-transform"
      style={{
        transform: `translate(${position.x}px, ${position.y}px)`,
        left: 0,
        top: 0,
      }}
    >
      {!isOpen && (
        <button
          onClick={() => onVisibilityChange(true)}
          onMouseDown={handleMouseDown as any}
          className="w-16 h-16 bg-brand-600 text-white rounded-full shadow-lg flex items-center justify-center cursor-grab active:cursor-grabbing hover:bg-brand-700 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:ring-offset-2 transition-all transform hover:scale-110 active:scale-105 select-none"
          aria-label="Open AI Assistant"
        >
          <RobotIcon className="w-8 h-8" />
        </button>
      )}

      {isOpen && (
        <div className="w-80 h-[28rem] bg-white rounded-2xl shadow-2xl flex flex-col overflow-hidden border border-slate-200 backdrop-blur-sm">
          <div onMouseDown={handleMouseDown as any} className="flex items-center justify-between p-3 bg-gradient-to-r from-brand-50 to-purple-50 border-b border-slate-200 cursor-grab active:cursor-grabbing select-none transition-colors hover:from-brand-100 hover:to-purple-100">
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-gradient-to-r from-brand-600 to-purple-600 rounded-lg flex items-center justify-center">
                <RobotIcon className="w-5 h-5 text-white" />
              </div>
              <div>
                <h3 className="font-semibold text-slate-800 text-sm">Productivity Assistant</h3>
                <p className="text-xs text-slate-500">🎯 Work & Time Management Expert</p>
              </div>
            </div>
            <div className="flex items-center space-x-1">
                <button onClick={onClearChat} className="p-1.5 rounded-full hover:bg-slate-200 text-slate-500" aria-label="Clear chat">
                    <RefreshCwIcon className="w-4 h-4" />
                </button>
                <button onClick={() => onVisibilityChange(false)} className="p-1.5 rounded-full hover:bg-slate-200 text-slate-500">
                    <CloseIcon className="w-4 h-4" />
                </button>
            </div>
          </div>

          <div className="flex-1 p-4 overflow-y-auto bg-slate-50/50 space-y-4">
            {/* Welcome Message */}
            {history.length === 0 && !isLoading && (
              <div className="text-center py-6 space-y-3">
                <div className="w-12 h-12 bg-gradient-to-r from-brand-500 to-purple-500 rounded-full flex items-center justify-center mx-auto">
                  <span className="text-2xl">💼</span>
                </div>
                <div>
                  <h4 className="font-semibold text-slate-800 text-sm">Ready to boost your productivity?</h4>
                  <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                    I'm here to help with task management, time optimization, focus techniques, and work strategies.
                  </p>
                </div>
                <div className="flex justify-center space-x-1 text-xs">
                  <span className="px-2 py-1 bg-brand-100 text-brand-700 rounded-full">Time Management</span>
                  <span className="px-2 py-1 bg-purple-100 text-purple-700 rounded-full">Productivity</span>
                </div>
              </div>
            )}
            
            {history.map((msg, index) => (
              <div key={index} className={`flex items-start gap-2 group ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                 {msg.role === 'user' && (
                    <button
                        onClick={() => handleCopy(msg.content, index)}
                        className="p-1.5 rounded-full bg-slate-100/80 text-slate-600 opacity-0 group-hover:opacity-100 transition-opacity focus:opacity-100 hover:bg-slate-200 backdrop-blur-sm shrink-0"
                        aria-label="Copy message"
                    >
                        {copiedMessageIndex === index ? <CheckIcon className="w-3 h-3 text-green-600" /> : <CopyIcon className="w-3 h-3" />}
                    </button>
                )}
                <div
                  className={`max-w-[80%] rounded-2xl px-4 py-2 text-sm select-text ${
                    msg.role === 'user'
                      ? 'bg-brand-600 text-white rounded-br-lg'
                      : 'bg-slate-200 text-slate-800 rounded-bl-lg'
                  }`}
                >
                  {msg.content}
                </div>
                 {msg.role === 'model' && (
                    <button
                        onClick={() => handleCopy(msg.content, index)}
                        className="p-1.5 rounded-full bg-slate-100/80 text-slate-600 opacity-0 group-hover:opacity-100 transition-opacity focus:opacity-100 hover:bg-slate-200 backdrop-blur-sm shrink-0"
                        aria-label="Copy message"
                    >
                        {copiedMessageIndex === index ? <CheckIcon className="w-3 h-3 text-green-600" /> : <CopyIcon className="w-3 h-3" />}
                    </button>
                )}
              </div>
            ))}
            {isLoading && (
               <div className="flex justify-start">
                    <div className="max-w-[80%] rounded-2xl px-4 py-2 text-sm bg-slate-200 text-slate-800 rounded-bl-lg">
                        <div className="flex items-center space-x-2">
                           <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce [animation-delay:-0.3s]"></div>
                           <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce [animation-delay:-0.15s]"></div>
                           <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce"></div>
                        </div>
                    </div>
                </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          <div className="p-3 bg-white border-t border-slate-200">
            {/* Quick Productivity Prompts */}
            {history.length === 0 && (
              <div className="mb-3 space-y-2">
                <p className="text-xs text-slate-500 font-medium">💡 Quick productivity tips:</p>
                <div className="grid grid-cols-2 gap-1">
                  <button
                    onClick={() => onSendMessage('How to prioritize tasks effectively?')}
                    className="text-left px-2 py-1 text-xs bg-slate-100 hover:bg-slate-200 rounded text-slate-700 transition-colors"
                  >
                    🎯 Task Priority
                  </button>
                  <button
                    onClick={() => onSendMessage('Best time management techniques for busy days?')}
                    className="text-left px-2 py-1 text-xs bg-slate-100 hover:bg-slate-200 rounded text-slate-700 transition-colors"
                  >
                    ⏰ Time Management
                  </button>
                  <button
                    onClick={() => onSendMessage('How to maintain focus while working?')}
                    className="text-left px-2 py-1 text-xs bg-slate-100 hover:bg-slate-200 rounded text-slate-700 transition-colors"
                  >
                    🧠 Stay Focused
                  </button>
                  <button
                    onClick={() => onSendMessage('Tips for better team collaboration?')}
                    className="text-left px-2 py-1 text-xs bg-slate-100 hover:bg-slate-200 rounded text-slate-700 transition-colors"
                  >
                    🤝 Team Work
                  </button>
                </div>
              </div>
            )}
            
            {taskContext && (
                <div className="mb-2">
                    <button
                        type="button"
                        onClick={onSummarizeTask}
                        disabled={isLoading}
                        className="w-full text-center px-3 py-1.5 text-xs font-semibold text-brand-700 bg-brand-100 rounded-lg hover:bg-brand-200 transition-colors disabled:opacity-50"
                    >
                        ✨ Summarize this task
                    </button>
                </div>
            )}
            <form onSubmit={handleSubmit} className="flex items-center space-x-2">
              <input
                type="text"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Ask about productivity, time management, focus..."
                className="flex-1 w-full px-3 py-2 text-sm bg-slate-100 border-transparent rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500 placeholder:text-slate-400"
                disabled={isLoading}
              />
              <button
                type="submit"
                disabled={isLoading || !message.trim()}
                className="p-2.5 bg-brand-600 text-white rounded-lg disabled:bg-slate-300 disabled:cursor-not-allowed hover:bg-brand-700 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:ring-offset-2 transition-colors"
                aria-label="Send message"
              >
                <SendIcon className="w-4 h-4" />
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AIAssistant;
