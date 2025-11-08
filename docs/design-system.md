# LexCMS Admin Panel - Sistema de Diseño Moderno

## Filosofía de Diseño

**Minimalista** - Menos es más. Enfoque en contenido y funcionalidad sin distracciones visuales.

**Moderno** - Interfaces limpias, transiciones suaves, microinteracciones sutiles.

**Accesible** - Contraste adecuado, tamaños legibles, navegación clara.

---

## 🎨 Paleta de Colores

### Colores Principales

```css
/* Neutros - Base minimalista */
--neutral-50: #fafafa;
--neutral-100: #f5f5f5;
--neutral-200: #e5e5e5;
--neutral-300: #d4d4d4;
--neutral-400: #a3a3a3;
--neutral-500: #737373;
--neutral-600: #525252;
--neutral-700: #404040;
--neutral-800: #262626;
--neutral-900: #171717;
--neutral-950: #0a0a0a;

/* Accent - Azul minimalista (cambio de púrpura a azul para modernidad) */
--accent-50: #eff6ff;
--accent-100: #dbeafe;
--accent-200: #bfdbfe;
--accent-300: #93c5fd;
--accent-400: #60a5fa;
--accent-500: #3b82f6;  /* Primary */
--accent-600: #2563eb;  /* Primary Dark */
--accent-700: #1d4ed8;
--accent-800: #1e40af;
--accent-900: #1e3a8a;

/* Semánticos */
--success: #10b981;
--warning: #f59e0b;
--error: #ef4444;
--info: #06b6d4;
```

### Modo Oscuro

```css
/* Dark Mode - Tonos más sutiles y modernos */
--dark-bg-primary: #0f0f0f;
--dark-bg-secondary: #1a1a1a;
--dark-bg-tertiary: #252525;
--dark-border: #2a2a2a;
--dark-text-primary: #fafafa;
--dark-text-secondary: #a3a3a3;
```

---

## 📐 Espaciado y Tamaños

### Sistema de Espaciado (basado en 4px)

```
xs: 0.25rem (4px)
sm: 0.5rem (8px)
md: 1rem (16px)
lg: 1.5rem (24px)
xl: 2rem (32px)
2xl: 3rem (48px)
3xl: 4rem (64px)
```

### Bordes Redondeados

```css
--radius-sm: 0.375rem;  /* 6px - inputs, pequeños elementos */
--radius-md: 0.5rem;    /* 8px - cards, botones */
--radius-lg: 0.75rem;   /* 12px - modales, contenedores grandes */
--radius-xl: 1rem;      /* 16px - elementos destacados */
--radius-full: 9999px;  /* Círculos y pills */
```

### Sombras

```css
/* Sombras sutiles y modernas */
--shadow-xs: 0 1px 2px 0 rgb(0 0 0 / 0.05);
--shadow-sm: 0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1);
--shadow-md: 0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1);
--shadow-lg: 0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1);
--shadow-xl: 0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1);

/* Sombras de color para acentos */
--shadow-accent: 0 4px 14px 0 rgb(59 130 246 / 0.15);
```

---

## 🔤 Tipografía

### Fuentes

```css
/* Sistema de fuentes moderno y limpio */
--font-sans: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto',
             'Oxygen', 'Ubuntu', 'Cantarell', sans-serif;

/* Fuente monoespaciada para código */
--font-mono: 'JetBrains Mono', 'Fira Code', 'Consolas', monospace;
```

### Escala Tipográfica

```css
--text-xs: 0.75rem;     /* 12px */
--text-sm: 0.875rem;    /* 14px */
--text-base: 1rem;      /* 16px */
--text-lg: 1.125rem;    /* 18px */
--text-xl: 1.25rem;     /* 20px */
--text-2xl: 1.5rem;     /* 24px */
--text-3xl: 1.875rem;   /* 30px */
--text-4xl: 2.25rem;    /* 36px */

/* Pesos */
--font-normal: 400;
--font-medium: 500;
--font-semibold: 600;
--font-bold: 700;
```

---

## 🎯 Componentes Principales

### Sidebar

**Características:**
- Fondo sólido minimalista (sin gradiente)
- Items con hover sutil
- Indicador activo simple (borde izquierdo)
- Iconos outline en lugar de filled
- Espaciado generoso

**Estados:**
- Default: bg-white dark:bg-neutral-950
- Hover: bg-neutral-50 dark:bg-neutral-900
- Active: border-l-2 border-accent-500 bg-accent-50 dark:bg-accent-950

### Header

**Características:**
- Altura fija de 64px
- Borde inferior sutil
- Search bar destacado
- Acciones alineadas a la derecha

**Elementos:**
- Logo/Brand
- Global Search
- Notificaciones
- Tema Toggle
- User Avatar + Dropdown

### Cards

**Características:**
- Bordes suaves (radius-lg)
- Sombra muy sutil (shadow-sm)
- Padding consistente
- Hover effect opcional

```html
<div class="bg-white dark:bg-neutral-900 rounded-lg shadow-sm p-6
            hover:shadow-md transition-shadow duration-200">
  <!-- contenido -->
</div>
```

### Botones

**Primary:**
```html
<button class="px-4 py-2 bg-accent-500 text-white rounded-md
               hover:bg-accent-600 transition-colors duration-200
               font-medium text-sm shadow-sm hover:shadow-md">
  Acción Principal
</button>
```

**Secondary:**
```html
<button class="px-4 py-2 bg-white dark:bg-neutral-800
               border border-neutral-300 dark:border-neutral-700
               text-neutral-700 dark:text-neutral-300 rounded-md
               hover:bg-neutral-50 dark:hover:bg-neutral-700
               transition-colors duration-200 font-medium text-sm">
  Acción Secundaria
</button>
```

