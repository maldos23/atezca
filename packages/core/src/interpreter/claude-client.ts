import Anthropic from '@anthropic-ai/sdk';

/**
 * Claude client wrapper
 */
export class ClaudeClient {
  private client: Anthropic;
  private model: string;

  constructor(apiKey: string, model: string = 'claude-3-5-sonnet-20241022') {
    if (!apiKey || !apiKey.startsWith('sk-ant-')) {
      throw new Error('Invalid Anthropic API key. Must start with "sk-ant-"');
    }

    this.client = new Anthropic({
      apiKey,
    });
    this.model = model;
  }

  /**
   * Send a message to Claude and get response
   */
  async sendMessage(systemPrompt: string, userPrompt: string): Promise<string> {
    console.log(`🤖 Using model: ${this.model}`);
    try {
      const message = await this.client.messages.create({
        model: this.model,
        max_tokens: 1024,
        temperature: 0, // Deterministic responses
        system: systemPrompt,
        messages: [
          {
            role: 'user',
            content: userPrompt,
          },
        ],
      });

      // Extract text from response
      const content = message.content[0];
      if (content.type !== 'text') {
        throw new Error('Expected text response from Claude');
      }

      return content.text;
    } catch (error) {
      if (error instanceof Anthropic.APIError) {
        throw new Error(`Claude API error: ${error.message}`);
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
