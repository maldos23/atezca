import { execSync } from 'child_process';
import chalk from 'chalk';

/**
 * Check if error is due to missing Playwright browser
 */
export function isMissingBrowserError(error: Error): boolean {
  const message = error.message;
  return (
    message.includes("Executable doesn't exist at") ||
    message.includes('Looks like Playwright') ||
    message.includes('npx playwright install')
  );
}

/**
 * Extract browser name from error message
 */
export function extractBrowserFromError(error: Error): string | null {
  const message = error.message;
  
  if (message.includes('chromium')) return 'chromium';
  if (message.includes('firefox')) return 'firefox';
  if (message.includes('webkit')) return 'webkit';
  
  return null;
}

/**
 * Auto-install Playwright browser
 */
export async function installPlaywrightBrowser(browser: string): Promise<boolean> {
  try {
    console.log(chalk.yellow(`\n⚠️  Browser ${browser} not found. Installing automatically...\n`));
    
    // Execute playwright install command
    execSync(`npx playwright install ${browser}`, {
      stdio: 'inherit',
      cwd: process.cwd(),
    });
    
    console.log(chalk.green(`\n✓ Browser ${browser} installed successfully!\n`));
    return true;
  } catch (error) {
    console.error(chalk.red(`\n✗ Failed to install browser: ${(error as Error).message}\n`));
    return false;
  }
}

/**
 * Handle browser installation if needed
 */
export async function handleBrowserInstallation(error: Error, browserType: string): Promise<boolean> {
  if (!isMissingBrowserError(error)) {
    return false;
  }

  const browser = extractBrowserFromError(error) || browserType;
  return await installPlaywrightBrowser(browser);
}
