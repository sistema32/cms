# Blueprint: Remaining Theme System Features

Detailed implementation guide for the 10 remaining theme system features. This document provides architecture, APIs, and implementation details.

---

## 9. Widget System (High Priority)

### Overview
Drag-and-drop widget system for sidebars and widget areas, similar to WordPress.

### Architecture

```typescript
// src/db/schema.ts additions
export const widgetAreas = sqliteTable("widget_areas", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  slug: text("slug").notNull().unique(),
  name: text("name").notNull(),
  description: text("description"),
  theme: text("theme").notNull(),
  isActive: integer("is_active", { mode: "boolean" }).default(true),
});

export const widgets = sqliteTable("widgets", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  areaId: integer("area_id").references(() => widgetAreas.id, { onDelete: "cascade" }),
  type: text("type").notNull(), // 'search', 'recent-posts', 'custom-html', etc.
  title: text("title"),
  settings: text("settings"), // JSON
  order: integer("order").default(0),
  isActive: integer("is_active", { mode: "boolean" }).default(true),
});
```

### Built-in Widgets

```typescript
// src/widgets/types.ts
export interface Widget {
  id: string;
  name: string;
  description: string;
  settingsSchema: Record<string, SettingDefinition>;
  render(settings: any, context: any): Promise<HtmlEscapedString>;
}

// src/widgets/search.tsx
export const SearchWidget: Widget = {
  id: "search",
  name: "Search",
  description: "Search form",
  settingsSchema: {
    placeholder: {
      type: "text",
      label: "Placeholder",
      default: "Search...",
    },
  },
  async render(settings, context) {
    return html`
      <form action="/search" method="get" class="widget-search">
        <input
          type="search"
          name="q"
          placeholder="${settings.placeholder || 'Search...'}"
        />
        <button type="submit">Search</button>
      </form>
    `;
  },
};
```

### Widget Service

```typescript
// src/services/widgetService.ts
export async function getWidgetsByArea(areaSlug: string): Promise<WidgetData[]> {
  // Fetch widgets for area, sorted by order
}

export async function renderWidget(widget: WidgetData, context: any): Promise<HtmlEscapedString> {
  const widgetClass = getWidgetClass(widget.type);
  return await widgetClass.render(widget.settings, context);
}

export async function renderWidgetArea(areaSlug: string, context: any): Promise<HtmlEscapedString> {
  const widgets = await getWidgetsByArea(areaSlug);

  return html`
    <div class="widget-area widget-area--${areaSlug}">
      ${widgets.map(w => html`
        <div class="widget widget--${w.type}">
          ${w.title ? html`<h3 class="widget-title">${w.title}</h3>` : ''}
          ${await renderWidget(w, context)}
        </div>
      `)}
    </div>
  `;
}
```

### Admin Interface

```typescript
// Admin route: /admin/appearance/widgets
// Drag-and-drop interface using SortableJS or similar
// - List of available widgets
- List of widget areas
- Drag widgets to areas
- Configure widget settings
- Reorder widgets within area
```

### Theme Integration

```json
// theme.json
{
  "supports": {
    "widgets": true,
    "widgetAreas": [
      {"id": "sidebar-primary", "name": "Primary Sidebar"},
      {"id": "footer-1", "name": "Footer Column 1"},
      {"id": "footer-2", "name": "Footer Column 2"}
    ]
  }
}
```

### Usage in Templates

```typescript
import { renderWidgetArea } from "../sdk/index.ts";

export const BlogTemplate = (props) => {
  return html`
    <main>...</main>
    <aside>
      ${await renderWidgetArea("sidebar-primary", props)}
    </aside>
  `;
};
```

### Estimated Implementation: 16 hours

---

## 10. Internationalization (i18n) System (High Priority)

### Overview
Multi-language support for themes with translations, RTL support, and locale-specific templates.

### Architecture

```typescript
// src/services/i18nService.ts
export class I18nService {
  private translations = new Map<string, Record<string, any>>();
  private currentLocale = "en";

  async loadTranslations(theme: string, locale: string) {
    const path = `./src/themes/${theme}/locales/${locale}.json`;
    const data = JSON.parse(await Deno.readTextFile(path));
    this.translations.set(`${theme}:${locale}`, data);
  }

  t(key: string, params?: Record<string, any>): string {
    const translation = this.getTranslation(key);
    return this.interpolate(translation, params);
  }

  setLocale(locale: string) {
    this.currentLocale = locale;
  }
}
```

