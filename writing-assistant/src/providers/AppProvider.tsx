'use client'

import React, { createContext, useContext, useReducer, useEffect, ReactNode, useCallback, useMemo } from 'react';
import { Post, ChatConversation, UserSettings, AppState, AnalysisResult, AIProviderConfig } from '@/types';
import { storageService } from '@/services/storage';
import { AIService, createAIService, DEFAULT_AI_PROVIDERS } from '@/services/ai';

// Action types
type AppAction =
  | { type: 'SET_POSTS'; payload: Post[] }
  | { type: 'ADD_POST'; payload: Post }
  | { type: 'UPDATE_POST'; payload: Post }
  | { type: 'DELETE_POST'; payload: string }
  | { type: 'SET_CURRENT_POST'; payload: Post | null }
  | { type: 'SET_CONVERSATIONS'; payload: ChatConversation[] }
  | { type: 'ADD_CONVERSATION'; payload: ChatConversation }
  | { type: 'UPDATE_CONVERSATION'; payload: ChatConversation }
  | { type: 'DELETE_CONVERSATION'; payload: string }
  | { type: 'SET_CURRENT_CONVERSATION'; payload: ChatConversation | null }
  | { type: 'SET_ANALYZING'; payload: boolean }
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_ERROR'; payload: string | null }
  | { type: 'SET_SETTINGS'; payload: UserSettings }
  | { type: 'SET_ANALYSIS_RESULT'; payload: { postId: string; result: AnalysisResult } }
  | { type: 'UPDATE_AI_SETTINGS'; payload: AIProviderConfig }
  | { type: 'SET_AI_ERROR'; payload: string | null };

// Default user settings with AI provider
const defaultSettings: UserSettings = {
  theme: 'system',
  autoSave: true,
  analysisThreshold: 50,
  defaultVerbosity: 'normal',
  shortcuts: {},
  aiProvider: DEFAULT_AI_PROVIDERS.openai
};

// Initial state
const initialState: AppState = {
  posts: [],
  currentPost: null,
  chatConversations: [],
  currentConversation: null,
  isAnalyzing: false,
  isLoading: false,
  error: null,
  settings: defaultSettings,
  aiError: null
};

// Reducer
function appReducer(state: AppState, action: AppAction): AppState {
  switch (action.type) {
    case 'SET_POSTS':
      return { ...state, posts: action.payload };
    case 'ADD_POST':
      return { ...state, posts: [...state.posts, action.payload] };
    case 'UPDATE_POST':
      return {
        ...state,
        posts: state.posts.map(post =>
          post.id === action.payload.id ? action.payload : post
        ),
        currentPost: state.currentPost?.id === action.payload.id ? action.payload : state.currentPost,
      };
    case 'DELETE_POST':
      return {
        ...state,
        posts: state.posts.filter(post => post.id !== action.payload),
        currentPost: state.currentPost?.id === action.payload ? null : state.currentPost,
      };
    case 'SET_CURRENT_POST':
      return { ...state, currentPost: action.payload };
    case 'SET_CONVERSATIONS':
      return { ...state, chatConversations: action.payload };
    case 'ADD_CONVERSATION':
      return { ...state, chatConversations: [...state.chatConversations, action.payload] };
    case 'UPDATE_CONVERSATION':
      return {
        ...state,
        chatConversations: state.chatConversations.map(conv =>
          conv.id === action.payload.id ? action.payload : conv
        ),
        currentConversation: state.currentConversation?.id === action.payload.id ? action.payload : state.currentConversation,
      };
    case 'DELETE_CONVERSATION':
      return {
        ...state,
        chatConversations: state.chatConversations.filter(conv => conv.id !== action.payload),
        currentConversation: state.currentConversation?.id === action.payload ? null : state.currentConversation,
      };
    case 'SET_CURRENT_CONVERSATION':
      return { ...state, currentConversation: action.payload };
    case 'SET_ANALYZING':
      return { ...state, isAnalyzing: action.payload };
    case 'SET_LOADING':
      return { ...state, isLoading: action.payload };
    case 'SET_ERROR':
      return { ...state, error: action.payload };
    case 'SET_SETTINGS':
      return { ...state, settings: action.payload };
    case 'SET_ANALYSIS_RESULT':
      return {
        ...state,
        posts: state.posts.map(post =>
          post.id === action.payload.postId
            ? {
                ...post,
                analysisHistory: [...post.analysisHistory, action.payload.result]
              }
            : post
        ),
        currentPost: state.currentPost?.id === action.payload.postId
          ? {
              ...state.currentPost,
              analysisHistory: [...state.currentPost.analysisHistory, action.payload.result]
            }
          : state.currentPost
      };
    case 'UPDATE_AI_SETTINGS':
      return {
        ...state,
        settings: {
          ...state.settings,
          aiProvider: action.payload
        }
      };
    case 'SET_AI_ERROR':
      return { ...state, aiError: action.payload };
    default:
      return state;
  }
}

