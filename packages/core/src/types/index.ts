/**
 * AI Provider type
 */
export type AIProvider = 'claude' | 'gemini';

/**
 * Configuration for az.setup()
 */
export interface SetupConfig {
  /** Base URL for the application under test */
  url: string;
  /** Browser type to use */
  browser?: 'chromium' | 'firefox' | 'webkit';
  /** Whether to run in headless mode */
  headless?: boolean;
  /** Default timeout in milliseconds */
  timeout?: number;
  /** Directory for generated test files */
  outputDir?: string;
  /** Whether to enable caching */
  cacheEnabled?: boolean;
  /** Number of retries for failed actions */
  retries?: number;
  /** AI provider to use (overrides environment config) */
  aiProvider?: AIProvider;
  /** API key for the AI provider (overrides environment config) */
  apiKey?: string;
  /** Disable SSL certificate validation (useful for self-signed certificates) */
  disableSSL?: boolean;
}

/**
 * Type of action to perform
 */
export type ActionType = 
  | 'navigate'    // Navigate to a page or URL
  | 'interact'    // Click, type, select, etc.
  | 'wait'        // Wait for condition
  | 'expect';     // Assertion/verification

/**
 * Test command registered by az.test()
 */
export interface TestCommand {
  actionType: ActionType;
  description: string;
  timestamp: number;
}

/**
 * Page context for AI interpretation
 */
export interface PageContext {
  /** Current URL */
  url: string;
  /** Page title */
  title: string;
  /** Simplified accessibility tree */
  accessibilityTree: string;
  /** Available interactive elements */
  interactiveElements: Array<{
    role: string;
    name: string;
    tag: string;
  }>;
}

/**
 * Playwright action to execute
 */
export interface PlaywrightAction {
  /** Type of action */
  action: 'click' | 'type' | 'navigate' | 'wait' | 'expect' | 'select' | 'hover' | 'press';
  /** CSS selector or text selector */
  selector?: string;
  /** Value to type, URL to navigate, etc. */
  value?: string;
  /** Condition for wait actions */
  condition?: string;
  /** Assertion type for expect actions */
  assertionType?: 'visible' | 'hidden' | 'text' | 'value' | 'enabled' | 'disabled';
  /** Expected value for assertions */
  expected?: string;
  /** Timeout for this specific action */
  timeout?: number;
}

/**
 * Result of interpreting a command
 */
export interface InterpretationResult {
  /** Original command */
  command: TestCommand;
  /** Parsed Playwright actions */
  actions: PlaywrightAction[];
  /** Whether this came from cache */
  cached: boolean;
  /** Timestamp of interpretation */
  timestamp: number;
}

/**
 * Cache entry structure
 */
export interface CacheEntry {
  /** Hash of the command */
  key: string;
  /** Parsed actions */
  actions: PlaywrightAction[];
  /** When it was cached */
  cachedAt: number;
  /** Expiry timestamp */
  expiresAt: number;
}

/**
 * Test execution result
 */
export interface TestResult {
  /** Whether test passed */
  success: boolean;
  /** Error message if failed */
  error?: string;
  /** Duration in milliseconds */
  duration: number;
  /** Number of actions executed */
  actionsExecuted: number;
  /** Generated Playwright code file path */
  generatedFile?: string;
}

/**
 * Configuration loaded from .atezcarc or environment
 */
export interface AtezcaConfig {
  /** AI provider to use */
  aiProvider: AIProvider;
  /** Anthropic API key (for Claude) */
  anthropicApiKey?: string;
  /** Google API key (for Gemini) */
  googleApiKey?: string;
  /** Cache settings */
  cache: {
    enabled: boolean;
    expiryDays: number;
    filePath: string;
  };
  /** Browser settings */
  browser: {
    type: 'chromium' | 'firefox' | 'webkit';
    headless: boolean;
  };
  /** Execution settings */
  execution: {
    timeout: number;
    retries: number;
    outputDir: string;
  };
}
