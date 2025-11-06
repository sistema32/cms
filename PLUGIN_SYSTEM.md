# LexCMS Plugin System

Sistema de plugins extensible y seguro para LexCMS que permite agregar funcionalidades sin modificar el código core.

## 🎯 Características

- ✅ **Sistema de Hooks y Filters** - 40+ puntos de extensión
- ✅ **API Rica** - PluginAPI con métodos para DB, HTTP, logging, cache, utils
- ✅ **Seguridad Robusta** - Sistema de permisos granular con sandboxing
- ✅ **Hot Reload** - Activar/desactivar plugins sin reiniciar
- ✅ **Persistencia** - Settings guardados en base de datos
- ✅ **Manifests Declarativos** - Metadata, permisos y dependencias en JSON
- ✅ **TypeScript First** - Tipos completos para desarrollo

## 📦 Arquitectura

```
plugins/
├── my-plugin/
│   ├── plugin.json      # Manifest con metadata
│   ├── index.ts         # Plugin class (default export)
│   ├── README.md        # Documentación
│   └── ...

src/lib/plugin-system/
├── types.ts             # Type definitions
├── HookManager.ts       # Gestión de hooks/filters
├── PluginAPI.ts         # API para plugins
├── SecurityManager.ts   # Validación de permisos
├── PluginLoader.ts      # Carga y activación
├── PluginManager.ts     # Operaciones alto nivel + DB
└── index.ts             # Exports

src/db/schema.ts
├── plugins              # Tabla de plugins instalados
└── plugin_hooks         # Tabla de hooks registrados
```

## 🚀 Quick Start

### 1. Crear un Plugin

**Estructura mínima:**
```
plugins/my-plugin/
├── plugin.json
└── index.ts
```

**plugin.json:**
```json
{
  "name": "my-plugin",
  "version": "1.0.0",
  "displayName": "My Awesome Plugin",
  "description": "Does something awesome",
  "author": "Your Name",
  "license": "MIT",

  "compatibility": {
    "lexcms": ">=1.0.0"
  },

  "permissions": [
    "content:read",
    "settings:read"
  ],

  "hooks": [
    "content:afterCreate"
  ],

  "category": "other",
  "tags": ["utility"]
}
```

**index.ts:**
```typescript
import type { PluginAPI } from '../../src/lib/plugin-system/index.ts';

export default class MyPlugin {
  private api: PluginAPI;

  constructor(api: PluginAPI) {
    this.api = api;
  }

  async onActivate(): Promise<void> {
    this.api.log('Plugin activated!', 'info');

    // Register hooks
    this.api.addAction('content:afterCreate', this.onContentCreated.bind(this));
  }

  async onDeactivate(): Promise<void> {
    this.api.log('Plugin deactivated!', 'info');

    // Cleanup
    this.api.removeAction('content:afterCreate', this.onContentCreated);
  }

  private async onContentCreated(content: any): Promise<void> {
    this.api.log(`New content created: ${content.title}`, 'info');
  }
}
```

### 2. Instalar y Activar

```typescript
import { pluginManager } from './src/lib/plugin-system/index.ts';

// Install
await pluginManager.install('my-plugin', { activate: true });

// Or separately
await pluginManager.install('my-plugin');
await pluginManager.activate('my-plugin');
```

## 🪝 Sistema de Hooks

### Action Hooks

Ejecutan código en momentos específicos sin retornar valores:

```typescript
this.api.addAction('content:afterCreate', async (content) => {
  // Do something after content is created
  console.log('New content:', content.title);
});

// Trigger actions (en el core)
await hookManager.doAction('content:afterCreate', content);
```

### Filter Hooks

Modifican y retornan valores:

```typescript
this.api.addFilter('content:render', (content) => {
  // Modify content before rendering
  content.body = content.body.toUpperCase();
  return content;
});

// Apply filters (en el core)
const modifiedContent = await hookManager.applyFilters('content:render', content);
```

### Hooks Disponibles

#### Content Hooks
- `content:beforeCreate`, `content:afterCreate`
- `content:beforeUpdate`, `content:afterUpdate`
- `content:beforeDelete`, `content:afterDelete`
- `content:beforePublish`, `content:afterPublish`
- `content:render` (filter)

