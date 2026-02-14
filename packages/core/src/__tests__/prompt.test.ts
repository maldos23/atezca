import { getSystemPrompt, getUserPrompt, getUserPromptWithContext } from '../interpreter/prompt.js';
import type { PageContext, TestCommand } from '../types/index.js';

describe('prompt helpers', () => {
  it('getSystemPrompt returns non-empty instructions', () => {
    const prompt = getSystemPrompt();
    expect(prompt).toContain('CRITICAL RULES');
    expect(prompt).toContain('Respond ONLY with JSON');
  });

  it('getUserPrompt stringifies command', () => {
    const cmd: TestCommand = { actionType: 'expect', description: 'see success', timestamp: 1 };
    expect(getUserPrompt(cmd)).toBe(JSON.stringify({ actionType: 'expect', description: 'see success' }));
  });

  it('getUserPromptWithContext includes elements and accessibility tree when available', () => {
    const cmd: TestCommand = { actionType: 'interact', description: 'click login', timestamp: 1 };
    const ctx: PageContext = {
      url: 'https://example.com/login',
      title: 'Login',
      accessibilityTree: 'Root > Form',
      interactiveElements: [
        { role: 'button', name: 'Login', tag: 'button' },
        { role: 'textbox', name: 'Email', tag: 'input' },
      ],
    };

    const prompt = getUserPromptWithContext(cmd, ctx);
    expect(prompt).toContain('CURRENT PAGE CONTEXT');
    expect(prompt).toContain('Available interactive elements on the page');
    expect(prompt).toContain('- button: "Login" (button)');
    expect(prompt).toContain('Page structure:');
    expect(prompt).toContain('Root > Form');
    expect(prompt).toContain('USER COMMAND');
    expect(prompt).toContain('click login');
  });

  it('getUserPromptWithContext omits accessibilityTree when capture is unavailable', () => {
    const cmd: TestCommand = { actionType: 'wait', description: 'until ready', timestamp: 1 };
    const ctx: PageContext = {
      url: 'https://example.com',
      title: 'Home',
      accessibilityTree: 'Unable to capture',
      interactiveElements: [],
    };

    const prompt = getUserPromptWithContext(cmd, ctx);
    expect(prompt).not.toContain('Page structure:');
    expect(prompt).not.toContain('Available interactive elements on the page');
  });
});