### Translation Files

```
src/themes/my-theme/
├── locales/
│   ├── en.json
│   ├── es.json
│   ├── fr.json
│   └── ar.json  (RTL)
```

**en.json:**
```json
{
  "theme": {
    "read_more": "Read More",
    "posted_on": "Posted on {date}",
    "by_author": "By {author}",
    "categories": "Categories",
    "tags": "Tags"
  },
  "settings": {
    "primary_color": {
      "label": "Primary Color",
      "description": "Main theme color"
    }
  }
}
```

**es.json:**
```json
{
  "theme": {
    "read_more": "Leer Más",
    "posted_on": "Publicado el {date}",
    "by_author": "Por {author}",
    "categories": "Categorías",
    "tags": "Etiquetas"
  }
}
```

### Helper Functions

```typescript
// src/themes/sdk/i18n.ts
export function t(key: string, params?: Record<string, any>): string {
  return i18nService.t(key, params);
}

export function setLocale(locale: string): void {
  i18nService.setLocale(locale);
}

export function getLocale(): string {
  return i18nService.currentLocale;
}

export function isRTL(): boolean {
  const rtlLocales = ['ar', 'he', 'fa', 'ur'];
  return rtlLocales.includes(i18nService.currentLocale);
}
```

### Usage in Templates

```typescript
import { t, isRTL } from "../sdk/index.ts";

export const PostTemplate = (props) => {
  return html`
    <html lang="${getLocale()}" dir="${isRTL() ? 'rtl' : 'ltr'}">
      <body>
        <article>
          <h1>${props.post.title}</h1>
          <time>${t('theme.posted_on', { date: formatDate(props.post.publishedAt) })}</time>
          <span>${t('theme.by_author', { author: props.post.author.name })}</span>
          <a href="#">${t('theme.read_more')}</a>
        </article>
      </body>
    </html>
  `;
};
```

### Theme Config

```json
{
  "supports": {
    "i18n": true,
    "locales": ["en", "es", "fr", "ar"],
    "rtl": true
  },
  "defaultLocale": "en"
}
```

### Estimated Implementation: 12 hours

---

## 11. Hot Reload in Development (High Priority)

### Overview
Auto-reload browser when templates/assets change during development.

### Architecture

```typescript
// src/dev/hotReload.ts
import { watch } from "https://deno.land/std/fs/mod.ts";

export class HotReloadServer {
  private clients = new Set<WebSocket>();
  private watcher?: Deno.FsWatcher;

  async start(port = 3001) {
    // WebSocket server
    Deno.serve({ port }, (req) => {
      if (req.headers.get("upgrade") === "websocket") {
        const { socket, response } = Deno.upgradeWebSocket(req);
        this.clients.add(socket);
        socket.onclose = () => this.clients.delete(socket);
        return response;
      }
      return new Response("Not Found", { status: 404 });
    });

    // File watcher
    this.watchFiles();
  }

  private async watchFiles() {
    const watcher = Deno.watchFs("./src/themes", { recursive: true });

    for await (const event of watcher) {
      if (event.kind === "modify" || event.kind === "create") {
        const file = event.paths[0];
        console.log(`🔄 File changed: ${file}`);

        // Invalidate cache
        themeCacheService.invalidateAll();

        // Notify clients
        this.broadcast({ type: "reload", file });
      }
    }
  }

  private broadcast(data: any) {
    const message = JSON.stringify(data);
    for (const client of this.clients) {
      client.send(message);
    }
  }
}
```

### Client Script

```javascript
// Injected in development mode
<script>
  if (import.meta.env.DEV) {
    const ws = new WebSocket('ws://localhost:3001');

    ws.onmessage = (event) => {
      const data = JSON.parse(event.data);
      if (data.type === 'reload') {
        console.log('🔄 Reloading:', data.file);
        location.reload();
      }
    };

    ws.onerror = () => {
      console.warn('Hot reload disconnected');
    };
  }
</script>
```

