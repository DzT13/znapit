import OpenAI from 'openai';
import { AIConfig, AnalysisResponse, ChatResponse, ChatMessage, AIServiceError } from '@/types';

class AIService {
  private client: OpenAI | null = null;
  private config: AIConfig = {
    apiKey: '',
    model: 'gpt-4',
    temperature: 0.7,
    maxTokens: 2000,
    verbosity: 'normal'
  };
  private rateLimitQueue: Array<() => Promise<any>> = [];
  private isProcessingQueue = false;
  private lastRequestTime = 0;
  private requestInterval = 1000; // 1 second between requests

  constructor() {
    this.initializeClient();
  }

  private initializeClient() {
    const apiKey = process.env.NEXT_PUBLIC_OPENAI_API_KEY || localStorage.getItem('openai_api_key');
    
    if (apiKey) {
      this.config.apiKey = apiKey;
      this.client = new OpenAI({
        apiKey: apiKey,
        dangerouslyAllowBrowser: true // For client-side usage
      });
    }
  }

  public setApiKey(apiKey: string) {
    this.config.apiKey = apiKey;
    localStorage.setItem('openai_api_key', apiKey);
    this.client = new OpenAI({
      apiKey: apiKey,
      dangerouslyAllowBrowser: true
    });
  }

  public updateConfig(config: Partial<AIConfig>) {
    this.config = { ...this.config, ...config };
  }

  public isConfigured(): boolean {
    return !!this.client && !!this.config.apiKey;
  }

  private async rateLimitedRequest<T>(request: () => Promise<T>): Promise<T> {
    return new Promise((resolve, reject) => {
      this.rateLimitQueue.push(async () => {
        try {
          const result = await request();
          resolve(result);
        } catch (error) {
          reject(error);
        }
      });

      this.processQueue();
    });
  }

  private async processQueue() {
    if (this.isProcessingQueue || this.rateLimitQueue.length === 0) {
      return;
    }

    this.isProcessingQueue = true;

    while (this.rateLimitQueue.length > 0) {
      const now = Date.now();
      const timeSinceLastRequest = now - this.lastRequestTime;

      if (timeSinceLastRequest < this.requestInterval) {
        await new Promise(resolve => setTimeout(resolve, this.requestInterval - timeSinceLastRequest));
      }

      const request = this.rateLimitQueue.shift();
      if (request) {
        try {
          await request();
        } catch (error) {
          console.error('Request failed:', error);
        }
        this.lastRequestTime = Date.now();
      }
    }

    this.isProcessingQueue = false;
  }

  public async analyzeContent(content: string): Promise<AnalysisResponse> {
    if (!this.isConfigured()) {
      throw new AIServiceError('AI service not configured. Please set your OpenAI API key.');
    }

    if (!content.trim()) {
      throw new AIServiceError('Content cannot be empty');
    }

    try {
      const response = await this.rateLimitedRequest(async () => {
        return await this.client!.chat.completions.create({
          model: this.config.model,
          messages: [
            {
              role: 'system',
              content: this.getAnalysisSystemPrompt()
            },
            {
              role: 'user',
              content: `Please analyze the following text for clarity, readability, tone, and potential improvements:\n\n${content}`
            }
          ],
          temperature: this.config.temperature,
          max_tokens: this.config.maxTokens
        });
      });

      const analysisText = response.choices[0]?.message?.content;
      if (!analysisText) {
        throw new AIServiceError('No analysis received from AI service');
      }

      // Parse the structured response
      const analysisResult = this.parseAnalysisResponse(analysisText, content);

      return {
        success: true,
        data: analysisResult
      };

    } catch (error) {
      console.error('Analysis failed:', error);
      
      if (error instanceof AIServiceError) {
        throw error;
      }

      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      throw new AIServiceError(`Analysis failed: ${errorMessage}`);
    }
  }

  public async sendChatMessage(
    messages: ChatMessage[],
    newMessage: string,
    context?: { postId?: string; analysisId?: string }
  ): Promise<ChatResponse> {
    if (!this.isConfigured()) {
      throw new AIServiceError('AI service not configured. Please set your OpenAI API key.');
    }

    try {
      // Convert our messages to OpenAI format
      const openAIMessages = [
        {
          role: 'system' as const,
          content: this.getChatSystemPrompt()
        },
        ...messages.map(msg => ({
          role: msg.role as 'user' | 'assistant',
          content: msg.content
        })),
        {
          role: 'user' as const,
          content: newMessage
        }
      ];

      const response = await this.rateLimitedRequest(async () => {
        return await this.client!.chat.completions.create({
          model: this.config.model,
          messages: openAIMessages,
          temperature: this.config.temperature,
          max_tokens: this.config.maxTokens
        });
      });

      const aiResponse = response.choices[0]?.message?.content;
      if (!aiResponse) {
        throw new AIServiceError('No response received from AI service');
      }

      const responseMessage: ChatMessage = {
        id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        role: 'assistant',
        content: aiResponse,
        timestamp: new Date(),
        context,
        metadata: {
          wordCount: aiResponse.split(/\s+/).length,
          processingTime: Date.now() - Date.now() // This would be calculated properly
        }
      };

      return {
        success: true,
        data: {
          message: responseMessage
        }
      };

    } catch (error) {
      console.error('Chat message failed:', error);
      
      if (error instanceof AIServiceError) {
        throw error;
      }

      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      throw new AIServiceError(`Chat failed: ${errorMessage}`);
    }
  }

