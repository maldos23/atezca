import { az } from '@atezca/core';

// Example 1: Using Gemini with API key in setup (no .env needed)
az.setup({
  url: 'https://example.com',
  browser: 'chromium',
  headless: true,
  aiProvider: 'gemini',
  apiKey: 'AIza...your_gemini_key_here',
});

// Example 2: Using Claude with API key in setup
// az.setup({
//   url: 'https://example.com',
//   browser: 'chromium',
//   headless: true,
//   aiProvider: 'claude',
//   apiKey: 'sk-ant-api03-...your_claude_key_here',
// });

// Example 3: Using environment variables (traditional way)
// Set ATEZCA_AI_PROVIDER and GOOGLE_API_KEY or ANTHROPIC_API_KEY in .env
// az.setup({
//   url: 'https://example.com',
//   browser: 'chromium',
//   headless: true,
//   // aiProvider and apiKey will be read from .env or .atezcarc
// });

az.test('navigate', 'Go to the homepage');
az.test('interact', 'Click the "Get Started" button');
az.test('expect', 'The page should show a welcome message');
