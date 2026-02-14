import chalk from 'chalk';
import type { TestCommand, InterpretationResult, TestResult, SetupConfig } from '../types/index.js';
import { getConfig } from '../config/config-loader.js';
import { Interpreter, createInterpretationResult } from '../interpreter/interpreter.js';
import { CacheManager } from '../cache/cache-manager.js';
import { PlaywrightExecutor } from '../executor/playwright-executor.js';
import { CodeGenerator } from '../generator/code-generator.js';
import { handleBrowserInstallation } from '../utils/browser-installer.js';

/**
 * Test runner that orchestrates the entire test execution
 */
export class TestRunner {
  private config: SetupConfig;
  private interpreter: Interpreter;
  private cache: CacheManager;
  private executor: PlaywrightExecutor | null = null;
  private generator: CodeGenerator;
  private interpretations: InterpretationResult[] = [];

  constructor(config: SetupConfig) {
    this.config = config;
    
    // Load global config
    const globalConfig = getConfig();
    
    // Use provider from setup config if provided, otherwise use global config
    const aiProvider = config.aiProvider || globalConfig.aiProvider;
    
    // Use API key from setup config if provided, otherwise use global config
    let apiKey = config.apiKey;
    if (!apiKey) {
      apiKey = aiProvider === 'claude' 
        ? globalConfig.anthropicApiKey 
        : globalConfig.googleApiKey;
    }

    if (!apiKey) {
      throw new Error(`API key not found for provider: ${aiProvider}`);
    }
    
    // Initialize components
    this.interpreter = new Interpreter(aiProvider, apiKey);
    this.cache = new CacheManager(
      globalConfig.cache.filePath,
      globalConfig.cache.expiryDays
    );
    this.generator = new CodeGenerator(config);
  }

  /**
   * Process a single command (interpret and cache) with retry logic
   */
  async processCommand(command: TestCommand): Promise<InterpretationResult> {
    const cacheEnabled = this.config.cacheEnabled ?? true;
    const aiProvider = this.config.aiProvider || getConfig().aiProvider;

    // Try cache first
    if (cacheEnabled) {
      const cached = this.cache.get(command);
      if (cached) {
        console.log(chalk.gray(`  ✓ Using cached interpretation`));
        return createInterpretationResult(command, cached, true);
      }
    }

    // Get global config to show provider name
    const displayProvider = aiProvider.toUpperCase();

    // Interpret with AI with retry logic
    const maxInterpretationRetries = 3;
    let lastError: Error | null = null;

    for (let attempt = 0; attempt < maxInterpretationRetries; attempt++) {
      try {
        if (attempt === 0) {
          console.log(chalk.blue(`  → Interpreting with ${displayProvider}...`));
        } else {
          console.log(chalk.yellow(`  ⟳ Interpretation retry ${attempt}/${maxInterpretationRetries - 1}...`));
        }

        const actions = await this.interpreter.interpret(command);

        // Cache the result
        if (cacheEnabled) {
          this.cache.set(command, actions);
        }

        return createInterpretationResult(command, actions, false);
      } catch (error) {
        lastError = error as Error;
        console.log(chalk.yellow(`  ⚠ Interpretation failed: ${lastError.message}`));
        
        if (attempt < maxInterpretationRetries - 1) {
          // Wait before retry (progressive backoff)
          await new Promise(resolve => setTimeout(resolve, 1000 * (attempt + 1)));
        }
      }
    }

    // If all retries failed, throw the last error
    throw new Error(`Failed to interpret after ${maxInterpretationRetries} attempts: ${lastError?.message}`);
  }

  /**
   * Interpret command with retry logic and page context
   */
  private async interpretWithRetry(command: TestCommand, pageContext: any): Promise<any[]> {
    const aiProvider = this.config.aiProvider || getConfig().aiProvider;
    const displayProvider = aiProvider.toUpperCase();
    const maxInterpretationRetries = 3;
    let lastError: Error | null = null;

    for (let attempt = 0; attempt < maxInterpretationRetries; attempt++) {
      try {
        if (attempt > 0) {
          console.log(chalk.yellow(`     ⟳ AI retry ${attempt}/${maxInterpretationRetries - 1} (${displayProvider})...`));
        }

        const actions = await this.interpreter.interpret(command, pageContext);
        return actions;
      } catch (error) {
        lastError = error as Error;
        console.log(chalk.yellow(`     ⚠ ${displayProvider} failed: ${lastError.message}`));
        
        if (attempt < maxInterpretationRetries - 1) {
          // Wait before retry (progressive backoff)
          await new Promise(resolve => setTimeout(resolve, 1000 * (attempt + 1)));
        }
      }
    }

    // If all retries failed, throw the last error
    throw new Error(`${displayProvider} failed after ${maxInterpretationRetries} attempts: ${lastError?.message}`);
  }

  /**
   * Process all commands
   */
  async processCommands(commands: TestCommand[]): Promise<InterpretationResult[]> {
    console.log(chalk.bold('\n📝 Processing commands...\n'));

    const interpretations: InterpretationResult[] = [];

    for (let i = 0; i < commands.length; i++) {
      const command = commands[i];
      console.log(chalk.cyan(`[${i + 1}/${commands.length}] ${command.actionType}: ${command.description}`));
      
      try {
        const interpretation = await this.processCommand(command);
        interpretations.push(interpretation);
        console.log(chalk.green(`  ✓ ${interpretation.actions.length} action(s) generated\n`));
      } catch (error) {
        console.error(chalk.red(`  ✗ Failed: ${(error as Error).message}\n`));
        throw error;
      }
    }

    this.interpretations = interpretations;
    return interpretations;
  }

