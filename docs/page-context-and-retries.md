# Contexto de Página y Reintentos Inteligentes

## Contexto de Página

### ¿Qué es?

Cada vez que el AI interpreta un comando, ahora tiene acceso al **estado actual de la página**, incluyendo:

- URL actual
- Título de la página
- Elementos interactivos disponibles (botones, links, inputs)
- Estructura de accesibilidad simplificada

### ¿Cómo funciona?

Antes de cada interpretación, Atezca captura automáticamente:

```javascript
{
  url: "https://example.com/login",
  title: "Login - My App",
  interactiveElements: [
    { role: "input", name: "Email", tag: "input" },
    { role: "input", name: "Password", tag: "input" },
    { role: "button", name: "Sign In", tag: "button" },
    { role: "link", name: "Forgot password?", tag: "a" }
  ],
  accessibilityTree: "..."
}
```

El AI usa esta información para:
- **Seleccionar elementos precisos**: Conoce exactamente qué elementos están disponibles
- **Evitar errores**: No intenta interactuar con elementos que no existen
- **Generar selectores robustos**: Usa información real de la página

### Ventajas

✅ **Mayor precisión**: El AI ve lo que hay en la página  
✅ **Menos errores**: No intenta acciones imposibles  
✅ **Selectores contextuales**: Usa los nombres reales de los elementos  
✅ **Adaptación dinámica**: Se ajusta al estado actual de la aplicación  

---

## Reintentos Inteligentes (5 intentos)

### ¿Qué es?

Si una acción falla, Atezca **automáticamente**:

1. **Captura el nuevo estado de la página**
2. **Re-interpreta el comando** con el contexto actualizado
3. **Genera nuevas acciones** basadas en el estado actual
4. **Reintenta la ejecución**
5. Repite hasta **5 veces** o hasta que tenga éxito

### Flujo de Reintentos

```
Intento 1: Ejecutar con interpretación inicial
   ↓ (falla)
   
Intento 2: 
   → Capturar contexto actual de página
   → Re-interpretar comando con nuevo contexto
   → Ejecutar con nueva interpretación
   ↓ (falla)
   
Intento 3: 
   → Capturar contexto actualizado
   → Re-interpretar con contexto más reciente
   → Ejecutar
   ↓ (falla)

... hasta 5 intentos totales
```

### Ejemplo Real

```javascript
az.test('interact', "Click the submit button");
```

**Intento 1:**
- AI busca botón "submit"
- No lo encuentra (página aún cargando)
- ❌ Falla

**Intento 2:**
- Captura página actual
- Detecta: `button "Send Form"` está presente
- Re-interpreta: "submit" → "Send Form"
- ✅ Éxito

### Ventajas

✅ **Auto-recuperación**: No necesitas intervenir manualmente  
✅ **Adaptación a cambios**: Si la página cambia, se adapta  
✅ **Tolerancia a fallos temporales**: Espera a que elementos aparezcan  
✅ **Aprendizaje continuo**: Cada reintento usa información más actualizada  

### Configuración

Los reintentos están **siempre activos** con máximo 5 intentos. No requiere configuración adicional.

---

## Ejemplo Completo

```javascript
import { az } from '@atezca/core';

az.setup({
  url: 'https://example.com/app',
  browser: 'chromium',
  headless: true,
  aiProvider: 'gemini',
  apiKey: process.env.GOOGLE_API_KEY,
});

// Test con contexto automático y reintentos
az.test('navigate', 'Go to login page');
az.test('interact', 'Type email in the email field');
az.test('interact', 'Type password in the password field');
az.test('interact', 'Click the login button');
az.test('expect', 'Show welcome message');
```

**Salida con reintento:**

```
▶️  Executing tests...

→ interact: Click the login button
  ⚠ Failed: Element not found: button[name="Login"]
  ⟳ Retry 1/4 - Re-analyzing page...
  → Interpreting with GEMINI...
  ✓ click (role=button[name="Sign In"])
  
✓ Test passed!
```

---

## Casos de Uso

### 1. Páginas con Carga Asíncrona

Si elementos aparecen después de cargar:
- Primer intento falla (elemento no existe)
- Reintento captura página con elemento cargado
- Éxito en segundo intento

### 2. Texto Variable en Botones

Si el texto del botón cambia según el contexto:
- "Submit" vs "Send" vs "Guardar"
- AI adapta el selector al texto real

### 3. Popups y Modales

Si aparece un modal después de una acción:
- Captura el nuevo contexto con el modal
- Interpreta comandos dentro del modal

### 4. Formularios Dinámicos

Si campos aparecen/desaparecen según selecciones:
- Cada reintento ve el estado actualizado
- Interactúa solo con elementos visibles

---

## Monitoreo

Durante la ejecución, verás logs claros:

```bash
→ interact: Fill in the registration form
  ⚠ Failed: Selector "input[name='email']" not found
  ⟳ Retry 1/4 - Re-analyzing page...
  → Interpreting with GEMINI...
  ✓ type (role=textbox[name="Email Address"])
  ✓ type (role=textbox[name="Full Name"])
  
✓ All actions completed successfully
```

---

## Limitaciones

⚠️ **Máximo 5 reintentos**: Después de 5 fallos, el test se detiene  
⚠️ **Costo de API**: Cada reintento consume tokens del AI  
⚠️ **Tiempo**: Los reintentos aumentan el tiempo de ejecución  

## Recomendaciones

✅ **Usa descripciones claras**: "Click login button" es mejor que "Click it"  
✅ **Sé específico**: "Type email in the top input" vs "Type email"  
✅ **Confía en el sistema**: Los reintentos manejan casos edge automáticamente  

---

## Preguntas Frecuentes

### ¿Se cachean las interpretaciones con contexto?

Sí, pero si cambia el contexto de la página significativamente, se re-interpreta.

### ¿Los reintentos aumentan mucho el costo?

Solo si fallan. Cada reintento consume tokens, pero normalmente 1-2 reintentos son suficientes.

### ¿Puedo desactivar los reintentos?

No, están siempre activos para mejorar la robustez. Si no quieres reintentos, asegúrate de que tus comandos sean muy precisos.

### ¿El contexto captura todo el HTML?

No, solo elementos interactivos y estructura de accesibilidad simplificada para reducir tokens.
