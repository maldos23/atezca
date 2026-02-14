# Configuración del AI Provider

Ahora puedes configurar el proveedor de IA de tres maneras diferentes:

## Opción 1: Variables de Entorno (Recomendado para producción)

Crea un archivo `.env`:

```bash
# Selecciona el proveedor
ATEZCA_AI_PROVIDER=gemini  # o 'claude'

# Agrega la API key correspondiente
GOOGLE_API_KEY=AIza...
# o
ANTHROPIC_API_KEY=sk-ant-api03-...
```

En tu test:

```javascript
import { az } from '@atezca/core';

az.setup({
  url: 'https://example.com',
  browser: 'chromium',
  headless: true,
});

az.test('navigate', 'Go to homepage');
```

## Opción 2: Directamente en az.setup() (Útil para pruebas)

```javascript
import { az } from '@atezca/core';

// Con Gemini
az.setup({
  url: 'https://example.com',
  browser: 'chromium',
  headless: true,
  aiProvider: 'gemini',
  apiKey: 'AIza...your_gemini_key',
});

// O con Claude
az.setup({
  url: 'https://example.com',
  browser: 'chromium',
  headless: true,
  aiProvider: 'claude',
  apiKey: 'sk-ant-api03-...your_claude_key',
});

az.test('navigate', 'Go to homepage');
```

## Opción 3: Archivo de configuración .atezcarc

Crea un archivo `.atezcarc` en la raíz del proyecto:

```json
{
  "aiProvider": "gemini",
  "googleApiKey": "AIza...",
  "cacheEnabled": true,
  "cacheExpiryDays": 30,
  "browser": "chromium",
  "headless": true,
  "timeout": 30000,
  "retries": 3,
  "outputDir": "generated-tests"
}
```

En tu test:

```javascript
import { az } from '@atezca/core';

az.setup({
  url: 'https://example.com',
  // Toda la configuración se lee de .atezcarc
});

az.test('navigate', 'Go to homepage');
```

## Prioridad de Configuración

La configuración sigue este orden de prioridad (mayor a menor):

1. **Parámetros en `az.setup()`** - Máxima prioridad
2. **Variables de entorno** (`.env`)
3. **Archivo `.atezcarc`**
4. **Valores por defecto**

Ejemplo con override:

```javascript
// .env tiene: ATEZCA_AI_PROVIDER=claude
// Pero en el test especificas Gemini:

az.setup({
  url: 'https://example.com',
  aiProvider: 'gemini',  // Esto sobrescribe el .env
  apiKey: 'AIza...gemini_key',
});

// Resultado: Usará Gemini en lugar de Claude
```

## Ventajas de cada opción

### Variables de Entorno (.env)
✅ Seguro: No expones API keys en el código  
✅ Fácil cambio entre entornos  
✅ Recomendado para CI/CD  

### az.setup()
✅ Flexibilidad máxima  
✅ Útil para tests con diferentes proveedores  
✅ No requiere archivos externos  

### Archivo .atezcarc
✅ Configuración centralizada del proyecto  
✅ Versionable (sin API keys)  
✅ Compartido entre todo el equipo  