  /**
   * Execute tests
   */
  async execute(commands: TestCommand[]): Promise<TestResult> {
    const startTime = Date.now();
    let actionsExecuted = 0;
    let browserInstalled = false;

    try {
      // Initialize executor FIRST (before interpretation)
      console.log(chalk.bold('🚀 Launching browser...\n'));
      this.executor = new PlaywrightExecutor(this.config);
      
      try {
        await this.executor.initialize();
      } catch (error) {
        // Try to auto-install browser if it's missing
        const installed = await handleBrowserInstallation(
          error as Error, 
          this.config.browser || 'chromium'
        );
        
        if (installed) {
          browserInstalled = true;
          console.log(chalk.blue('Retrying browser launch...\n'));
          await this.executor.initialize();
        } else {
          throw error;
        }
      }

      // Execute tests with context-aware interpretation
      console.log(chalk.bold('▶️  Executing tests...\n'));

      for (let i = 0; i < commands.length; i++) {
        const command = commands[i];
        console.log(chalk.cyan(`\n[${i + 1}/${commands.length}] ${command.actionType}: ${command.description}`));

        // Try executing with intelligent retry and context-aware re-interpretation
        let success = false;
        let lastError: Error | null = null;
        const maxRetries = 5;

        for (let attempt = 0; attempt < maxRetries && !success; attempt++) {
          try {
            // Capture current page context for interpretation
            const pageContext = await this.executor!.getPageContext();
            
            if (attempt === 0) {
              console.log(chalk.blue(`  → Interpreting with context...`));
              console.log(chalk.gray(`     Page: ${pageContext.url}`));
              console.log(chalk.gray(`     Available elements: ${pageContext.interactiveElements.length}`));
            } else {
              console.log(chalk.yellow(`  ⟳ Retry ${attempt}/${maxRetries - 1} - Re-analyzing page...`));
              console.log(chalk.gray(`     Page: ${pageContext.url}`));
              console.log(chalk.gray(`     Available elements: ${pageContext.interactiveElements.length}`));
            }

            // Interpret with current page context
            let actions: any[];
            
            // Check cache first (only on first attempt)
            if (attempt === 0 && this.config.cacheEnabled) {
              const cached = this.cache.get(command);
              if (cached) {
                console.log(chalk.gray(`  ✓ Using cached interpretation`));
                actions = cached;
              } else {
                // Interpret with AI using page context
                actions = await this.interpretWithRetry(command, pageContext);
                // Cache the result
                this.cache.set(command, actions);
              }
            } else {
              // Re-interpret with fresh context (don't use cache on retries)
              actions = await this.interpretWithRetry(command, pageContext);
              // Update cache with new interpretation
              if (this.config.cacheEnabled) {
                this.cache.set(command, actions);
              }
            }

            console.log(chalk.gray(`  ✓ Generated ${actions.length} action(s)`));

            // Execute all actions for this command
            for (const action of actions) {
              await this.executor!.executeAction(action);
              actionsExecuted++;
              console.log(chalk.gray(`     ✓ ${action.action}${action.selector ? ` (${action.selector})` : ''}`));
            }

            // Store interpretation for code generation
            const interpretation = createInterpretationResult(command, actions, false);
            this.interpretations.push(interpretation);

            success = true;
            console.log(chalk.green(`  ✓ Success\n`));

          } catch (error) {
            lastError = error as Error;
            
            if (attempt < maxRetries - 1) {
              console.log(chalk.yellow(`  ⚠ Failed: ${lastError.message}`));
              // Wait before retry (progressive backoff)
              await new Promise(resolve => setTimeout(resolve, 1000 * (attempt + 1)));
            } else {
              throw new Error(`Failed after ${maxRetries} attempts: ${lastError.message}`);
            }
          }
        }
      }

      // Generate code
      console.log(chalk.bold('\n📄 Generating Playwright code...\n'));
      const generatedFile = await this.generator.saveTestFile(this.interpretations);
      console.log(chalk.green(`✓ Test file saved: ${generatedFile}`));

      const duration = Date.now() - startTime;

      return {
        success: true,
        duration,
        actionsExecuted,
        generatedFile,
      };

    } catch (error) {
      const duration = Date.now() - startTime;
      
      return {
        success: false,
        error: (error as Error).message,
        duration,
        actionsExecuted,
      };

    } finally {
      // Cleanup
      if (this.executor) {
        await this.executor.close();
      }
    }
  }

  /**
   * Generate code only (no execution)
   */
  async generateOnly(commands: TestCommand[]): Promise<string> {
    console.log(chalk.bold('📝 Processing commands for code generation...\n'));

    // Process commands
    const interpretations = await this.processCommands(commands);

    // Generate code
    console.log(chalk.bold('\n📄 Generating Playwright code...\n'));
    const generatedFile = await this.generator.saveTestFile(interpretations);
    console.log(chalk.green(`✓ Test file saved: ${generatedFile}`));

    return generatedFile;
  }

  /**
   * Get interpretations
   */
  getInterpretations(): InterpretationResult[] {
    return this.interpretations;
  }
}
