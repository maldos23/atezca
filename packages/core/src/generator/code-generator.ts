import * as fs from 'node:fs';
import * as path from 'node:path';
import type { PlaywrightAction, SetupConfig, InterpretationResult } from '../types/index.js';

/**
 * Code generator for creating reusable Playwright test files
 */
export class CodeGenerator {
  private config: SetupConfig;

  constructor(config: SetupConfig) {
    this.config = config;
  }

  /**
   * Generate Playwright test code from actions
   */
  generateCode(interpretations: InterpretationResult[]): string {
    const lines: string[] = [];

    // Add imports
    lines.push("import { test, expect } from '@playwright/test';");
    lines.push('');

    // Add SSL warning if disabled
    if (this.config.disableSSL) {
      lines.push('// Note: SSL certificate validation is disabled (ignoreHTTPSErrors: true)');
      lines.push('// This is configured in playwright.config.ts');
      lines.push('');
    }

    // Add test suite
    lines.push("test.describe('Generated E2E Test', () => {");
    lines.push('  test.beforeEach(async ({ page }) => {');
    lines.push(`    // Navigate to base URL`);
    lines.push(`    await page.goto('${this.config.url}');`);
    lines.push('  });');
    lines.push('');

    // Add main test
    lines.push("  test('should execute test actions', async ({ page }) => {");
    
    // Add each action group as comments and code
    for (const interpretation of interpretations) {
      const { command, actions } = interpretation;
      
      lines.push('');
      lines.push(`    // ${command.actionType}: ${command.description}`);
      
      for (const action of actions) {
        const code = this.generateActionCode(action);
        lines.push(`    ${code}`);
      }
    }

    lines.push('  });');
    lines.push('});');
    lines.push('');

    return lines.join('\n');
  }

  /**
   * Generate code for a single action
   */
  private generateActionCode(action: PlaywrightAction): string {
    const timeout = action.timeout ?? this.config.timeout ?? 30000;

    switch (action.action) {
      case 'click':
        return `await page.locator('${this.escapeString(action.selector!)}').click({ timeout: ${timeout} });`;

      case 'type':
        return `await page.locator('${this.escapeString(action.selector!)}').fill('${this.escapeString(action.value!)}', { timeout: ${timeout} });`;

      case 'navigate': {
        const url = action.value!.startsWith('http') 
          ? action.value 
          : `\${baseUrl}${action.value}`;
        return `await page.goto('${this.escapeString(url)}', { timeout: ${timeout} });`;
      }

      case 'wait': {
        // Check if this is a simple time wait
        if (action.condition === 'attached' && action.selector === 'body') {
          return `await page.waitForTimeout(${timeout});`;
        }
        // Otherwise, wait for element state
        const state = action.condition ?? 'visible';
        return `await page.locator('${this.escapeString(action.selector!)}').waitFor({ state: '${state}', timeout: ${timeout} });`;
      }

      case 'expect':
        return this.generateAssertionCode(action, timeout);

      case 'select':
        return `await page.locator('${this.escapeString(action.selector!)}').selectOption('${this.escapeString(action.value!)}', { timeout: ${timeout} });`;

      case 'hover':
        return `await page.locator('${this.escapeString(action.selector!)}').hover({ timeout: ${timeout} });`;

      case 'press':
        return `await page.keyboard.press('${this.escapeString(action.value!)}');`;

      default:
        return `// Unsupported action: ${action.action}`;
    }
  }

  /**
   * Generate assertion code
   */
  private generateAssertionCode(action: PlaywrightAction, timeout: number): string {
    const locator = `page.locator('${this.escapeString(action.selector!)}')`;

    switch (action.assertionType) {
      case 'visible':
        return `await expect(${locator}).toBeVisible({ timeout: ${timeout} });`;
      case 'hidden':
        return `await expect(${locator}).toBeHidden({ timeout: ${timeout} });`;
      case 'text':
        return `await expect(${locator}).toContainText('${this.escapeString(action.expected!)}', { timeout: ${timeout} });`;
      case 'value':
        return `await expect(${locator}).toHaveValue('${this.escapeString(action.expected!)}', { timeout: ${timeout} });`;
      case 'enabled':
        return `await expect(${locator}).toBeEnabled({ timeout: ${timeout} });`;
      case 'disabled':
        return `await expect(${locator}).toBeDisabled({ timeout: ${timeout} });`;
      default:
        return `await expect(${locator}).toBeVisible({ timeout: ${timeout} });`;
    }
  }

  /**
   * Escape string for code generation
   */
  private escapeString(str: string): string {
    return str
      .replace(/\\/g, '\\\\')
      .replace(/'/g, "\\'")
      .replace(/"/g, '\\"')
      .replace(/\n/g, '\\n')
      .replace(/\r/g, '\\r');
  }

  /**
   * Generate and save test file
   */
  async saveTestFile(
    interpretations: InterpretationResult[],
    filename?: string
  ): Promise<string> {
    const code = this.generateCode(interpretations);
    const outputDir = this.config.outputDir ?? 'generated-tests';
    
    // Ensure output directory exists
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }

    // Generate filename if not provided
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const finalFilename = filename ?? `test-${timestamp}.spec.ts`;
    const filePath = path.join(outputDir, finalFilename);

    // Write file
    fs.writeFileSync(filePath, code, 'utf-8');

    return filePath;
  }

  /**
   * Generate Playwright config file
   */
  generatePlaywrightConfig(): string {
    const useConfig: string[] = [
      `    baseURL: '${this.config.url}',`,
      `    trace: 'on-first-retry',`,
      `    screenshot: 'only-on-failure',`,
    ];

    // Add ignoreHTTPSErrors if disableSSL is enabled
    if (this.config.disableSSL) {
      useConfig.push(`    ignoreHTTPSErrors: true, // SSL certificate errors disabled`);
    }

    return `import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './generated-tests',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: 'html',
  use: {
${useConfig.join('\n')}
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
});
`;
  }

  /**
   * Save Playwright config file
   */
  async savePlaywrightConfig(): Promise<string> {
    const config = this.generatePlaywrightConfig();
    const filePath = 'playwright.config.ts';
    
    // Only create if it doesn't exist
    if (!fs.existsSync(filePath)) {
      fs.writeFileSync(filePath, config, 'utf-8');
    }
    
    return filePath;
  }
}
