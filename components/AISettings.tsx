import React, { useState, useEffect } from 'react';
import { aiService, AISettings, AIProvider, ExpertDomain, EXPERT_PROMPTS } from '../services/aiService';

interface AISettingsProps {
  isOpen: boolean;
  onClose: () => void;
}

const AISettingsComponent: React.FC<AISettingsProps> = ({ isOpen, onClose }) => {
  const [settings, setSettings] = useState<AISettings>(aiService.getSettings());
  const [providerStatus, setProviderStatus] = useState<{
    openai: { available: boolean; error?: string };
    gemini: { available: boolean; error?: string };
  } | null>(null);
  const [isTestingProviders, setIsTestingProviders] = useState(false);

  // Load current settings when modal opens
  useEffect(() => {
    if (isOpen) {
      setSettings(aiService.getSettings());
      testProviders();
    }
  }, [isOpen]);

  const testProviders = async () => {
    setIsTestingProviders(true);
    try {
      const status = await aiService.getProviderStatus();
      setProviderStatus(status);
    } catch (error) {
      console.error('Failed to test providers:', error);
    } finally {
      setIsTestingProviders(false);
    }
  };

  const handleSave = () => {
    aiService.updateSettings(settings);
    onClose();
  };

  const handleProviderChange = (provider: AIProvider) => {
    setSettings(prev => ({ ...prev, primaryProvider: provider }));
  };

  const handleToggleFallback = () => {
    setSettings(prev => ({ ...prev, enableFallback: !prev.enableFallback }));
  };

  const handleModelChange = (provider: 'openai' | 'gemini', model: string) => {
    if (provider === 'openai') {
      setSettings(prev => ({ ...prev, openaiModel: model }));
    } else {
      setSettings(prev => ({ ...prev, geminiModel: model }));
    }
  };

  const getProviderStatusIcon = (provider: 'openai' | 'gemini') => {
    if (isTestingProviders) return '🔄';
    if (!providerStatus) return '❓';
    return providerStatus[provider].available ? '✅' : '❌';
  };

  const getProviderStatusText = (provider: 'openai' | 'gemini') => {
    if (isTestingProviders) return 'Testing...';
    if (!providerStatus) return 'Unknown';
    return providerStatus[provider].available ? 'Available' : 'Error';
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl p-6 max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
            🤖 AI Settings
          </h3>
          <button
            onClick={onClose}
            className="text-slate-500 hover:text-slate-700 text-xl font-bold"
          >
            ✕
          </button>
        </div>

        <div className="space-y-6">
          {/* Provider Selection */}
          <div>
            <h4 className="text-lg font-semibold text-slate-800 mb-3">Primary AI Provider</h4>
            <div className="space-y-3">
              <label className="flex items-center p-4 border-2 border-slate-200 rounded-lg cursor-pointer hover:bg-slate-50">
                <input
                  type="radio"
                  name="provider"
                  value="openai"
                  checked={settings.primaryProvider === 'openai'}
                  onChange={() => handleProviderChange('openai')}
                  className="mr-3"
                />
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="font-medium text-slate-800">OpenAI GPT</span>
                      <p className="text-sm text-slate-600">ChatGPT models (GPT-3.5, GPT-4)</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-2xl">{getProviderStatusIcon('openai')}</span>
                      <span className="text-sm text-slate-600">{getProviderStatusText('openai')}</span>
                    </div>
                  </div>
                  {providerStatus?.openai.error && (
                    <p className="text-xs text-red-600 mt-1">{providerStatus.openai.error}</p>
                  )}
                </div>
              </label>

              <label className="flex items-center p-4 border-2 border-slate-200 rounded-lg cursor-pointer hover:bg-slate-50">
                <input
                  type="radio"
                  name="provider"
                  value="gemini"
                  checked={settings.primaryProvider === 'gemini'}
                  onChange={() => handleProviderChange('gemini')}
                  className="mr-3"
                />
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="font-medium text-slate-800">Google Gemini</span>
                      <p className="text-sm text-slate-600">Gemini Pro models</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-2xl">{getProviderStatusIcon('gemini')}</span>
                      <span className="text-sm text-slate-600">{getProviderStatusText('gemini')}</span>
                    </div>
                  </div>
                  {providerStatus?.gemini.error && (
                    <p className="text-xs text-red-600 mt-1">{providerStatus.gemini.error}</p>
                  )}
                </div>
              </label>
            </div>
          </div>

          {/* Fallback Settings */}
          <div>
            <h4 className="text-lg font-semibold text-slate-800 mb-3">Fallback Settings</h4>
            <label className="flex items-center p-4 border border-slate-200 rounded-lg cursor-pointer hover:bg-slate-50">
              <input
                type="checkbox"
                checked={settings.enableFallback}
                onChange={handleToggleFallback}
                className="mr-3"
              />
              <div>
                <span className="font-medium text-slate-800">Enable Auto Fallback</span>
                <p className="text-sm text-slate-600">
                  Automatically switch to the other provider if the primary one fails or hits rate limits
                </p>
              </div>
            </label>
          </div>

          {/* Assistant Mode */}
          <div>
            <h4 className="text-lg font-semibold text-slate-800 mb-3">Assistant Mode</h4>
            <div className="space-y-3">
              <label className="flex items-center p-3 border border-slate-200 rounded-lg cursor-pointer hover:bg-slate-50">
                <input
                  type="radio"
                  name="mode"
                  value="general"
                  checked={settings.mode === 'general'}
                  onChange={() => setSettings(prev => ({ ...prev, mode: 'general' }))}
                  className="mr-3"
                />
                <div>
                  <span className="font-medium text-slate-800">🧠 General Knowledge</span>
                  <p className="text-sm text-slate-600">Broad expertise across many domains - good for general questions and tasks</p>
                </div>
              </label>

              <label className="flex items-center p-3 border border-slate-200 rounded-lg cursor-pointer hover:bg-slate-50">
                <input
                  type="radio"
                  name="mode"
                  value="expert"
                  checked={settings.mode === 'expert'}
                  onChange={() => setSettings(prev => ({ ...prev, mode: 'expert' }))}
                  className="mr-3"
                />
                <div>
                  <span className="font-medium text-slate-800">👨‍💼 Expert Mode</span>
                  <p className="text-sm text-slate-600">Specialized knowledge in specific domains - choose your expert below</p>
                </div>
              </label>
            </div>

            {settings.mode === 'expert' && (
              <div className="mt-4 p-4 bg-blue-50 rounded-lg">
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Expert Domain
                </label>
                <select
                  value={settings.expertDomain}
                  onChange={(e) => setSettings(prev => ({ ...prev, expertDomain: e.target.value as ExpertDomain }))}
                  className="w-full px-3 py-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-brand-500 focus:border-transparent"
                >
                  <option value="business">👔 Business & Strategy</option>
                  <option value="tech">💻 Technology & Programming</option>
                  <option value="marketing">📢 Marketing & Growth</option>
                  <option value="design">🎨 Design & User Experience</option>
                  <option value="finance">💰 Finance & Investment</option>
                  <option value="legal">⚖️ Legal & Compliance</option>
                  <option value="medical">🏥 Medical & Healthcare</option>
                  <option value="education">📚 Education & Learning</option>
                  <option value="engineering">🔧 Engineering & Technical</option>
                  <option value="research">🔬 Research & Analysis</option>
                  <option value="writing">✍️ Writing & Communication</option>
                  <option value="data-analysis">📊 Data Analysis & Statistics</option>
                  <option value="project-management">📋 Project Management</option>
                </select>
                <div className="mt-2 p-2 bg-white rounded border text-xs text-slate-600">
                  <strong>Expert Context:</strong> {EXPERT_PROMPTS[settings.expertDomain]}
                </div>
              </div>
            )}
          </div>

          {/* Custom Instructions */}
          <div>
            <h4 className="text-lg font-semibold text-slate-800 mb-3">Custom Instructions</h4>
            <textarea
              value={settings.customInstructions}
              onChange={(e) => setSettings(prev => ({ ...prev, customInstructions: e.target.value }))}
              placeholder="Add custom instructions for the AI assistant (optional)..."
              rows={3}
              className="w-full px-3 py-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-brand-500 focus:border-transparent resize-none"
            />
            <p className="text-xs text-slate-500 mt-1">
              These instructions will be added to every conversation to customize the AI's behavior
            </p>
          </div>

          {/* File Upload Settings */}
          <div>
            <h4 className="text-lg font-semibold text-slate-800 mb-3">File Upload Settings</h4>
            <div className="space-y-4">
              <label className="flex items-center p-3 border border-slate-200 rounded-lg cursor-pointer hover:bg-slate-50">
                <input
                  type="checkbox"
                  checked={settings.enableFileUploads}
                  onChange={() => setSettings(prev => ({ ...prev, enableFileUploads: !prev.enableFileUploads }))}
                  className="mr-3"
                />
                <div>
                  <span className="font-medium text-slate-800">📁 Enable File Uploads</span>
                  <p className="text-sm text-slate-600">Allow uploading PDF, images, documents, and presentations</p>
                </div>
              </label>

              {settings.enableFileUploads && (
                <div className="p-4 bg-green-50 rounded-lg">
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Maximum File Size (MB)
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="50"
                    value={settings.maxFileSize}
                    onChange={(e) => setSettings(prev => ({ ...prev, maxFileSize: parseInt(e.target.value) || 10 }))}
                    className="w-full px-3 py-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-brand-500 focus:border-transparent"
                  />
                  <div className="mt-2 text-xs text-slate-600">
                    <strong>Supported formats:</strong> PDF, Images (JPG, PNG, GIF), Word (DOC, DOCX), PowerPoint (PPT, PPTX), Text (TXT, CSV)
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Model Settings */}
          <div>
            <h4 className="text-lg font-semibold text-slate-800 mb-3">Model Configuration</h4>
            <div className="grid gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  OpenAI Model
                </label>
                <select
                  value={settings.openaiModel}
                  onChange={(e) => handleModelChange('openai', e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-brand-500 focus:border-transparent"
                >
                  <option value="gpt-3.5-turbo">GPT-3.5 Turbo (Fast & Affordable)</option>
                  <option value="gpt-4">GPT-4 (More Capable)</option>
                  <option value="gpt-4-turbo-preview">GPT-4 Turbo (Latest)</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Gemini Model
                </label>
                <select
                  value={settings.geminiModel}
                  onChange={(e) => handleModelChange('gemini', e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-brand-500 focus:border-transparent"
                >
                  <option value="gemini-1.5-flash">Gemini 1.5 Flash (Fast & Free)</option>
                  <option value="gemini-1.5-pro">Gemini 1.5 Pro (More Capable)</option>
                  <option value="gemini-pro">Gemini Pro (Legacy)</option>
                </select>
              </div>
            </div>
          </div>

          {/* Current Status */}
          <div className="bg-slate-50 p-4 rounded-lg">
            <h4 className="text-sm font-semibold text-slate-800 mb-2">Current Configuration</h4>
            <div className="text-sm text-slate-600 space-y-1">
              <p><strong>Primary:</strong> {settings.primaryProvider === 'openai' ? 'OpenAI' : 'Gemini'} ({settings.primaryProvider === 'openai' ? settings.openaiModel : settings.geminiModel})</p>
              <p><strong>Mode:</strong> {settings.mode === 'expert' ? `🎯 Expert (${settings.expertDomain})` : '🧠 General Knowledge'}</p>
              <p><strong>Fallback:</strong> {settings.enableFallback ? 'Enabled' : 'Disabled'}</p>
              <p><strong>File Uploads:</strong> {settings.enableFileUploads ? `Enabled (${settings.maxFileSize}MB max)` : 'Disabled'}</p>
              {settings.customInstructions && (
                <p><strong>Custom Instructions:</strong> {settings.customInstructions.length > 50 ? settings.customInstructions.substring(0, 50) + '...' : settings.customInstructions}</p>
              )}
            </div>
          </div>

          {/* API Key Info */}
          <div className="bg-blue-50 p-4 rounded-lg">
            <h4 className="text-sm font-semibold text-blue-800 mb-2">📋 API Key Status</h4>
            <div className="text-sm text-blue-700 space-y-1">
              <p><strong>OpenAI:</strong> {import.meta.env.VITE_OPENAI_API_KEY ? '✅ Configured' : '❌ Missing'}</p>
              <p><strong>Gemini:</strong> {import.meta.env.VITE_GEMINI_API_KEY ? '✅ Configured' : '❌ Missing'}</p>
              {(!import.meta.env.VITE_OPENAI_API_KEY || !import.meta.env.VITE_GEMINI_API_KEY) && (
                <p className="text-xs mt-2">⚠️ Configure API keys in your .env file for full functionality</p>
              )}
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-3 pt-6 mt-6 border-t">
          <button
            onClick={testProviders}
            disabled={isTestingProviders}
            className="bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white px-4 py-2 rounded-lg font-medium transition-colors"
          >
            {isTestingProviders ? '🔄 Testing...' : '🧪 Test Providers'}
          </button>
          <button
            onClick={() => setSettings(aiService.getSettings())}
            className="bg-slate-500 hover:bg-slate-600 text-white px-4 py-2 rounded-lg font-medium transition-colors"
          >
            Reset
          </button>
          <div className="flex-1"></div>
          <button
            onClick={onClose}
            className="bg-slate-500 hover:bg-slate-600 text-white px-4 py-2 rounded-lg font-medium transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="bg-brand-600 hover:bg-brand-700 text-white px-4 py-2 rounded-lg font-medium transition-colors"
          >
            Save Settings
          </button>
        </div>
      </div>
    </div>
  );
};

export default AISettingsComponent;