**Ghost:**
```html
<button class="px-4 py-2 text-neutral-700 dark:text-neutral-300
               hover:bg-neutral-100 dark:hover:bg-neutral-800
               rounded-md transition-colors duration-200 font-medium text-sm">
  Acción Terciaria
</button>
```

### Forms

**Input:**
```html
<input type="text"
       class="w-full px-3 py-2 bg-white dark:bg-neutral-900
              border border-neutral-300 dark:border-neutral-700
              rounded-md text-sm
              focus:outline-none focus:ring-2 focus:ring-accent-500
              focus:border-transparent
              placeholder:text-neutral-400 dark:placeholder:text-neutral-600" />
```

### Tables

**Características:**
- Bordes sutiles
- Hover row con bg-neutral-50
- Headers con bg-neutral-100
- Padding generoso para legibilidad

### Badges

**Status Badges:**
```html
<!-- Success -->
<span class="inline-flex items-center px-2.5 py-0.5 rounded-full
             text-xs font-medium bg-green-100 text-green-800
             dark:bg-green-900/30 dark:text-green-400">
  Publicado
</span>

<!-- Warning -->
<span class="inline-flex items-center px-2.5 py-0.5 rounded-full
             text-xs font-medium bg-yellow-100 text-yellow-800
             dark:bg-yellow-900/30 dark:text-yellow-400">
  Borrador
</span>

<!-- Error -->
<span class="inline-flex items-center px-2.5 py-0.5 rounded-full
             text-xs font-medium bg-red-100 text-red-800
             dark:bg-red-900/30 dark:text-red-400">
  Inactivo
</span>
```

---

## 🌗 Modo Oscuro

### Estrategia

1. **Fondos oscuros pero no negros puros** - Usar neutral-950 como base
2. **Contraste reducido** - Borderes más sutiles
3. **Colores desaturados** - Versiones más suaves de los colores principales
4. **Transiciones suaves** - Cambio gradual entre modos

### Implementación

```html
<!-- Tailwind dark mode -->
<html class="dark">
  <!-- Los elementos usan dark: prefijo -->
  <div class="bg-white dark:bg-neutral-950">
  </div>
</html>
```

---

## ⚡ Animaciones y Transiciones

### Principios

- **Rápidas pero perceptibles** - 150-200ms
- **Suaves** - ease-in-out, cubic-bezier
- **Consistentes** - Misma duración para elementos similares
- **Sutiles** - No distraer del contenido

### Transiciones Comunes

```css
/* Hover states */
transition: all 200ms ease-in-out;

/* Modales y overlays */
transition: opacity 300ms ease-in-out, transform 300ms ease-in-out;

/* Sidebar toggle */
transition: transform 250ms cubic-bezier(0.4, 0, 0.2, 1);
```

---

## 📱 Responsive Design

### Breakpoints

```css
sm: 640px   /* Móvil grande */
md: 768px   /* Tablet */
lg: 1024px  /* Desktop pequeño */
xl: 1280px  /* Desktop */
2xl: 1536px /* Desktop grande */
```

### Estrategia

1. **Mobile First** - Diseñar primero para móvil
2. **Sidebar Collapsible** - Ocultar en móvil, overlay en tablet
3. **Grid Adaptativo** - 1 col → 2 cols → 4 cols
4. **Touch Targets** - Mínimo 44x44px en móvil

---

## 🎨 Iconografía

### Sistema de Iconos

**Heroicons Outline** - Para navegación y acciones generales
**Heroicons Solid** - Para estados activos y elementos destacados

### Tamaños

```
sm: 16px (w-4 h-4)
md: 20px (w-5 h-5)
lg: 24px (w-6 h-6)
xl: 32px (w-8 h-8)
```

---

## 🔒 Accesibilidad

### Contraste

- **Texto normal:** Mínimo 4.5:1
- **Texto grande:** Mínimo 3:1
- **Elementos UI:** Mínimo 3:1

### Focus States

Todos los elementos interactivos deben tener un estado de focus visible:

```css
focus:outline-none focus:ring-2 focus:ring-accent-500 focus:ring-offset-2
```

### ARIA Labels

Usar aria-label para elementos sin texto visible:

```html
<button aria-label="Cerrar modal">
  <svg>...</svg>
</button>
```

---

## 📊 Grid System

### Dashboard Grid

```html
<!-- Stats Cards: 4 columnas en desktop -->
<div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
  <!-- cards -->
</div>

<!-- Content Grid: 2 columnas -->
<div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
  <!-- contenido -->
</div>

<!-- Sidebar Layout -->
<div class="grid grid-cols-1 lg:grid-cols-12 gap-6">
  <aside class="lg:col-span-3"><!-- sidebar --></aside>
  <main class="lg:col-span-9"><!-- main --></main>
</div>
```

---

## 🎯 Mejoras Específicas vs Diseño Actual

### Cambios Principales

1. **Color primario:** Púrpura → Azul (más moderno y profesional)
2. **Sidebar:** Gradiente oscuro → Fondo sólido claro/oscuro
3. **Sombras:** Más sutiles y consistentes
4. **Espaciado:** Más generoso y respiración visual
5. **Bordes:** Más redondeados para modernidad
6. **Tipografía:** Inter en lugar de sistema default
7. **Iconos:** Outline en lugar de filled

### Elementos a Mantener

- Sistema de navegación por grupos
- Estructura de 3 paneles (sidebar, header, content)
- Modo oscuro
- Responsive design
- Componentes existentes (tables, forms, cards)

---

## 🚀 Próximos Pasos

1. Implementar nuevo sistema de colores en Tailwind config
2. Crear nuevos componentes base
3. Rediseñar AdminLayout
4. Actualizar páginas principales (Dashboard, Posts, Settings)
5. Testing en diferentes dispositivos y navegadores
