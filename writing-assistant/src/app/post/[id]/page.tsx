'use client'

import React, { useEffect, useState, useMemo } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useApp } from '@/providers/AppProvider';
import { TextEditor } from '@/components/editor/TextEditor';
import { AIAnalysisPanel } from '@/components/ai/AIAnalysisPanel';
import { storageService } from '@/services/storage';
import { 
  ArrowLeftIcon, 
  CloudArrowUpIcon, 
  SparklesIcon,
  BookmarkIcon,
  EyeIcon,
  TrashIcon
} from '@heroicons/react/24/outline';
import { Post, AnalysisResult } from '@/types';

export default function PostEditorPage() {
  const params = useParams();
  const router = useRouter();
  const { state, actions } = useApp();
  const [currentPost, setCurrentPost] = useState<Post | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);

  const postId = params.id as string;
  
  // Get the latest analysis result for this post
  const latestAnalysisResult = useMemo((): AnalysisResult | null => {
    if (!currentPost || currentPost.analysisHistory.length === 0) {
      return null;
    }
    return currentPost.analysisHistory[currentPost.analysisHistory.length - 1];
  }, [currentPost?.analysisHistory]);

  // Load post data
  useEffect(() => {
    const loadPost = async () => {
      setIsLoading(true);
      try {
        // Wait for app state to be ready (not loading)
        if (state.isLoading) {
          setIsLoading(false);
          return;
        }

        // First check if it's in the current state
        let post = state.posts.find(p => p.id === postId);
        
        if (!post) {
          // If not in state, try to load directly from storage
          try {
            const postFromStorage = await storageService.getPost(postId);
            post = postFromStorage || undefined;
          } catch (storageError) {
            console.error('Failed to load post from storage:', storageError);
          }
          
          if (!post) {
            // Handle special case for 'new' postId
            if (postId === 'new') {
              post = await actions.createPost('Untitled Post');
              router.replace(`/post/${post.id}`);
            } else {
              // Post not found, redirect to dashboard
              console.log('Post not found:', postId);
              router.push('/');
              return;
            }
          }
        }
        
        setCurrentPost(post);
        actions.setCurrentPost(post);
      } catch (error) {
        console.error('Failed to load post:', error);
        actions.setError('Failed to load post');
      } finally {
        setIsLoading(false);
      }
    };

    if (postId && !state.isLoading) {
      loadPost();
    }
  }, [postId, state.isLoading, state.posts.length]); // Added state.posts.length to detect when posts are loaded

  // Auto-save functionality - using interval to prevent infinite loops
  useEffect(() => {
    if (!currentPost) return;

    const autoSaveInterval = setInterval(async () => {
      if (currentPost && !isSaving) {
        await handleSave();
      }
    }, 30000); // Auto-save every 30 seconds

    return () => clearInterval(autoSaveInterval);
  }, []); // Empty dependency array to prevent loops

  const handleSave = async () => {
    if (!currentPost || isSaving) return;

    setIsSaving(true);
    try {
      await actions.updatePost(currentPost);
      setLastSaved(new Date());
      actions.setError(null);
    } catch (error) {
      console.error('Failed to save post:', error);
      actions.setError('Failed to save post');
    } finally {
      setIsSaving(false);
    }
  };

  const handleTitleChange = (title: string) => {
    if (!currentPost) return;
    
    setCurrentPost({
      ...currentPost,
      title: title.trim() || 'Untitled Post'
    });
  };

  const handleContentChange = (content: string) => {
    if (!currentPost) return;
    
    const updatedPost = {
      ...currentPost,
      content,
      wordCount: countWords(content),
      updatedAt: new Date()
    };
    
    setCurrentPost(updatedPost);
  };

  // Helper function to count words
  const countWords = (text: string): number => {
    return text.trim().split(/\s+/).filter(word => word.length > 0).length;
  };

  const handleStatusChange = (status: Post['status']) => {
    if (!currentPost) return;
    
    setCurrentPost({
      ...currentPost,
      status
    });
  };

  const handleAnalyze = async () => {
    if (!currentPost || state.isAnalyzing) return;
    
    try {
      const result = await actions.analyzeContent(currentPost.content, currentPost.id);
      if (result) {
        // Update the current post with the new analysis
        setCurrentPost(prev => prev ? {
          ...prev,
          analysisHistory: [...prev.analysisHistory, result]
        } : null);
      }
    } catch (error) {
      console.error('Failed to analyze content:', error);
      actions.setError('Failed to analyze content');
    }
  };

  const handleDelete = async () => {
    if (!currentPost) return;

    if (confirm('Are you sure you want to delete this post? This action cannot be undone.')) {
      try {
        await actions.deletePost(currentPost.id);
        router.push('/');
      } catch (error) {
        console.error('Failed to delete post:', error);
        actions.setError('Failed to delete post');
      }
    }
  };

  const handleBack = () => {
    router.push('/');
  };

  if (isLoading) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!currentPost) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-center">
          <div className="text-gray-500 dark:text-gray-400 mb-4">Post not found</div>
          <button
            onClick={handleBack}
            className="text-blue-600 dark:text-blue-400 hover:underline"
          >
            Return to Dashboard
          </button>
        </div>
      </div>
    );
  }

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
          </div>
          
          <div className="flex items-center space-x-3">
            {/* Status indicator */}
            <div className="text-sm text-gray-500 dark:text-gray-400">
              {isSaving ? (
                <span className="flex items-center">
                  <CloudArrowUpIcon className="w-4 h-4 mr-1 animate-spin" />
                  Saving...
                </span>
              ) : lastSaved ? (
                <span>Saved {lastSaved.toLocaleTimeString()}</span>
              ) : (
                <span>Not saved</span>
              )}
            </div>

            {/* Action buttons */}
            <button
              onClick={handleSave}
              disabled={isSaving}
              className="flex items-center px-3 py-2 text-sm font-medium text-gray-700 dark:text-gray-200 bg-gray-100 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md hover:bg-gray-200 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors disabled:opacity-50"
            >
              <CloudArrowUpIcon className="w-4 h-4 mr-2" />
              Save
            </button>

            <button
              onClick={handleAnalyze}
              disabled={state.isAnalyzing || !currentPost.content.trim()}
              className="flex items-center px-3 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors disabled:opacity-50"
            >
              <SparklesIcon className="w-4 h-4 mr-2" />
              {state.isAnalyzing ? 'Analyzing...' : 'Analyze'}
            </button>

            <button
              onClick={handleDelete}
              className="flex items-center px-3 py-2 text-sm font-medium text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/50 border border-red-200 dark:border-red-800 rounded-md hover:bg-red-100 dark:hover:bg-red-900/75 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 transition-colors"
            >
              <TrashIcon className="w-4 h-4 mr-2" />
              Delete
            </button>
          </div>
        </div>
      </div>

      {/* Status and metadata bar */}
      <div className="bg-gray-50 dark:bg-gray-800/50 border-b border-gray-200 dark:border-gray-700 px-6 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            {/* Status selector */}
            <select
              value={currentPost.status}
              onChange={(e) => handleStatusChange(e.target.value as Post['status'])}
              className="text-sm border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="draft">Draft</option>
              <option value="completed">Completed</option>
              <option value="archived">Archived</option>
            </select>
          </div>
          
          <div className="flex items-center space-x-6 text-sm text-gray-500 dark:text-gray-400">
            <span>{currentPost.wordCount.toLocaleString()} words</span>
            <span>Created {currentPost.createdAt.toLocaleDateString()}</span>
            <span>Modified {currentPost.updatedAt.toLocaleDateString()}</span>
          </div>
        </div>
      </div>

      {/* Main content area */}
      <div className="flex-1 flex overflow-hidden">
        {/* Editor */}
        <div className="flex-1 flex flex-col">
          {/* Title input */}
          <div className="p-6 border-b border-gray-200 dark:border-gray-700">
            <input
              type="text"
              value={currentPost.title}
              onChange={(e) => handleTitleChange(e.target.value)}
              placeholder="Post title..."
              className="w-full text-3xl font-bold bg-transparent border-none outline-none text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500"
            />
          </div>

          {/* Content editor */}
          <div className="flex-1 overflow-hidden">
            <TextEditor
              content={currentPost.content}
              onChange={handleContentChange}
              placeholder="Start writing your post..."
              autoFocus
            />
          </div>
        </div>

        {/* AI Analysis Panel */}
        <div className="w-96 border-l border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
          <AIAnalysisPanel
            content={currentPost.content}
            isAnalyzing={state.isAnalyzing}
            analysisResults={latestAnalysisResult}
            onAnalyze={handleAnalyze}
            error={state.aiError}
          />
        </div>
      </div>
    </div>
  );
}