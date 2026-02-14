# Quick Start Guide

This guide will help you get started with Atezca in 5 minutes.

## 1. Installation

```bash
cd your-project
pnpm add -D @atezca/core
```

## 2. Setup API Key

Get your Anthropic API key from: https://console.anthropic.com/

Create `.env` file:
```bash
echo "ANTHROPIC_API_KEY=sk-ant-api03-YOUR_KEY_HERE" > .env
```

## 3. Write Your First Test

Create `my-test.spec.js`:

```javascript
const { az } = require('@atezca/core');

az.setup({
  url: 'https://example.com',
});

az.test('interact', "click the 'More information' link");
az.test('expect', 'show information page');
```

## 4. Run the Test

```bash
npx az run my-test.spec.js
```

You should see:
- ✓ Commands being interpreted by Claude
- ✓ Browser launching and executing actions
- ✓ Generated Playwright code saved

## 5. Check Generated Code

Look in `generated-tests/` directory for the generated `.spec.ts` file.

You can run it directly with Playwright:
```bash
npx playwright test
```

## What's Next?

- Read the [full documentation](../README.md)
- Check out [examples](../examples/)
- Learn about [architecture](architecture.md)
- Explore [advanced features](#advanced-features)

## Advanced Features

### Caching

Tests are automatically cached for 30 days. Second runs are instant and free!

```bash
# Clear cache if needed
npx az cache clear

# View cache stats
npx az cache stats
```

### Generate-Only Mode

Generate Playwright code without running tests:

```bash
npx az generate my-test.spec.js
```

### Configuration

Create `.atezcarc` for persistent configuration:

```bash
npx az init
```

Then edit `.atezcarc` with your preferences.

### TypeScript

```typescript
import { az } from '@atezca/core';
import type { SetupConfig } from '@atezca/core';

const config: SetupConfig = {
  url: 'https://myapp.com',
  browser: 'firefox',
  headless: false,
};

az.setup(config);
az.test('interact', 'click login button');
```

## Common Use Cases

### Login Flow
```javascript
az.test('interact', "click 'Login' button");
az.test('interact', "type 'user@example.com' in email field");
az.test('interact', "type 'password' in password field");
az.test('interact', "click 'Sign In' button");
az.test('expect', 'show dashboard');
```

### Form Validation
```javascript
az.test('interact', "click 'Submit' without filling form");
az.test('expect', 'show validation errors');
```

### Shopping Cart
```javascript
az.test('interact', "click 'Add to Cart' on first product");
az.test('expect', 'show cart badge with number 1');
az.test('interact', "click cart icon");
az.test('expect', 'show product in cart');
```

## Troubleshooting

### API Key Error
```bash
Error: Invalid Anthropic API key
```
→ Check your `.env` file or `ANTHROPIC_API_KEY` environment variable

### Browser Not Installed
```bash
Error: Executable doesn't exist
```
→ Install Playwright browsers: `npx playwright install`

### Timeout Errors
Increase timeout in setup:
```javascript
az.setup({
  url: 'https://example.com',
  timeout: 60000, // 60 seconds
});
```

## Getting Help

- 📖 [Full Documentation](../README.md)
- 🐛 [Report Issues](https://github.com/atezca/atezca/issues)
- 💬 [Discussions](https://github.com/atezca/atezca/discussions)