### Integration with Dev Server

```typescript
// src/main.ts
if (Deno.env.get("DEV_MODE") === "true") {
  const hotReload = new HotReloadServer();
  await hotReload.start();
  console.log("🔥 Hot reload enabled on port 3001");
}
```

### Estimated Implementation: 8 hours

---

## 12. Live Theme Preview (High Priority)

### Overview
Preview themes before activation without affecting the live site.

### Architecture

```typescript
// Middleware for preview mode
app.use('*', async (c, next) => {
  const previewTheme = c.req.query('preview_theme');
  const previewToken = c.req.query('preview_token');

  if (previewTheme && previewToken) {
    // Verify token
    const valid = await verifyPreviewToken(previewToken);
    if (valid) {
      c.set('activeTheme', previewTheme);
      c.set('isPreview', true);
    }
  }

  await next();
});
```

### Admin Interface

```typescript
// Route: /admin/appearance/themes/preview/:themeName
app.get('/admin/appearance/themes/preview/:themeName', async (c) => {
  const theme = c.req.param('themeName');
  const previewToken = await generatePreviewToken(theme, c.get('user').id);

  return c.html(html`
    <div class="theme-preview">
      <div class="preview-toolbar">
        <select id="device-size">
          <option value="mobile">📱 Mobile</option>
          <option value="tablet">📱 Tablet</option>
          <option value="desktop">💻 Desktop</option>
        </select>
        <button id="activate-theme">Activate Theme</button>
        <button id="close-preview">Close Preview</button>
      </div>
      <iframe
        id="preview-frame"
        src="/?preview_theme=${theme}&preview_token=${previewToken}"
        class="preview-frame preview-frame--desktop"
      ></iframe>
    </div>
    <script src="/admin/assets/js/theme-preview.js"></script>
  `);
});
```

### Preview Styles

```css
.preview-frame {
  width: 100%;
  height: calc(100vh - 60px);
  border: none;
  transition: width 0.3s;
}

.preview-frame--mobile { width: 375px; }
.preview-frame--tablet { width: 768px; }
.preview-frame--desktop { width: 100%; }
```

### Estimated Implementation: 10 hours

---

## 13. Visual Theme Customizer (Medium Priority)

### Overview
WYSIWYG customizer for theme settings with live preview.

### Architecture

```typescript
// Route: /admin/appearance/customize
app.get('/admin/appearance/customize', async (c) => {
  const theme = await getActiveTheme();
  const config = await loadThemeConfig(theme);
  const settings = await getThemeCustomSettings(theme);

  return c.html(html`
    <div class="customizer">
      <!-- Sidebar with settings -->
      <div class="customizer-sidebar">
        <h2>Customize: ${config.displayName}</h2>
        ${renderSettingsPanel(config, settings)}
      </div>

      <!-- Live preview -->
      <div class="customizer-preview">
        <div class="preview-toolbar">
          <button class="undo">↶ Undo</button>
          <button class="redo">↷ Redo</button>
          <button class="reset">Reset</button>
        </div>
        <iframe id="customizer-preview"></iframe>
      </div>
    </div>
  `);
});
```

### Real-time Updates

```javascript
// Client-side customizer
class ThemeCustomizer {
  constructor() {
    this.iframe = document.getElementById('customizer-preview');
    this.history = [];
    this.historyIndex = -1;
  }

  updateSetting(key, value) {
    // Update preview
    this.iframe.contentWindow.postMessage({
      type: 'update-setting',
      key,
      value
    }, '*');

    // Save to history
    this.saveToHistory({ [key]: value });

    // Autosave
    this.autosave({ [key]: value });
  }

  async autosave(settings) {
    await fetch('/api/admin/themes/settings/draft', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(settings)
    });
  }

  publish() {
    // Publish draft settings
  }
}
```

### Estimated Implementation: 20 hours

---

## 14. Theme Marketplace MVP (Low Priority)

### Overview
Central repository for downloading and installing themes.

### Database Schema

