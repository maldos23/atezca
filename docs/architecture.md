# Arquitectura de Atezca

## Visión General

Atezca es una librería de testing E2E que permite escribir tests en lenguaje natural, interpretados por IA (Claude) y ejecutados con Playwright.

## Flujo de Datos

```
┌─────────────────────────────────────────────────────┐
│  1. Usuario escribe test en lenguaje natural       │
│     az.test("interact", "click button 'Login'")    │
└──────────────────┬──────────────────────────────────┘
                   │
┌──────────────────▼──────────────────────────────────┐
│  2. TestRunner procesa comandos                     │
│     - Lee estado de az.setup() y az.test()         │
│     - Coordina todos los componentes                │
└──────────────────┬──────────────────────────────────┘
                   │
┌──────────────────▼──────────────────────────────────┐
│  3. Cache Manager verifica cache                    │
│     - Hash: sha256(actionType + description)        │
│     - Si existe y no ha expirado → retorna acciones │
│     - Si no existe → continúa al intérprete         │
└──────────────────┬──────────────────────────────────┘
                   │
┌──────────────────▼──────────────────────────────────┐
│  4. Interpreter (Claude AI)                         │
│     - System prompt con ejemplos y formato JSON     │
│     - User prompt con comando específico            │
│     - Respuesta: { actions: [...] }                 │
└──────────────────┬──────────────────────────────────┘
                   │
┌──────────────────▼──────────────────────────────────┐
│  5. Validación con Zod                              │
│     - Verifica estructura de respuesta              │
│     - Tipos de action válidos                       │
│     - Campos requeridos presentes                   │
└──────────────────┬──────────────────────────────────┘
                   │
┌──────────────────▼──────────────────────────────────┐
│  6. Cache almacena resultado                        │
│     - Guarda en .atezca-cache.json                  │
│     - TTL: 30 días (configurable)                   │
└──────────────────┬──────────────────────────────────┘
                   │
┌──────────────────▼──────────────────────────────────┐
│  7. PlaywrightExecutor ejecuta acciones             │
│     - Inicializa browser (chromium/firefox/webkit)  │
│     - Ejecuta cada acción con retry logic           │
│     - Maneja errores y timeouts                     │
└──────────────────┬──────────────────────────────────┘
                   │
┌──────────────────▼──────────────────────────────────┐
│  8. CodeGenerator genera archivo .spec.ts           │
│     - Convierte acciones a código Playwright        │
│     - Guarda en directorio generated-tests/         │
│     - Código reutilizable sin IA                    │
└─────────────────────────────────────────────────────┘
```

## Componentes Principales

### 1. API Pública (`src/index.ts`)

**Responsabilidad**: Proveer interfaz simple y ergonómica para usuarios.

**Funciones**:
- `az.setup(config)`: Configurar test suite
- `az.test(actionType, description)`: Registrar comando de test

**Estado**: Mantiene estado global de configuración y comandos.

### 2. Test Runner (`src/runner/test-runner.ts`)

**Responsabilidad**: Orquestar todo el flujo de ejecución.

**Tareas**:
- Procesar todos los comandos registrados
- Coordinar cache, intérprete, executor y generador
- Manejar errores y resultados
- Proveer logging y feedback visual

### 3. Interpreter (`src/interpreter/`)

**Archivos**:
- `claude-client.ts`: Cliente de Anthropic API
- `prompt.ts`: System y user prompts
- `interpreter.ts`: Lógica principal de interpretación

**Prompt Engineering**:
```typescript
System Prompt:
- Define rol y reglas estrictas
- Formato de respuesta (JSON únicamente)
- Preferencias de selectores (role > aria > testid > text > css)
- Ejemplos de entrada/salida (few-shot learning)

User Prompt:
- JSON con actionType y description
- Contexto mínimo pero suficiente
```

**Respuesta esperada**:
```json
{
  "actions": [
    {
      "action": "click",
      "selector": "role=button[name='Login']",
      "timeout": 30000
    }
  ]
}
```

### 4. Cache Manager (`src/cache/cache-manager.ts`)

