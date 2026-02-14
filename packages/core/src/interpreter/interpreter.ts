import { z } from 'zod';
import type { TestCommand, PlaywrightAction, InterpretationResult, AIProvider, PageContext } from '../types/index.js';
import { ClaudeClient } from './claude-client.js';
import { GeminiClient } from './gemini-client.js';
import { getSystemPrompt, getUserPrompt, getUserPromptWithContext } from './prompt.js';

/**
 * Base AI client interface
 */
interface AIClient {
  sendMessage(systemPrompt: string, userPrompt: string): Promise<string>;
  testConnection(): Promise<boolean>;
}

/**
 * Zod schema for validating Claude's response
 */
const PlaywrightActionSchema = z.object({
  action: z.enum(['click', 'type', 'navigate', 'wait', 'expect', 'select', 'hover', 'press']),
  selector: z.string().optional(),
  value: z.string().optional(),
  condition: z.string().optional(),
  assertionType: z.enum(['visible', 'hidden', 'text', 'value', 'enabled', 'disabled']).optional(),
  expected: z.string().optional(),
  timeout: z.number().optional(),
});

const ClaudeResponseSchema = z.object({
  actions: z.array(PlaywrightActionSchema),
});

/**
 * Interpreter that converts natural language to Playwright actions using AI
 */
export class Interpreter {
  private client: AIClient;
  private provider: AIProvider;

  constructor(provider: AIProvider, apiKey: string) {
    this.provider = provider;

    switch (provider) {
      case 'claude':
        this.client = new ClaudeClient(apiKey);
        break;
      case 'gemini':
        this.client = new GeminiClient(apiKey);
        break;
      default:AI
        throw new Error(`Unsupported AI provider: ${provider}`);
    }
  }

  /**
   * Interpret a test command into Playwright actions
   */
  async interpret(command: TestCommand, pageContext?: PageContext): Promise<PlaywrightAction[]> {
    // Check if this is a simple wait command (e.g., "wait 1000ms")
    const waitMatch = command.description.match(/^wait\s+(\d+)ms$/i);
    if (waitMatch && command.actionType === 'wait') {
      const milliseconds = parseInt(waitMatch[1], 10);
      return [{
        action: 'wait',
        timeout: milliseconds,
        selector: 'body', // Dummy selector, will just wait
        condition: 'attached',
      }];
    }

    const systemPrompt = getSystemPrompt();
    const userPrompt = pageContext 
      ? getUserPromptWithContext(command, pageContext)
      : getUserPrompt(command);

    // Get response from AI
    const responseText = await this.client.sendMessage(systemPrompt, userPrompt);

    // Parse and validate response
    let response;
    try {
      // Clean response (remove markdown code blocks if present)
      const cleanedResponse = responseText
        .replace(/```json\n?/g, '')
        .replace(/```\n?/g, '')
        .trim();

      response = JSON.parse(cleanedResponse);
    } catch (error) {
      throw new Error(`Failed to parse ${this.provider} response: ${responseText}`);
    }

    // Validate against schema
    const validated = ClaudeResponseSchema.parse(response);

    return validated.actions;
  }

  /**
   * Test if the interpreter is working
   */
  async test(): Promise<boolean> {
    return this.client.testConnection();
  }
}

/**
 * Create interpretation result
 */
export function createInterpretationResult(
  command: TestCommand,
  actions: PlaywrightAction[],
  cached: boolean = false
): InterpretationResult {
  return {
    command,
    actions,
    cached,
    timestamp: Date.now(),
  };
}