```typescript
export const marketplaceThemes = sqliteTable("marketplace_themes", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  slug: text("slug").notNull().unique(),
  name: text("name").notNull(),
  description: text("description"),
  version: text("version").notNull(),
  author: text("author").notNull(),
  price: real("price").default(0),
  downloadCount: integer("download_count").default(0),
  rating: real("rating"),
  screenshots: text("screenshots"), // JSON array
  downloadUrl: text("download_url"),
  demoUrl: text("demo_url"),
  tags: text("tags"), // JSON array
  createdAt: integer("created_at", { mode: "timestamp" }),
  updatedAt: integer("updated_at", { mode: "timestamp" }),
});

export const themeReviews = sqliteTable("theme_reviews", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  themeId: integer("theme_id").references(() => marketplaceThemes.id),
  userId: integer("user_id").references(() => users.id),
  rating: integer("rating").notNull(),
  comment: text("comment"),
  createdAt: integer("created_at", { mode: "timestamp" }),
});
```

### API Endpoints

```typescript
// GET /api/marketplace/themes
app.get('/api/marketplace/themes', async (c) => {
  const { category, price, rating, search } = c.req.query();
  // Return filtered themes
});

// GET /api/marketplace/themes/:id
app.get('/api/marketplace/themes/:id', async (c) => {
  // Return theme details
});

// POST /api/marketplace/themes/:id/install
app.post('/api/marketplace/themes/:id/install', async (c) => {
  const themeId = c.req.param('id');

  // 1. Download theme ZIP
  // 2. Extract to src/themes/
  // 3. Validate theme
  // 4. Return success
});

// POST /api/marketplace/themes/:id/review
app.post('/api/marketplace/themes/:id/review', async (c) => {
  // Submit review
});
```

### Admin Interface

```
/admin/marketplace
├── Browse themes
├── Search and filters
├── Theme details modal
├── Install button
├── Demo preview
└── Reviews
```

### Estimated Implementation: 30 hours

---

## 15. Auto-Update System (Low Priority)

### Overview
Automatic theme updates with version checking.

### Architecture

```typescript
// src/services/themeUpdateService.ts
export async function checkForUpdates(): Promise<ThemeUpdate[]> {
  const installed = await listAvailableThemes();
  const updates: ThemeUpdate[] = [];

  for (const theme of installed) {
    const current = await loadThemeConfig(theme);
    const latest = await fetchLatestVersion(theme);

    if (semver.gt(latest.version, current.version)) {
      updates.push({
        theme,
        currentVersion: current.version,
        latestVersion: latest.version,
        changelog: latest.changelog,
      });
    }
  }

  return updates;
}

export async function updateTheme(themeName: string): Promise<void> {
  // 1. Create backup
  const backup = await createThemeBackup(themeName);

  try {
    // 2. Download new version
    const downloadUrl = await getThemeDownloadUrl(themeName);
    const zipContent = await fetch(downloadUrl).then(r => r.arrayBuffer());

    // 3. Extract and replace
    await extractTheme(zipContent, themeName);

    // 4. Invalidate cache
    invalidateThemeCache(themeName);

    console.log(`✅ Theme ${themeName} updated successfully`);
  } catch (error) {
    // Rollback to backup
    await restoreThemeBackup(backup);
    throw error;
  }
}
```

### Notification System

```typescript
// Check for updates daily
setInterval(async () => {
  const updates = await checkForUpdates();
  if (updates.length > 0) {
    // Notify admins
    await notifyAdmins({
      type: 'theme-updates-available',
      count: updates.length,
      themes: updates.map(u => u.theme),
    });
  }
}, 24 * 60 * 60 * 1000); // 24 hours
```

### Estimated Implementation: 16 hours

---

## 16. A/B Testing (Low Priority)

### Overview
Test multiple theme variants to optimize conversion.

### Database Schema

```typescript
export const abTests = sqliteTable("ab_tests", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  name: text("name").notNull(),
  status: text("status").default("running"), // running, completed, paused
  startDate: integer("start_date", { mode: "timestamp" }),
  endDate: integer("end_date", { mode: "timestamp" }),
});

export const abTestVariants = sqliteTable("ab_test_variants", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  testId: integer("test_id").references(() => abTests.id),
  name: text("name").notNull(),
  theme: text("theme").notNull(),
  settings: text("settings"), // JSON
  trafficPercentage: integer("traffic_percentage").default(50),
});

export const abTestEvents = sqliteTable("ab_test_events", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  testId: integer("test_id").references(() => abTests.id),
  variantId: integer("variant_id").references(() => abTestVariants.id),
  sessionId: text("session_id").notNull(),
  eventType: text("event_type"), // view, click, conversion
  createdAt: integer("created_at", { mode: "timestamp" }),
});
```

