import { AnalysisResult, Suggestion, AmbiguousPhrase, AIServiceError, AIProviderConfig } from '@/types';

/**
 * AI Service for content analysis using OpenAI-compatible APIs
 * Supports custom providers with different base URLs
 */
export class AIService {
  private config: AIProviderConfig;

  constructor(config: AIProviderConfig) {
    this.config = config;
  }

  /**
   * Update the AI provider configuration
   */
  updateConfig(config: AIProviderConfig): void {
    this.config = config;
  }

  /**
   * Check if the AI service is properly configured
   */
  isConfigured(): boolean {
    return !!(
      this.config.enabled &&
      this.config.apiKey &&
      this.config.baseUrl &&
      this.config.model
    );
  }

  /**
   * Analyze content and return detailed analysis results
   */
  async analyzeContent(content: string, postId: string): Promise<AnalysisResult> {
    if (!this.isConfigured()) {
      throw new AIServiceError('AI service is not properly configured');
    }

    if (!content.trim()) {
      throw new AIServiceError('Content cannot be empty');
    }

    try {
      const analysisPrompt = this.buildAnalysisPrompt(content);
      // Use higher max_tokens for analysis to prevent truncation
      const response = await this.makeAPICall(analysisPrompt, 2000);
      
      return this.parseAnalysisResponse(response, content, postId);
    } catch (error) {
      console.error('AI analysis failed:', error);
      if (error instanceof AIServiceError) {
        throw error;
      }
      throw new AIServiceError('Failed to analyze content: ' + (error as Error).message);
    }
  }

  /**
   * Generate a writing suggestion based on content
   */
  async generateSuggestion(content: string, context?: string): Promise<string> {
    if (!this.isConfigured()) {
      throw new AIServiceError('AI service is not properly configured');
    }

    try {
      const prompt = this.buildSuggestionPrompt(content, context);
      const response = await this.makeAPICall(prompt, 200);
      
      return this.extractTextFromResponse(response);
    } catch (error) {
      console.error('AI suggestion failed:', error);
      throw new AIServiceError('Failed to generate suggestion: ' + (error as Error).message);
    }
  }

  /**
   * Test the connection to the AI provider
   */
  async testConnection(): Promise<boolean> {
    if (!this.isConfigured()) {
      return false;
    }

    try {
      const testPrompt = [
        {
          role: 'user',
          content: 'Please respond with just "OK" to test the connection.'
        }
      ];

      const response = await this.makeAPICall(testPrompt, 10);
      const text = this.extractTextFromResponse(response);
      
      return text.toLowerCase().includes('ok');
    } catch (error) {
      console.error('Connection test failed:', error);
      return false;
    }
  }

  /**
   * Build the analysis prompt for content evaluation
   */
  private buildAnalysisPrompt(content: string) {
    return [
      {
        role: 'system',
        content: `You are an expert writing assistant. Analyze the provided text and return a JSON response with the following structure:
{
  "metrics": {
    "readabilityScore": <number 1-10>,
    "clarityScore": <number 1-10>,
    "toneAnalysis": "<descriptive tone>",
    "targetAudience": "<audience description>"
  },
  "suggestions": [
    {
      "type": "<clarity|tone|structure|grammar>",
      "severity": "<low|medium|high>",
      "description": "<explanation>",
      "originalText": "<text to improve>",
      "suggestedText": "<improved version>",
      "position": {"start": <number>, "end": <number>}
    }
  ],
  "ambiguousPhrases": [
    {
      "text": "<ambiguous phrase>",
      "position": {"start": <number>, "end": <number>},
      "reason": "<why it's ambiguous>",
      "suggestions": ["<alternative 1>", "<alternative 2>"]
    }
  ]
}

Provide specific, actionable feedback. Focus on improving clarity, readability, and engagement.`
      },
      {
        role: 'user',
        content: `Please analyze this text:\n\n${content}`
      }
    ];
  }

  /**
   * Build suggestion prompt for specific writing help
   */
  private buildSuggestionPrompt(content: string, context?: string) {
    const contextText = context ? `\n\nContext: ${context}` : '';
    
    return [
      {
        role: 'system',
        content: 'You are a helpful writing assistant. Provide concise, actionable suggestions to improve the given text. Focus on clarity, engagement, and effectiveness.'
      },
      {
        role: 'user',
        content: `Please provide a suggestion to improve this text:${contextText}\n\n${content}`
      }
    ];
  }

