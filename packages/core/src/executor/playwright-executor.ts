import { chromium, firefox, webkit, type Browser, type Page, type BrowserContext } from 'playwright';
import type { PlaywrightAction, SetupConfig, PageContext } from '../types/index.js';

/**
 * Playwright executor for running test actions
 */
export class PlaywrightExecutor {
  private browser: Browser | null = null;
  private context: BrowserContext | null = null;
  private page: Page | null = null;
  private config: SetupConfig;
  private actionLog: Array<{ action: PlaywrightAction; result: string; duration: number }> = [];

  constructor(config: SetupConfig) {
    this.config = config;
  }

  /**
   * Initialize browser and page
   */
  async initialize(): Promise<void> {
    const browserType = this.config.browser ?? 'chromium';
    const headless = this.config.headless ?? true;

    // Launch browser
    switch (browserType) {
      case 'chromium':
        this.browser = await chromium.launch({ headless });
        break;
      case 'firefox':
        this.browser = await firefox.launch({ headless });
        break;
      case 'webkit':
        this.browser = await webkit.launch({ headless });
        break;
      default:
        throw new Error(`Unsupported browser: ${browserType}`);
    }

    // Create context and page
    this.context = await this.browser.newContext({
      ignoreHTTPSErrors: this.config.disableSSL ?? false,
    });
    this.page = await this.context.newPage();

    // Set default timeout
    this.page.setDefaultTimeout(this.config.timeout ?? 30000);

    // Navigate to base URL
    await this.page.goto(this.config.url);
  }

  /**
   * Execute a single action with retry logic
   */
  async executeAction(action: PlaywrightAction): Promise<void> {
    if (!this.page) {
      throw new Error('Executor not initialized. Call initialize() first.');
    }

    const startTime = Date.now();
    const retries = this.config.retries ?? 3;
    let lastError: Error | null = null;

    for (let attempt = 0; attempt < retries; attempt++) {
      try {
        await this.performAction(action);
        const duration = Date.now() - startTime;
        this.actionLog.push({ action, result: 'success', duration });
        return;
      } catch (error) {
        lastError = error as Error;
        if (attempt < retries - 1) {
          // Wait before retry (exponential backoff)
          await this.page.waitForTimeout(Math.pow(2, attempt) * 1000);
        }
      }
    }

    const duration = Date.now() - startTime;
    this.actionLog.push({ 
      action, 
      result: `failed: ${lastError?.message}`, 
      duration 
    });
    throw lastError;
  }

  /**
   * Perform the actual action
   */
  private async performAction(action: PlaywrightAction): Promise<void> {
    if (!this.page) {
      throw new Error('Page not initialized');
    }

    const timeout = action.timeout ?? this.config.timeout ?? 30000;

    switch (action.action) {
      case 'click':
        if (!action.selector) throw new Error('Click action requires selector');
        await this.page.locator(action.selector).click({ timeout });
        break;

      case 'type':
        if (!action.selector) throw new Error('Type action requires selector');
        if (!action.value) throw new Error('Type action requires value');
        await this.page.locator(action.selector).fill(action.value, { timeout });
        break;

      case 'navigate':
        if (!action.value) throw new Error('Navigate action requires value');
        const url = action.value.startsWith('http') 
          ? action.value 
          : new URL(action.value, this.config.url).toString();
        await this.page.goto(url, { timeout });
        break;

      case 'wait':
        // If condition is 'attached' and selector is 'body', this is a simple time wait
        if (action.condition === 'attached' && action.selector === 'body') {
          await this.page.waitForTimeout(timeout);
        } else {
          // Otherwise, wait for element state
          if (!action.selector) throw new Error('Wait action requires selector');
          const state = action.condition ?? 'visible';
          await this.page.locator(action.selector).waitFor({ 
            state: state as 'visible' | 'hidden' | 'attached' | 'detached',
            timeout 
          });
        }
        break;

      case 'expect':
        if (!action.selector) throw new Error('Expect action requires selector');
        await this.performAssertion(action, timeout);
        break;

      case 'select':
        if (!action.selector) throw new Error('Select action requires selector');
        if (!action.value) throw new Error('Select action requires value');
        await this.page.locator(action.selector).selectOption(action.value, { timeout });
        break;

      case 'hover':
        if (!action.selector) throw new Error('Hover action requires selector');
        await this.page.locator(action.selector).hover({ timeout });
        break;

      case 'press':
        if (!action.value) throw new Error('Press action requires value (key name)');
        await this.page.keyboard.press(action.value);
        break;

      default:
        throw new Error(`Unsupported action: ${action.action}`);
    }
  }

