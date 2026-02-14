# @atezca/core

AI-powered E2E testing library with natural language syntax.

Part of the Atezca workspace.

## Documentation

See the [main README](../../README.md) for full documentation.

## Development

```bash
# Install dependencies
pnpm install

# Build
pnpm build

# Watch mode
pnpm dev

# Run tests
pnpm test

# Clean
pnpm clean
```

## Package Structure

```
src/
├── index.ts              # Main API exports
├── cli.ts                # CLI tool
├── types/                # TypeScript types
├── config/               # Configuration loader
├── interpreter/          # Claude AI integration
├── cache/                # Caching system
├── executor/             # Playwright executor
├── generator/            # Code generation
└── runner/               # Test orchestration
```

## License

MIT