  /**
   * Make API call to the configured provider
   */
  private async makeAPICall(messages: any[], maxTokens?: number): Promise<any> {
    const url = `${this.config.baseUrl}/chat/completions`;
    
    const requestBody = {
      model: this.config.model,
      messages,
      temperature: this.config.temperature,
      max_tokens: maxTokens || this.config.maxTokens,
      response_format: maxTokens ? undefined : { type: 'json_object' }
    };

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.config.apiKey}`,
      },
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
      const errorText = await response.text();
      let errorMessage = `API request failed: ${response.status} ${response.statusText}`;
      
      try {
        const errorData = JSON.parse(errorText);
        errorMessage = errorData.error?.message || errorMessage;
      } catch {
        // Use the default error message if JSON parsing fails
      }
      
      throw new AIServiceError(errorMessage, response.status.toString());
    }

    return await response.json();
  }

  /**
   * Extract text content from API response
   */
  private extractTextFromResponse(response: any): string {
    try {
      return response.choices[0]?.message?.content || '';
    } catch (error) {
      throw new AIServiceError('Invalid response format from AI provider');
    }
  }

  /**
   * Create a fallback analysis result when AI parsing fails
   */
  private createFallbackAnalysis(postId: string, originalContent: string, errorMessage: string): AnalysisResult {
    const analysisId = `fallback-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const wordCount = originalContent.trim().split(/\s+/).filter(word => word.length > 0).length;
    
