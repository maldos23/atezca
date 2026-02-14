import * as fs from 'node:fs';
import * as path from 'node:path';
import { config as loadEnv } from 'dotenv';
import { z } from 'zod';
import type { AtezcaConfig, AIProvider } from '../types/index.js';

/**
 * Configuration schema
 */
const ConfigSchema = z.object({
  aiProvider: z.enum(['claude', 'gemini']).default('claude'),
  anthropicApiKey: z.string().optional(),
  googleApiKey: z.string().optional(),
  cache: z.object({
    enabled: z.boolean().default(true),
    expiryDays: z.number().positive().default(30),
    filePath: z.string().default('.atezca-cache.json'),
  }),
  browser: z.object({
    type: z.enum(['chromium', 'firefox', 'webkit']).default('chromium'),
    headless: z.boolean().default(true),
  }),
  execution: z.object({
    timeout: z.number().positive().default(30000),
    retries: z.number().nonnegative().default(3),
    outputDir: z.string().default('generated-tests'),
  }),
}).refine(
  (data) => {
    // Validate that the appropriate API key is present for the selected provider
    if (data.aiProvider === 'claude' && !data.anthropicApiKey) {
      return false;
    }
    if (data.aiProvider === 'gemini' && !data.googleApiKey) {
      return false;
    }
    return true;
  },
  {
    message: 'API key required for selected AI provider',
  }
);

/**
 * Load configuration from environment and config file
 */
export class ConfigLoader {
  private config: AtezcaConfig | null = null;

  constructor() {
    this.load();
  }

  /**
   * Load configuration
   */
  private load(): void {
    // Load .env file
    loadEnv();

    // Try to load .atezcarc file
    const configFile = this.findConfigFile();
    let fileConfig: Record<string, unknown> = {};
    
    if (configFile) {
      try {
        const content = fs.readFileSync(configFile, 'utf-8');
        fileConfig = JSON.parse(content);
      } catch (error) {
        console.warn(`Warning: Failed to parse ${configFile}`);
      }
    }

    // Merge configurations (env > file > defaults)
    const rawConfig = {
      aiProvider: (process.env.ATEZCA_AI_PROVIDER as AIProvider) || (fileConfig.aiProvider as AIProvider) || 'claude',
      anthropicApiKey: process.env.ANTHROPIC_API_KEY || (fileConfig.anthropicApiKey as string) || '',
      googleApiKey: process.env.GOOGLE_API_KEY || (fileConfig.googleApiKey as string) || '',
      cache: {
        enabled: this.parseBoolean(process.env.ATEZCA_CACHE_ENABLED) ?? fileConfig.cacheEnabled ?? true,
        expiryDays: parseInt(process.env.ATEZCA_CACHE_EXPIRY_DAYS ?? '') || (fileConfig.cacheExpiryDays as number) || 30,
        filePath: process.env.ATEZCA_CACHE_FILE || (fileConfig.cacheFile as string) || '.atezca-cache.json',
      },
      browser: {
        type: (process.env.ATEZCA_BROWSER as 'chromium' | 'firefox' | 'webkit') || (fileConfig.browser as string) || 'chromium',
        headless: this.parseBoolean(process.env.ATEZCA_HEADLESS) ?? (fileConfig.headless as boolean) ?? true,
      },
      execution: {
        timeout: parseInt(process.env.ATEZCA_TIMEOUT ?? '') || (fileConfig.timeout as number) || 30000,
        retries: parseInt(process.env.ATEZCA_RETRIES ?? '') || (fileConfig.retries as number) || 3,
        outputDir: process.env.ATEZCA_OUTPUT_DIR || (fileConfig.outputDir as string) || 'generated-tests',
      },
    };

    // Validate and store
    try {
      this.config = ConfigSchema.parse(rawConfig);
    } catch (error) {
      if (error instanceof z.ZodError) {
        const messages = error.errors.map(e => `${e.path.join('.')}: ${e.message}`).join('\n');
        throw new Error(`Configuration validation failed:\n${messages}`);
      }
      throw error;
    }
  }

  /**
   * Find config file in current or parent directories
   */
  private findConfigFile(): string | null {
    const filenames = ['.atezcarc', '.atezcarc.json'];
    let dir = process.cwd();

    while (true) {
      for (const filename of filenames) {
        const filepath = path.join(dir, filename);
        if (fs.existsSync(filepath)) {
          return filepath;
        }
      }

      const parent = path.dirname(dir);
      if (parent === dir) break; // Reached root
      dir = parent;
    }

    return null;
  }

  /**
   * Parse boolean from string
   */
  private parseBoolean(value: string | undefined): boolean | undefined {
    if (value === undefined) return undefined;
    return value.toLowerCase() === 'true' || value === '1';
  }

  /**
   * Get configuration
   */
  getConfig(): AtezcaConfig {
    if (!this.config) {
      throw new Error('Configuration not loaded');
    }
    return this.config;
  }

  /**
   * Create default config file
   */
  static createDefaultConfig(filepath: string = '.atezcarc'): void {
    const defaultConfig = {
      aiProvider: 'claude',
      anthropicApiKey: process.env.ANTHROPIC_API_KEY || '',
      googleApiKey: process.env.GOOGLE_API_KEY || '',
      cacheEnabled: true,
      cacheExpiryDays: 30,
      cacheFile: '.atezca-cache.json',
      browser: 'chromium',
      headless: true,
      timeout: 30000,
      retries: 3,
      outputDir: 'generated-tests',
    };

    fs.writeFileSync(filepath, JSON.stringify(defaultConfig, null, 2), 'utf-8');
  }
}

/**
 * Global config instance
 */
let globalConfig: ConfigLoader | null = null;

/**
 * Get or create global config
 */
export function getConfig(): AtezcaConfig {
  if (!globalConfig) {
    globalConfig = new ConfigLoader();
  }
  return globalConfig.getConfig();
}

/**
 * Reset global config (for testing)
 */
export function resetConfig(): void {
  globalConfig = null;
}
