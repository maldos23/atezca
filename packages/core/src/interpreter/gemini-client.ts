import { GoogleGenerativeAI } from '@google/generative-ai';

/**
 * Gemini client wrapper
 */
export class GeminiClient {
  private genAI: GoogleGenerativeAI;
  private model: string;

  constructor(apiKey: string, model: string = 'gemini-3-pro-preview') {
    if (!apiKey || !apiKey.startsWith('AIza')) {
      throw new Error('Invalid Google API key. Must start with "AIza"');
    }

    this.genAI = new GoogleGenerativeAI(apiKey);
    this.model = model;
  }

  /**
   * Send a message to Gemini and get response
   */
  async sendMessage(systemPrompt: string, userPrompt: string): Promise<string> {
    console.log(`🤖 Using model: ${this.model}`);
    try {
      const model = this.genAI.getGenerativeModel({ 
        model: this.model,
        generationConfig: {
          temperature: 0, // Deterministic responses
          maxOutputTokens: 1024,
        },
      });

      // Combine system and user prompts for Gemini
      const fullPrompt = `${systemPrompt}\n\nUser Request:\n${userPrompt}`;

      const result = await model.generateContent(fullPrompt);
      const response = await result.response;
      return response.text();
    } catch (error) {
      if (error instanceof Error) {
        throw new Error(`Gemini API error: ${error.message}`);
      }
      throw error;
    }
  }

  /**
   * Test API key validity
   */
  async testConnection(): Promise<boolean> {
    try {
      await this.sendMessage('You are a test assistant.', 'Respond with "OK"');
      return true;
    } catch {
      return false;
    }
  }
}
