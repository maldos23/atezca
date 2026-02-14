# Atezca 🚀

AI-powered E2E testing library with natural language syntax.

Write tests like humans think, let AI handle the technical details.

## Features

- 🤖 **AI-Powered**: Uses Claude AI or Google Gemini to interpret natural language test commands
- 🎯 **Simple Syntax**: Intuitive API that reads like plain English
- 📝 **Code Generation**: Automatically generates reusable Playwright test files
- 💾 **Smart Caching**: Reduces API costs by caching interpretations
- ⚡ **Fast Execution**: Built on Playwright for reliable, fast test execution
- 🔄 **Multi-Browser**: Support for Chromium, Firefox, and WebKit
- 🔀 **Multi-Provider**: Choose between Claude (Anthropic) or Gemini (Google)
- 🔒 **SSL Bypass**: Option to disable SSL validation for development environments
- 🛠️ **Auto-Install**: Automatically installs Playwright browsers on first run

## Installation

```bash
# Using pnpm (recommended)
pnpm add -D @atezca/core

# Using npm
npm install --save-dev @atezca/core

# Using yarn
yarn add -D @atezca/core
```

## Quick Start

### 1. Setup API Key

Create a `.env` file in your project root:

**Option A: Using Claude (Anthropic)**
```bash
ANTHROPIC_API_KEY=sk-ant-api03-...
ATEZCA_AI_PROVIDER=claude
```

**Option B: Using Gemini (Google)**
```bash
GOOGLE_API_KEY=AIza...
ATEZCA_AI_PROVIDER=gemini
```

Or create a `.atezcarc` config file:

```bash
az init
```

### 2. Write Your First Test

Create a file `test.spec.js`:

```javascript
const { az } = require('@atezca/core');

// Configure the test
az.setup({
  url: 'https://example.com',
  browser: 'chromium',
  headless: true,
});

// Write tests in natural language
az.test('navigate', 'go to login page');
az.test('interact', "click button 'Login'");
az.test('interact', "type 'user@example.com' in email field");
az.test('interact', "type 'password123' in password field");
az.test('interact', "click submit button");
az.test('expect', 'show success message');
```

### 3. Run Your Test

```bash
az run test.spec.js
```

Or generate Playwright code without execution:

```bash
az generate test.spec.js
```

## API Reference

### `az.setup(config)`

Initialize test configuration.

**Parameters:**
- `url` (required): Base URL of the application
- `browser`: Browser type (`'chromium'`, `'firefox'`, `'webkit'`) - default: `'chromium'`
- `headless`: Run in headless mode - default: `true`
- `timeout`: Default timeout in milliseconds - default: `30000`
- `outputDir`: Directory for generated test files - default: `'generated-tests'`
- `aiProvider`: AI provider (`'claude'`, `'gemini'`) - overrides environment config
- `apiKey`: API key for the selected provider - overrides environment config
- `disableSSL`: Disable SSL certificate validation (useful for self-signed certificates) - default: `false`
- `cacheEnabled`: Enable interpretation caching - default: `true`
- `retries`: Number of retries for failed actions - default: `3`

**Example:**
```javascript
// Option 1: Use environment variables (recommended for production)
az.setup({
  url: 'https://myapp.com',
  browser: 'firefox',
  headless: false,
  timeout: 60000,
  outputDir: 'my-tests',
});

// Option 2: Specify AI provider and API key directly (useful for testing)
az.setup({
  url: 'https://myapp.com',
  browser: 'chromium',
  headless: true,
  aiProvider: 'gemini',  // or 'claude'
  apiKey: 'AIza...your_key_here',
});
```

### `az.test(actionType, description)`

Define a test action using natural language.

**Action Types:**
- `'navigate'`: Navigate to a page or URL
- `'interact'`: Click, type, select, or interact with elements
- `'wait'`: Wait for conditions to be met
- `'expect'`: Make assertions about the page state

**Examples:**

```javascript
// Navigation
az.test('navigate', 'go to dashboard');
az.test('navigate', 'open settings page');

// Interactions
az.test('interact', "click button 'Submit'");
az.test('interact', "type 'hello@example.com' in email field");
az.test('interact', "select 'Premium' from plan dropdown");
az.test('interact', "hover over user menu");

// Waits
az.test('wait', 'until loading spinner disappears');
az.test('wait', 'until submit button is visible');

// Assertions
az.test('expect', 'show success message');
az.test('expect', 'display user profile');
az.test('expect', 'form should have validation errors');
```

