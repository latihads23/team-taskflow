
import React, { useState, useRef, useEffect, useCallback } from 'react';
import { ChatMessage, Task } from '../types';
import { RobotIcon, CloseIcon, SendIcon, RefreshCwIcon, CopyIcon, CheckIcon } from './Icons';
import { aiService, FileUpload, AISettings } from '../services/aiService';

// Quick prompts for different expert domains
const getQuickPrompts = (settings: AISettings) => {
  if (settings.mode === 'general') {
    return [
      { icon: '🎯', title: 'Task Priority', question: 'How to prioritize tasks effectively?' },
      { icon: '⏰', title: 'Time Management', question: 'Best time management techniques for busy days?' },
      { icon: '🧠', title: 'Stay Focused', question: 'How to maintain focus while working?' },
      { icon: '🤝', title: 'Team Work', question: 'Tips for better team collaboration?' }
    ];
  }
  
  const expertPrompts: Record<string, Array<{icon: string, title: string, question: string}>> = {
    'business': [
      { icon: '📈', title: 'Strategy', question: 'What are key elements of a successful business strategy?' },
      { icon: '💰', title: 'Revenue', question: 'How to identify new revenue streams for my business?' },
      { icon: '📊', title: 'KPIs', question: 'What KPIs should I track for business growth?' },
      { icon: '🎯', title: 'Goals', question: 'How to set and achieve realistic business goals?' }
    ],
    'tech': [
      { icon: '💻', title: 'Architecture', question: 'Best practices for system architecture design?' },
      { icon: '🔒', title: 'Security', question: 'How to implement security best practices in development?' },
      { icon: '🚀', title: 'Performance', question: 'Techniques to optimize application performance?' },
      { icon: '🧪', title: 'Testing', question: 'What testing strategies should I implement?' }
    ],
    'marketing': [
      { icon: '📱', title: 'Digital', question: 'Effective digital marketing strategies for 2024?' },
      { icon: '🎨', title: 'Branding', question: 'How to build a strong brand identity?' },
      { icon: '📈', title: 'Growth', question: 'Customer acquisition strategies that work?' },
      { icon: '💬', title: 'Content', question: 'Content marketing best practices?' }
    ],
    'design': [
      { icon: '🎨', title: 'UX Principles', question: 'Core principles of excellent user experience?' },
      { icon: '📱', title: 'Mobile First', question: 'Mobile-first design best practices?' },
      { icon: '🔍', title: 'User Research', question: 'How to conduct effective user research?' },
      { icon: '🎯', title: 'Accessibility', question: 'Design accessibility guidelines and tips?' }
    ],
    'finance': [
      { icon: '📊', title: 'Analysis', question: 'Financial analysis techniques for investment decisions?' },
      { icon: '💰', title: 'Portfolio', question: 'How to build a diversified investment portfolio?' },
      { icon: '📈', title: 'Risk Mgmt', question: 'Risk management strategies in finance?' },
      { icon: '💳', title: 'Budgeting', question: 'Personal and business budgeting best practices?' }
    ],
    'legal': [
      { icon: '📋', title: 'Contracts', question: 'Key elements of business contracts?' },
      { icon: '🔒', title: 'Compliance', question: 'Data privacy and compliance requirements?' },
      { icon: '⚖️', title: 'IP Rights', question: 'Intellectual property protection strategies?' },
      { icon: '🏢', title: 'Corporate', question: 'Corporate governance best practices?' }
    ],
    'medical': [
      { icon: '🩺', title: 'Diagnosis', question: 'Clinical decision-making frameworks?' },
      { icon: '💊', title: 'Treatment', question: 'Evidence-based treatment approaches?' },
      { icon: '📊', title: 'Research', question: 'Medical research methodology best practices?' },
      { icon: '🏥', title: 'Patient Care', question: 'Patient-centered care strategies?' }
    ],
    'education': [
      { icon: '📚', title: 'Curriculum', question: 'Effective curriculum design principles?' },
      { icon: '🎓', title: 'Learning', question: 'Evidence-based learning methodologies?' },
      { icon: '💻', title: 'EdTech', question: 'Educational technology integration strategies?' },
      { icon: '📊', title: 'Assessment', question: 'Student assessment and evaluation methods?' }
    ],
    'engineering': [
      { icon: '🔧', title: 'Design', question: 'Engineering design process optimization?' },
      { icon: '⚡', title: 'Systems', question: 'Complex systems engineering approaches?' },
      { icon: '📐', title: 'Standards', question: 'Industry standards and quality assurance?' },
      { icon: '🛠️', title: 'Tools', question: 'Essential engineering tools and software?' }
    ],
    'research': [
      { icon: '🔬', title: 'Methodology', question: 'Research methodology and design principles?' },
      { icon: '📊', title: 'Data Analysis', question: 'Statistical analysis techniques for research?' },
      { icon: '📄', title: 'Publishing', question: 'Academic writing and publishing guidelines?' },
      { icon: '🔍', title: 'Literature', question: 'Systematic literature review techniques?' }
    ],
    'writing': [
      { icon: '✍️', title: 'Style', question: 'Writing style guidelines for different audiences?' },
      { icon: '📝', title: 'Structure', question: 'Document structure and organization tips?' },
      { icon: '🎯', title: 'Clarity', question: 'How to write clearly and persuasively?' },
      { icon: '📚', title: 'Editing', question: 'Self-editing and proofreading techniques?' }
    ],
    'data-analysis': [
      { icon: '📊', title: 'Visualization', question: 'Data visualization best practices?' },
      { icon: '🤖', title: 'ML Models', question: 'Machine learning model selection strategies?' },
      { icon: '🔍', title: 'Insights', question: 'How to extract actionable insights from data?' },
      { icon: '📈', title: 'Statistics', question: 'Statistical analysis techniques and methods?' }
    ],
    'project-management': [
      { icon: '📋', title: 'Planning', question: 'Project planning and scheduling best practices?' },
      { icon: '👥', title: 'Teams', question: 'Effective team management strategies?' },
      { icon: '⚠️', title: 'Risk Mgmt', question: 'Project risk identification and mitigation?' },
      { icon: '📊', title: 'Tracking', question: 'Project progress tracking and reporting methods?' }
    ]
  };
  
  return expertPrompts[settings.expertDomain] || expertPrompts['business'];
};

