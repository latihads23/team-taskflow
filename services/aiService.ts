import { ChatMessage } from '../types';

// AI Provider types
export type AIProvider = 'openai' | 'gemini';

export interface AISettings {
  primaryProvider: AIProvider;
  enableFallback: boolean;
  openaiModel: string;
  geminiModel: string;
}

// Default settings
export const DEFAULT_AI_SETTINGS: AISettings = {
  primaryProvider: 'openai',
  enableFallback: true,
  openaiModel: 'gpt-3.5-turbo',
  geminiModel: 'gemini-pro'
};

// Storage key
const AI_SETTINGS_KEY = 'team_taskflow_ai_settings';

export class AIService {
  private static instance: AIService;
  private settings: AISettings;
  
  private constructor() {
    this.settings = this.loadSettings();
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
   * Chat with AI using primary provider with fallback
   */
  async chat(message: string, history: ChatMessage[] = []): Promise<string> {
    const { primaryProvider, enableFallback } = this.settings;
    
    try {
      // Try primary provider first
      return await this.chatWithProvider(primaryProvider, message, history);
    } catch (error) {
      console.warn(`Primary AI provider (${primaryProvider}) failed:`, error);
      
      if (enableFallback) {
        const fallbackProvider = primaryProvider === 'openai' ? 'gemini' : 'openai';
        console.log(`Falling back to ${fallbackProvider}...`);
        
        try {
          return await this.chatWithProvider(fallbackProvider, message, history);
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
  private async chatWithProvider(provider: AIProvider, message: string, history: ChatMessage[]): Promise<string> {
    switch (provider) {
      case 'openai':
        return this.chatWithOpenAI(message, history);
      case 'gemini':
        return this.chatWithGemini(message, history);
      default:
        throw new Error(`Unsupported AI provider: ${provider}`);
    }
  }
  
  /**
   * Chat with OpenAI GPT
   */
  private async chatWithOpenAI(message: string, history: ChatMessage[]): Promise<string> {
    const apiKey = import.meta.env.VITE_OPENAI_API_KEY;
    if (!apiKey) {
      throw new Error('OpenAI API key not configured');
    }
    
    // Convert history to OpenAI format
    const messages = [
      {
        role: 'system',
        content: 'You are a helpful task management assistant. Help users organize their work, prioritize tasks, and improve productivity.'
      },
      ...history.map(msg => ({
        role: msg.role === 'model' ? 'assistant' : msg.role,
        content: msg.content
      })),
      {
        role: 'user',
        content: message
      }
    ];
    
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
      throw new Error(`OpenAI API error: ${response.status} - ${errorData.error?.message || 'Unknown error'}`);
    }
    
    const data = await response.json();
    return data.choices[0]?.message?.content || 'No response from OpenAI';
  }
  
  /**
   * Chat with Google Gemini
   */
  private async chatWithGemini(message: string, history: ChatMessage[]): Promise<string> {
    const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error('Gemini API key not configured');
    }
    
    // Build conversation context
    let fullPrompt = 'You are a helpful task management assistant. Help users organize their work, prioritize tasks, and improve productivity.\n\n';
    
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
      throw new Error(`Gemini API error: ${response.status} - ${errorData.error?.message || 'Unknown error'}`);
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
    
    // Test OpenAI
    try {
      await this.chatWithOpenAI('test', []);
      result.openai.available = true;
    } catch (error) {
      result.openai.error = error instanceof Error ? error.message : 'Unknown error';
    }
    
    // Test Gemini
    try {
      await this.chatWithGemini('test', []);
      result.gemini.available = true;
    } catch (error) {
      result.gemini.error = error instanceof Error ? error.message : 'Unknown error';
    }
    
    return result;
  }
}

export const aiService = AIService.getInstance();