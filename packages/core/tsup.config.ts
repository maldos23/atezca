import { defineConfig } from 'tsup';

export default defineConfig([
  // Main library build
  {
    entry: ['src/index.ts'],
    format: ['cjs', 'esm'],
    dts: true,
    splitting: false,
    sourcemap: true,
    clean: true,
    shims: true,
    treeshake: true,
    minify: false,
    target: 'node18',
    outDir: 'dist',
  },
  // CLI build with shebang
  {
    entry: ['src/cli.ts'],
    format: ['cjs', 'esm'],
    dts: true,
    splitting: false,
    sourcemap: true,
    clean: false,
    shims: true,
    treeshake: false,  // Disable treeshaking to preserve imports
    minify: false,
    target: 'node18',
    outDir: 'dist',
    noExternal: [],  // Bundle nothing, make everything external
    banner: {
      js: '#!/usr/bin/env node',
    },
  },
]);