### Middleware

```typescript
app.use('*', async (c, next) => {
  const activeTest = await getActiveABTest();

  if (activeTest) {
    let sessionId = getCookie(c, 'ab_session');
    if (!sessionId) {
      sessionId = generateSessionId();
      setCookie(c, 'ab_session', sessionId);
    }

    const variant = await selectVariant(activeTest, sessionId);
    c.set('activeTheme', variant.theme);
    c.set('abTestVariant', variant.id);

    // Track view
    await trackEvent(activeTest.id, variant.id, sessionId, 'view');
  }

  await next();
});
```

### Variant Selection

```typescript
function selectVariant(test: ABTest, sessionId: string): Variant {
  // Sticky assignment based on session
  const hash = hashCode(sessionId + test.id);
  const percentage = hash % 100;

  let cumulative = 0;
  for (const variant of test.variants) {
    cumulative += variant.trafficPercentage;
    if (percentage < cumulative) {
      return variant;
    }
  }

  return test.variants[0];
}
```

### Analytics Dashboard

```typescript
// /admin/ab-tests/:id
// Show:
// - Variant performance
// - Conversion rates
// - Statistical significance
// - Winner recommendation
```

### Estimated Implementation: 24 hours

---

## 17. Multi-Theme Support (Low Priority)

### Overview
Different themes for different sections of the site.

### Architecture

```typescript
// Theme routing configuration
export const themeRouting = {
  routes: [
    { pattern: /^\/blog\//, theme: "magazine" },
    { pattern: /^\/shop\//, theme: "ecommerce" },
    { pattern: /^\/docs\//, theme: "documentation" },
    { pattern: /.*/, theme: "corporate" }, // default
  ]
};

// Middleware
app.use('*', async (c, next) => {
  const path = new URL(c.req.url).pathname;
  const route = themeRouting.routes.find(r => r.pattern.test(path));

  if (route) {
    c.set('activeTheme', route.theme);
  }

  await next();
});
```

### Configuration Storage

```typescript
export const themeRoutes = sqliteTable("theme_routes", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  pattern: text("pattern").notNull(),
  theme: text("theme").notNull(),
  priority: integer("priority").default(0),
  isActive: integer("is_active", { mode: "boolean" }).default(true),
});
```

### Admin Interface

```
Theme Routing
┌──────────────────────────────────┐
│ Route Pattern     Theme          │
├──────────────────────────────────┤
│ /blog/*           Magazine   [×] │
│ /shop/*           E-commerce [×] │
│ /docs/*           Docs       [×] │
│ /*                Corporate  [×] │
├──────────────────────────────────┤
│ [Add New Route]                  │
└──────────────────────────────────┘
```

### Estimated Implementation: 12 hours

---

## 18. Headless/API Mode (Low Priority)

### Overview
JSON API for headless CMS usage with decoupled frontends.

### API Endpoints

```typescript
// GET /api/theme/layout
app.get('/api/theme/layout', async (c) => {
  const theme = await getActiveTheme();
  const config = await loadThemeConfig(theme);

  return c.json({
    theme: config.name,
    layout: {
      header: await getComponentStructure('Header'),
      footer: await getComponentStructure('Footer'),
      sidebar: await getComponentStructure('Sidebar'),
    },
    settings: await getThemeCustomSettings(theme),
  });
});

// GET /api/theme/render/:template
app.get('/api/theme/render/:template', async (c) => {
  const templateName = c.req.param('template');
  const context = c.req.query('context'); // home, post, page

  const template = await loadTemplate(templateName);
  const html = await template.render(context);

  return c.json({
    html,
    css: await getThemeCSS(),
    js: await getThemeJS(),
  });
});

// GET /api/theme/components
app.get('/api/theme/components', async (c) => {
  return c.json({
    components: [
      { name: 'Header', props: {...} },
      { name: 'Footer', props: {...} },
      { name: 'PostCard', props: {...} },
    ]
  });
});

// GET /api/theme/styles
app.get('/api/theme/styles', async (c) => {
  const theme = await getActiveTheme();
  const css = await loadThemeCSS(theme);

  return c.json({
    variables: extractCSSVariables(css),
    classes: extractCSSClasses(css),
  });
});
```

