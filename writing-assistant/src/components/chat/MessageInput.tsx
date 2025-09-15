'use client'

import React, { useState, useRef, KeyboardEvent } from 'react';
import { 
  PaperAirplaneIcon, 
  PaperClipIcon,
  MicrophoneIcon,
  CommandLineIcon 
} from '@heroicons/react/24/outline';
import { MessageInputProps } from '@/types';

export function MessageInput({ 
  onSendMessage, 
  disabled, 
  placeholder = "Type your message..." 
}: MessageInputProps) {
  const [message, setMessage] = useState('');
  const [isMultiline, setIsMultiline] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const handleSend = () => {
    const trimmedMessage = message.trim();
    if (trimmedMessage && !disabled) {
      onSendMessage(trimmedMessage);
      setMessage('');
      setIsMultiline(false);
      // Reset textarea height
      if (textareaRef.current) {
        textareaRef.current.style.height = 'auto';
      }
    }
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    // Send message on Enter (unless Shift+Enter for new line)
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
    
    // Toggle multiline mode with Shift+Enter
    if (e.key === 'Enter' && e.shiftKey) {
      setIsMultiline(true);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setMessage(e.target.value);
    
    // Auto-resize textarea
    const textarea = e.target;
    textarea.style.height = 'auto';
    const scrollHeight = textarea.scrollHeight;
    const maxHeight = 120; // Max height in pixels
    
    if (scrollHeight > maxHeight) {
      textarea.style.height = `${maxHeight}px`;
    } else {
      textarea.style.height = `${scrollHeight}px`;
    }
    
    // Check if we need multiline mode
    if (scrollHeight > 48) { // Single line height
      setIsMultiline(true);
    } else if (e.target.value === '') {
      setIsMultiline(false);
    }
  };

  const quickPrompts = [
    "How can I improve this writing?",
    "Check this for clarity and tone",
    "Help me restructure this content",
    "What's wrong with this paragraph?"
  ];

  const handleQuickPrompt = (prompt: string) => {
    setMessage(prompt);
    if (textareaRef.current) {
      textareaRef.current.focus();
    }
  };

  return (
    <div className="p-4 space-y-3">
      {/* Quick prompts */}
      {message === '' && (
        <div className="flex flex-wrap gap-2">
          {quickPrompts.map((prompt, index) => (
            <button
              key={index}
              onClick={() => handleQuickPrompt(prompt)}
              className="text-xs px-3 py-1 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-full hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
              disabled={disabled}
            >
              {prompt}
            </button>
          ))}
        </div>
      )}

      {/* Input area */}
      <div className="flex items-end space-x-3">
        {/* Attachment button */}
        <button
          className="flex-shrink-0 p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md transition-colors"
          title="Attach file (Coming soon)"
          disabled
        >
          <PaperClipIcon className="w-5 h-5" />
        </button>

        {/* Message input container */}
        <div className="flex-1 relative">
          {/* Input field */}
          <div className="relative">
            <textarea
              ref={textareaRef}
              value={message}
              onChange={handleInputChange}
              onKeyDown={handleKeyDown}
              placeholder={placeholder}
              disabled={disabled}
              rows={1}
              className={`w-full resize-none border border-gray-300 dark:border-gray-600 rounded-lg px-4 py-3 pr-12 bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors ${
                disabled ? 'opacity-50 cursor-not-allowed' : ''
              }`}
              style={{ 
                minHeight: '48px',
                maxHeight: '120px'
              }}
            />
            
            {/* Character/word count */}
            {message.length > 0 && (
              <div className="absolute bottom-1 left-2 text-xs text-gray-400">
                {message.trim().split(/\s+/).filter(word => word.length > 0).length} words
              </div>
            )}
          </div>

          {/* Keyboard shortcuts hint */}
          {message === '' && (
            <div className="absolute bottom-2 right-2 text-xs text-gray-400 pointer-events-none">
              <div className="flex items-center space-x-1">
                <CommandLineIcon className="w-3 h-3" />
                <span>Enter to send • Shift+Enter for new line</span>
              </div>
            </div>
          )}
        </div>

        {/* Voice input button */}
        <button
          className="flex-shrink-0 p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md transition-colors"
          title="Voice input (Coming soon)"
          disabled
        >
          <MicrophoneIcon className="w-5 h-5" />
        </button>

        {/* Send button */}
        <button
          onClick={handleSend}
          disabled={disabled || !message.trim()}
          className={`flex-shrink-0 p-2 rounded-md transition-colors ${
            disabled || !message.trim()
              ? 'text-gray-400 cursor-not-allowed'
              : 'text-white bg-blue-600 hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2'
          }`}
          title="Send message (Enter)"
        >
          <PaperAirplaneIcon className="w-5 h-5" />
        </button>
      </div>

      {/* Input hints */}
      {isMultiline && (
        <div className="text-xs text-gray-500 dark:text-gray-400 flex items-center justify-between">
          <span>Shift+Enter for new line • Enter to send</span>
          <span>{message.length} characters</span>
        </div>
      )}
    </div>
  );
}