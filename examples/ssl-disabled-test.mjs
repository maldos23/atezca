import { az } from '@atezca/core';

// ============================================================
// EJEMPLO: Prueba con certificados SSL autofirmados
// ============================================================
// Útil para entornos de desarrollo, staging o redes corporativas

az.setup({
  url: 'https://your-dev-server.local/app',
  browser: 'chromium',
  headless: true,
  
  // Deshabilitar validación SSL (útil para certificados autofirmados)
  disableSSL: true,
  
  // Configurar AI provider
  aiProvider: 'gemini',
  apiKey: process.env.GOOGLE_API_KEY,
});

az.test('navigate', 'Go to the login page');
az.test('interact', 'Click the login button');
az.test('expect', 'The page should load without SSL errors');