#### Media Hooks
- `media:beforeUpload`, `media:afterUpload`
- `media:beforeDelete`, `media:afterDelete`
- `media:getUrl` (filter) - **Ideal para CDN**
- `media:optimize` (filter)

#### Theme Hooks
- `theme:beforeRender`, `theme:afterRender`
- `theme:headScripts` (filter) - **Inyectar scripts**
- `theme:footerScripts` (filter)
- `theme:css` (filter) - **Agregar CSS**
- `theme:helpers` (filter) - **Extender helpers**

#### CAPTCHA Hooks
- `captcha:verify` (filter) - **Cambiar proveedor**
- `captcha:render` (filter)

#### Y muchos más...
Ver `AVAILABLE_HOOKS` en `src/lib/plugin-system/index.ts`

## 💻 Plugin API

### Hook Management

```typescript
// Actions
this.api.addAction(hookName, callback, priority);
this.api.removeAction(hookName, callback);
this.api.doAction(hookName, ...args);

// Filters
this.api.addFilter(hookName, callback, priority);
this.api.removeFilter(hookName, callback);
this.api.applyFilters(hookName, value, ...args);
```

### Settings

```typescript
// Get setting
const apiKey = this.api.getSetting('apiKey', 'default-value');

// Set setting (in-memory, persistence via PluginManager)
this.api.setSetting('apiKey', 'new-value');

// Get all settings
const allSettings = this.api.getAllSettings();

// Settings are persisted automatically in database
```

### Database

```typescript
// Execute queries (requires database permissions)
const results = await this.api.query(
  'SELECT * FROM content WHERE status = ?',
  ['published']
);

// Update with parameterized query
await this.api.query(
  'UPDATE media SET metadata = ? WHERE id = ?',
  [JSON.stringify(metadata), mediaId]
);
```

### HTTP

```typescript
// Make external requests (requires network:external permission)
const response = await this.api.fetch('https://api.example.com/data', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ key: 'value' })
});

const data = await response.json();
```

### Logging

```typescript
this.api.log('Info message', 'info');
this.api.log('Warning message', 'warn');
this.api.log('Error occurred', 'error');
```

### Cache (Placeholder)

```typescript
// Will be implemented when cache system is available
await this.api.cache.get('key');
await this.api.cache.set('key', value, ttl);
await this.api.cache.delete('key');
```

### Utilities

```typescript
// Sanitize HTML
const clean = this.api.utils.sanitize('<script>alert("xss")</script>');

// Create slug
const slug = this.api.utils.slugify('Hello World!'); // "hello-world"

// Format date
const formatted = this.api.utils.formatDate(new Date(), 'YYYY-MM-DD');

// Generate random ID
const id = this.api.utils.generateId(16);
```

## 🔒 Sistema de Permisos

### Permisos Disponibles

```typescript
// Content
'content:read', 'content:write', 'content:delete'

// Media
'media:read', 'media:write', 'media:delete'

// Users
'users:read', 'users:write'

// Settings
'settings:read', 'settings:write'

// Network
'network:external'  // HTTP requests

// Database
'database:read', 'database:write'

// System (muy peligrosos)
'system:shell', 'system:files'
```

### Validación Automática

El `SecurityManager` valida automáticamente:

- ✅ Permisos antes de cada operación
- ✅ Previene SQL injection (bloquea DROP, TRUNCATE, ALTER, etc.)
- ✅ Previene SSRF (bloquea localhost, 127.0.0.1, IPs privadas)
- ✅ Solo HTTP/HTTPS en requests
- ✅ Path traversal prevention
- ✅ Command injection prevention

### Ejemplos

```typescript
// ❌ Error: Plugin no tiene permiso
await this.api.query('UPDATE users SET role = "admin"');
// Requires 'database:write' permission

// ❌ Error: Query peligroso bloqueado
await this.api.query('DROP TABLE users');
// Forbidden keyword: DROP

// ❌ Error: SSRF prevention
await this.api.fetch('http://localhost:8080/admin');
// Forbidden hostname: localhost

// ✅ OK: Tiene permiso network:external
await this.api.fetch('https://api.cloudflare.com/');
```

## 📊 Gestión de Plugins

### Programáticamente

