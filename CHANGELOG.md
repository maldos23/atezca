# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added
- **AI provider selection in `az.setup()`**: Now you can specify `aiProvider` and `apiKey` directly in setup
- **SSL certificate bypass**: New `disableSSL` option to ignore SSL errors (useful for self-signed certificates)
- **Auto-install Playwright browsers**: Automatically detects and installs missing browsers on first run
- **Context-aware interpretation**: AI now receives live page state (accessibility tree, interactive elements) before each action
- **Intelligent retry system**: Failed tests automatically retry up to 5 times with fresh page context and re-interpretation
- Configuration priority system: setup params > env vars > .atezcarc > defaults
- Documentation for provider configuration options (`docs/provider-configuration.md`)
- Documentation for page context and retry features (`docs/page-context-and-retries.md`)
- Documentation for all advanced features (`docs/advanced-features.md`)
- Example file demonstrating setup with provider override
- Browser installer utility with automatic retry logic

### Changed
- `SetupConfig` interface now accepts optional `aiProvider`, `apiKey`, and `disableSSL` parameters
- `TestRunner` now prioritizes provider config from setup over environment variables
- `TestRunner` execution loop completely rewritten with intelligent retry logic
- `PlaywrightExecutor` now supports `ignoreHTTPSErrors` option
- `PlaywrightExecutor` now captures page context (accessibility tree, interactive elements)
- `Interpreter` now accepts optional `PageContext` parameter for context-aware prompts
- Enhanced flexibility: no need for .env file if API key is provided in setup
- Improved error handling for missing browser executables

### Improved
- Better user experience: no manual browser installation required
- SSL certificate handling for development and staging environments
- More robust browser initialization with automatic recovery
- **Self-healing tests**: Tests adapt to actual page state instead of relying on cached interpretations
- **Higher success rate**: Context-aware retries significantly improve test reliability
- Progressive backoff between retries (1s, 2s, 3s, 4s) for better stability

## [0.2.0] - 2026-02-13

### Added
- Google Gemini AI provider support as alternative to Claude
- Multi-provider architecture with `aiProvider` configuration option
- `GeminiClient` class for Google Generative AI integration
- Conditional API key validation based on selected provider
- Environment variables `ATEZCA_AI_PROVIDER`, `GOOGLE_API_KEY`
- Comprehensive AI provider comparison documentation (`docs/ai-providers.md`)
- Gemini example files demonstrating usage

### Changed
- Updated configuration schema to support `aiProvider` selection ('claude' | 'gemini')
- Modified interpreter to accept and route to appropriate AI provider
- Enhanced test runner to display active AI provider during execution
- Updated README with multi-provider setup instructions
- Refactored API key management to support both `anthropicApiKey` and `googleApiKey`

### Improved
- Cost optimization: Gemini offers ~20x cheaper pricing than Claude for similar performance
- Provider flexibility: Choose AI model based on cost, performance, or availability needs

## [0.1.0] - 2026-02-13

### Added
- Initial release of @atezca/core
- Natural language test syntax with `az.setup()` and `az.test()`
- Claude AI integration for interpreting natural language commands
- Playwright executor for browser automation
- Smart caching system to reduce API costs
- Code generation for reusable Playwright test files
- CLI tool with commands: run, generate, init, cache
- Support for multiple action types: navigate, interact, wait, expect
- Configuration via environment variables and .atezcarc file
- Multi-browser support (Chromium, Firefox, WebKit)
- Retry logic with exponential backoff
- TypeScript support with full type definitions
- Comprehensive documentation and examples

### Features
- ✅ AI-powered test interpretation
- ✅ Playwright integration
- ✅ Smart caching (30-day TTL)
- ✅ Code generation
- ✅ CLI tool
- ✅ Multi-browser support
- ✅ TypeScript support
- ✅ Configuration system
- ✅ Examples and documentation

[Unreleased]: https://github.com/maldos23/atezca/compare/v0.1.0...HEAD
[0.1.0]: https://github.com/maldos23/atezca/releases/tag/v0.1.0
