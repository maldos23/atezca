# Funcionalidades Avanzadas

## 1. Desactivar Validación SSL (`disableSSL`)

### ¿Cuándo usarlo?

La opción `disableSSL` es útil en estos escenarios:

- **Entornos de desarrollo** con certificados autofirmados
- **Redes corporativas** con proxies SSL
- **Servidores de staging** sin certificados válidos
- **Testing local** con HTTPS sin configuración completa

### ¿Cómo funciona?

Cuando se activa `disableSSL: true`, Playwright ignora todos los errores de certificados SSL, permitiendo que las pruebas se ejecuten en sitios con certificados inválidos, expirados o autofirmados.

### Uso

```javascript
import { az } from '@atezca/core';

az.setup({
  url: 'https://dev-server.local/app',
  browser: 'chromium',
  headless: true,
  disableSSL: true,  // 👈 Ignora errores SSL
});

az.test('navigate', 'Go to login page');
```

### ⚠️ Advertencia de Seguridad

**NO uses `disableSSL: true` en producción.** Esta opción desactiva una capa importante de seguridad. Úsala solo en entornos controlados de desarrollo o testing.

### Errores SSL Comunes que Resuelve

- `net::ERR_CERT_AUTHORITY_INVALID` - Certificado no confiable
- `net::ERR_CERT_COMMON_NAME_INVALID` - Nombre del certificado no coincide
- `net::ERR_CERT_DATE_INVALID` - Certificado expirado
- `SSL certificate problem: self signed certificate` - Certificado autofirmado

---

## 2. Instalación Automática de Navegadores

### ¿Qué hace?

Cuando ejecutas una prueba por primera vez y Playwright no tiene el navegador instalado, **@atezca/core automáticamente**:

1. Detecta que falta el navegador
2. Muestra un mensaje informativo
3. Descarga e instala el navegador automáticamente
4. Reintenta la ejecución de la prueba

### Proceso Automático

```bash
$ node cli.js run test.mjs

Loading test file: test.mjs

Found 2 test command(s)

📝 Processing commands...
🚀 Launching browser...

⚠️  Browser chromium not found. Installing automatically...

Downloading Chromium 145.0.7632.6...
[====================] 100%

✓ Browser chromium installed successfully!

Retrying browser launch...

▶️  Executing tests...
```

### ¿Qué navegadores soporta?

- ✅ **Chromium** (Chrome sin marca)
- ✅ **Firefox**
- ✅ **WebKit** (Safari engine)

### Configuración Manual (opcional)

Si prefieres instalar manualmente:

```bash
# Instalar todos los navegadores
pnpm exec playwright install

# Instalar solo Chromium
pnpm exec playwright install chromium

# Instalar Firefox
pnpm exec playwright install firefox

# Instalar WebKit
pnpm exec playwright install webkit
```

### Ventajas

✅ **Experiencia fluida**: No necesitas recordar instalar navegadores  
✅ **Portable**: Funciona en cualquier máquina sin configuración previa  
✅ **CI/CD friendly**: Ideal para pipelines de integración continua  
✅ **Multi-entorno**: Funciona en desarrollo, staging y producción  

### Detalles Técnicos

La instalación automática:
- Solo se ejecuta cuando falta el navegador
- Usa el comando oficial `playwright install`
- No interfiere con instalaciones existentes
- Almacena navegadores en `~/.cache/ms-playwright/`
- Solo descarga el navegador solicitado (no todos)

### Ejemplo Completo

```javascript
import { az } from '@atezca/core';

// Primera ejecución: instala automáticamente
az.setup({
  url: 'https://example.com',
  browser: 'firefox',  // Se instalará automáticamente si falta
  headless: true,
});

az.test('navigate', 'Go to homepage');
```

**Salida esperada en primera ejecución:**
```
⚠️  Browser firefox not found. Installing automatically...
Downloading Firefox...
✓ Browser firefox installed successfully!
Retrying browser launch...
✓ Test passed!
```

**Ejecuciones subsecuentes:**
```
🚀 Launching browser...
▶️  Executing tests...
✓ Test passed!
```

---

## Combinación de Ambas Funcionalidades

Puedes combinar `disableSSL` con instalación automática:

```javascript
import { az } from '@atezca/core';

az.setup({
  url: 'https://staging.myapp.com',  // Servidor staging con SSL inválido
  browser: 'webkit',                  // Se instalará automáticamente
  headless: true,
  disableSSL: true,                   // Ignora errores de certificado
  aiProvider: 'gemini',
  apiKey: process.env.GOOGLE_API_KEY,
});

az.test('navigate', 'Go to dashboard');
az.test('interact', 'Click settings button');
```

**Primera ejecución:**
1. Detecta que falta WebKit → lo instala automáticamente
2. Lanza WebKit con SSL deshabilitado
3. Ejecuta las pruebas sin errores SSL

---

## Preguntas Frecuentes

### ¿La instalación automática funciona sin internet?

No, requiere conexión a internet para descargar los navegadores desde los servidores de Playwright.

### ¿Cuánto espacio ocupan los navegadores?

- Chromium: ~160 MB
- Firefox: ~90 MB
- WebKit: ~70 MB

### ¿Puedo desactivar la instalación automática?

No hay una opción para desactivarla, pero si prefieres controlarla manualmente, simplemente instala los navegadores antes de ejecutar las pruebas.

### ¿Es seguro usar disableSSL en CI/CD?

Sí, si tu entorno de CI/CD usa certificados autofirmados. Pero asegúrate de no usarlo en pruebas de producción.

### ¿Los navegadores se actualizan automáticamente?

No. La instalación automática solo se ejecuta si el navegador no existe. Para actualizar, ejecuta:

```bash
pnpm exec playwright install --force
```

---

## Soporte

Si encuentras problemas:

1. Verifica que tienes suficiente espacio en disco
2. Asegúrate de tener conexión a internet (para instalación)
3. Revisa los permisos de escritura en `~/.cache/ms-playwright/`
4. Consulta los logs de error para más detalles