```typescript
import { pluginManager } from './src/lib/plugin-system/index.ts';

// Install
await pluginManager.install('plugin-name', { activate: true });

// Activate/Deactivate
await pluginManager.activate('plugin-name');
await pluginManager.deactivate('plugin-name');

// Update settings
await pluginManager.updateSettings('plugin-name', {
  apiKey: 'new-key',
  enabled: true
});

// Get settings
const settings = await pluginManager.getSettings('plugin-name');

// Uninstall
await pluginManager.uninstall('plugin-name');

// List plugins
const all = await pluginManager.getAll();
const active = await pluginManager.getActive();

// Statistics
const stats = await pluginManager.getStats();
// { total: 5, active: 3, inactive: 2 }
```

### Inicialización del Sistema

En `src/main.ts` o `src/app.ts`:

```typescript
import { pluginManager } from './lib/plugin-system/index.ts';

// Initialize plugin system (loads all active plugins from DB)
await pluginManager.initialize();
```

## 🎓 Ejemplos de Plugins

### 1. CDN Plugin (Cloudflare)

**Caso de uso:** Servir media desde CDN

```typescript
export default class CDNPlugin {
  async onActivate() {
    // Upload to CDN after local upload
    this.api.addAction('media:afterUpload', this.uploadToCDN.bind(this));

    // Serve from CDN
    this.api.addFilter('media:getUrl', this.getCDNUrl.bind(this));
  }

  private async uploadToCDN(media: Media) {
    const cdnUrl = await uploadToCloudflare(media);

    // Save CDN URL in metadata
    await this.api.query(
      'UPDATE media SET metadata = json_set(metadata, "$.cdnUrl", ?) WHERE id = ?',
      [cdnUrl, media.id]
    );
  }

  private getCDNUrl(url: string, media: Media): string {
    return media.metadata?.cdnUrl || url;
  }
}
```

### 2. Analytics Plugin (Google Analytics)

**Caso de uso:** Tracking de pageviews

```typescript
export default class AnalyticsPlugin {
  async onActivate() {
    // Inject GA script
    this.api.addFilter('theme:headScripts', this.injectScript.bind(this));

    // Track pageviews server-side
    this.api.addAction('analytics:pageview', this.trackPageview.bind(this));
  }

  private injectScript(scripts: string): string {
    const trackingId = this.api.getSetting('trackingId');

    return scripts + `
      <script async src="https://www.googletagmanager.com/gtag/js?id=${trackingId}"></script>
      <script>
        window.dataLayer = window.dataLayer || [];
        function gtag(){dataLayer.push(arguments);}
        gtag('js', new Date());
        gtag('config', '${trackingId}');
      </script>
    `;
  }
}
```

### 3. Reading Time Plugin

**Caso de uso:** Agregar tiempo de lectura a posts

```typescript
export default class ReadingTimePlugin {
  async onActivate() {
    this.api.addFilter('content:render', this.addReadingTime.bind(this));
    this.api.addFilter('theme:helpers', this.addHelpers.bind(this));
  }

  private addReadingTime(content: Content): Content {
    const wordsPerMinute = 200;
    const words = content.body.split(/\s+/).length;
    const readingTime = Math.ceil(words / wordsPerMinute);

    return {
      ...content,
      readingTime,
      readingTimeText: `${readingTime} min read`
    };
  }

  private addHelpers(helpers: any) {
    return {
      ...helpers,
      getReadingTime: (text: string) => {
        const words = text.split(/\s+/).length;
        return Math.ceil(words / 200);
      }
    };
  }
}
```

### 4. CAPTCHA Provider Plugin (hCaptcha)

**Caso de uso:** Cambiar proveedor de CAPTCHA

```typescript
export default class HCaptchaPlugin {
  async onActivate() {
    this.api.addFilter('captcha:verify', this.verify.bind(this));
    this.api.addFilter('captcha:render', this.render.bind(this));
  }

  private async verify(isValid: boolean, token: string, ip: string): Promise<boolean> {
    const secret = this.api.getSetting('siteSecret');

    const response = await this.api.fetch('https://hcaptcha.com/siteverify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({ secret, response: token, remoteip: ip })
    });

    const data = await response.json();
    return data.success;
  }

  private render(html: string): string {
    const siteKey = this.api.getSetting('siteKey');

    return `
      <div class="h-captcha" data-sitekey="${siteKey}"></div>
      <script src="https://hcaptcha.com/1/api.js" async defer></script>
    `;
  }
}
```

