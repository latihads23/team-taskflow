import { ChatMessage } from '../types';

// AI Provider types
export type AIProvider = 'openai' | 'gemini';

// AI Assistant Modes
export type AIMode = 'general' | 'expert';
export type ExpertDomain = 
  | 'business' | 'tech' | 'marketing' | 'design' | 'finance' 
  | 'legal' | 'medical' | 'education' | 'engineering' | 'research'
  | 'writing' | 'data-analysis' | 'project-management';

// Supported file types
export type SupportedFileType = 'pdf' | 'image' | 'doc' | 'docx' | 'ppt' | 'pptx' | 'txt' | 'csv';

export interface FileUpload {
  id: string;
  name: string;
  type: SupportedFileType;
  size: number;
  content: string; // Base64 or extracted text
  uploadedAt: Date;
  processedContent?: string; // Processed/extracted content
}

export interface AISettings {
  primaryProvider: AIProvider;
  enableFallback: boolean;
  openaiModel: string;
  geminiModel: string;
  mode: AIMode;
  expertDomain: ExpertDomain;
  customInstructions: string;
  enableFileUploads: boolean;
  maxFileSize: number; // in MB
}

// Default settings
export const DEFAULT_AI_SETTINGS: AISettings = {
  primaryProvider: 'gemini', // Use Gemini as primary since it's working
  enableFallback: true,
  openaiModel: 'gpt-3.5-turbo',
  geminiModel: 'gemini-pro', // Use stable model
  mode: 'general',
  expertDomain: 'business',
  customInstructions: '',
  enableFileUploads: true,
  maxFileSize: 10 // 10MB
};

// Expert domain prompts
export const EXPERT_PROMPTS: Record<ExpertDomain, string> = {
  'business': 'You are a senior business consultant with 20+ years of experience in strategy, operations, and management. You provide actionable insights for business growth, efficiency, and decision-making.',
  'tech': 'You are a senior software architect and technology expert with deep knowledge in programming, system design, cloud computing, AI/ML, and emerging technologies.',
  'marketing': 'You are a digital marketing expert specializing in growth strategies, brand development, content marketing, SEO, social media, and customer acquisition.',
  'design': 'You are a UX/UI design expert with expertise in user research, design thinking, visual design, prototyping, and creating exceptional user experiences.',
  'finance': 'You are a financial analyst and advisor with expertise in investment analysis, financial planning, budgeting, risk assessment, and financial modeling.',
  'legal': 'You are a legal expert with knowledge in business law, contracts, compliance, intellectual property, and legal risk management.',
  'medical': 'You are a medical professional with expertise in healthcare, medical research, patient care, and health technology. Always recommend consulting healthcare providers for medical decisions.',
  'education': 'You are an education specialist with expertise in curriculum design, learning methodologies, educational technology, and student development.',
  'engineering': 'You are a professional engineer with expertise in mechanical, electrical, civil, and software engineering principles, project management, and technical problem-solving.',
  'research': 'You are a research scientist with expertise in methodology, data analysis, academic writing, literature review, and scientific investigation.',
  'writing': 'You are a professional writer and editor with expertise in content creation, copywriting, technical writing, storytelling, and communication strategy.',
  'data-analysis': 'You are a data scientist with expertise in statistics, data visualization, machine learning, business intelligence, and analytical insights.',
  'project-management': 'You are a certified project manager with expertise in agile methodologies, resource planning, risk management, and successful project delivery.'
};

// Storage key
const AI_SETTINGS_KEY = 'team_taskflow_ai_settings';

export class AIService {
  private static instance: AIService;
  private settings: AISettings;
  private uploadedFiles: Map<string, FileUpload> = new Map();
  
  private constructor() {
    this.settings = this.loadSettings();
    this.loadUploadedFiles();
  }
  
  static getInstance(): AIService {
    if (!AIService.instance) {
      AIService.instance = new AIService();
    }
    return AIService.instance;
  }
  
  /**
   * Load AI settings from localStorage
   */
  private loadSettings(): AISettings {
    try {
      const saved = localStorage.getItem(AI_SETTINGS_KEY);
      if (saved) {
        return { ...DEFAULT_AI_SETTINGS, ...JSON.parse(saved) };
      }
    } catch (error) {
      console.error('Failed to load AI settings:', error);
    }
    return DEFAULT_AI_SETTINGS;
  }
  
  /**
   * Save AI settings to localStorage
   */
  private saveSettings(): void {
    try {
      localStorage.setItem(AI_SETTINGS_KEY, JSON.stringify(this.settings));
    } catch (error) {
      console.error('Failed to save AI settings:', error);
    }
  }
  
