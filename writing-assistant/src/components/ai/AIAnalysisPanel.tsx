'use client'

import React, { useState } from 'react';
import { 
  SparklesIcon, 
  ExclamationTriangleIcon,
  CheckCircleIcon,
  InformationCircleIcon,
  EyeIcon,
  UserIcon,
  ClockIcon,
  ChartBarIcon
} from '@heroicons/react/24/outline';
import { AIAnalysisPanelProps, AnalysisResult, Suggestion } from '@/types';

export function AIAnalysisPanel({ 
  content, 
  isAnalyzing, 
  analysisResults, 
  onAnalyze 
}: AIAnalysisPanelProps) {
  const [activeTab, setActiveTab] = useState<'overview' | 'suggestions' | 'details'>('overview');

  const wordCount = content.trim().split(/\s+/).filter(word => word.length > 0).length;
  const readingTime = Math.ceil(wordCount / 200); // Average reading speed

  const getSeverityColor = (severity: Suggestion['severity']) => {
    switch (severity) {
      case 'high':
        return 'text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/50';
      case 'medium':
        return 'text-yellow-600 dark:text-yellow-400 bg-yellow-50 dark:bg-yellow-900/50';
      case 'low':
        return 'text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/50';
      default:
        return 'text-gray-600 dark:text-gray-400 bg-gray-50 dark:bg-gray-900/50';
    }
  };

  const getSeverityIcon = (severity: Suggestion['severity']) => {
    switch (severity) {
      case 'high':
        return ExclamationTriangleIcon;
      case 'medium':
        return InformationCircleIcon;
      case 'low':
        return CheckCircleIcon;
      default:
        return InformationCircleIcon;
    }
  };

  const renderOverview = () => (
    <div className="space-y-4">
      {/* Content metrics */}
      <div className="grid grid-cols-2 gap-3">
        <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-3">
          <div className="text-sm font-medium text-gray-500 dark:text-gray-400">Words</div>
          <div className="text-xl font-bold text-gray-900 dark:text-white">{wordCount}</div>
        </div>
        <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-3">
          <div className="text-sm font-medium text-gray-500 dark:text-gray-400">Read Time</div>
          <div className="text-xl font-bold text-gray-900 dark:text-white">{readingTime}m</div>
        </div>
      </div>

      {analysisResults && (
        <>
          {/* Readability scores */}
          <div className="space-y-3">
            <h4 className="font-medium text-gray-900 dark:text-white">Analysis Scores</h4>
            
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600 dark:text-gray-400">Readability</span>
                <div className="flex items-center space-x-2">
                  <div className="w-20 bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                    <div 
                      className="bg-blue-600 h-2 rounded-full"
                      style={{ width: `${analysisResults.metrics.readabilityScore * 10}%` }}
                    ></div>
                  </div>
                  <span className="text-sm font-medium text-gray-900 dark:text-white">
                    {analysisResults.metrics.readabilityScore}/10
                  </span>
                </div>
              </div>
              
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600 dark:text-gray-400">Clarity</span>
                <div className="flex items-center space-x-2">
                  <div className="w-20 bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                    <div 
                      className="bg-green-600 h-2 rounded-full"
                      style={{ width: `${analysisResults.metrics.clarityScore * 10}%` }}
                    ></div>
                  </div>
                  <span className="text-sm font-medium text-gray-900 dark:text-white">
                    {analysisResults.metrics.clarityScore}/10
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Quick insights */}
          <div className="space-y-3">
            <h4 className="font-medium text-gray-900 dark:text-white">Quick Insights</h4>
            <div className="space-y-2">
              <div className="flex items-center space-x-2 text-sm">
                <UserIcon className="w-4 h-4 text-gray-400" />
                <span className="text-gray-600 dark:text-gray-400">
                  Target Audience: {analysisResults.metrics.targetAudience}
                </span>
              </div>
              <div className="flex items-center space-x-2 text-sm">
                <EyeIcon className="w-4 h-4 text-gray-400" />
                <span className="text-gray-600 dark:text-gray-400">
                  Tone: {analysisResults.metrics.toneAnalysis}
                </span>
              </div>
            </div>
          </div>
        </>
      )}

      {/* Analysis button */}
      {!analysisResults && (
        <div className="pt-4">
          <button
            onClick={onAnalyze}
            disabled={isAnalyzing || wordCount < 10}
            className="w-full flex items-center justify-center px-4 py-3 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <SparklesIcon className="w-4 h-4 mr-2" />
            {isAnalyzing ? 'Analyzing...' : 'Analyze Writing'}
          </button>
          {wordCount < 10 && (
            <p className="mt-2 text-xs text-gray-500 dark:text-gray-400 text-center">
              Write at least 10 words to enable analysis
            </p>
          )}
        </div>
      )}
    </div>
  );

  const renderSuggestions = () => (
    <div className="space-y-3">
      {analysisResults?.suggestions.length ? (
        analysisResults.suggestions.map((suggestion, index) => {
          const SeverityIcon = getSeverityIcon(suggestion.severity);
          return (
            <div
              key={index}
              className={`p-3 rounded-lg border ${getSeverityColor(suggestion.severity)}`}
            >
              <div className="flex items-start space-x-2">
                <SeverityIcon className="w-4 h-4 mt-0.5 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium capitalize">
                    {suggestion.type} Issue
                  </div>
                  <p className="text-sm mt-1 opacity-90">
                    {suggestion.description}
                  </p>
                  {suggestion.originalText && (
                    <div className="mt-2 p-2 bg-black/5 dark:bg-white/5 rounded text-xs">
                      <div className="font-medium">Original:</div>
                      <div className="mt-1 font-mono">{suggestion.originalText}</div>
                      {suggestion.suggestedText && (
                        <>
                          <div className="font-medium mt-2">Suggested:</div>
                          <div className="mt-1 font-mono">{suggestion.suggestedText}</div>
                        </>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          );
        })
      ) : (
        <div className="text-center py-8">
          <CheckCircleIcon className="w-12 h-12 text-green-500 mx-auto mb-3" />
          <div className="text-sm text-gray-600 dark:text-gray-400">
            {analysisResults ? 'No issues found! Your writing looks great.' : 'Run analysis to see suggestions'}
          </div>
        </div>
      )}
    </div>
  );

  const renderDetails = () => (
    <div className="space-y-4">
      {analysisResults ? (
        <>
          {/* Ambiguous phrases */}
          {analysisResults.ambiguousPhrases.length > 0 && (
            <div>
              <h4 className="font-medium text-gray-900 dark:text-white mb-3">Ambiguous Phrases</h4>
              <div className="space-y-2">
                {analysisResults.ambiguousPhrases.map((phrase, index) => (
                  <div key={index} className="p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg border border-yellow-200 dark:border-yellow-800">
                    <div className="text-sm font-medium text-yellow-800 dark:text-yellow-200">
                      "{phrase.text}"
                    </div>
                    <div className="text-xs text-yellow-600 dark:text-yellow-300 mt-1">
                      {phrase.reason}
                    </div>
                    {phrase.suggestions.length > 0 && (
                      <div className="mt-2">
                        <div className="text-xs font-medium text-yellow-700 dark:text-yellow-200">Suggestions:</div>
                        <ul className="text-xs text-yellow-600 dark:text-yellow-300 mt-1 list-disc list-inside">
                          {phrase.suggestions.map((suggestion, idx) => (
                            <li key={idx}>{suggestion}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Analysis timestamp */}
          <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
            <div className="flex items-center space-x-2 text-xs text-gray-500 dark:text-gray-400">
              <ClockIcon className="w-4 h-4" />
              <span>Analyzed {analysisResults.timestamp.toLocaleString()}</span>
            </div>
          </div>
        </>
      ) : (
        <div className="text-center py-8">
          <ChartBarIcon className="w-12 h-12 text-gray-400 mx-auto mb-3" />
          <div className="text-sm text-gray-600 dark:text-gray-400">
            Analysis details will appear here after running analysis
          </div>
        </div>
      )}
    </div>
  );

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="p-4 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-medium text-gray-900 dark:text-white">
            AI Analysis
          </h3>
          {analysisResults && (
            <button
              onClick={onAnalyze}
              disabled={isAnalyzing}
              className="text-sm text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300"
            >
              {isAnalyzing ? 'Analyzing...' : 'Re-analyze'}
            </button>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200 dark:border-gray-700">
        <nav className="flex space-x-4 px-4">
          {[
            { id: 'overview', label: 'Overview' },
            { id: 'suggestions', label: 'Suggestions' },
            { id: 'details', label: 'Details' }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as typeof activeTab)}
              className={`py-2 px-1 text-sm font-medium border-b-2 transition-colors ${
                activeTab === tab.id
                  ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                  : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
              }`}
            >
              {tab.label}
              {tab.id === 'suggestions' && analysisResults?.suggestions.length ? (
                <span className="ml-1 inline-flex items-center justify-center px-2 py-1 text-xs font-bold leading-none text-red-100 bg-red-600 rounded-full">
                  {analysisResults.suggestions.length}
                </span>
              ) : null}
            </button>
          ))}
        </nav>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto p-4">
        {isAnalyzing ? (
          <div className="flex items-center justify-center h-32">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
              <div className="text-sm text-gray-500 dark:text-gray-400">Analyzing your writing...</div>
            </div>
          </div>
        ) : (
          <>
            {activeTab === 'overview' && renderOverview()}
            {activeTab === 'suggestions' && renderSuggestions()}
            {activeTab === 'details' && renderDetails()}
          </>
        )}
      </div>
    </div>
  );
}