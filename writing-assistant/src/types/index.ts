// Core Post interface
export interface Post {
  id: string;
  title: string;
  content: string;
  excerpt: string;
  tags: string[];
  createdAt: Date;
  updatedAt: Date;
  wordCount: number;
  status: 'draft' | 'completed' | 'archived';
  analysisHistory: AnalysisResult[];
}

// Analysis result interface
export interface AnalysisResult {
  id: string;
  postId: string;
  timestamp: Date;
  metrics: {
    readabilityScore: number;
    clarityScore: number;
    toneAnalysis: string;
    targetAudience: string;
  };
  suggestions: Suggestion[];
  ambiguousPhrases: AmbiguousPhrase[];
}

// Suggestion interface for writing improvements
export interface Suggestion {
  type: 'clarity' | 'tone' | 'structure' | 'grammar';
  severity: 'low' | 'medium' | 'high';
  description: string;
  originalText: string;
  suggestedText?: string;
  position: { start: number; end: number };
}

// Ambiguous phrases interface
export interface AmbiguousPhrase {
  text: string;
  position: { start: number; end: number };
  reason: string;
  suggestions: string[];
}

// Chat message interface
export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  context?: {
    postId?: string;
    analysisId?: string;
  };
  metadata?: {
    wordCount?: number;
    processingTime?: number;
  };
}

// Chat conversation interface
export interface ChatConversation {
  id: string;
  title: string;
  messages: ChatMessage[];
  createdAt: Date;
  updatedAt: Date;
}

// UI state interfaces
export interface AppState {
  posts: Post[];
  currentPost: Post | null;
  chatConversations: ChatConversation[];
  currentConversation: ChatConversation | null;
  isAnalyzing: boolean;
  isLoading: boolean;
  error: string | null;
}

// AI service configuration
export interface AIConfig {
  apiKey: string;
  model: string;
  temperature: number;
  maxTokens: number;
  verbosity: 'concise' | 'normal' | 'detailed';
}

// Local storage types
export interface StorageData {
  posts: Post[];
  conversations: ChatConversation[];
  settings: UserSettings;
}

// User settings interface
export interface UserSettings {
  theme: 'light' | 'dark' | 'system';
  autoSave: boolean;
  analysisThreshold: number; // minimum word count for analysis
  defaultVerbosity: 'concise' | 'normal' | 'detailed';
  shortcuts: Record<string, string>;
}

// Component prop types
export interface PostCardProps {
  post: Post;
  onPostClick: (post: Post) => void;
  onDeletePost: (postId: string) => void;
}

export interface PostsGridProps {
  posts: Post[];
  onPostClick: (post: Post) => void;
  onDeletePost: (postId: string) => void;
  sortBy: 'title' | 'createdAt' | 'updatedAt' | 'wordCount';
  filterBy: string;
}

export interface TextEditorProps {
  content: string;
  onChange: (content: string) => void;
  placeholder?: string;
  autoFocus?: boolean;
}

export interface AIAnalysisPanelProps {
  content: string;
  isAnalyzing: boolean;
  analysisResults: AnalysisResult | null;
  onAnalyze: () => void;
}

export interface MessageListProps {
  messages: ChatMessage[];
  isLoading: boolean;
}

export interface MessageInputProps {
  onSendMessage: (message: string) => void;
  disabled: boolean;
  placeholder?: string;
}

// Error types
export class AIServiceError extends Error {
  constructor(message: string, public code?: string) {
    super(message);
    this.name = 'AIServiceError';
  }
}

export class StorageError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'StorageError';
  }
}

// Utility types
export type SortDirection = 'asc' | 'desc';
export type PostStatus = Post['status'];
export type SuggestionType = Suggestion['type'];
export type SuggestionSeverity = Suggestion['severity'];
export type ChatRole = ChatMessage['role'];
export type Theme = UserSettings['theme'];
export type Verbosity = AIConfig['verbosity'];

// API response types
export interface AnalysisResponse {
  success: boolean;
  data?: AnalysisResult;
  error?: string;
}

export interface ChatResponse {
  success: boolean;
  data?: {
    message: ChatMessage;
    stream?: boolean;
  };
  error?: string;
}