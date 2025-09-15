'use client'

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useApp } from '@/providers/AppProvider';
import { 
  ArrowLeftIcon,
  CogIcon,
  SparklesIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  EyeIcon,
  EyeSlashIcon
} from '@heroicons/react/24/outline';
import { AIProviderConfig } from '@/types';
import { DEFAULT_AI_PROVIDERS, validateAIConfig } from '@/services/ai';

export default function SettingsPage() {
  const router = useRouter();
  const { state, actions, aiService } = useApp();
  const [activeTab, setActiveTab] = useState<'general' | 'ai'>('general');
  const [aiSettings, setAiSettings] = useState<AIProviderConfig>(state.settings.aiProvider);
  const [isTestingConnection, setIsTestingConnection] = useState(false);
  const [connectionTestResult, setConnectionTestResult] = useState<{
    success: boolean;
    message: string;
  } | null>(null);
  const [showApiKey, setShowApiKey] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  // Check for unsaved changes
  useEffect(() => {
    const hasChanges = JSON.stringify(aiSettings) !== JSON.stringify(state.settings.aiProvider);
    setHasUnsavedChanges(hasChanges);
  }, [aiSettings, state.settings.aiProvider]);

  const handleBack = () => {
    if (hasUnsavedChanges) {
      if (confirm('You have unsaved changes. Are you sure you want to leave?')) {
        router.push('/');
      }
    } else {
      router.push('/');
    }
  };

  const handleProviderSelect = (providerKey: keyof typeof DEFAULT_AI_PROVIDERS) => {
    setAiSettings(DEFAULT_AI_PROVIDERS[providerKey]);
    setConnectionTestResult(null);
  };

  const handleAiSettingChange = (field: keyof AIProviderConfig, value: string | number | boolean) => {
    setAiSettings(prev => ({
      ...prev,
      [field]: value
    }));
    setConnectionTestResult(null);
  };

  const handleTestConnection = async () => {
    setIsTestingConnection(true);
    setConnectionTestResult(null);

    try {
      // Update AI service with current settings for testing
      aiService.updateConfig(aiSettings);
      const success = await actions.testAIConnection();
      
      setConnectionTestResult({
        success,
        message: success ? 'Connection successful!' : 'Connection failed. Please check your settings.'
      });
    } catch (error) {
      setConnectionTestResult({
        success: false,
        message: `Connection failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      });
    } finally {
      setIsTestingConnection(false);
    }
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await actions.updateAISettings(aiSettings);
      setConnectionTestResult(null);
      actions.setError(null);
      
      // Show success message
      alert('Settings saved successfully!');
    } catch (error) {
      console.error('Failed to save settings:', error);
      actions.setError('Failed to save settings');
    } finally {
      setIsSaving(false);
    }
  };

  const handleReset = () => {
    if (confirm('Are you sure you want to reset AI settings to default?')) {
      setAiSettings(DEFAULT_AI_PROVIDERS.openai);
      setConnectionTestResult(null);
    }
  };

  const validationResult = validateAIConfig(aiSettings);

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <button
              onClick={handleBack}
              className="flex items-center text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 transition-colors"
            >
              <ArrowLeftIcon className="w-5 h-5 mr-2" />
              Back to Dashboard
            </button>
            <div className="flex items-center space-x-2">
              <CogIcon className="w-6 h-6 text-gray-400" />
              <h1 className="text-xl font-semibold text-gray-900 dark:text-white">Settings</h1>
            </div>
          </div>
          
          <div className="flex items-center space-x-3">
            {hasUnsavedChanges && (
              <span className="text-sm text-amber-600 dark:text-amber-400">
                Unsaved changes
              </span>
            )}
            <button
              onClick={handleSave}
              disabled={isSaving || !validationResult.valid || !hasUnsavedChanges}
              className="flex items-center px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSaving ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200 dark:border-gray-700">
        <nav className="flex space-x-8 px-6">
          {[
            { id: 'general', label: 'General', icon: CogIcon },
            { id: 'ai', label: 'AI Configuration', icon: SparklesIcon }
          ].map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as typeof activeTab)}
                className={`py-4 px-1 text-sm font-medium border-b-2 transition-colors flex items-center space-x-2 ${
                  activeTab === tab.id
                    ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                    : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </nav>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto p-6">
        {activeTab === 'general' && (
          <div className="max-w-2xl">
            <h2 className="text-lg font-medium text-gray-900 dark:text-white mb-6">General Settings</h2>
            
            <div className="space-y-6">
              {/* Theme */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Theme
                </label>
                <select
                  value={state.settings.theme}
                  onChange={(e) => {
                    // TODO: Implement theme change
                    console.log('Theme change:', e.target.value);
                  }}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="light">Light</option>
                  <option value="dark">Dark</option>
                  <option value="system">System</option>
                </select>
              </div>

              {/* Auto Save */}
              <div className="flex items-center justify-between">
                <div>
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    Auto Save
                  </label>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    Automatically save posts while typing
                  </p>
                </div>
                <input
                  type="checkbox"
                  checked={state.settings.autoSave}
                  onChange={(e) => {
                    // TODO: Implement auto save setting
                    console.log('Auto save change:', e.target.checked);
                  }}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
              </div>

              {/* Analysis Threshold */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Analysis Threshold (words)
                </label>
                <input
                  type="number"
                  min="10"
                  max="1000"
                  value={state.settings.analysisThreshold}
                  onChange={(e) => {
                    // TODO: Implement analysis threshold change
                    console.log('Threshold change:', e.target.value);
                  }}
                  className="w-32 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                  Minimum word count before AI analysis is enabled
                </p>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'ai' && (
          <div className="max-w-4xl">
            <h2 className="text-lg font-medium text-gray-900 dark:text-white mb-6">AI Configuration</h2>
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Left Column - Configuration */}
              <div className="space-y-6">
                {/* Provider Presets */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                    Provider Presets
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    {Object.entries(DEFAULT_AI_PROVIDERS).map(([key, provider]) => (
                      <button
                        key={key}
                        onClick={() => handleProviderSelect(key as keyof typeof DEFAULT_AI_PROVIDERS)}
                        className={`p-3 text-left border rounded-md transition-colors ${
                          aiSettings.name === provider.name
                            ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                            : 'border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700'
                        }`}
                      >
                        <div className="font-medium text-sm text-gray-900 dark:text-white">
                          {provider.name}
                        </div>
                        <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                          {key === 'local' ? 'Local LLM' : key === 'custom' ? 'Custom API' : 'Cloud API'}
                        </div>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Provider Configuration */}
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Provider Name
                    </label>
                    <input
                      type="text"
                      value={aiSettings.name}
                      onChange={(e) => handleAiSettingChange('name', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Base URL
                    </label>
                    <input
                      type="url"
                      value={aiSettings.baseUrl}
                      onChange={(e) => handleAiSettingChange('baseUrl', e.target.value)}
                      placeholder="https://api.openai.com/v1"
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                      API endpoint for OpenAI-compatible services
                    </p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      API Key
                    </label>
                    <div className="relative">
                      <input
                        type={showApiKey ? 'text' : 'password'}
                        value={aiSettings.apiKey}
                        onChange={(e) => handleAiSettingChange('apiKey', e.target.value)}
                        placeholder="sk-..."
                        className="w-full px-3 py-2 pr-10 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                      <button
                        type="button"
                        onClick={() => setShowApiKey(!showApiKey)}
                        className="absolute inset-y-0 right-0 flex items-center pr-3"
                      >
                        {showApiKey ? (
                          <EyeSlashIcon className="w-4 h-4 text-gray-400" />
                        ) : (
                          <EyeIcon className="w-4 h-4 text-gray-400" />
                        )}
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Model
                    </label>
                    <input
                      type="text"
                      value={aiSettings.model}
                      onChange={(e) => handleAiSettingChange('model', e.target.value)}
                      placeholder="gpt-3.5-turbo"
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Temperature
                      </label>
                      <input
                        type="number"
                        min="0"
                        max="2"
                        step="0.1"
                        value={aiSettings.temperature}
                        onChange={(e) => handleAiSettingChange('temperature', parseFloat(e.target.value))}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Max Tokens
                      </label>
                      <input
                        type="number"
                        min="1"
                        max="4000"
                        value={aiSettings.maxTokens}
                        onChange={(e) => handleAiSettingChange('maxTokens', parseInt(e.target.value))}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                        Enable AI Analysis
                      </label>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        Turn on AI-powered writing analysis
                      </p>
                    </div>
                    <input
                      type="checkbox"
                      checked={aiSettings.enabled}
                      onChange={(e) => handleAiSettingChange('enabled', e.target.checked)}
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    />
                  </div>
                </div>
              </div>

              {/* Right Column - Validation and Testing */}
              <div className="space-y-6">
                {/* Validation */}
                <div>
                  <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                    Configuration Validation
                  </h3>
                  <div className="space-y-2">
                    {validationResult.valid ? (
                      <div className="flex items-center text-green-600 dark:text-green-400">
                        <CheckCircleIcon className="w-4 h-4 mr-2" />
                        <span className="text-sm">Configuration is valid</span>
                      </div>
                    ) : (
                      <div>
                        <div className="flex items-center text-red-600 dark:text-red-400 mb-2">
                          <ExclamationTriangleIcon className="w-4 h-4 mr-2" />
                          <span className="text-sm">Configuration has errors</span>
                        </div>
                        <ul className="text-sm text-red-600 dark:text-red-400 list-disc list-inside space-y-1">
                          {validationResult.errors.map((error, index) => (
                            <li key={index}>{error}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                </div>

                {/* Connection Test */}
                <div>
                  <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                    Connection Test
                  </h3>
                  <button
                    onClick={handleTestConnection}
                    disabled={isTestingConnection || !validationResult.valid}
                    className="w-full flex items-center justify-center px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isTestingConnection ? 'Testing...' : 'Test Connection'}
                  </button>

                  {connectionTestResult && (
                    <div className={`mt-3 p-3 rounded-md ${
                      connectionTestResult.success 
                        ? 'bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800'
                        : 'bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800'
                    }`}>
                      <div className={`flex items-center ${
                        connectionTestResult.success 
                          ? 'text-green-600 dark:text-green-400'
                          : 'text-red-600 dark:text-red-400'
                      }`}>
                        {connectionTestResult.success ? (
                          <CheckCircleIcon className="w-4 h-4 mr-2" />
                        ) : (
                          <ExclamationTriangleIcon className="w-4 h-4 mr-2" />
                        )}
                        <span className="text-sm">{connectionTestResult.message}</span>
                      </div>
                    </div>
                  )}
                </div>

                {/* Actions */}
                <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
                  <div className="flex space-x-3">
                    <button
                      onClick={handleReset}
                      className="flex-1 px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-200 bg-gray-100 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md hover:bg-gray-200 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
                    >
                      Reset to Default
                    </button>
                  </div>
                </div>

                {/* Error Display */}
                {(state.error || state.aiError) && (
                  <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-md">
                    <div className="flex items-center text-red-600 dark:text-red-400">
                      <ExclamationTriangleIcon className="w-4 h-4 mr-2" />
                      <span className="text-sm">{state.error || state.aiError}</span>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}