# Tailwind CSS en LexCMS

## Descripción

LexCMS utiliza Tailwind CSS v3.4 para el sistema de diseño del frontend público. El CSS se compila usando el Tailwind standalone CLI que se descarga automáticamente la primera vez que ejecutas el build.

## Estructura de archivos

```
├── tailwind.config.js           # Configuración de Tailwind
├── scripts/build-css.ts          # Script de build automático
├── .bin/tailwindcss             # CLI standalone (git ignored)
└── src/themes/default/assets/css/
    ├── tailwind.css             # Archivo fuente con @layer
    └── main.css                 # Archivo compilado (git ignored)
```

## Comandos disponibles

### Build CSS (una vez)
```bash
deno task css:build
```

### Watch mode (desarrollo)
```bash
deno task css:watch
```

### Build minificado (producción)
```bash
deno task css:minify
```

### Desarrollo con CSS watch
```bash
# Terminal 1: Watch CSS
deno task css:watch

# Terminal 2: Run server
deno task dev
```

## Arquitectura del CSS

El archivo `tailwind.css` está organizado en 3 layers principales:

### 1. @layer base
Estilos base para elementos HTML:
- Typography (h1-h6, p, a)
- Forms (inputs, buttons)
- Reset de estilos

### 2. @layer components
Componentes reutilizables con clases semánticas:
- `.container` - Contenedor responsive
- `.btn-primary`, `.btn-secondary`, `.btn-outline` - Botones
- `.card`, `.card-hover` - Tarjetas
- `.badge`, `.badge-primary` - Badges
- `.site-header`, `.site-footer` - Layout
- `.post-card-*` - Componentes de posts
- `.post-full-*` - Post individual
- `.widget` - Widgets de sidebar
- Y más...

### 3. @layer utilities
Utilidades personalizadas:
- `.text-balance` - Text wrapping balanceado
- `.scrollbar-thin` - Scrollbar delgado
- `.scrollbar-none` - Ocultar scrollbar

## Uso en templates

Los templates TSX actuales ya usan las clases de componentes definidas:

```tsx
// Ejemplo: index.tsx
<header class="site-header">
  <div class="container">
    <h1 class="site-title">{site.name}</h1>
  </div>
</header>

<article class="post-card">
  <div class="post-card-content">
    <h2 class="post-card-title">
      <a href={`/${post.slug}`}>{post.title}</a>
    </h2>
  </div>
</article>
```

## Personalización

### Colores en tailwind.config.js

El archivo de configuración permite personalizar:
- Content paths (dónde buscar clases)
- Dark mode (class-based)
- Theme extensions
- Plugins

### Agregar nuevas clases de componentes

Edita `src/themes/default/assets/css/tailwind.css`:

```css
@layer components {
  .mi-nuevo-componente {
    @apply bg-blue-500 text-white p-4 rounded-lg;
  }
}
```

Luego compila:
```bash
deno task css:build
```

## Optimización

### Purging en producción

Tailwind automáticamente purga (elimina) clases CSS no utilizadas. El `content` en `tailwind.config.js` define qué archivos escanear:

```javascript
content: [
  "./src/themes/**/*.{tsx,ts,html}",
  "./src/routes/frontend.ts",
],
```

### Minificación

Para producción, usa:
```bash
deno task css:minify
```

Esto genera un archivo CSS minificado más pequeño (~29KB → ~15KB aproximadamente).

## Dark Mode

El theme soporta dark mode usando la estrategia `class`:

```tsx
// Las clases dark: se activan cuando <html> o <body> tiene class="dark"
<div class="bg-white dark:bg-gray-900">
  <p class="text-gray-900 dark:text-white">Texto</p>
</div>
```

## Integración con Settings

El theme puede leer configuraciones desde la base de datos:

```typescript
const custom = await themeHelpers.getCustomSettings();
const primaryColor = custom.primary_color || "#0066cc";

// En el template
<div style="--primary-color: ${primaryColor}">
```

## Troubleshooting

### El CSS no se actualiza
1. Verifica que el watch esté corriendo: `deno task css:watch`
2. Fuerza un rebuild: `deno task css:build`
3. Limpia el cache del navegador

### Clases no funcionan
1. Verifica que la clase esté en el archivo compilado `main.css`
2. Revisa que el archivo fuente esté en el `content` de `tailwind.config.js`
3. Si es una clase custom, verifica que esté en `@layer components` o `@layer utilities`

### Error "class does not exist"
- Para clases de plugins (como `prose`), instala el plugin:
```javascript
// tailwind.config.js
plugins: [
  require('@tailwindcss/typography'),
],
```

## Referencias

- [Tailwind CSS Docs](https://tailwindcss.com)
- [Tailwind CLI](https://tailwindcss.com/blog/standalone-cli)
- [Layer Directive](https://tailwindcss.com/docs/adding-custom-styles#using-css-and-layer)
- [Configuration](https://tailwindcss.com/docs/configuration)
