
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
  const [position, setPosition] = useState({ x: window.innerWidth - 80, y: window.innerHeight - 80 });
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
    if (nodeRef.current) {
      const rect = nodeRef.current.getBoundingClientRect();
      dragRef.current = {
        isDragging: true,
        offset: {
          x: e.clientX - rect.left,
          y: e.clientY - rect.top,
        },
      };
    }
  };

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!dragRef.current.isDragging || !nodeRef.current) return;
    e.preventDefault();
    setPosition({
      x: e.clientX - dragRef.current.offset.x,
      y: e.clientY - dragRef.current.offset.y,
    });
  }, []);

  const handleMouseUp = useCallback(() => {
    dragRef.current.isDragging = false;
  }, []);

  useEffect(() => {
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [handleMouseMove, handleMouseUp]);
  
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
          className="w-16 h-16 bg-brand-600 text-white rounded-full shadow-lg flex items-center justify-center cursor-move hover:bg-brand-700 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:ring-offset-2 transition-all transform hover:scale-110"
          aria-label="Open AI Assistant"
        >
          <RobotIcon className="w-8 h-8" />
        </button>
      )}

      {isOpen && (
        <div className="w-80 h-[28rem] bg-white rounded-2xl shadow-2xl flex flex-col overflow-hidden border border-slate-200">
          <div onMouseDown={handleMouseDown as any} className="flex items-center justify-between p-3 bg-slate-50 border-b border-slate-200 cursor-move">
            <div className="flex items-center space-x-2">
              <RobotIcon className="w-6 h-6 text-brand-600" />
              <h3 className="font-semibold text-slate-800">AI Assistant</h3>
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
                placeholder="Ask me anything..."
                className="flex-1 w-full px-3 py-2 text-sm bg-slate-100 border-transparent rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500"
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
