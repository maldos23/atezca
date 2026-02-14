import * as fs from 'node:fs';
import * as path from 'node:path';
import chalk from 'chalk';
import { getState } from './index.js';
import { TestRunner } from './runner/test-runner.js';
import { CacheManager } from './cache/cache-manager.js';
import { ConfigLoader } from './config/config-loader.js';

/**
 * CLI tool for Atezca
 */

function showHelp(): void {
  console.log(chalk.bold('\n⚡ Atezca - AI-Powered E2E Testing\n'));
  console.log('Usage:');
  console.log('  az run <file>         Execute test file');
  console.log('  az generate <file>    Generate Playwright code without execution');
  console.log('  az init               Create .atezcarc config file');
  console.log('  az cache clear        Clear interpretation cache');
  console.log('  az cache stats        Show cache statistics');
  console.log('  az help               Show this help message');
  console.log('');
  console.log('Examples:');
  console.log('  az run test.spec.js');
  console.log('  az generate test.spec.js');
  console.log('  az init');
  console.log('');
}

async function runTest(filepath: string): Promise<void> {
  try {
    // Load test file
    console.log(chalk.blue(`Loading test file: ${filepath}\n`));
    
    if (!fs.existsSync(filepath)) {
      console.error(chalk.red(`Error: File not found: ${filepath}`));
      process.exit(1);
    }

    // Import and execute test file
    const absPath = path.resolve(filepath);
    await import(`file://${absPath}`);

    // Get state - try to find from the same module the test file uses
    let state = getState();
    
    // If local state is empty, the test file might be using a different module instance
    // Try to reimport from the package root
    if (!state.config || state.commands.length === 0) {
      try {
        // Calculate path to index module relative to this CLI
        const currentDir = path.dirname(new URL(import.meta.url).pathname);
        const indexModule = await import(path.join(currentDir, 'index.js'));
        const altState = indexModule.getState();
        if (altState.config) {
          state = altState;
        }
      } catch (e) {
        // Fallback to local state
      }
    }
    
    if (!state.config) {
      console.error(chalk.red('Error: az.setup() was not called in the test file'));
      process.exit(1);
    }

    if (state.commands.length === 0) {
      console.error(chalk.yellow('Warning: No test commands found'));
      process.exit(0);
    }

    console.log(chalk.bold(`Found ${state.commands.length} test command(s)\n`));

    // Run tests
    const runner = new TestRunner(state.config);
    const result = await runner.execute(state.commands);

    // Show results
    console.log(chalk.bold('\n' + '='.repeat(50)));
    
    if (result.success) {
      console.log(chalk.green.bold('\n✓ Test passed!\n'));
      console.log(chalk.gray(`Duration: ${(result.duration / 1000).toFixed(2)}s`));
      console.log(chalk.gray(`Actions executed: ${result.actionsExecuted}`));
      if (result.generatedFile) {
        console.log(chalk.gray(`Generated file: ${result.generatedFile}`));
      }
      process.exit(0);
    } else {
      console.log(chalk.red.bold('\n✗ Test failed!\n'));
      console.log(chalk.red(`Error: ${result.error}`));
      console.log(chalk.gray(`Duration: ${(result.duration / 1000).toFixed(2)}s`));
      console.log(chalk.gray(`Actions executed: ${result.actionsExecuted}`));
      process.exit(1);
    }

  } catch (error) {
    console.error(chalk.red('\n✗ Error:'), (error as Error).message);
    process.exit(1);
  }
}

