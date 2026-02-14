# Contributing to Atezca

Thank you for your interest in contributing to Atezca!

## Development Setup

1. **Prerequisites**:
   - Node.js >= 18
   - pnpm >= 8

2. **Clone and install**:
   ```bash
   git clone https://github.com/atezca/atezca.git
   cd atezca
   pnpm install
   ```

3. **Build**:
   ```bash
   pnpm build
   ```

4. **Run tests**:
   ```bash
   pnpm test
   ```

## Project Structure

```
atezca/
├── packages/
│   └── core/              # Main library
│       ├── src/
│       │   ├── index.ts   # API exports
│       │   ├── cli.ts     # CLI tool
│       │   ├── types/     # TypeScript types
│       │   ├── config/    # Configuration
│       │   ├── interpreter/ # AI integration
│       │   ├── cache/     # Caching system
│       │   ├── executor/  # Playwright executor
│       │   ├── generator/ # Code generation
│       │   └── runner/    # Test runner
│       └── tests/         # Unit tests
├── examples/              # Example tests
├── docs/                  # Documentation
└── README.md
```

## Coding Guidelines

- Use TypeScript
- Follow existing code style (ESLint/Prettier)
- Add tests for new features
- Update documentation

## Pull Request Process

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/my-feature`
3. Make your changes
4. Run tests: `pnpm test`
5. Build: `pnpm build`
6. Commit: `git commit -m "feat: add my feature"`
7. Push: `git push origin feature/my-feature`
8. Open a Pull Request

## Commit Convention

We use [Conventional Commits](https://www.conventionalcommits.org/):

- `feat:` - New feature
- `fix:` - Bug fix
- `docs:` - Documentation changes
- `refactor:` - Code refactoring
- `test:` - Test changes
- `chore:` - Build/tooling changes

## Questions?

Open an issue or discussion on GitHub.

## License

By contributing, you agree that your contributions will be licensed under the MIT License.