    return {
      id: analysisId,
      postId,
      timestamp: new Date(),
      metrics: {
        readabilityScore: 5,
        clarityScore: 5,
        toneAnalysis: 'Unable to analyze - AI service error',
        targetAudience: 'General audience'
      },
      suggestions: [{
        type: 'clarity',
        severity: 'low',
        description: `AI analysis failed: ${errorMessage}. Please check your AI configuration or try again later.`,
        originalText: '',
        suggestedText: '',
        position: { start: 0, end: 0 }
      }],
      ambiguousPhrases: []
    };
  }

  /**
   * Attempt to repair truncated or malformed JSON
   */
  private attemptJSONRepair(jsonString: string): string | null {
    try {
      let repairedJSON = jsonString.trim();
      console.log('Starting JSON repair on:', repairedJSON.length, 'characters');
      
      // Check if JSON is truncated (doesn't end with proper closing)
      const openBraces = (repairedJSON.match(/\{/g) || []).length;
      const closeBraces = (repairedJSON.match(/\}/g) || []).length;
      const openBrackets = (repairedJSON.match(/\[/g) || []).length;
      const closeBrackets = (repairedJSON.match(/\]/g) || []).length;
      
      console.log('Brace/bracket counts:', { openBraces, closeBraces, openBrackets, closeBrackets });
      
      // If we have unmatched braces/brackets, try to close them
      if (openBraces > closeBraces || openBrackets > closeBrackets) {
        console.log('Detected truncated JSON, attempting repair...');
        
        // Strategy 1: Remove incomplete trailing content
        // Look for incomplete string values at the end (pattern: "key": "incomplete_value)
        const incompleteStringMatch = repairedJSON.match(/(.*?)"[^"]*"\s*:\s*"[^"]*$/);
        if (incompleteStringMatch) {
          console.log('Found incomplete string value, truncating...');
          repairedJSON = incompleteStringMatch[1].replace(/,\s*$/, ''); // Remove trailing comma if any
        }
        
        // Strategy 2: Remove incomplete object/array at the end
        // Find the last complete comma-separated item
        const lastCommaIndex = repairedJSON.lastIndexOf(',');
        const lastOpenBrace = repairedJSON.lastIndexOf('{');
        const lastOpenBracket = repairedJSON.lastIndexOf('[');
        
        // If there's incomplete content after the last comma, remove it
        if (lastCommaIndex > Math.max(lastOpenBrace, lastOpenBracket)) {
          const afterComma = repairedJSON.substring(lastCommaIndex + 1).trim();
          // Check if content after comma is incomplete (no closing quote or brace)
          if (afterComma && !afterComma.match(/^\s*"[^"]+"\s*:\s*[^,}\]]+[}\]]/)) {
            console.log('Removing incomplete content after last comma');
            repairedJSON = repairedJSON.substring(0, lastCommaIndex);
          }
        }
        
        // Strategy 3: Handle incomplete quoted strings
        const quoteCount = (repairedJSON.match(/"/g) || []).length;
        if (quoteCount % 2 !== 0) {
          console.log('Closing unclosed quote');
          repairedJSON += '"';
        }
        
        // Strategy 4: Close missing brackets and braces in proper order
        // Close arrays first (innermost structures), then objects
        const missingCloseBrackets = openBrackets - closeBrackets;
        for (let i = 0; i < missingCloseBrackets; i++) {
          console.log('Adding missing ] bracket');
          repairedJSON += ']';
        }
        
        const missingCloseBraces = openBraces - closeBraces;
        for (let i = 0; i < missingCloseBraces; i++) {
          console.log('Adding missing } brace');
          repairedJSON += '}';
        }
        
        console.log('Repaired JSON preview:', repairedJSON.substring(0, 200) + '...');
        console.log('Repaired JSON ending:', repairedJSON.substring(Math.max(0, repairedJSON.length - 100)));
        
        // Test if the repaired JSON is valid
        JSON.parse(repairedJSON);
        console.log('JSON repair successful!');
        return repairedJSON;
      }
      
      console.log('JSON appears complete, no repair needed');
      return null; // No repair needed
    } catch (error) {
      console.error('JSON repair failed:', error);
      console.error('Failed JSON preview:', jsonString.substring(0, 200) + '...');
      return null;
    }
  }

  /**
   * Parse analysis response and create AnalysisResult
   */
  private parseAnalysisResponse(response: any, originalContent: string, postId: string): AnalysisResult {
    try {
      const content = this.extractTextFromResponse(response);
      
      // Debug logging to capture actual content before JSON parsing
      console.log('AI Response raw content:', content);
      console.log('AI Response content length:', content.length);
      console.log('AI Response content preview (first 200 chars):', content.substring(0, 200));
      
      if (!content || content.trim().length === 0) {
        throw new Error('Empty response content from AI provider');
      }
      
      // Clean content - remove potential markdown code blocks or extra formatting
      let cleanContent = content.trim();
      
      // Remove markdown JSON code blocks if present
      if (cleanContent.startsWith('```json')) {
        cleanContent = cleanContent.replace(/^```json\s*/, '').replace(/\s*```$/, '');
      } else if (cleanContent.startsWith('```')) {
        cleanContent = cleanContent.replace(/^```\s*/, '').replace(/\s*```$/, '');
      }
      
      // Remove any leading/trailing text that isn't JSON
      const jsonMatch = cleanContent.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        cleanContent = jsonMatch[0];
      }
      
      console.log('AI Response cleaned content:', cleanContent);
      
      let analysisData;
      try {
        analysisData = JSON.parse(cleanContent);
        console.log('JSON parsed successfully on first attempt');
      } catch (parseError) {
        console.error('JSON Parse Error:', parseError);
        console.error('Failed content length:', cleanContent.length);
        console.error('Failed content preview (first 300 chars):', cleanContent.substring(0, 300));
        console.error('Failed content ending (last 300 chars):', cleanContent.substring(Math.max(0, cleanContent.length - 300)));
        
        // Check if this looks like a truncation issue
        const isTruncationLikely = cleanContent.length > 1000 && (
          !cleanContent.trim().endsWith('}') || 
          parseError instanceof Error && parseError.message.includes('position')
        );
        
        if (isTruncationLikely) {
          console.log('Truncation detected, attempting JSON repair...');
        }
        
        // Attempt to fix truncated JSON
        const fixedJSON = this.attemptJSONRepair(cleanContent);
        if (fixedJSON) {
          console.log('JSON repair attempt successful, trying to parse...');
          try {
            analysisData = JSON.parse(fixedJSON);
            console.log('Successfully parsed repaired JSON! Original length:', cleanContent.length, 'Repaired length:', fixedJSON.length);
          } catch (repairError) {
            console.error('Repaired JSON still invalid:', repairError);
            console.error('Repaired content preview:', fixedJSON.substring(0, 300));
            throw new Error(`Invalid JSON response from AI provider: ${parseError instanceof Error ? parseError.message : 'Unknown parse error'}. Auto-repair failed: ${repairError instanceof Error ? repairError.message : 'Unknown repair error'}.`);
          }
        } else {
          console.error('JSON repair could not fix the issue');
          throw new Error(`Invalid JSON response from AI provider: ${parseError instanceof Error ? parseError.message : 'Unknown parse error'}. Content appears to be truncated at position ${cleanContent.length}.`);
        }
      }
      
      // Validate the response structure
      if (!analysisData.metrics || !Array.isArray(analysisData.suggestions)) {
        throw new Error('Invalid analysis response structure');
      }

      // Generate analysis ID
      const analysisId = `analysis-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

      // Process suggestions with position validation
      const suggestions: Suggestion[] = analysisData.suggestions.map((s: any) => ({
        type: s.type || 'clarity',
        severity: s.severity || 'low',
        description: s.description || '',
        originalText: s.originalText || '',
        suggestedText: s.suggestedText || '',
        position: {
          start: Math.max(0, s.position?.start || 0),
          end: Math.min(originalContent.length, s.position?.end || 0)
        }
      }));

      // Process ambiguous phrases with position validation
      const ambiguousPhrases: AmbiguousPhrase[] = (analysisData.ambiguousPhrases || []).map((p: any) => ({
        text: p.text || '',
        position: {
          start: Math.max(0, p.position?.start || 0),
          end: Math.min(originalContent.length, p.position?.end || 0)
        },
        reason: p.reason || '',
        suggestions: Array.isArray(p.suggestions) ? p.suggestions : []
      }));

      return {
        id: analysisId,
        postId,
        timestamp: new Date(),
        metrics: {
          readabilityScore: Math.max(1, Math.min(10, analysisData.metrics.readabilityScore || 5)),
          clarityScore: Math.max(1, Math.min(10, analysisData.metrics.clarityScore || 5)),
          toneAnalysis: analysisData.metrics.toneAnalysis || 'Neutral',
          targetAudience: analysisData.metrics.targetAudience || 'General audience'
        },
        suggestions,
        ambiguousPhrases
      };
    } catch (error) {
      console.error('Failed to parse analysis response:', error);
      
      // Create detailed error message with context
      let errorMessage = 'Failed to parse analysis results';
      if (error instanceof Error) {
        errorMessage += `: ${error.message}`;
      }
      
      // Add additional context for debugging
      console.error('Analysis parsing error context:', {
        originalError: error,
        responseStructure: typeof response,
        hasChoices: response?.choices?.length > 0,
        hasContent: !!response?.choices?.[0]?.message?.content,
        contentType: typeof response?.choices?.[0]?.message?.content
      });
      
      throw new AIServiceError(errorMessage);
    }
  }
}

/**
 * Default AI provider configurations
 */
export const DEFAULT_AI_PROVIDERS = {
  openai: {
    name: 'OpenAI',
    baseUrl: 'https://api.openai.com/v1',
    apiKey: '',
    model: 'gpt-3.5-turbo',
    temperature: 0.3,
    maxTokens: 1000,
    enabled: false
  },
  anthropic: {
    name: 'Anthropic (via OpenAI-compatible)',
    baseUrl: 'https://api.anthropic.com/v1',
    apiKey: '',
    model: 'claude-3-haiku-20240307',
    temperature: 0.3,
    maxTokens: 1000,
    enabled: false
  },
  local: {
    name: 'Local LLM (Ollama)',
    baseUrl: 'http://localhost:11434/v1',
    apiKey: 'not-required',
    model: 'llama2',
    temperature: 0.3,
    maxTokens: 1000,
    enabled: false
  },
  custom: {
    name: 'Custom Provider',
    baseUrl: '',
    apiKey: '',
    model: '',
    temperature: 0.3,
    maxTokens: 1000,
    enabled: false
  }
} as const;

/**
 * Create AI service instance with current settings
 */
export function createAIService(config: AIProviderConfig): AIService {
  return new AIService(config);
}

/**
 * Validate AI provider configuration
 */
export function validateAIConfig(config: AIProviderConfig): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (!config.baseUrl) {
    errors.push('Base URL is required');
  } else {
    try {
      new URL(config.baseUrl);
    } catch {
      errors.push('Invalid base URL format');
    }
  }

  if (!config.model) {
    errors.push('Model name is required');
  }

  if (!config.apiKey && !config.baseUrl.includes('localhost')) {
    errors.push('API key is required for remote providers');
  }

  if (config.temperature < 0 || config.temperature > 2) {
    errors.push('Temperature must be between 0 and 2');
  }

  if (config.maxTokens < 1 || config.maxTokens > 4000) {
    errors.push('Max tokens must be between 1 and 4000');
  }

  return {
    valid: errors.length === 0,
    errors
  };
}