import { az } from '@atezca/core';

// ============================================================
// DEMO: Todas las funcionalidades de @atezca/core
// ============================================================

console.log('🎯 Atezca Demo - Funcionalidades Completas\n');

// Configuración con todas las opciones
az.setup({
  // URL con SSL inválido (ejemplo: entorno de desarrollo)
  url: 'https://example.com',
  
  // Navegador (se instalará automáticamente si falta)
  browser: 'chromium',
  
  // Modo headless para ejecución rápida
  headless: true,
  
  // Deshabilitar validación SSL para certificados autofirmados
  disableSSL: true,
  
  // Proveedor de IA configurado directamente
  aiProvider: 'gemini',
  apiKey: process.env.GOOGLE_API_KEY,
  
  // Opciones de caché y reintentos
  cacheEnabled: true,
  retries: 3,
  
  // Configuración de tiempo y salida
  timeout: 30000,
  outputDir: 'demo-tests',
});

// Tests con lenguaje natural
console.log('📝 Definiendo tests...\n');

az.test('navigate', 'Go to the homepage');
az.test('interact', 'Click the "Get Started" button');
az.test('wait', 'Wait for the page to fully load');
az.test('expect', 'The welcome message should be visible');

console.log('✅ Tests definidos. Ejecuta con: az run demo.mjs\n');