// Context
const AppContext = createContext<{
  state: AppState;
  dispatch: React.Dispatch<AppAction>;
  aiService: AIService;
  actions: {
    loadData: () => Promise<void>;
    createPost: (title: string, content?: string) => Promise<Post>;
    updatePost: (post: Post) => Promise<void>;
    deletePost: (id: string) => Promise<void>;
    setCurrentPost: (post: Post | null) => void;
    createConversation: (title: string) => Promise<ChatConversation>;
    updateConversation: (conversation: ChatConversation) => Promise<void>;
    deleteConversation: (id: string) => Promise<void>;
    setCurrentConversation: (conversation: ChatConversation | null) => void;
    setError: (error: string | null) => void;
    analyzeContent: (content: string, postId: string) => Promise<AnalysisResult | null>;
    updateAISettings: (config: AIProviderConfig) => Promise<void>;
    testAIConnection: () => Promise<boolean>;
  };
} | null>(null);

// Helper function to generate unique IDs
function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

// Helper function to create excerpt from content
function createExcerpt(content: string, maxLength: number = 150): string {
  if (content.length <= maxLength) return content;
  return content.substring(0, maxLength).trim() + '...';
}

// Helper function to count words
function countWords(text: string): number {
  return text.trim().split(/\\s+/).filter(word => word.length > 0).length;
}