  public async streamChatMessage(
    messages: ChatMessage[],
    newMessage: string,
    onChunk: (chunk: string) => void,
    context?: { postId?: string; analysisId?: string }
  ): Promise<ChatResponse> {
    if (!this.isConfigured()) {
      throw new AIServiceError('AI service not configured. Please set your OpenAI API key.');
    }

    try {
      const openAIMessages = [
        {
          role: 'system' as const,
          content: this.getChatSystemPrompt()
        },
        ...messages.map(msg => ({
          role: msg.role as 'user' | 'assistant',
          content: msg.content
        })),
        {
          role: 'user' as const,
          content: newMessage
        }
      ];

      const stream = await this.rateLimitedRequest(async () => {
        return await this.client!.chat.completions.create({
          model: this.config.model,
          messages: openAIMessages,
          temperature: this.config.temperature,
          max_tokens: this.config.maxTokens,
          stream: true
        });
      });

      let fullResponse = '';
      for await (const chunk of stream) {
        const content = chunk.choices[0]?.delta?.content || '';
        if (content) {
          fullResponse += content;
          onChunk(content);
        }
      }

      const responseMessage: ChatMessage = {
        id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        role: 'assistant',
        content: fullResponse,
        timestamp: new Date(),
        context,
        metadata: {
          wordCount: fullResponse.split(/\s+/).length,
          processingTime: Date.now() - Date.now()
        }
      };

      return {
        success: true,
        data: {
          message: responseMessage,
          stream: true
        }
      };

    } catch (error) {
      console.error('Streaming chat failed:', error);
      
      if (error instanceof AIServiceError) {
        throw error;
      }

      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      throw new AIServiceError(`Streaming chat failed: ${errorMessage}`);
    }
  }

  private getAnalysisSystemPrompt(): string {
    return `You are a professional writing editor and coach. Your role is to analyze written content and provide constructive feedback.

Your analysis should cover:
1. Readability and clarity (score 1-10)
2. Tone assessment
3. Target audience identification
4. Specific suggestions for improvement
5. Identification of ambiguous phrases

Respond in this JSON format:
{
  "readabilityScore": number,
  "clarityScore": number,
  "toneAnalysis": "string",
  "targetAudience": "string",
  "suggestions": [
    {
      "type": "clarity|tone|structure|grammar",
      "severity": "low|medium|high",
      "description": "string",
      "originalText": "string",
      "suggestedText": "string",
      "position": {"start": number, "end": number}
    }
  ],
  "ambiguousPhrases": [
    {
      "text": "string",
      "position": {"start": number, "end": number},
      "reason": "string",
      "suggestions": ["string"]
    }
  ]
}

Be constructive and specific in your feedback. Focus on helping the writer improve their content.`;
  }

  private getChatSystemPrompt(): string {
    const verbosityInstructions = {
      concise: 'Keep responses brief and to the point.',
      normal: 'Provide balanced responses with adequate detail.',
      detailed: 'Give comprehensive responses with examples and explanations.'
    };

    return `You are a professional writing assistant and editor. Your role is to help users improve their writing through:

1. Answering questions about writing techniques and best practices
2. Providing feedback on content clarity and style
3. Suggesting improvements for readability and engagement
4. Explaining grammar and style rules
5. Helping with content structure and organization

Guidelines:
- ${verbosityInstructions[this.config.verbosity]}
- Be supportive and constructive in your feedback
- Ask clarifying questions when needed
- Provide specific, actionable advice
- Respect the user's writing style and voice
- Never rewrite content without explicit permission

Maintain a helpful, professional tone while being approachable and encouraging.`;
  }

  private parseAnalysisResponse(analysisText: string, originalContent: string): any {
    try {
      // Try to parse as JSON first
      const parsed = JSON.parse(analysisText);
      
      // Add required fields with defaults if missing
      return {
        id: `analysis-${Date.now()}`,
        postId: '', // Will be set by the calling code
        timestamp: new Date(),
        metrics: {
          readabilityScore: parsed.readabilityScore || 7,
          clarityScore: parsed.clarityScore || 7,
          toneAnalysis: parsed.toneAnalysis || 'Neutral',
          targetAudience: parsed.targetAudience || 'General audience'
        },
        suggestions: parsed.suggestions || [],
        ambiguousPhrases: parsed.ambiguousPhrases || []
      };
    } catch (error) {
      // Fallback: create a basic analysis result
      const wordCount = originalContent.split(/\s+/).length;
      const sentences = originalContent.split(/[.!?]+/).filter(s => s.trim().length > 0);
      const avgWordsPerSentence = wordCount / sentences.length || 0;
      
      // Simple readability estimation
      const readabilityScore = Math.min(10, Math.max(1, 10 - (avgWordsPerSentence - 15) / 3));
      
      return {
        id: `analysis-${Date.now()}`,
        postId: '',
        timestamp: new Date(),
        metrics: {
          readabilityScore: Math.round(readabilityScore),
          clarityScore: 7,
          toneAnalysis: 'Unable to analyze tone',
          targetAudience: 'General audience'
        },
        suggestions: [{
          type: 'clarity',
          severity: 'low',
          description: 'Analysis could not be completed. Please try again.',
          originalText: '',
          suggestedText: '',
          position: { start: 0, end: 0 }
        }],
        ambiguousPhrases: []
      };
    }
  }
}

// Create and export singleton instance
export const aiService = new AIService();

// Export the class for testing
export { AIService };