### Component Structure

```typescript
interface ComponentStructure {
  name: string;
  props: Record<string, PropDefinition>;
  slots?: string[];
  events?: string[];
}

async function getComponentStructure(componentName: string): Promise<ComponentStructure> {
  // Extract component metadata
  return {
    name: componentName,
    props: {
      site: { type: 'SiteData', required: true },
      custom: { type: 'Record<string, any>', required: true },
    },
    slots: ['default'],
  };
}
```

### Client Libraries

```typescript
// @lexcms/headless-client
export class LexCMSClient {
  constructor(private apiUrl: string, private apiKey: string) {}

  async getLayout() {
    return await this.fetch('/api/theme/layout');
  }

  async renderTemplate(template: string, context: any) {
    return await this.fetch(`/api/theme/render/${template}`, { context });
  }

  async getComponents() {
    return await this.fetch('/api/theme/components');
  }
}

// Usage in Next.js
import { LexCMSClient } from '@lexcms/headless-client';

const client = new LexCMSClient('https://api.lexcms.com', 'API_KEY');

export default async function HomePage() {
  const layout = await client.getLayout();
  const posts = await client.getPosts();

  return (
    <div>
      <Header {...layout.header} />
      <main>
        {posts.map(post => <PostCard key={post.id} {...post} />)}
      </main>
      <Footer {...layout.footer} />
    </div>
  );
}
```

### Estimated Implementation: 20 hours

---

## Implementation Priority & Timeline

### Phase 3 (Weeks 1-2): High Value UX
1. **Widget System** - 16h
2. **i18n System** - 12h
3. **Hot Reload** - 8h
4. **Live Preview** - 10h

**Total: 46 hours (6 days)**

### Phase 4 (Weeks 3-4): Advanced Features
5. **Visual Customizer** - 20h
6. **Multi-Theme Support** - 12h

**Total: 32 hours (4 days)**

### Phase 5 (Weeks 5-6): Ecosystem
7. **Marketplace MVP** - 30h
8. **Auto-Update** - 16h
9. **Headless API** - 20h

**Total: 66 hours (8 days)**

### Phase 6 (Week 7): Analytics
10. **A/B Testing** - 24h

**Total: 24 hours (3 days)**

---

## Grand Total

**Total Implementation Time: 168 hours (21 days)**

---

## Technology Stack

- **Backend**: Deno, TypeScript, Hono
- **Database**: SQLite (Drizzle ORM)
- **Frontend**: Vanilla JS (admin), SSR (themes)
- **Real-time**: WebSockets (hot reload)
- **File Processing**: Deno standard library
- **Validation**: Zod
- **Testing**: Deno test

---

## Testing Strategy

Each feature should include:
- Unit tests for services
- Integration tests for APIs
- E2E tests for UI flows
- Performance benchmarks
- Security audits

---

## Documentation Requirements

Each feature needs:
- API documentation
- User guide
- Developer guide
- Migration guide
- Video tutorials (for complex features)

---

## Success Metrics

- Widget System: > 10 built-in widgets, drag-and-drop < 300ms
- i18n: Support 10+ languages, < 5ms translation lookup
- Hot Reload: < 500ms from change to refresh
- Live Preview: < 2s initial load, smooth device switching
- Visual Customizer: < 100ms setting updates, undo/redo working
- Marketplace: > 50 themes in first 6 months
- Auto-Update: < 30s update time, 0% data loss
- A/B Testing: Statistical significance calculator, > 95% accuracy
- Multi-Theme: 0ms overhead for route matching
- Headless: < 100ms API response time, complete type safety

---

This blueprint provides a complete implementation guide for all remaining features. Each can be built incrementally and tested independently.
