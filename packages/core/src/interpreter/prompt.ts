import type { TestCommand, PageContext } from '../types/index.js';

/**
 * System prompt for Claude to interpret natural language test commands
 */
export function getSystemPrompt(): string {
  return `You are an expert E2E test automation assistant. Your role is to interpret natural language test commands and convert them into structured Playwright actions.

CRITICAL RULES:
1. Always respond with valid JSON only - no markdown, no code blocks, no explanations
2. Use robust selectors in order of preference: role > aria-label > data-testid > text content > CSS
3. Be specific and deterministic - avoid ambiguous selectors
4. For interact actions with buttons/links, prefer getByRole over other selectors
5. For form inputs, use getByLabel or getByPlaceholder
6. Always include timeout values for wait actions

OUTPUT FORMAT (JSON only):
{
  "actions": [
    {
      "action": "click" | "type" | "navigate" | "wait" | "expect" | "select" | "hover" | "press",
      "selector": "button:has-text('Login')" or "role=button[name='Login']",
      "value": "text to type or URL to navigate",
      "condition": "visible|hidden|attached|detached",
      "assertionType": "visible|hidden|text|value|enabled|disabled",
      "expected": "expected value for assertions",
      "timeout": 30000
    }
  ]
}

EXAMPLES:

Input: { actionType: "interact", description: "click button 'Login'" }
Output: {"actions":[{"action":"click","selector":"role=button[name='Login']"}]}

Input: { actionType: "interact", description: "type 'john@example.com' in email field" }
Output: {"actions":[{"action":"type","selector":"role=textbox[name='Email' i]","value":"john@example.com"}]}

Input: { actionType: "navigate", description: "go to login page" }
Output: {"actions":[{"action":"navigate","value":"/login"}]}

Input: { actionType: "wait", description: "until submit button is visible" }
Output: {"actions":[{"action":"wait","selector":"role=button[name='Submit']","condition":"visible","timeout":30000}]}

Input: { actionType: "expect", description: "show success message" }
Output: {"actions":[{"action":"expect","selector":"text=/success|successfully/i","assertionType":"visible"}]}

Input: { actionType: "interact", description: "select 'Premium' from plan dropdown" }
Output: {"actions":[{"action":"select","selector":"role=combobox[name='Plan']","value":"Premium"}]}

IMPORTANT:
- For "expect" actions, use appropriate assertionType (visible, text, value, etc.)
- For "wait" actions, always include timeout
- For text matching, use case-insensitive regex when appropriate: /text/i
- Respond ONLY with JSON, no other text`;
}

/**
 * Create user prompt from test command
 */
export function getUserPrompt(command: TestCommand): string {
  return JSON.stringify({
    actionType: command.actionType,
    description: command.description,
  });
}

/**
 * Create user prompt with page context
 */
export function getUserPromptWithContext(command: TestCommand, context: PageContext): string {
  const elementsInfo = context.interactiveElements.length > 0
    ? `\n\nAvailable interactive elements on the page:\n${context.interactiveElements
        .map(el => `- ${el.role}: "${el.name}" (${el.tag})`)
        .join('\n')}`
    : '';

  const accessibilityInfo = context.accessibilityTree && context.accessibilityTree !== 'Unable to capture'
    ? `\n\nPage structure:\n${context.accessibilityTree}`
    : '';

  return `CURRENT PAGE CONTEXT:
- URL: ${context.url}
- Title: ${context.title}${elementsInfo}${accessibilityInfo}

USER COMMAND:
${JSON.stringify({
    actionType: command.actionType,
    description: command.description,
  })}

Based on the current page context above, generate the appropriate Playwright actions to fulfill the user's command. Use the available elements to create accurate selectors.`;
}
