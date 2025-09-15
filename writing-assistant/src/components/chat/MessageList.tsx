'use client'

import React, { useEffect, useRef } from 'react';
import { formatDistanceToNow } from 'date-fns';
import { 
  UserIcon, 
  SparklesIcon, 
  ClockIcon,
  DocumentDuplicateIcon 
} from '@heroicons/react/24/outline';
import { MessageListProps, ChatMessage } from '@/types';

export function MessageList({ messages, isLoading }: MessageListProps) {
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages.length, isLoading]);

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      // TODO: Add toast notification
    } catch (error) {
      console.error('Failed to copy text:', error);
    }
  };

  const renderMessage = (message: ChatMessage, index: number) => {
    const isUser = message.role === 'user';
    const isLast = index === messages.length - 1;

    return (
      <div
        key={message.id}
        className={`flex items-start space-x-3 ${isUser ? 'flex-row-reverse space-x-reverse' : ''} group`}
      >
        {/* Avatar */}
        <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${
          isUser 
            ? 'bg-blue-600 text-white' 
            : 'bg-purple-600 text-white'
        }`}>
          {isUser ? (
            <UserIcon className="w-4 h-4" />
          ) : (
            <SparklesIcon className="w-4 h-4" />
          )}
        </div>

        {/* Message content */}
        <div className={`flex-1 max-w-3xl ${isUser ? 'text-right' : 'text-left'}`}>
          {/* Message bubble */}
          <div className={`inline-block p-4 rounded-lg ${
            isUser
              ? 'bg-blue-600 text-white'
              : 'bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-white'
          }`}>
            <div className="prose prose-sm max-w-none">
              <div className="whitespace-pre-wrap">{message.content}</div>
            </div>
          </div>

          {/* Message metadata */}
          <div className={`mt-2 flex items-center space-x-2 text-xs text-gray-500 dark:text-gray-400 ${
            isUser ? 'justify-end' : 'justify-start'
          }`}>
            <div className="flex items-center space-x-1">
              <ClockIcon className="w-3 h-3" />
              <span>{formatDistanceToNow(message.timestamp, { addSuffix: true })}</span>
            </div>
            
            {message.metadata?.wordCount && (
              <span>• {message.metadata.wordCount} words</span>
            )}
            
            {message.metadata?.processingTime && (
              <span>• {message.metadata.processingTime}ms</span>
            )}

            {/* Copy button */}
            <button
              onClick={() => copyToClipboard(message.content)}
              className="opacity-0 group-hover:opacity-100 transition-opacity hover:text-gray-700 dark:hover:text-gray-300"
              title="Copy message"
            >
              <DocumentDuplicateIcon className="w-3 h-3" />
            </button>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div 
      ref={containerRef}
      className="h-full overflow-y-auto p-4 space-y-6"
    >
      {messages.length === 0 ? (
        <div className="flex items-center justify-center h-full">
          <div className="text-center">
            <SparklesIcon className="w-12 h-12 text-gray-300 dark:text-gray-600 mx-auto mb-3" />
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
              Start the conversation
            </h3>
            <p className="text-gray-500 dark:text-gray-400 max-w-sm">
              Ask me anything about writing, get feedback on your content, or seek help with your blog posts.
            </p>
            <div className="mt-6 space-y-2 text-sm text-gray-600 dark:text-gray-400">
              <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-3">
                <div className="font-medium mb-1">Example questions:</div>
                <ul className="text-left list-disc list-inside space-y-1">
                  <li>"How can I make this paragraph clearer?"</li>
                  <li>"What's the best way to structure a blog post?"</li>
                  <li>"Can you help me improve the tone of my writing?"</li>
                  <li>"How do I write for my target audience?"</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <>
          {messages.map((message, index) => renderMessage(message, index))}
          
          {/* Loading indicator */}
          {isLoading && (
            <div className="flex items-start space-x-3">
              <div className="flex-shrink-0 w-8 h-8 rounded-full bg-purple-600 text-white flex items-center justify-center">
                <SparklesIcon className="w-4 h-4" />
              </div>
              <div className="flex-1">
                <div className="inline-block p-4 rounded-lg bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
                  <div className="flex items-center space-x-2">
                    <div className="flex space-x-1">
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                    </div>
                    <span className="text-sm text-gray-500 dark:text-gray-400">AI is typing...</span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </>
      )}
      
      {/* Scroll anchor */}
      <div ref={messagesEndRef} />
    </div>
  );
}