  /**
   * Perform assertion
   */
  private async performAssertion(action: PlaywrightAction, timeout: number): Promise<void> {
    if (!this.page || !action.selector) return;

    const locator = this.page.locator(action.selector);

    switch (action.assertionType) {
      case 'visible':
        await locator.waitFor({ state: 'visible', timeout });
        break;
      case 'hidden':
        await locator.waitFor({ state: 'hidden', timeout });
        break;
      case 'text':
        if (!action.expected) throw new Error('Text assertion requires expected value');
        await locator.waitFor({ state: 'visible', timeout });
        const text = await locator.textContent();
        if (!text?.includes(action.expected)) {
          throw new Error(`Expected text "${action.expected}" but got "${text}"`);
        }
        break;
      case 'value':
        if (!action.expected) throw new Error('Value assertion requires expected value');
        await locator.waitFor({ state: 'visible', timeout });
        const value = await locator.inputValue();
        if (value !== action.expected) {
          throw new Error(`Expected value "${action.expected}" but got "${value}"`);
        }
        break;
      case 'enabled':
        await locator.waitFor({ state: 'visible', timeout });
        if (await locator.isDisabled()) {
          throw new Error('Expected element to be enabled but it is disabled');
        }
        break;
      case 'disabled':
        await locator.waitFor({ state: 'visible', timeout });
        if (await locator.isEnabled()) {
          throw new Error('Expected element to be disabled but it is enabled');
        }
        break;
      default:
        // Default to visibility check
        await locator.waitFor({ state: 'visible', timeout });
    }
  }

  /**
   * Execute multiple actions in sequence
   */
  async executeActions(actions: PlaywrightAction[]): Promise<void> {
    for (const action of actions) {
      await this.executeAction(action);
    }
  }

  /**
   * Get action execution log
   */
  getActionLog(): typeof this.actionLog {
    return [...this.actionLog];
  }

  /**
   * Take screenshot
   */
  async screenshot(path: string): Promise<void> {
    if (!this.page) {
      throw new Error('Page not initialized');
    }
    await this.page.screenshot({ path });
  }

  /**
   * Close browser
   */
  async close(): Promise<void> {
    if (this.context) {
      await this.context.close();
    }
    if (this.browser) {
      await this.browser.close();
    }
    this.browser = null;
    this.context = null;
    this.page = null;
  }

  /**
   * Get current page (for advanced usage)
   */
  getPage(): Page | null {
    return this.page;
  }

  /**
   * Capture current page context for AI interpretation
   */
  async getPageContext(): Promise<PageContext> {
    if (!this.page) {
      throw new Error('Page not initialized');
    }

    try {
      // Get basic page info
      const url = this.page.url();
      const title = await this.page.title();

      // Get accessibility tree snapshot (simplified)
      const snapshot = await this.page.accessibility.snapshot();
      const accessibilityTree = this.simplifyAccessibilityTree(snapshot);

      // Get interactive elements
      const interactiveElements = await this.page.evaluate(() => {
        const elements: Array<{ role: string; name: string; tag: string }> = [];
        
        // Get buttons
        document.querySelectorAll('button, [role="button"], input[type="button"], input[type="submit"]').forEach(el => {
          const text = el.textContent?.trim() || (el as HTMLInputElement).value || '';
          if (text) {
            elements.push({
              role: 'button',
              name: text,
              tag: el.tagName.toLowerCase()
            });
          }
        });

        // Get links
        document.querySelectorAll('a[href]').forEach(el => {
          const text = el.textContent?.trim() || '';
          if (text) {
            elements.push({
              role: 'link',
              name: text,
              tag: 'a'
            });
          }
        });

        // Get inputs
        document.querySelectorAll('input:not([type="hidden"]), textarea, select').forEach(el => {
          const input = el as HTMLInputElement;
          const label = document.querySelector(`label[for="${input.id}"]`)?.textContent?.trim() ||
                       input.placeholder ||
                       input.name ||
                       input.id;
          if (label) {
            elements.push({
              role: 'input',
              name: label,
              tag: input.tagName.toLowerCase()
            });
          }
        });

        return elements.slice(0, 50); // Limit to first 50 elements
      });

      return {
        url,
        title,
        accessibilityTree,
        interactiveElements
      };
    } catch (error) {
      // Fallback context if capture fails
      return {
        url: this.page.url(),
        title: await this.page.title().catch(() => 'Unknown'),
        accessibilityTree: 'Unable to capture',
        interactiveElements: []
      };
    }
  }

  /**
   * Simplify accessibility tree for AI consumption
   */
  private simplifyAccessibilityTree(node: any, depth: number = 0, maxDepth: number = 3): string {
    if (!node || depth > maxDepth) return '';

    let result = '';
    const indent = '  '.repeat(depth);

    if (node.role) {
      const name = node.name ? ` "${node.name}"` : '';
      result += `${indent}- ${node.role}${name}\n`;
    }

    if (node.children && depth < maxDepth) {
      for (const child of node.children.slice(0, 10)) { // Limit children
        result += this.simplifyAccessibilityTree(child, depth + 1, maxDepth);
      }
    }

    return result;
  }
}
