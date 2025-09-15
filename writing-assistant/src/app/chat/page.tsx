'use client'

import React, { useState, useEffect } from 'react';
import { useApp } from '@/providers/AppProvider';
import { MessageList } from '@/components/chat/MessageList';
import { MessageInput } from '@/components/chat/MessageInput';
import { 
  PlusIcon, 
  Cog6ToothIcon,
  ChatBubbleLeftRightIcon,
  SparklesIcon 
} from '@heroicons/react/24/outline';
import { ChatConversation, ChatMessage } from '@/types';

export default function ChatPage() {
  const { state, actions } = useApp();
  const { chatConversations, currentConversation, isLoading, error } = state;
  const [isTyping, setIsTyping] = useState(false);
  const [showSettings, setShowSettings] = useState(false);

  // Initialize with a default conversation if none exists
  useEffect(() => {
    if (!currentConversation && chatConversations.length === 0 && !isLoading) {
      createNewConversation();
    }
  }, [currentConversation, chatConversations, isLoading]);

  const createNewConversation = async () => {
    try {
      const conversation = await actions.createConversation('New Chat');
      actions.setCurrentConversation(conversation);
    } catch (error) {
      console.error('Failed to create conversation:', error);
      actions.setError('Failed to create new conversation');
    }
  };

  const handleSendMessage = async (message: string) => {
    if (!currentConversation || !message.trim()) return;

    try {
      setIsTyping(true);

      // Create user message
      const userMessage: ChatMessage = {
        id: `msg-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        role: 'user',
        content: message.trim(),
        timestamp: new Date(),
        metadata: {
          wordCount: message.trim().split(/\s+/).length
        }
      };

      // Add user message to conversation
      const updatedConversation = {
        ...currentConversation,
        messages: [...currentConversation.messages, userMessage],
        updatedAt: new Date()
      };

      actions.setCurrentConversation(updatedConversation);
      await actions.updateConversation(updatedConversation);

      // TODO: Send to AI service and get response
      // For now, we'll add a placeholder response
      setTimeout(async () => {
        const aiMessage: ChatMessage = {
          id: `msg-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          role: 'assistant',
          content: `I understand you're asking about: "${message}". This is a placeholder response. The AI service integration will be completed to provide real responses based on your writing assistance needs.`,
          timestamp: new Date(),
          metadata: {
            wordCount: 25,
            processingTime: 1500
          }
        };

        const finalConversation = {
          ...updatedConversation,
          messages: [...updatedConversation.messages, aiMessage],
          updatedAt: new Date()
        };

        actions.setCurrentConversation(finalConversation);
        await actions.updateConversation(finalConversation);
        setIsTyping(false);
      }, 1500);

    } catch (error) {
      console.error('Failed to send message:', error);
      actions.setError('Failed to send message');
      setIsTyping(false);
    }
  };

  const handleConversationSelect = (conversation: ChatConversation) => {
    actions.setCurrentConversation(conversation);
  };

  const handleDeleteConversation = async (conversationId: string) => {
    if (confirm('Are you sure you want to delete this conversation?')) {
      try {
        await actions.deleteConversation(conversationId);
        
        // If we deleted the current conversation, switch to another or create new
        if (currentConversation?.id === conversationId) {
          const remainingConversations = chatConversations.filter(c => c.id !== conversationId);
          if (remainingConversations.length > 0) {
            actions.setCurrentConversation(remainingConversations[0]);
          } else {
            actions.setCurrentConversation(null);
            createNewConversation();
          }
        }
      } catch (error) {
        console.error('Failed to delete conversation:', error);
        actions.setError('Failed to delete conversation');
      }
    }
  };

  if (isLoading) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="h-full flex">
      {/* Sidebar - Conversation List */}
      <div className="w-80 border-r border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 flex flex-col">
        {/* Header */}
        <div className="p-4 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
              Conversations
            </h2>
            <div className="flex items-center space-x-2">
              <button
                onClick={createNewConversation}
                className="p-2 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md transition-colors"
                title="New Conversation"
              >
                <PlusIcon className="w-5 h-5" />
              </button>
              <button
                onClick={() => setShowSettings(!showSettings)}
                className="p-2 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md transition-colors"
                title="Settings"
              >
                <Cog6ToothIcon className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>

        {/* Conversation List */}
        <div className="flex-1 overflow-auto">
          {chatConversations.length === 0 ? (
            <div className="p-4 text-center">
              <ChatBubbleLeftRightIcon className="w-12 h-12 text-gray-400 mx-auto mb-3" />
              <p className="text-sm text-gray-500 dark:text-gray-400">
                No conversations yet. Start a new chat!
              </p>
            </div>
          ) : (
            <div className="p-2 space-y-1">
              {chatConversations.map((conversation) => (
                <button
                  key={conversation.id}
                  onClick={() => handleConversationSelect(conversation)}
                  className={`w-full p-3 text-left rounded-lg transition-colors ${
                    currentConversation?.id === conversation.id
                      ? 'bg-blue-50 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300'
                      : 'text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'
                  }`}
                >
                  <div className="font-medium truncate">
                    {conversation.title}
                  </div>
                  <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    {conversation.messages.length} messages • {conversation.updatedAt.toLocaleDateString()}
                  </div>
                  {conversation.messages.length > 0 && (
                    <div className="text-xs text-gray-600 dark:text-gray-400 mt-1 truncate">
                      {conversation.messages[conversation.messages.length - 1].content.substring(0, 50)}...
                    </div>
                  )}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Settings Panel */}
        {showSettings && (
          <div className="border-t border-gray-200 dark:border-gray-700 p-4 bg-gray-50 dark:bg-gray-800/50">
            <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-3">
              Chat Settings
            </h4>
            <div className="space-y-2 text-sm">
              <div>
                <label className="block text-gray-600 dark:text-gray-400 mb-1">
                  Response Style
                </label>
                <select className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-white">
                  <option value="normal">Normal</option>
                  <option value="concise">Concise</option>
                  <option value="detailed">Detailed</option>
                </select>
              </div>
              <div>
                <label className="block text-gray-600 dark:text-gray-400 mb-1">
                  AI Personality
                </label>
                <select className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-white">
                  <option value="professional">Professional</option>
                  <option value="friendly">Friendly</option>
                  <option value="academic">Academic</option>
                </select>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col">
        {currentConversation ? (
          <>
            {/* Chat Header */}
            <div className="border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-4">
              <div className="flex items-center justify-between">
                <div>
                  <h1 className="text-xl font-semibold text-gray-900 dark:text-white">
                    {currentConversation.title}
                  </h1>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    {currentConversation.messages.length} messages • Last active {currentConversation.updatedAt.toLocaleString()}
                  </p>
                </div>
                <button
                  onClick={() => handleDeleteConversation(currentConversation.id)}
                  className="text-sm text-red-600 dark:text-red-400 hover:text-red-800 dark:hover:text-red-300"
                >
                  Delete Chat
                </button>
              </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-hidden">
              <MessageList
                messages={currentConversation.messages}
                isLoading={isTyping}
              />
            </div>

            {/* Message Input */}
            <div className="border-t border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
              <MessageInput
                onSendMessage={handleSendMessage}
                disabled={isTyping}
                placeholder="Ask me anything about your writing..."
              />
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center">
              <SparklesIcon className="w-16 h-16 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                Welcome to your Writing Assistant
              </h3>
              <p className="text-gray-500 dark:text-gray-400 mb-6 max-w-sm">
                Start a conversation to get help with your writing, ask questions, or get feedback on your content.
              </p>
              <button
                onClick={createNewConversation}
                className="flex items-center px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
              >
                <PlusIcon className="w-4 h-4 mr-2" />
                Start New Conversation
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Error Display */}
      {error && (
        <div className="fixed bottom-4 right-4 bg-red-50 dark:bg-red-900/50 border border-red-200 dark:border-red-800 rounded-md p-4 max-w-sm">
          <div className="text-sm text-red-800 dark:text-red-200">
            {error}
          </div>
          <button
            onClick={() => actions.setError(null)}
            className="mt-2 text-xs text-red-600 dark:text-red-400 hover:text-red-800 dark:hover:text-red-300"
          >
            Dismiss
          </button>
        </div>
      )}
    </div>
  );
}