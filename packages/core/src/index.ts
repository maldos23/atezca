import type { SetupConfig, TestCommand, ActionType } from './types/index.js';

/**
 * Global state for Atezca test suite
 */
class AtezcaState {
  private config: SetupConfig | null = null;
  private commands: TestCommand[] = [];

  setConfig(config: SetupConfig): void {
    this.config = config;
  }

  getConfig(): SetupConfig | null {
    return this.config;
  }

  addCommand(command: TestCommand): void {
    this.commands.push(command);
  }

  getCommands(): TestCommand[] {
    return [...this.commands];
  }

  clear(): void {
    this.config = null;
    this.commands = [];
  }
}

// Use globalThis to ensure state is shared across module instances
const ATEZCA_STATE_KEY = Symbol.for('__ATEZCA_STATE__');
if (!(globalThis as any)[ATEZCA_STATE_KEY]) {
  (globalThis as any)[ATEZCA_STATE_KEY] = new AtezcaState();
}
const state: AtezcaState = (globalThis as any)[ATEZCA_STATE_KEY];

/**
 * Setup Atezca test configuration
 * 
 * @example
 * ```ts
 * az.setup({
 *   url: "https://example.com",
 *   browser: "chromium",
 *   headless: true
 * });
 * ```
 */
export function setup(config: SetupConfig): void {
  if (!config.url) {
    throw new Error('az.setup() requires a url');
  }
  
  state.setConfig({
    ...config,
    browser: config.browser ?? 'chromium',
    headless: config.headless ?? true,
    timeout: config.timeout ?? 30000,
    outputDir: config.outputDir ?? 'generated-tests',
    cacheEnabled: config.cacheEnabled ?? true,
    retries: config.retries ?? 3,
    aiProvider: config.aiProvider,
    apiKey: config.apiKey,
    disableSSL: config.disableSSL ?? false,
  });
}

/**
 * Define a test action using natural language
 * 
 * @example
 * ```ts
 * az.test("interact", "click button 'Login'");
 * az.test("expect", "show success message");
 * az.test("wait", "until page is loaded");
 * ```
 */
export function test(actionType: ActionType, description: string): void {
  if (!state.getConfig()) {
    throw new Error('az.setup() must be called before az.test()');
  }

  if (!description || description.trim() === '') {
    throw new Error('az.test() requires a description');
  }

  const validTypes: ActionType[] = ['navigate', 'interact', 'wait', 'expect'];
  if (!validTypes.includes(actionType)) {
    throw new Error(`Invalid action type: ${actionType}. Must be one of: ${validTypes.join(', ')}`);
  }

  state.addCommand({
    actionType,
    description: description.trim(),
    timestamp: Date.now(),
  });
}

/**
 * Get current state (for internal use)
 * @internal
 */
export function getState() {
  return {
    config: state.getConfig(),
    commands: state.getCommands(),
  };
}

/**
 * Clear state (for internal use)
 * @internal
 */
export function clearState() {
  state.clear();
}

/**
 * Wait for a specified number of milliseconds
 * 
 * @example
 * ```ts
 * az.wait(1000); // Wait 1 second
 * az.wait(2500); // Wait 2.5 seconds
 * ```
 */
export function wait(milliseconds: number): void {
  if (!state.getConfig()) {
    throw new Error('az.setup() must be called before az.wait()');
  }

  if (typeof milliseconds !== 'number' || milliseconds < 0) {
    throw new Error('az.wait() requires a positive number of milliseconds');
  }

  state.addCommand({
    actionType: 'wait',
    description: `wait ${milliseconds}ms`,
    timestamp: Date.now(),
  });
}

/**
 * Main API export
 */
export const az = {
  setup,
  test,
  wait,
};

// Named exports for convenience
export { setup as azSetup, test as azTest, wait as azWait };

// Re-export types
export type * from './types/index.js';
