import { AnalysisResult, Post, Suggestion, AmbiguousPhrase } from '@/types';
import { aiService } from './ai';

export class ContentAnalyzer {
  private cache = new Map<string, AnalysisResult>();
  private readonly cacheTimeout = 5 * 60 * 1000; // 5 minutes

  constructor() {
    // Clear expired cache entries periodically
    setInterval(() => {
      this.clearExpiredCache();
    }, 60000); // Check every minute
  }

  async analyzePost(post: Post): Promise<AnalysisResult> {
    if (!post.content.trim()) {
      throw new Error('Cannot analyze empty content');
    }

    // Check cache first
    const cacheKey = this.generateCacheKey(post.content);
    const cached = this.cache.get(cacheKey);
    
    if (cached && this.isCacheValid(cached)) {
      return { ...cached, postId: post.id };
    }

    try {
      // Use AI service for analysis
      const response = await aiService.analyzeContent(post.content);
      
      if (!response.success || !response.data) {
        throw new Error('AI analysis failed');
      }

      const analysisResult: AnalysisResult = {
        ...response.data,
        postId: post.id,
        timestamp: new Date()
      };

      // Cache the result
      this.cache.set(cacheKey, analysisResult);

      // Add to post's analysis history
      const updatedPost = {
        ...post,
        analysisHistory: [...post.analysisHistory, analysisResult]
      };

      return analysisResult;

    } catch (error) {
      console.error('Content analysis failed:', error);
      
      // Fallback analysis
      return this.createFallbackAnalysis(post);
    }
  }

  async analyzeContent(content: string, postId?: string): Promise<AnalysisResult> {
    if (!content.trim()) {
      throw new Error('Cannot analyze empty content');
    }

    const cacheKey = this.generateCacheKey(content);
    const cached = this.cache.get(cacheKey);
    
    if (cached && this.isCacheValid(cached)) {
      return { ...cached, postId: postId || '' };
    }

    try {
      const response = await aiService.analyzeContent(content);
      
      if (!response.success || !response.data) {
        throw new Error('AI analysis failed');
      }

      const analysisResult: AnalysisResult = {
        ...response.data,
        postId: postId || '',
        timestamp: new Date()
      };

      this.cache.set(cacheKey, analysisResult);
      return analysisResult;

    } catch (error) {
      console.error('Content analysis failed:', error);
      return this.createBasicAnalysis(content, postId);
    }
  }

  private generateCacheKey(content: string): string {
    // Simple hash function for cache key
    let hash = 0;
    for (let i = 0; i < content.length; i++) {
      const char = content.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32bit integer
    }
    return `analysis_${Math.abs(hash)}_${content.length}`;
  }

  private isCacheValid(analysis: AnalysisResult): boolean {
    return Date.now() - analysis.timestamp.getTime() < this.cacheTimeout;
  }

  private clearExpiredCache(): void {
    const now = Date.now();
    for (const [key, analysis] of this.cache.entries()) {
      if (now - analysis.timestamp.getTime() > this.cacheTimeout) {
        this.cache.delete(key);
      }
    }
  }

  private createFallbackAnalysis(post: Post): AnalysisResult {
    return this.createBasicAnalysis(post.content, post.id);
  }

  private createBasicAnalysis(content: string, postId?: string): AnalysisResult {
    const processor = new AnalysisProcessor();
    return processor.createBasicAnalysis(content, postId);
  }

  clearCache(): void {
    this.cache.clear();
  }

  getCacheSize(): number {
    return this.cache.size;
  }
}