## 🧪 Testing

### Unit Tests

```typescript
import { assertEquals } from 'https://deno.land/std/testing/asserts.ts';
import { pluginLoader } from './src/lib/plugin-system/PluginLoader.ts';

Deno.test('Plugin loads successfully', async () => {
  const plugin = await pluginLoader.loadPlugin('test-plugin');
  assertEquals(plugin.name, 'test-plugin');
  assertEquals(plugin.status, 'inactive');
});

Deno.test('Hook manager executes actions', async () => {
  const { hookManager } = await import('./src/lib/plugin-system/HookManager.ts');

  let executed = false;
  hookManager.addAction('test:hook', () => { executed = true; });

  await hookManager.doAction('test:hook');
  assertEquals(executed, true);
});
```

## 📝 Best Practices

### 1. Siempre Validar Configuración

```typescript
async onActivate() {
  const apiKey = this.api.getSetting('apiKey');

  if (!apiKey) {
    this.api.log('Plugin not configured. Please add API key in settings.', 'warn');
    return; // Don't register hooks if not configured
  }

  // Register hooks only if configured
  this.api.addAction('...', ...);
}
```

### 2. Manejar Errores Gracefully

```typescript
private async uploadToCDN(media: Media) {
  try {
    await someRiskyOperation();
  } catch (error) {
    this.api.log(`Upload failed: ${error.message}`, 'error');
    // Don't throw - allow the system to continue
  }
}
```

### 3. Cleanup en onDeactivate

```typescript
async onDeactivate() {
  // Remove ALL registered hooks
  this.api.removeAction('media:afterUpload', this.uploadToCDN);
  this.api.removeFilter('media:getUrl', this.getCDNUrl);

  // Close connections, cleanup resources
  await this.cleanup();
}
```

### 4. Usar Priority para Control de Ejecución

```typescript
// Lower number = higher priority (executes first)
this.api.addAction('media:afterUpload', this.uploadToCDN, 5);  // Runs early
this.api.addAction('media:afterUpload', this.notifyAdmin, 10); // Runs later
```

### 5. Documentar Todo

```typescript
/**
 * Upload media file to CDN
 * @param media - Media object with file information
 * @throws {Error} If CDN API fails
 */
private async uploadToCDN(media: Media): Promise<void> {
  // ...
}
```

## 🚨 Seguridad

### DO:
- ✅ Siempre sanitizar input del usuario
- ✅ Usar consultas parametrizadas
- ✅ Validar configuración antes de usar
- ✅ Manejar errores sin exponer información sensible
- ✅ Usar HTTPS para requests externos
- ✅ Documentar permisos requeridos

### DON'T:
- ❌ Nunca ejecutar código arbitrario del usuario
- ❌ No acceder a DB directamente sin permisos
- ❌ No hacer requests a localhost/IPs privadas
- ❌ No almacenar secrets en texto plano
- ❌ No usar `eval()` o `Function()`
- ❌ No ignorar errores silenciosamente

## 📚 Referencias

- **Plugin Example:** `plugins/cdn-cloudflare/`
- **Type Definitions:** `src/lib/plugin-system/types.ts`
- **Available Hooks:** `src/lib/plugin-system/index.ts`
- **Security Manager:** `src/lib/plugin-system/SecurityManager.ts`

## 🎉 Plugins Sugeridos

Ideas de plugins a implementar:

1. **CDN Providers:** Cloudflare, AWS CloudFront, BunnyCDN
2. **Analytics:** GA4, Plausible, Matomo, Umami
3. **CAPTCHA:** hCaptcha, Turnstile, FriendlyCaptcha
4. **Email:** SendGrid, Mailgun, Resend, SES
5. **Storage:** S3, Google Cloud Storage, Azure Blob
6. **Social:** Auto-post to Twitter/X, Facebook, LinkedIn
7. **SEO:** Yoast-like analyzer, Schema.org generator
8. **AI:** OpenAI content generation, auto-tagging
9. **Forms:** Contact forms, surveys, polls
10. **E-commerce:** Stripe, PayPal, digital downloads

---

**¡El sistema de plugins está listo para usar!** 🎉

Para comenzar a desarrollar plugins, consulta los ejemplos en `plugins/cdn-cloudflare/` y la documentación completa en este archivo.