## CLI Commands

### Run Tests
```bash
az run <file>
```
Execute a test file with browser automation.

### Generate Code
```bash
az generate <file>
```
Generate Playwright test code without execution.

### Initialize Config
```bash
az init
```
Create a `.atezcarc` configuration file.

### Cache Management
```bash
# Clear cache
az cache clear

# Show cache statistics
az cache stats
```

## Configuration

Atezca can be configured via:
1. Environment variables (`.env` file)
2. Configuration file (`.atezcarc`)
3. API call (`az.setup()`)

Priority: API > Environment > Config File > Defaults

### Environment Variables

```bash
# AI Provider (choose one)
ATEZCA_AI_PROVIDER=claude  # or 'gemini'

# For Claude:
ANTHROPIC_API_KEY=sk-ant-api03-...

# For Gemini:
GOOGLE_API_KEY=AIza...

# Optional
ATEZCA_CACHE_ENABLED=true
ATEZCA_CACHE_EXPIRY_DAYS=30
ATEZCA_OUTPUT_DIR=generated-tests
ATEZCA_TIMEOUT=30000
ATEZCA_RETRIES=3
ATEZCA_BROWSER=chromium
ATEZCA_HEADLESS=true
```

### Config File (`.atezcarc`)

```json
{
  "aiProvider": "claude",
  "anthropicApiKey": "sk-ant-api03-...",
  "googleApiKey": "AIza...",
  "cacheEnabled": true,
  "cacheExpiryDays": 30,
  "cacheFile": ".atezca-cache.json",
  "browser": "chromium",
  "headless": true,
  "timeout": 30000,
  "retries": 3,
  "outputDir": "generated-tests"
}
```

## How It Works

1. **Write Natural Language**: You write test commands in plain English
2. **AI Interpretation**: Claude AI or Gemini interprets your commands into Playwright actions
3. **Smart Caching**: Interpretations are cached to reduce API calls and costs
4. **Execution**: Playwright executes the actions in a real browser
5. **Code Generation**: Reusable Playwright test files are generated

```
Your Test → AI (Claude/Gemini) → Playwright Actions → Browser → Generated Code
                    ↓
                 Cache (saves $$)
```

## Examples

See the [`examples/`](examples/) directory for more examples:
- [Basic Login Test](examples/basic/test.spec.js)
- [E-commerce Checkout](examples/advanced/ecommerce.spec.mjs)
- [Using Gemini Provider](examples/gemini/test-with-gemini.mjs)

## TypeScript Support

Atezca is written in TypeScript and includes full type definitions:

```typescript
import { az, type SetupConfig, type ActionType } from '@atezca/core';

const config: SetupConfig = {
  url: 'https://example.com',
  browser: 'chromium',
  headless: true,
};

az.setup(config);
az.test('interact', 'click login button');
```

## Cost Optimization

Atezca includes several features to minimize API costs:

- **Aggressive Caching**: Interpretations are cached locally for 30 days (configurable)
- **Deterministic AI**: Uses temperature=0 for consistent results
- **Batch Processing**: Multiple commands processed efficiently
- **Offline Re-runs**: Cached tests can run without API calls

## Troubleshooting

### API Key Issues
```bash
Error: Invalid Anthropic API key
```
Make sure your API key is set correctly in `.env` or `.atezcarc`.

### Cache Issues
```bash
# Clear cache if interpretations seem stale
az cache clear
```

### Browser Issues
```bash
# Install Playwright browsers
npx playwright install
```

## Contributing

Contributions are welcome! Please see [CONTRIBUTING.md](CONTRIBUTING.md) for guidelines.

## License

MIT License - see [LICENSE](LICENSE) for details.

## Support

- 📧 Email: contacto@soygino.com
- 🐛 Issues: [GitHub Issues](https://github.com/maldos23/atezca/issues)
- 💬 Discussions: [GitHub Discussions](https://github.com/maldos23/atezca/discussions)

## Roadmap

- [ ] Support for additional AI models (OpenAI, local models)
- [ ] Visual regression testing
- [ ] Parallel test execution
- [ ] Plugin system
- [ ] CI/CD integrations
- [ ] Test recorder browser extension

---

Made with ❤️ by the Atezca team
