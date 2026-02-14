const { az } = require('@atezca/core');

// Configure the test
az.setup({
  url: 'https://example.com',
  browser: 'chromium',
  headless: true,
  timeout: 30000,
});

// Define test actions using natural language
az.test('navigate', 'go to login page');
az.test('interact', "click button 'Login'");
az.test('interact', "type 'user@example.com' in email field");
az.test('interact', "type 'password123' in password field");
az.test('interact', "click submit button");
az.test('wait', 'until page is loaded');
az.test('expect', 'show success message');