export class AnalysisProcessor {
  createBasicAnalysis(content: string, postId?: string): AnalysisResult {
    const metrics = this.calculateBasicMetrics(content);
    const suggestions = this.generateBasicSuggestions(content, metrics);
    const ambiguousPhrases = this.detectAmbiguousPhrases(content);

    return {
      id: `analysis-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      postId: postId || '',
      timestamp: new Date(),
      metrics: {
        readabilityScore: metrics.readabilityScore,
        clarityScore: metrics.clarityScore,
        toneAnalysis: metrics.toneAnalysis,
        targetAudience: metrics.targetAudience
      },
      suggestions,
      ambiguousPhrases
    };
  }

  private calculateBasicMetrics(content: string) {
    const words = content.trim().split(/\s+/).filter(word => word.length > 0);
    const sentences = content.split(/[.!?]+/).filter(s => s.trim().length > 0);
    const paragraphs = content.split(/\n\s*\n/).filter(p => p.trim().length > 0);

    const wordCount = words.length;
    const sentenceCount = sentences.length;
    const paragraphCount = paragraphs.length;

    // Calculate average words per sentence
    const avgWordsPerSentence = sentenceCount > 0 ? wordCount / sentenceCount : 0;

    // Calculate average sentences per paragraph
    const avgSentencesPerParagraph = paragraphCount > 0 ? sentenceCount / paragraphCount : 0;

    // Simple readability score (based on sentence length)
    let readabilityScore = 10;
    if (avgWordsPerSentence > 20) readabilityScore -= 2;
    if (avgWordsPerSentence > 25) readabilityScore -= 2;
    if (avgWordsPerSentence > 30) readabilityScore -= 2;

    // Clarity score (based on various factors)
    let clarityScore = 8;
    if (avgSentencesPerParagraph > 5) clarityScore -= 1;
    if (paragraphCount === 1 && sentenceCount > 10) clarityScore -= 1;

    // Simple tone analysis
    const toneAnalysis = this.analyzeTone(content);
    const targetAudience = this.determineTargetAudience(content, avgWordsPerSentence);

    return {
      readabilityScore: Math.max(1, Math.min(10, readabilityScore)),
      clarityScore: Math.max(1, Math.min(10, clarityScore)),
      toneAnalysis,
      targetAudience,
      wordCount,
      sentenceCount,
      paragraphCount,
      avgWordsPerSentence,
      avgSentencesPerParagraph
    };
  }

  private analyzeTone(content: string): string {
    const lowerContent = content.toLowerCase();
    
    // Count indicators for different tones
    const formalIndicators = ['therefore', 'however', 'furthermore', 'consequently', 'nevertheless'];
    const casualIndicators = ['just', 'really', 'pretty', 'kinda', 'gonna', 'wanna'];
    const technicalIndicators = ['implement', 'configure', 'optimize', 'analyze', 'framework'];
    const emotionalIndicators = ['amazing', 'terrible', 'love', 'hate', 'excited', 'frustrated'];

    const formalCount = formalIndicators.reduce((count, word) => 
      count + (lowerContent.match(new RegExp(`\\b${word}\\b`, 'g')) || []).length, 0);
    
    const casualCount = casualIndicators.reduce((count, word) => 
      count + (lowerContent.match(new RegExp(`\\b${word}\\b`, 'g')) || []).length, 0);
    
    const technicalCount = technicalIndicators.reduce((count, word) => 
      count + (lowerContent.match(new RegExp(`\\b${word}\\b`, 'g')) || []).length, 0);
    
    const emotionalCount = emotionalIndicators.reduce((count, word) => 
      count + (lowerContent.match(new RegExp(`\\b${word}\\b`, 'g')) || []).length, 0);

    if (technicalCount > formalCount && technicalCount > casualCount) {
      return 'Technical';
    } else if (formalCount > casualCount && formalCount > emotionalCount) {
      return 'Formal';
    } else if (casualCount > formalCount) {
      return 'Casual';
    } else if (emotionalCount > 2) {
      return 'Emotional';
    } else {
      return 'Neutral';
    }
  }

  private determineTargetAudience(content: string, avgWordsPerSentence: number): string {
    const lowerContent = content.toLowerCase();
    
    if (avgWordsPerSentence > 25) {
      return 'Academic/Professional';
    } else if (avgWordsPerSentence < 15) {
      return 'General/Casual';
    }

    // Check for technical terms
    const technicalTerms = ['api', 'framework', 'database', 'algorithm', 'implementation'];
    const technicalCount = technicalTerms.reduce((count, term) => 
      count + (lowerContent.includes(term) ? 1 : 0), 0);

    if (technicalCount > 2) {
      return 'Technical/Developer';
    }

    return 'General audience';
  }

  private generateBasicSuggestions(content: string, metrics: any): Suggestion[] {
    const suggestions: Suggestion[] = [];

    // Long sentences suggestion
    if (metrics.avgWordsPerSentence > 25) {
      suggestions.push({
        type: 'clarity',
        severity: 'medium',
        description: 'Consider breaking down long sentences for better readability.',
        originalText: 'Long sentences detected',
        suggestedText: 'Try splitting sentences that exceed 25 words.',
        position: { start: 0, end: content.length }
      });
    }

    // Paragraph length suggestion
    if (metrics.avgSentencesPerParagraph > 6) {
      suggestions.push({
        type: 'structure',
        severity: 'low',
        description: 'Consider breaking long paragraphs into smaller chunks.',
        originalText: 'Long paragraphs detected',
        suggestedText: 'Aim for 3-5 sentences per paragraph for better readability.',
        position: { start: 0, end: content.length }
      });
    }

    // Passive voice detection (simple)
    const passiveMatches = content.match(/\b(is|are|was|were|be|been|being)\s+\w+ed\b/gi);
    if (passiveMatches && passiveMatches.length > 3) {
      suggestions.push({
        type: 'clarity',
        severity: 'low',
        description: 'Consider using active voice for more engaging writing.',
        originalText: 'Passive voice detected',
        suggestedText: 'Try converting passive sentences to active voice.',
        position: { start: 0, end: content.length }
      });
    }

    // Repetitive word usage
    const words = content.toLowerCase().match(/\b\w+\b/g) || [];
    const wordFreq = words.reduce((freq: Record<string, number>, word) => {
      if (word.length > 4) { // Only check longer words
        freq[word] = (freq[word] || 0) + 1;
      }
      return freq;
    }, {});

    const overusedWords = Object.entries(wordFreq)
      .filter(([, count]) => count > 5)
      .map(([word]) => word);

    if (overusedWords.length > 0) {
      suggestions.push({
        type: 'clarity',
        severity: 'low',
        description: `The words "${overusedWords.slice(0, 3).join(', ')}" appear frequently. Consider using synonyms.`,
        originalText: overusedWords.join(', '),
        suggestedText: 'Use varied vocabulary to maintain reader interest.',
        position: { start: 0, end: content.length }
      });
    }

    return suggestions;
  }

  private detectAmbiguousPhrases(content: string): AmbiguousPhrase[] {
    const ambiguousPhrases: AmbiguousPhrase[] = [];

    // Common ambiguous phrases
    const ambiguousPatterns = [
      {
        pattern: /\b(a lot|lots)\b/gi,
        reason: 'Vague quantity. Consider being more specific.',
        suggestions: ['many', 'numerous', 'several', 'a specific number']
      },
      {
        pattern: /\b(stuff|things)\b/gi,
        reason: 'Vague reference. Be more specific about what you mean.',
        suggestions: ['items', 'elements', 'components', 'specific nouns']
      },
      {
        pattern: /\b(very|really|quite)\s+(\w+)/gi,
        reason: 'Weak intensifiers. Consider stronger, more specific adjectives.',
        suggestions: ['use stronger adjectives', 'be more specific', 'remove unnecessary intensifiers']
      },
      {
        pattern: /\b(maybe|perhaps|possibly)\b/gi,
        reason: 'Uncertain language may weaken your message.',
        suggestions: ['be more definitive', 'provide evidence', 'state clearly']
      }
    ];

    ambiguousPatterns.forEach(({ pattern, reason, suggestions }) => {
      let match;
      while ((match = pattern.exec(content)) !== null) {
        ambiguousPhrases.push({
          text: match[0],
          position: { start: match.index, end: match.index + match[0].length },
          reason,
          suggestions
        });
      }
    });

    return ambiguousPhrases;
  }
}

// Create and export singleton instances
export const contentAnalyzer = new ContentAnalyzer();
export const analysisProcessor = new AnalysisProcessor();