interface AIAssistantProps {
  history: ChatMessage[];
  onSendMessage: (message: string, selectedFileIds?: string[]) => void;
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
  const [uploadedFiles, setUploadedFiles] = useState<FileUpload[]>([]);
  const [selectedFileIds, setSelectedFileIds] = useState<string[]>([]);
  const [aiSettings, setAiSettings] = useState(aiService.getSettings());
  const [isUploading, setIsUploading] = useState(false);
  
  const dragRef = useRef<{ isDragging: boolean; offset: { x: number; y: number } }>({ isDragging: false, offset: { x: 0, y: 0 } });
  const nodeRef = useRef<HTMLDivElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(scrollToBottom, [history]);

  // Load uploaded files and listen for settings changes
  useEffect(() => {
    if (isOpen) {
      setUploadedFiles(aiService.getUploadedFiles());
      setAiSettings(aiService.getSettings());
    }
  }, [isOpen]);

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    try {
      const uploadedFile = await aiService.uploadFile(file);
      setUploadedFiles(prev => [uploadedFile, ...prev]);
      // Auto-select the newly uploaded file
      setSelectedFileIds(prev => [...prev, uploadedFile.id]);
    } catch (error) {
      alert(`Upload failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsUploading(false);
      // Reset file input
      event.target.value = '';
    }
  };

  const toggleFileSelection = (fileId: string) => {
    setSelectedFileIds(prev => 
      prev.includes(fileId) 
        ? prev.filter(id => id !== fileId)
        : [...prev, fileId]
    );
  };

  const removeFile = (fileId: string) => {
    aiService.deleteUploadedFile(fileId);
    setUploadedFiles(prev => prev.filter(f => f.id !== fileId));
    setSelectedFileIds(prev => prev.filter(id => id !== fileId));
  };

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
      onSendMessage(message, selectedFileIds);
      setMessage('');
      setSelectedFileIds([]); // Clear file selection after sending
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
                <h3 className="font-semibold text-slate-800 text-sm">
                  {aiSettings.mode === 'expert' 
                    ? `🎯 ${aiSettings.expertDomain.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')} Expert`
                    : '🧠 AI Assistant'
                  }
                </h3>
                <p className="text-xs text-slate-500">
                  {aiSettings.primaryProvider === 'openai' ? '🟢 OpenAI' : '🔵 Gemini'} • 
                  {aiSettings.enableFileUploads ? '📁 Files OK' : '📄 Text Only'}
                </p>
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
                  <span className="text-2xl">
                    {aiSettings.mode === 'expert' ? '🎯' : '💼'}
                  </span>
                </div>
                <div>
                  <h4 className="font-semibold text-slate-800 text-sm">
                    {aiSettings.mode === 'expert' 
                      ? `${aiSettings.expertDomain.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')} Expert Ready!`
                      : 'Ready to boost your productivity?'
                    }
                  </h4>
                  <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                    {aiSettings.mode === 'expert' 
                      ? `I'm your specialized ${aiSettings.expertDomain.replace('-', ' ')} consultant. ${aiSettings.enableFileUploads ? 'Upload files for analysis and' : ''} ask domain-specific questions.`
                      : "I'm here to help with task management, time optimization, focus techniques, and work strategies."
                    }
                  </p>
                </div>
                <div className="flex justify-center space-x-1 text-xs">
                  {aiSettings.mode === 'expert' ? (
                    <>
                      <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded-full">
                        🎯 {aiSettings.expertDomain.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')}
                      </span>
                      {aiSettings.enableFileUploads && (
                        <span className="px-2 py-1 bg-green-100 text-green-700 rounded-full">📁 File Analysis</span>
                      )}
                    </>
                  ) : (
                    <>
                      <span className="px-2 py-1 bg-brand-100 text-brand-700 rounded-full">Time Management</span>
                      <span className="px-2 py-1 bg-purple-100 text-purple-700 rounded-full">Productivity</span>
                    </>
                  )}
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
            {/* Dynamic Quick Prompts based on AI Mode */}
            {history.length === 0 && (
              <div className="mb-3 space-y-2">
                <p className="text-xs text-slate-500 font-medium">
                  {aiSettings.mode === 'expert' 
                    ? `💡 ${aiSettings.expertDomain.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')} Expert Prompts:` 
                    : '💡 Quick productivity tips:'
                  }
                </p>
                <div className="grid grid-cols-2 gap-1">
                  {getQuickPrompts(aiSettings).map((prompt, index) => (
                    <button
                      key={index}
                      onClick={() => onSendMessage(prompt.question)}
                      className="text-left px-2 py-1 text-xs bg-slate-100 hover:bg-slate-200 rounded text-slate-700 transition-colors"
                    >
                      {prompt.icon} {prompt.title}
                    </button>
                  ))}
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
            
            {/* File Upload Section */}
            {aiSettings.enableFileUploads && (
              <div className="mb-3 space-y-2">
                {/* Upload Button */}
                <div className="flex items-center gap-2">
                  <label className="flex items-center gap-1 px-2 py-1 text-xs bg-blue-100 hover:bg-blue-200 text-blue-700 rounded cursor-pointer transition-colors">
                    <input
                      type="file"
                      onChange={handleFileUpload}
                      disabled={isUploading}
                      accept=".pdf,.doc,.docx,.ppt,.pptx,.txt,.csv,.jpg,.jpeg,.png,.gif,.webp"
                      className="hidden"
                    />
                    {isUploading ? (
                      <span className="w-3 h-3 border border-blue-500 border-t-transparent rounded-full animate-spin"></span>
                    ) : (
                      <span>📁</span>
                    )}
                    {isUploading ? 'Uploading...' : 'Upload File'}
                  </label>
                  {uploadedFiles.length > 0 && (
                    <span className="text-xs text-slate-500">({uploadedFiles.length} files)</span>
                  )}
                </div>
                
                {/* File List */}
                {uploadedFiles.length > 0 && (
                  <div className="max-h-16 overflow-y-auto space-y-1">
                    {uploadedFiles.slice(0, 3).map(file => (
                      <div key={file.id} className="flex items-center gap-2 p-1.5 bg-slate-50 rounded text-xs">
                        <label className="flex items-center gap-1 flex-1 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={selectedFileIds.includes(file.id)}
                            onChange={() => toggleFileSelection(file.id)}
                            className="w-3 h-3"
                          />
                          <span className="truncate flex-1" title={file.name}>
                            {file.type === 'image' ? '🖼️' : '📄'} {file.name.length > 20 ? file.name.substring(0, 20) + '...' : file.name}
                          </span>
                        </label>
                        <button
                          onClick={() => removeFile(file.id)}
                          className="text-red-500 hover:text-red-700 p-0.5"
                          title="Remove file"
                        >
                          ✕
                        </button>
                      </div>
                    ))}
                    {uploadedFiles.length > 3 && (
                      <div className="text-xs text-slate-400 text-center">+{uploadedFiles.length - 3} more files</div>
                    )}
                  </div>
                )}
                
                {/* Selected Files Indicator */}
                {selectedFileIds.length > 0 && (
                  <div className="text-xs text-blue-600 bg-blue-50 px-2 py-1 rounded">
                    📎 {selectedFileIds.length} file{selectedFileIds.length > 1 ? 's' : ''} selected for context
                  </div>
                )}
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