async function generateTest(filepath: string): Promise<void> {
  try {
    // Load test file
    console.log(chalk.blue(`Loading test file: ${filepath}\n`));
    
    if (!fs.existsSync(filepath)) {
      console.error(chalk.red(`Error: File not found: ${filepath}`));
      process.exit(1);
    }

    // Import test file
    const absPath = path.resolve(filepath);
    await import(`file://${absPath}`);

    // Try to get state from the core module
    let state = getState();
    
    // If local state is empty, try from package root
    if (!state.config || state.commands.length === 0) {
      try {
        const currentDir = path.dirname(new URL(import.meta.url).pathname);
        const indexModule = await import(path.join(currentDir, 'index.js'));
        const altState = indexModule.getState();
        if (altState.config) {
          state = altState;
        }
      } catch (e) {
        // Fallback to local state
      }
    }
    
    if (!state.config) {
      console.error(chalk.red('Error: az.setup() was not called in the test file'));
      process.exit(1);
    }

    if (state.commands.length === 0) {
      console.error(chalk.yellow('Warning: No test commands found'));
      process.exit(0);
    }

    console.log(chalk.bold(`Found ${state.commands.length} test command(s)\n`));

    // Generate code only
    const runner = new TestRunner(state.config);
    const generatedFile = await runner.generateOnly(state.commands);

    console.log(chalk.green.bold('\n✓ Code generation complete!\n'));
    console.log(chalk.gray(`Generated file: ${generatedFile}`));
    console.log(chalk.gray('\nRun with: npx playwright test'));
    process.exit(0);

  } catch (error) {
    console.error(chalk.red('\n✗ Error:'), (error as Error).message);
    process.exit(1);
  }
}

function initConfig(): void {
  const filepath = '.atezcarc';
  
  if (fs.existsSync(filepath)) {
    console.log(chalk.yellow(`Warning: ${filepath} already exists`));
    process.exit(0);
  }

  ConfigLoader.createDefaultConfig(filepath);
  console.log(chalk.green(`✓ Created ${filepath}`));
  console.log(chalk.gray('\nDon\'t forget to set your ANTHROPIC_API_KEY in .env or .atezcarc'));
  process.exit(0);
}

function clearCache(): void {
  const cache = new CacheManager();
  cache.clear();
  console.log(chalk.green('✓ Cache cleared'));
  process.exit(0);
}

function showCacheStats(): void {
  const cache = new CacheManager();
  const stats = cache.getStats();
  
  console.log(chalk.bold('\nCache Statistics:\n'));
  console.log(chalk.gray(`Entries: ${stats.size}`));
  
  if (stats.oldestEntry) {
    const oldest = new Date(stats.oldestEntry);
    console.log(chalk.gray(`Oldest entry: ${oldest.toLocaleString()}`));
  }
  
  if (stats.newestEntry) {
    const newest = new Date(stats.newestEntry);
    console.log(chalk.gray(`Newest entry: ${newest.toLocaleString()}`));
  }
  
  if (stats.size === 0) {
    console.log(chalk.yellow('\nCache is empty'));
  }
  
  console.log('');
  process.exit(0);
}

// Main CLI logic
async function main() {
  const args = process.argv.slice(2);
  
  if (args.length === 0 || args[0] === 'help' || args[0] === '--help' || args[0] === '-h') {
    showHelp();
    process.exit(0);
  }

  const command = args[0];
  const subcommand = args[1];

  switch (command) {
    case 'run':
      if (!subcommand) {
        console.error(chalk.red('Error: Please specify a test file'));
        console.log('Usage: az run <file>');
        process.exit(1);
      }
      await runTest(subcommand);
      break;

    case 'generate':
      if (!subcommand) {
        console.error(chalk.red('Error: Please specify a test file'));
        console.log('Usage: az generate <file>');
        process.exit(1);
      }
      await generateTest(subcommand);
      break;

    case 'init':
      initConfig();
      break;

    case 'cache':
      if (subcommand === 'clear') {
        clearCache();
      } else if (subcommand === 'stats') {
        showCacheStats();
      } else {
        console.error(chalk.red('Error: Unknown cache command'));
        console.log('Usage: az cache <clear|stats>');
        process.exit(1);
      }
      break;

    default:
      console.error(chalk.red(`Error: Unknown command: ${command}`));
      showHelp();
      process.exit(1);
  }
}

main().catch((error) => {
  console.error(chalk.red('Fatal error:'), error);
  process.exit(1);
});
