import { az } from './packages/core/dist/index.mjs';

// ============================================================
// EJEMPLO 1: Configuración con Gemini directamente en setup
// ============================================================
// Ventaja: No necesitas archivo .env, todo en un lugar
// Desventaja: API key visible en el código

az.setup({
  url: 'https://example.com',
  browser: 'chromium',
  headless: true,
  cacheEnabled: false,
  
  // Configuración del AI provider directamente aquí
  aiProvider: 'gemini',
  apiKey: process.env.GOOGLE_API_KEY || 'AIza...your_key',  // Desde env o hardcoded
});

az.test('navigate', 'Go to the homepage');
az.test('interact', 'Click the "Get Started" button');


// ============================================================
// EJEMPLO 2: Configuración con Claude
// ============================================================
// Descomenta para probar con Claude:
/*
az.setup({
  url: 'https://example.com',
  browser: 'chromium',
  headless: true,
  aiProvider: 'claude',
  apiKey: process.env.ANTHROPIC_API_KEY || 'sk-ant-api03-...',
});

az.test('navigate', 'Go to the homepage');
az.test('interact', 'Click the "Get Started" button');
*/


// ============================================================
// EJEMPLO 3: Usando variables de entorno (modo clásico)
// ============================================================
// Requiere .env con:
// ATEZCA_AI_PROVIDER=gemini
// GOOGLE_API_KEY=AIza...
/*
az.setup({
  url: 'https://example.com',
  browser: 'chromium',
  headless: true,
  // aiProvider y apiKey se leen del .env automáticamente
});

az.test('navigate', 'Go to the homepage');
az.test('interact', 'Click the "Get Started" button');
*/
