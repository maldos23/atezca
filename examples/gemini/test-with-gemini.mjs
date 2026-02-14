import { az } from '@atezca/core';

// Example using Gemini (Google)
// Make sure to set GOOGLE_API_KEY in .env
// and ATEZCA_AI_PROVIDER=gemini

az.setup({
  url: 'https://example.com',
  browser: 'chromium',
  headless: false,
});

// Test actions - works the same with Gemini or Claude!
az.test('navigate', 'go to the main page');
az.test('interact', "click the 'More information' link");
az.test('wait', 'until the information page loads');
az.test('expect', 'show detailed information');
