# Guía de Desarrollo de Themes - LexCMS

## Índice

1. [Introducción](#introducción)
2. [Arquitectura del Sistema](#arquitectura-del-sistema)
3. [Crear tu Primer Theme](#crear-tu-primer-theme)
4. [Estructura de un Theme](#estructura-de-un-theme)
5. [Custom Settings](#custom-settings)
6. [Child Themes](#child-themes)
7. [Hooks y Filtros](#hooks-y-filtros)
8. [Widgets](#widgets)
9. [Internacionalización (i18n)](#internacionalización)
10. [Testing](#testing)
11. [Best Practices](#best-practices)
12. [API Reference](#api-reference)
13. [Troubleshooting](#troubleshooting)

---

## Introducción

LexCMS implementa un sistema de themes robusto inspirado en WordPress, con características avanzadas como:

- ✅ Sistema multi-theme con activación dinámica
- ✅ Child themes con herencia
- ✅ Custom settings configurables por theme
- ✅ Sistema de hooks y filtros extensible
- ✅ Widgets con drag & drop
- ✅ Internacionalización (i18n) con 15 idiomas
- ✅ Live preview y customizer visual
- ✅ Caching inteligente (70-90% mejora de performance)
- ✅ Validación robusta de themes

---

## Arquitectura del Sistema

### Componentes Principales

```
src/
├── themes/               # Directorio de themes
│   ├── default/         # Theme por defecto
│   ├── corporate/       # Theme corporativo
│   └── {tu-theme}/      # Tu theme custom
├── services/
│   ├── themeService.ts           # Gestión de themes
│   ├── themeCacheService.ts      # Caching
│   ├── themePreviewService.ts    # Preview functionality
│   └── themeCustomizerService.ts # Visual editor
└── admin/pages/
    ├── ThemesPage.tsx            # UI de gestión
    ├── ThemePreviewPage.tsx      # Preview con iframe
    └── ThemeCustomizerPage.tsx   # Editor visual
```

### Flujo de Carga de Themes

```
HTTP Request → Determinar template → Cargar theme activo →
Buscar template en jerarquía → Cargar desde caché o importar →
Cargar custom settings → Renderizar con props → HTML Response
```

---

## Crear tu Primer Theme

### Opción 1: CLI Generator (Recomendado)

```bash
deno task theme:create
```

El generador interactivo te guiará paso a paso:

1. Nombre del theme
2. Display name
3. Parent theme (opcional)
4. Features (dark mode, custom settings)
5. CSS framework (Tailwind, custom, none)

### Opción 2: Manual

```bash
mkdir -p src/themes/mi-theme/{templates,partials,assets/css,locales}
cd src/themes/mi-theme
```

Crear `theme.json`:

```json
{
  "name": "mi-theme",
  "displayName": "Mi Theme Increíble",
  "version": "1.0.0",
  "description": "Un theme personalizado para mi sitio",
  "author": {
    "name": "Tu Nombre",
    "email": "tu@email.com",
    "url": "https://tusitioweb.com"
  },
  "license": "MIT",
  "config": {
    "posts_per_page": 10
  },
  "supports": {
    "comments": true,
    "widgets": true,
    "menus": ["header", "footer"]
  }
}
```

---

## Estructura de un Theme

### Anatomía Completa

```
mi-theme/
├── theme.json              # Configuración principal
├── templates/              # Templates de página
│   ├── home.tsx           # Homepage
│   ├── blog.tsx           # Listado de blog
│   ├── post.tsx           # Post individual
│   ├── page.tsx           # Página individual
│   ├── category.tsx       # Archivo de categoría
│   └── Layout.tsx         # Wrapper HTML base
├── partials/              # Componentes reutilizables
│   ├── Header.tsx
│   ├── Footer.tsx
│   ├── PostCard.tsx
│   └── Sidebar.tsx
├── helpers/               # Funciones helper
│   └── index.ts
├── assets/                # Assets estáticos
│   ├── css/
│   │   └── main.css
│   ├── js/
│   │   └── main.js
│   └── images/
│       └── screenshot-desktop.jpg
└── locales/               # Traducciones
    ├── en.json
    └── es.json
```

### Template Hierarchy

LexCMS usa un sistema de jerarquía de templates similar a WordPress:

```
POST:
post-{slug}.tsx → post-{id}.tsx → post.tsx → single.tsx → index.tsx

PAGE:
page-{slug}.tsx → page-{id}.tsx → page.tsx → single.tsx → index.tsx

HOME:
front-page.tsx → home.tsx → index.tsx

CATEGORY:
category-{slug}.tsx → category.tsx → archive.tsx → index.tsx
```

### Ejemplo de Template: home.tsx

```tsx
import { html } from "hono/html";
import type { HomeTemplateProps } from "../sdk/types.ts";
import { t } from "../sdk/i18n.ts";

export const HomeTemplate = (props: HomeTemplateProps) => {
  const { site, custom, featuredPosts, menu } = props;

  return html`
    <!DOCTYPE html>
    <html lang="${site.language || 'es'}">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>${site.name} - ${site.tagline}</title>
        <link rel="stylesheet" href="/themes/mi-theme/assets/css/main.css">
      </head>
      <body>
        <header>
          <h1>${site.name}</h1>
          <nav>
            ${menu.items.map(item => html`
              <a href="${item.url}">${item.title}</a>
            `)}
          </nav>
        </header>

        <main>
          <h2>${t('blog.latest_posts')}</h2>
          ${featuredPosts.map(post => html`
            <article>
              <h3><a href="/blog/${post.slug}">${post.title}</a></h3>
              <time>${t('blog.posted_on', { date: post.publishedAt })}</time>
              <p>${post.excerpt}</p>
              <a href="/blog/${post.slug}">${t('blog.read_more')}</a>
            </article>
          `)}
        </main>

        <footer>
          <p>${t('footer.copyright', { year: new Date().getFullYear(), siteName: site.name })}</p>
        </footer>
      </body>
    </html>
  `;
};

export default HomeTemplate;
```

---

## Custom Settings

Los custom settings permiten a los usuarios configurar tu theme sin tocar código.

### Tipos Soportados

```typescript
// text - Campo de texto simple
"site_tagline": {
  "type": "text",
  "label": "Tagline del sitio",
  "default": "Mi sitio increíble",
  "group": "branding"
}

// textarea - Texto multilínea
"footer_text": {
  "type": "textarea",
  "label": "Texto del footer",
  "default": "Copyright 2024",
  "group": "footer"
}

// number - Número con validación
"posts_per_page": {
  "type": "number",
  "label": "Posts por página",
  "default": 10,
  "min": 1,
  "max": 50,
  "group": "blog"
}

// color - Selector de color
"primary_color": {
  "type": "color",
  "label": "Color primario",
  "default": "#3b82f6",
  "group": "colors"
}

// select - Dropdown
"header_style": {
  "type": "select",
  "label": "Estilo del header",
  "options": ["minimal", "large", "centered"],
  "default": "minimal",
  "group": "design"
}

// boolean - Toggle
"show_sidebar": {
  "type": "boolean",
  "label": "Mostrar sidebar",
  "default": true,
  "group": "layout"
}

// range - Slider
"font_size": {
  "type": "range",
  "label": "Tamaño de fuente",
  "default": 16,
  "min": 12,
  "max": 24,
  "step": 1,
  "group": "typography"
}

// url - URL con validación
"logo_url": {
  "type": "url",
  "label": "URL del logo",
  "default": "",
  "group": "branding"
}

// image_upload - Selector de imagen
"hero_image": {
  "type": "image_upload",
  "label": "Imagen de hero",
  "default": "",
  "group": "homepage"
}
```

### Uso en Templates

```tsx
export const HomeTemplate = (props: HomeTemplateProps) => {
  const { custom } = props;

  return html`
    <div style="background-color: ${custom.primary_color}">
      <h1 style="font-size: ${custom.font_size}px">
        ${custom.site_tagline}
      </h1>
      ${custom.show_sidebar ? html`<aside>...</aside>` : ""}
    </div>
  `;
};
```

---

## Child Themes

Los child themes permiten heredar de otro theme y sobrescribir solo lo necesario.

### Crear un Child Theme

`theme.json`:

```json
{
  "name": "corporate-child",
  "displayName": "Corporate Child",
  "version": "1.0.0",
  "description": "Child theme de Corporate",
  "parent": "corporate",
  "author": {...}
}
```

### Jerarquía de Archivos

```
corporate-child/
├── partials/
│   └── Header.tsx     (override)
└── assets/
    └── css/
        └── custom.css (adicional)

Hereda de corporate:
├── templates/home.tsx
├── partials/Footer.tsx
└── helpers/
```

### Validación de Child Themes

El sistema valida automáticamente:
- Parent theme existe
- No hay referencias circulares
- Máximo 5 niveles de herencia

---

## Hooks y Filtros

Sistema extensible para modificar comportamiento sin editar código core.

### Hooks Disponibles

```typescript
// Lifecycle
THEME_INIT                    // Al inicializar theme
THEME_ACTIVATED              // Después de activar
THEME_DEACTIVATED           // Antes de desactivar

// Rendering
BEFORE_TEMPLATE_RENDER      // Antes de renderizar template
AFTER_TEMPLATE_RENDER       // Después de renderizar
POST_CONTENT                 // Filtrar contenido de post
POST_EXCERPT                 // Filtrar excerpt
POST_TITLE                   // Filtrar título

// UI
HEADER                       // Modificar HTML del header
FOOTER                       // Modificar HTML del footer
CUSTOM_CSS                   // Inyectar CSS custom
CUSTOM_JS                    // Inyectar JS custom

// Data
MENU_ITEMS                   // Filtrar items de menú
WIDGET_AREAS                 // Filtrar áreas de widgets
```

### Ejemplo de Uso

```typescript
import { registerFilter, registerAction } from "../sdk/hooks.ts";

// Modificar excerpt
registerFilter("POST_EXCERPT", (excerpt: string) => {
  return excerpt + "... [Leer más]";
}, 10);

// Añadir clase CSS al body
registerAction("HEADER", () => {
  console.log("Header rendered");
}, 10);

// Filtrar items de menú
registerFilter("MENU_ITEMS", (items: MenuItem[]) => {
  return items.filter(item => item.visible);
}, 10);
```

---

## Widgets

Sistema de widgets con drag & drop para áreas customizables.

### Definir Áreas de Widgets

`theme.json`:

```json
{
  "supports": {
    "widgets": true,
    "widgetAreas": [
      {
        "id": "sidebar-primary",
        "name": "Primary Sidebar",
        "description": "Main sidebar area"
      },
      {
        "id": "footer-1",
        "name": "Footer Column 1"
      }
    ]
  }
}
```

### Renderizar en Template

```tsx
import { renderWidgetArea } from "../sdk/widgets.ts";

export const BlogTemplate = async (props) => {
  return html`
    <main>
      ${/* Contenido principal */}
    </main>
    <aside>
      ${await renderWidgetArea("sidebar-primary", {
        site: props.site,
        theme: props.activeTheme
      })}
    </aside>
  `;
};
```

---

## Internacionalización

Soporte completo para múltiples idiomas.

### Crear Traducciones

`locales/es.json`:

```json
{
  "blog": {
    "title": "Blog",
    "read_more": "Leer más",
    "posted_on": "Publicado el {date}",
    "comments": "{count, plural, =0 {Sin comentarios} one {1 comentario} other {# comentarios}}"
  }
}
```

`locales/en.json`:

```json
{
  "blog": {
    "title": "Blog",
    "read_more": "Read more",
    "posted_on": "Posted on {date}",
    "comments": "{count, plural, =0 {No comments} one {1 comment} other {# comments}}"
  }
}
```

### Uso en Templates

```tsx
import { t, tn } from "../sdk/i18n.ts";

// Traducción simple
t('blog.title')  // "Blog"

// Con variables
t('blog.posted_on', { date: '2024-01-15' })  // "Posted on 2024-01-15"

// Plurales
tn('comment', 'comments', 5)  // "5 comments"
```

---

## Testing

### Validar Theme

```bash
deno task theme:validate --theme mi-theme
```

Valida:
- theme.json existe y es válido
- Templates requeridos existen
- Parent theme (si es child)
- Versiones de requisitos
- Custom settings bien definidos

### Tests Básicos

```typescript
import { assertEquals } from "https://deno.land/std/testing/asserts.ts";
import * as themeService from "../services/themeService.ts";

Deno.test("Load theme config", async () => {
  const config = await themeService.loadThemeConfig("mi-theme");
  assertEquals(config.name, "mi-theme");
});

Deno.test("Validate theme structure", async () => {
  const validation = await themeService.validateTheme("mi-theme");
  assertEquals(validation.valid, true);
});
```

---

## Best Practices

### 1. Performance

```typescript
// ✅ Usar caching
const cached = themeCacheService.getCachedTemplate(path);

// ✅ Cargar en paralelo
const [menu, categories] = await Promise.all([
  getMenu("main"),
  getCategories()
]);

// ❌ Evitar queries innecesarias
```

### 2. Seguridad

```typescript
// ✅ Escapar HTML
import { escapeAttr } from "../sdk/helpers.ts";

html`<div class="${escapeAttr(userInput)}">...</div>`

// ❌ No insertar directamente user input
html`<div class="${userInput}">...</div>`  // Vulnerable a XSS
```

### 3. Accesibilidad

```html
<!-- ✅ Semántica correcta -->
<nav aria-label="Main navigation">
  <ul>
    <li><a href="/">Home</a></li>
  </ul>
</nav>

<!-- ✅ Atributos ARIA -->
<button aria-label="Close menu" aria-expanded="false">
```

### 4. Responsive Design

```css
/* Mobile-first approach */
.container {
  width: 100%;
}

@media (min-width: 768px) {
  .container {
    max-width: 720px;
  }
}
```

---

## API Reference

### themeService

```typescript
// Obtener theme activo
const theme = await getActiveTheme();

// Cargar configuración
const config = await loadThemeConfig(themeName);

// Activar theme
await activateTheme(themeName);

// Validar theme
const validation = await validateTheme(themeName);

// Custom settings
const settings = await getThemeCustomSettings(themeName);
await updateThemeCustomSettings(themeName, { key: value });

// Child themes
const isChild = await isChildTheme(themeName);
const parent = await getParentTheme(themeName);
const hierarchy = await getThemeHierarchy(themeName);
```

### themeCacheService

```typescript
// Invalidar caché
invalidateThemeCache(themeName);
invalidateAll();

// Estadísticas
const stats = getCacheStats();

// Pre-calentar
await warmupCache(themeName);
```

---

## Troubleshooting

### Theme no se activa

1. Verificar validación: `deno task theme:validate --theme mi-theme`
2. Revisar logs de consola
3. Verificar que templates requeridos existen (home, blog, post, page)

### Templates no se encuentran

- Verificar jerarquía de templates
- Check si existe `index.tsx` como fallback
- Revisar child theme parent existe

### Custom settings no aparecen

- Verificar `theme.json` tiene `config.custom`
- Check tipos de settings son válidos
- Validar sintaxis JSON

### Performance lenta

- Activar caching: `await warmupCache()`
- Minimizar queries a DB
- Usar caching de common data

---

## Recursos Adicionales

- [Theme SDK Documentation](../themes/sdk/README.md)
- [Hooks Guide](../themes/sdk/HOOKS_GUIDE.md)
- [Child Themes Guide](./CHILD_THEMES_GUIDE.md)
- [Widgets Guide](./WIDGETS_GUIDE.md)

---

**¿Necesitas ayuda?** Abre un issue en GitHub o consulta la documentación completa.