  /**
   * Get current AI settings
   */
  getSettings(): AISettings {
    return { ...this.settings };
  }
  
  /**
   * Update AI settings
   */
  updateSettings(newSettings: Partial<AISettings>): void {
    this.settings = { ...this.settings, ...newSettings };
    this.saveSettings();
  }
  
  /**
   * Load uploaded files from localStorage
   */
  private loadUploadedFiles(): void {
    try {
      const saved = localStorage.getItem('team_taskflow_ai_files');
      if (saved) {
        const files: FileUpload[] = JSON.parse(saved);
        files.forEach(file => {
          this.uploadedFiles.set(file.id, {
            ...file,
            uploadedAt: new Date(file.uploadedAt)
          });
        });
      }
    } catch (error) {
      console.error('Failed to load uploaded files:', error);
    }
  }
  
  /**
   * Save uploaded files to localStorage
   */
  private saveUploadedFiles(): void {
    try {
      const files = Array.from(this.uploadedFiles.values());
      localStorage.setItem('team_taskflow_ai_files', JSON.stringify(files));
    } catch (error) {
      console.error('Failed to save uploaded files:', error);
    }
  }
  
  /**
   * Upload and process file
   */
  async uploadFile(file: File): Promise<FileUpload> {
    if (!this.settings.enableFileUploads) {
      throw new Error('File uploads are disabled');
    }
    
    if (file.size > this.settings.maxFileSize * 1024 * 1024) {
      throw new Error(`File size exceeds limit of ${this.settings.maxFileSize}MB`);
    }
    
    const fileType = this.getFileType(file.name);
    if (!fileType) {
      throw new Error('Unsupported file type');
    }
    
    const fileUpload: FileUpload = {
      id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
      name: file.name,
      type: fileType,
      size: file.size,
      content: '',
      uploadedAt: new Date()
    };
    
    try {
      if (fileType === 'image') {
        fileUpload.content = await this.fileToBase64(file);
      } else {
        fileUpload.content = await this.extractTextContent(file, fileType);
      }
      
      this.uploadedFiles.set(fileUpload.id, fileUpload);
      this.saveUploadedFiles();
      return fileUpload;
    } catch (error) {
      throw new Error(`Failed to process file: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
  
  /**
   * Get uploaded files
   */
  getUploadedFiles(): FileUpload[] {
    return Array.from(this.uploadedFiles.values()).sort((a, b) => 
      b.uploadedAt.getTime() - a.uploadedAt.getTime()
    );
  }
  
  /**
   * Delete uploaded file
   */
  deleteUploadedFile(fileId: string): void {
    this.uploadedFiles.delete(fileId);
    this.saveUploadedFiles();
  }
  
  /**
   * Clear all uploaded files
   */
  clearUploadedFiles(): void {
    this.uploadedFiles.clear();
    this.saveUploadedFiles();
  }
  
  /**
   * Chat with AI using primary provider with fallback
   */
  async chat(message: string, history: ChatMessage[] = [], selectedFileIds: string[] = []): Promise<string> {
    const { primaryProvider, enableFallback } = this.settings;
    
    try {
      // Try primary provider first
      return await this.chatWithProvider(primaryProvider, message, history, selectedFileIds);
    } catch (error) {
      console.warn(`Primary AI provider (${primaryProvider}) failed:`, error);
      
      if (enableFallback) {
        const fallbackProvider = primaryProvider === 'openai' ? 'gemini' : 'openai';
        console.log(`Falling back to ${fallbackProvider}...`);
        
        try {
          return await this.chatWithProvider(fallbackProvider, message, history, selectedFileIds);
        } catch (fallbackError) {
          console.error(`Fallback provider (${fallbackProvider}) also failed:`, fallbackError);
          throw new Error(`Both AI providers failed. Please check your API keys and try again.`);
        }
      }
      
      throw error;
    }
  }
  
  /**
   * Chat with specific provider
   */
  private async chatWithProvider(provider: AIProvider, message: string, history: ChatMessage[], selectedFileIds: string[] = []): Promise<string> {
    switch (provider) {
      case 'openai':
        return this.chatWithOpenAI(message, history, selectedFileIds);
      case 'gemini':
        return this.chatWithGemini(message, history, selectedFileIds);
      default:
        throw new Error(`Unsupported AI provider: ${provider}`);
    }
  }
  
  /**
   * Chat with OpenAI GPT
   */
  private async chatWithOpenAI(message: string, history: ChatMessage[], selectedFileIds: string[] = []): Promise<string> {
    const apiKey = import.meta.env.VITE_OPENAI_API_KEY;
    if (!apiKey) {
      throw new Error('OpenAI API key not configured');
    }
    
    // Build system prompt based on mode
    const systemPrompt = this.buildSystemPrompt();
    
    // Add file context if files are selected
    const fileContext = this.buildFileContext(selectedFileIds);
    const enhancedMessage = fileContext ? `${fileContext}\n\nUser question: ${message}` : message;
    
    // Convert history to OpenAI format
    const messages = [
      {
        role: 'system',
        content: systemPrompt
      },
      ...history.map(msg => ({
        role: msg.role === 'model' ? 'assistant' : msg.role,
        content: msg.content
      })),
      {
        role: 'user',
        content: enhancedMessage
      }
    ];
    
    // Use direct OpenAI API endpoint
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: this.settings.openaiModel,
        messages,
        max_tokens: 1000,
        temperature: 0.7
      })
    });
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      let errorMessage = `OpenAI API error: ${response.status}`;
      
      if (response.status === 401) {
        errorMessage += ' - Invalid API key. Please check your OpenAI API key in settings.';
      } else if (response.status === 429) {
        errorMessage += ' - Rate limit exceeded. Please try again later or upgrade your OpenAI plan.';
      } else if (response.status === 403) {
        errorMessage += ' - Access denied. Please check your OpenAI API key permissions.';
      } else {
        errorMessage += ` - ${errorData.error?.message || 'Unknown error'}`;
      }
      
      throw new Error(errorMessage);
    }
    
    const data = await response.json();
    return data.choices[0]?.message?.content || 'No response from OpenAI';
  }
  
  /**
   * Chat with Google Gemini
   */
  private async chatWithGemini(message: string, history: ChatMessage[], selectedFileIds: string[] = []): Promise<string> {
    const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error('Gemini API key not configured');
    }
    
    // Build system prompt based on mode
    const systemPrompt = this.buildSystemPrompt();
    
    // Build conversation context
    let fullPrompt = systemPrompt + '\n\n';
    
    // Add file context if files are selected
    const fileContext = this.buildFileContext(selectedFileIds);
    if (fileContext) {
      fullPrompt += fileContext + '\n\n';
    }
    
    // Add history context
    if (history.length > 0) {
      fullPrompt += 'Previous conversation:\n';
      history.forEach(msg => {
        const role = msg.role === 'model' ? 'Assistant' : 'User';
        fullPrompt += `${role}: ${msg.content}\n`;
      });
      fullPrompt += '\n';
    }
    
    fullPrompt += `Current question: ${message}`;
    
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${this.settings.geminiModel}:generateContent?key=${apiKey}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        contents: [{
          parts: [{
            text: fullPrompt
          }]
        }],
        generationConfig: {
          temperature: 0.7,
          maxOutputTokens: 1000
        }
      })
    });
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      let errorMessage = `Gemini API error: ${response.status}`;
      
      if (response.status === 404) {
        errorMessage += ' - Model not found. Try switching to Gemini 1.5 Flash or check if the model is available.';
      } else if (response.status === 403) {
        errorMessage += ' - Access denied. Please check your Gemini API key.';
      } else if (response.status === 400) {
        errorMessage += ' - Bad request. Please check your input or try a different model.';
      } else {
        errorMessage += ` - ${errorData.error?.message || 'Unknown error'}`;
      }
      
      throw new Error(errorMessage);
    }
    
    const data = await response.json();
    return data.candidates?.[0]?.content?.parts?.[0]?.text || 'No response from Gemini';
  }
  
  /**
   * Parse task from natural language using AI
   */
  async parseTask(prompt: string, availableUsers: Array<{id: string, name: string}>): Promise<any> {
    const usersList = availableUsers.map(u => `${u.name} (${u.id})`).join(', ');
    
    const systemPrompt = `Parse the following task request and return a JSON object with these fields:
    - title: string (task title)
    - description: string (detailed description)
    - assigneeId: string (user ID from available users)
    - dueDate: string (YYYY-MM-DD format, default to tomorrow if not specified)
    - priority: string (Low/Medium/High/Urgent)
    - status: string (always "To Do")
    
    Available users: ${usersList}
    
    Task request: "${prompt}"
    
    Return only valid JSON, no additional text.`;
    
    try {
      const response = await this.chat(systemPrompt);
      
      // Try to extract JSON from response
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }
      
      throw new Error('Could not parse AI response as JSON');
    } catch (error) {
      console.error('Failed to parse task:', error);
      throw error;
    }
  }
  
  /**
   * Reset chat conversation
   */
  resetChat(): void {
    // This method can be used to clear any cached conversation state if needed
    console.log('AI chat reset');
  }
  
  /**
   * Build system prompt based on current settings
   */
  private buildSystemPrompt(): string {
    let prompt = '';
    
    if (this.settings.mode === 'expert') {
      prompt = EXPERT_PROMPTS[this.settings.expertDomain];
    } else {
      prompt = 'You are an intelligent and knowledgeable AI assistant. You have broad expertise across many domains and can help with various tasks, questions, and problems. Provide helpful, accurate, and detailed responses.';
    }
    
    // Add custom instructions if provided
    if (this.settings.customInstructions.trim()) {
      prompt += `\n\nAdditional instructions: ${this.settings.customInstructions}`;
    }
    
    return prompt;
  }
  
  /**
   * Build file context from selected files
   */
  private buildFileContext(selectedFileIds: string[]): string {
    if (!selectedFileIds.length) return '';
    
    const contextFiles = selectedFileIds
      .map(id => this.uploadedFiles.get(id))
      .filter((file): file is FileUpload => file !== undefined);
    
    if (!contextFiles.length) return '';
    
    let context = 'Context from uploaded files:\n';
    contextFiles.forEach((file, index) => {
      context += `\n--- File ${index + 1}: ${file.name} ---\n`;
      if (file.type === 'image') {
        context += `[Image file: ${file.name}]\n`;
      } else {
        context += file.processedContent || file.content || '[Content not available]';
      }
      context += '\n';
    });
    
    return context;
  }
  
  /**
   * Get file type from filename
   */
  private getFileType(filename: string): SupportedFileType | null {
    const ext = filename.toLowerCase().split('.').pop();
    switch (ext) {
      case 'pdf': return 'pdf';
      case 'jpg': case 'jpeg': case 'png': case 'gif': case 'webp': return 'image';
      case 'doc': return 'doc';
      case 'docx': return 'docx';
      case 'ppt': return 'ppt';
      case 'pptx': return 'pptx';
      case 'txt': return 'txt';
      case 'csv': return 'csv';
      default: return null;
    }
  }
  
  /**
   * Convert file to base64
   */
  private fileToBase64(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  }
  
  /**
   * Extract text content from file
   */
  private async extractTextContent(file: File, type: SupportedFileType): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const content = reader.result as string;
        
        // For now, we'll handle basic text extraction
        // In production, you'd want to use proper libraries for each format
        switch (type) {
          case 'txt':
          case 'csv':
            resolve(content);
            break;
          case 'pdf':
            // Note: PDF extraction would need a library like PDF.js
            resolve('[PDF content - extraction would require PDF.js library]');
            break;
          case 'doc':
          case 'docx':
            // Note: Word doc extraction would need a library like mammoth.js
            resolve('[Word document - extraction would require mammoth.js library]');
            break;
          case 'ppt':
          case 'pptx':
            // Note: PowerPoint extraction would need appropriate library
            resolve('[PowerPoint document - extraction would require appropriate library]');
            break;
          default:
            resolve('[Content extraction not implemented for this file type]');
        }
      };
      reader.onerror = reject;
      reader.readAsText(file);
    });
  }
  
  /**
   * Get provider status info
   */
  async getProviderStatus(): Promise<{
    openai: { available: boolean; error?: string };
    gemini: { available: boolean; error?: string };
  }> {
    const result = {
      openai: { available: false, error: undefined as string | undefined },
      gemini: { available: false, error: undefined as string | undefined }
    };
    
    // Check API keys first
    const openaiKey = import.meta.env.VITE_OPENAI_API_KEY;
    const geminiKey = import.meta.env.VITE_GEMINI_API_KEY;
    
    if (!openaiKey) {
      result.openai.error = 'OpenAI API key not configured';
    } else {
      // Test OpenAI with a simple request
      try {
        await this.chatWithOpenAI('Hi', []);
        result.openai.available = true;
      } catch (error) {
        result.openai.error = error instanceof Error ? error.message : 'Unknown error';
      }
    }
    
    if (!geminiKey) {
      result.gemini.error = 'Gemini API key not configured';
    } else {
      // Test Gemini with a simple request
      try {
        await this.chatWithGemini('Hi', []);
        result.gemini.available = true;
      } catch (error) {
        result.gemini.error = error instanceof Error ? error.message : 'Unknown error';
      }
    }
    
    return result;
  }
}

export const aiService = AIService.getInstance();