// Provider component
export function AppProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(appReducer, initialState);
  
  // Create AI service instance
  const aiService = useMemo(
    () => createAIService(state.settings.aiProvider),
    [state.settings.aiProvider]
  );

  // Initialize storage and load data
  const loadData = useCallback(async () => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      await storageService.init();
      
      const [posts, conversations, settings] = await Promise.all([
        storageService.getPosts(),
        storageService.getConversations(),
        storageService.getSettings().catch(() => defaultSettings), // Use default if no settings found
      ]);
      
      dispatch({ type: 'SET_POSTS', payload: posts });
      dispatch({ type: 'SET_CONVERSATIONS', payload: conversations });
      dispatch({ type: 'SET_SETTINGS', payload: settings });
      dispatch({ type: 'SET_ERROR', payload: null });
    } catch (error) {
      console.error('Failed to load data:', error);
      dispatch({ type: 'SET_ERROR', payload: 'Failed to load data' });
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  }, []);

  // Post actions
  const createPost = useCallback(async (title: string, content: string = ''): Promise<Post> => {
    const now = new Date();
    const post: Post = {
      id: generateId(),
      title: title.trim() || 'Untitled Post',
      content,
      excerpt: createExcerpt(content),
      tags: [],
      createdAt: now,
      updatedAt: now,
      wordCount: countWords(content),
      status: 'draft',
      analysisHistory: [],
    };

    try {
      await storageService.savePost(post);
      dispatch({ type: 'ADD_POST', payload: post });
      return post;
    } catch (error) {
      console.error('Failed to create post:', error);
      dispatch({ type: 'SET_ERROR', payload: 'Failed to create post' });
      throw error;
    }
  }, []);

  const updatePost = useCallback(async (post: Post): Promise<void> => {
    const updatedPost = {
      ...post,
      updatedAt: new Date(),
      excerpt: createExcerpt(post.content),
      wordCount: countWords(post.content),
    };

    try {
      await storageService.savePost(updatedPost);
      dispatch({ type: 'UPDATE_POST', payload: updatedPost });
      dispatch({ type: 'SET_ERROR', payload: null });
    } catch (error) {
      console.error('Failed to update post:', error);
      dispatch({ type: 'SET_ERROR', payload: 'Failed to update post' });
      throw error;
    }
  }, []);

  const deletePost = useCallback(async (id: string): Promise<void> => {
    try {
      await storageService.deletePost(id);
      dispatch({ type: 'DELETE_POST', payload: id });
      dispatch({ type: 'SET_ERROR', payload: null });
    } catch (error) {
      console.error('Failed to delete post:', error);
      dispatch({ type: 'SET_ERROR', payload: 'Failed to delete post' });
      throw error;
    }
  }, []);

  const setCurrentPost = useCallback((post: Post | null) => {
    dispatch({ type: 'SET_CURRENT_POST', payload: post });
  }, []);

  // Conversation actions
  const createConversation = useCallback(async (title: string): Promise<ChatConversation> => {
    const now = new Date();
    const conversation: ChatConversation = {
      id: generateId(),
      title: title.trim() || 'New Conversation',
      messages: [],
      createdAt: now,
      updatedAt: now,
    };

    try {
      await storageService.saveConversation(conversation);
      dispatch({ type: 'ADD_CONVERSATION', payload: conversation });
      return conversation;
    } catch (error) {
      console.error('Failed to create conversation:', error);
      dispatch({ type: 'SET_ERROR', payload: 'Failed to create conversation' });
      throw error;
    }
  }, []);

  const updateConversation = useCallback(async (conversation: ChatConversation): Promise<void> => {
    const updatedConversation = {
      ...conversation,
      updatedAt: new Date(),
    };

    try {
      await storageService.saveConversation(updatedConversation);
      dispatch({ type: 'UPDATE_CONVERSATION', payload: updatedConversation });
      dispatch({ type: 'SET_ERROR', payload: null });
    } catch (error) {
      console.error('Failed to update conversation:', error);
      dispatch({ type: 'SET_ERROR', payload: 'Failed to update conversation' });
      throw error;
    }
  }, []);

  const deleteConversation = useCallback(async (id: string): Promise<void> => {
    try {
      await storageService.deleteConversation(id);
      dispatch({ type: 'DELETE_CONVERSATION', payload: id });
      dispatch({ type: 'SET_ERROR', payload: null });
    } catch (error) {
      console.error('Failed to delete conversation:', error);
      dispatch({ type: 'SET_ERROR', payload: 'Failed to delete conversation' });
      throw error;
    }
  }, []);

  const setCurrentConversation = useCallback((conversation: ChatConversation | null) => {
    dispatch({ type: 'SET_CURRENT_CONVERSATION', payload: conversation });
  }, []);

  const setError = useCallback((error: string | null) => {
    dispatch({ type: 'SET_ERROR', payload: error });
  }, []);

  // AI analysis actions
  const analyzeContent = useCallback(async (content: string, postId: string): Promise<AnalysisResult | null> => {
    if (!content.trim() || content.split(/\s+/).length < state.settings.analysisThreshold) {
      dispatch({ type: 'SET_AI_ERROR', payload: 'Content too short for analysis' });
      return null;
    }

    try {
      dispatch({ type: 'SET_ANALYZING', payload: true });
      dispatch({ type: 'SET_AI_ERROR', payload: null });
      
      const result = await aiService.analyzeContent(content, postId);
      
      // Add to post analysis history
      dispatch({ type: 'SET_ANALYSIS_RESULT', payload: { postId, result } });
      
      // Update the post in storage
      const post = state.posts.find(p => p.id === postId);
      if (post) {
        const updatedPost = {
          ...post,
          analysisHistory: [...post.analysisHistory, result]
        };
        await storageService.savePost(updatedPost);
      }
      
      return result;
    } catch (error) {
      console.error('AI analysis failed:', error);
      const errorMessage = error instanceof Error ? error.message : 'Analysis failed';
      dispatch({ type: 'SET_AI_ERROR', payload: errorMessage });
      return null;
    } finally {
      dispatch({ type: 'SET_ANALYZING', payload: false });
    }
  }, [aiService, state.posts, state.settings.analysisThreshold]);

  const updateAISettings = useCallback(async (config: AIProviderConfig): Promise<void> => {
    try {
      const updatedSettings = {
        ...state.settings,
        aiProvider: config
      };
      
      await storageService.saveSettings(updatedSettings);
      dispatch({ type: 'UPDATE_AI_SETTINGS', payload: config });
      dispatch({ type: 'SET_AI_ERROR', payload: null });
    } catch (error) {
      console.error('Failed to update AI settings:', error);
      dispatch({ type: 'SET_AI_ERROR', payload: 'Failed to save AI settings' });
      throw error;
    }
  }, [state.settings]);

  const testAIConnection = useCallback(async (): Promise<boolean> => {
    try {
      dispatch({ type: 'SET_AI_ERROR', payload: null });
      return await aiService.testConnection();
    } catch (error) {
      console.error('AI connection test failed:', error);
      const errorMessage = error instanceof Error ? error.message : 'Connection test failed';
      dispatch({ type: 'SET_AI_ERROR', payload: errorMessage });
      return false;
    }
  }, [aiService]);

  // Load data on mount
  useEffect(() => {
    loadData();
  }, []);

  const actions = useMemo(() => ({
    loadData,
    createPost,
    updatePost,
    deletePost,
    setCurrentPost,
    createConversation,
    updateConversation,
    deleteConversation,
    setCurrentConversation,
    setError,
    analyzeContent,
    updateAISettings,
    testAIConnection,
  }), [loadData, createPost, updatePost, deletePost, setCurrentPost, createConversation, updateConversation, deleteConversation, setCurrentConversation, setError, analyzeContent, updateAISettings, testAIConnection]);

  return (
    <AppContext.Provider value={{ state, dispatch, aiService, actions }}>
      {children}
    </AppContext.Provider>
  );
}

// Hook to use the app context
export function useApp() {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
}