**Responsabilidad**: Reducir costos de API mediante caché persistente.

**Estrategia**:
- Hash: `sha256(actionType:description)`
- Almacenamiento: JSON local (`.atezca-cache.json`)
- TTL: 30 días (configurable)
- Limpieza automática de entradas expiradas

**Estructura de Cache**:
```json
[
  {
    "key": "abc123...",
    "actions": [...],
    "cachedAt": 1708000000000,
    "expiresAt": 1710592000000
  }
]
```

### 5. Playwright Executor (`src/executor/playwright-executor.ts`)

**Responsabilidad**: Ejecutar acciones en navegador real.

**Características**:
- Multi-browser (chromium, firefox, webkit)
- Retry logic con backoff exponencial
- Timeouts configurables
- Logging detallado de cada acción

**Acciones soportadas**:
- `click`: Click en elemento
- `type`: Escribir en campo
- `navigate`: Navegar a URL
- `wait`: Esperar condición
- `expect`: Hacer aserción
- `select`: Seleccionar opción
- `hover`: Hover sobre elemento
- `press`: Presionar tecla

### 6. Code Generator (`src/generator/code-generator.ts`)

**Responsabilidad**: Generar código Playwright reutilizable.

**Output**:
```typescript
import { test, expect } from '@playwright/test';

test.describe('Generated E2E Test', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('https://example.com');
  });

  test('should execute test actions', async ({ page }) => {
    // interact: click button 'Login'
    await page.locator('role=button[name=\'Login\']').click({ timeout: 30000 });
    
    // ...
  });
});
```

### 7. Config Loader (`src/config/config-loader.ts`)

**Responsabilidad**: Cargar y validar configuración.

**Fuentes** (prioridad descendente):
1. Variables de entorno (`.env`)
2. Archivo de configuración (`.atezcarc`)
3. Valores por defecto

**Validación**: Usa Zod para schema validation.

### 8. CLI (`src/cli.ts`)

**Comandos**:
- `az run <file>`: Ejecutar test
- `az generate <file>`: Solo generar código
- `az init`: Crear configuración
- `az cache clear`: Limpiar cache
- `az cache stats`: Estadísticas de cache

## Decisiones de Diseño

### ¿Por qué Claude sobre OpenAI?

1. Mejor para tareas estructuradas
2. Contexto más largo (útil para prompts complejos)
3. Respuestas más consistentes con temperature=0

### ¿Por qué cache agresivo?

1. **Costo**: Cada interpretación = $0.003 aprox
2. **Performance**: Cache hit = 0ms vs API call = 1-2s
3. **Determinismo**: Tests deben ser reproducibles

### ¿Por qué generar código?

1. **Auditoría**: Código visible y editable
2. **CI/CD**: Ejecutar sin API key
3. **Performance**: Re-runs sin IA
4. **Depuración**: Más fácil debuggear código estático

## Optimizaciones

### Reducción de Costos

- Cache con TTL de 30 días
- Temperature = 0 para consistencia
- Prompts optimizados (mínimo tokens)
- Re-runs usan código generado

### Performance

- Paralelización posible en futuro
- Cache en memoria + disco
- Lazy loading de componentes pesados

## Limitaciones Actuales

1. **Determinismo IA**: Aunque usamos temperature=0, respuestas pueden variar ligeramente
2. **Selectores dinámicos**: Elementos con IDs generados pueden fallar
3. **Single-threaded**: Tests ejecutan secuencialmente
4. **Lenguaje**: Solo inglés en descripciones (por ahora)

## Roadmap Técnico

### v0.2.0
- [ ] Soporte multi-modelo (OpenAI, local)
- [ ] Paralelización de tests
- [ ] Selector healing (auto-repair)

### v0.3.0
- [ ] Sistema de plugins
- [ ] Test recorder (extensión de navegador)
- [ ] Visual regression testing

### v1.0.0
- [ ] Producción-ready
- [ ] Documentación completa
- [ ] Suite de tests robusta
- [ ] CI/CD templates
