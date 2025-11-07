# Internationalization (i18n) Guide

Complete guide for multi-language support in LexCMS themes.

## Overview

The i18n system allows you to create multilingual themes with support for:

- Multiple languages
- RTL (Right-to-Left) languages
- Locale-specific formatting (dates, numbers, currency)
- Translation file management
- Automatic fallback to default locale

## Supported Locales

LexCMS includes built-in support for 15 locales:

### LTR Languages
- **English (en)** - English
- **Spanish (es)** - Español
- **French (fr)** - Français
- **German (de)** - Deutsch
- **Italian (it)** - Italiano
- **Portuguese (pt)** - Português
- **Japanese (ja)** - 日本語
- **Chinese (zh)** - 中文
- **Korean (ko)** - 한국어
- **Russian (ru)** - Русский
- **Hindi (hi)** - हिन्दी

### RTL Languages
- **Arabic (ar)** - العربية
- **Hebrew (he)** - עברית
- **Persian (fa)** - فارسی
- **Urdu (ur)** - اردو

## Creating Translation Files

### 1. Create Locales Directory

```bash
mkdir -p src/themes/my-theme/locales
```

### 2. Create Translation Files

Create a JSON file for each supported language:

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
  "comments": {
    "one": "{count} Comment",
    "other": "{count} Comments",
    "no_comments": "No comments yet"
  },
  "newsletter": {
    "title": "Subscribe to our Newsletter",
    "email_placeholder": "Enter your email",
    "subscribe": "Subscribe"
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
  },
  "comments": {
    "one": "{count} Comentario",
    "other": "{count} Comentarios",
    "no_comments": "Aún no hay comentarios"
  },
  "newsletter": {
    "title": "Suscríbete a nuestro Newsletter",
    "email_placeholder": "Ingresa tu email",
    "subscribe": "Suscribirse"
  }
}
```

## Theme Configuration

Add i18n support to your theme.json:

```json
{
  "name": "my-theme",
  "version": "1.0.0",
  "supports": {
    "i18n": true,
    "locales": ["en", "es", "fr", "ar"],
    "rtl": true
  },
  "defaultLocale": "en"
}
```

## Using Translations in Templates

### Basic Translation

```typescript
import { html, t } from "../sdk/index.ts";

export const PostTemplate = (props) => {
  return html`
    <article>
      <h1>${props.post.title}</h1>
      <a href="#">${t('theme.read_more')}</a>
    </article>
  `;
};
```

### Translation with Parameters

```typescript
import { html, t, formatDate } from "../sdk/index.ts";

export const PostTemplate = (props) => {
  const { post } = props;

  return html`
    <article>
      <time>
        ${t('theme.posted_on', {
          date: formatDate(post.publishedAt)
        })}
      </time>
      <span>
        ${t('theme.by_author', {
          author: post.author.name
        })}
      </span>
    </article>
  `;
};
```

### Pluralization

```typescript
import { html, tn } from "../sdk/index.ts";

export const PostTemplate = (props) => {
  const commentCount = props.post.commentCount;

  return html`
    <div class="comments">
      ${tn('comments', commentCount)}
    </div>
  `;
};
```

## RTL Support

### Check if Locale is RTL

```typescript
import { html, isRTL, getDir } from "../sdk/index.ts";

export const BaseTemplate = (props) => {
  return html`
    <html dir="${getDir()}">
      <body>
        ${isRTL()
          ? html`<div>This is RTL</div>`
          : html`<div>This is LTR</div>`
        }
      </body>
    </html>
  `;
};
```

### HTML Attributes for i18n

```typescript
import { html, getLangAttr, getDirAttr } from "../sdk/index.ts";

export const BaseTemplate = (props) => {
  return html`
    <!DOCTYPE html>
    <html lang="${getLangAttr()}" dir="${getDirAttr()}">
      <head>
        <meta charset="UTF-8">
        <title>${props.site.name}</title>
      </head>
      <body>
        <!-- Your content -->
      </body>
    </html>
  `;
};
```

### RTL-Aware CSS Classes

```typescript
import { html, getRTLClass } from "../sdk/index.ts";

export const SidebarTemplate = (props) => {
  return html`
    <aside class="${getRTLClass('sidebar-left')}">
      <!-- Automatically becomes 'sidebar-right' in RTL -->
    </aside>
  `;
};
```

## Loading Translations

### Automatic Loading

Translations are automatically loaded when a theme is activated. You can also manually load them:

```typescript
import { loadThemeTranslations, setLocale } from "../sdk/index.ts";

// Load translations for Spanish
await loadThemeTranslations('my-theme', 'es');
setLocale('es', 'my-theme');
```

### Get Available Locales for Theme

```typescript
import { getThemeLocales } from "../sdk/index.ts";

const locales = await getThemeLocales('my-theme');
console.log(locales); // ['en', 'es', 'fr', 'ar']
```

## Locale-Specific Formatting

### Format Dates

```typescript
import { html, formatLocalizedDate } from "../sdk/index.ts";

export const PostTemplate = (props) => {
  const { post } = props;

  return html`
    <time>
      ${formatLocalizedDate(post.publishedAt)}
    </time>
  `;
};

// English: "January 1, 2024"
// Spanish: "1 de enero de 2024"
// Arabic: "١ يناير ٢٠٢٤"
```

### Format Numbers

```typescript
import { html, formatLocalizedNumber } from "../sdk/index.ts";

export const StatsTemplate = (props) => {
  return html`
    <div>
      Views: ${formatLocalizedNumber(1234567)}
    </div>
  `;
};

// English: "1,234,567"
// German: "1.234.567"
// French: "1 234 567"
```

### Format Currency

```typescript
import { html, formatCurrency } from "../sdk/index.ts";

export const PriceTemplate = (props) => {
  return html`
    <div>
      Price: ${formatCurrency(99.99, 'USD')}
    </div>
  `;
};

// English: "$99.99"
// German: "99,99 $"
// Japanese: "$99.99"
```

## Advanced Features

### Check if Translation Exists

```typescript
import { hasTranslation, t } from "../sdk/index.ts";

const customText = hasTranslation('theme.custom_text')
  ? t('theme.custom_text')
  : 'Default text';
```

### Get All Translations

```typescript
import { getAllTranslations } from "../sdk/index.ts";

const allTranslations = getAllTranslations();
console.log(allTranslations);
// { theme: {...}, comments: {...}, ... }
```

### Get Locale Information

```typescript
import { getLocaleConfig, getAvailableLocales } from "../sdk/index.ts";

// Get info about specific locale
const arConfig = getLocaleConfig('ar');
console.log(arConfig);
// {
//   code: 'ar',
//   name: 'Arabic',
//   nativeName: 'العربية',
//   direction: 'rtl'
// }

// Get all available locales
const locales = getAvailableLocales();
locales.forEach(locale => {
  console.log(`${locale.name} (${locale.nativeName}) - ${locale.direction}`);
});
```

## Complete Template Example

```typescript
import {
  html,
  t,
  tn,
  formatLocalizedDate,
  getLangAttr,
  getDirAttr,
  isRTL
} from "../sdk/index.ts";
import type { BlogTemplateProps } from "../sdk/index.ts";

export const BlogTemplate = async (props: BlogTemplateProps) => {
  const { site, posts, pagination } = props;

  return html`
    <!DOCTYPE html>
    <html lang="${getLangAttr()}" dir="${getDirAttr()}">
      <head>
        <meta charset="UTF-8">
        <title>${site.name} - ${t('theme.blog')}</title>
        ${isRTL()
          ? html`<link rel="stylesheet" href="/css/rtl.css">`
          : ''
        }
      </head>
      <body>
        <header>
          <h1>${site.name}</h1>
          <nav>
            <a href="/">${t('theme.home')}</a>
            <a href="/blog">${t('theme.blog')}</a>
            <a href="/about">${t('theme.about')}</a>
          </nav>
        </header>

        <main>
          <h2>${t('theme.recent_posts')}</h2>

          ${posts.map(post => html`
            <article>
              <h3>${post.title}</h3>
              <time>
                ${t('theme.posted_on', {
                  date: formatLocalizedDate(post.publishedAt)
                })}
              </time>
              <span>
                ${t('theme.by_author', { author: post.author.name })}
              </span>
              <p>${post.excerpt}</p>
              <a href="/blog/${post.slug}">
                ${t('theme.read_more')}
              </a>
              <div class="meta">
                ${tn('comments', post.commentCount)}
              </div>
            </article>
          `)}
        </main>

        <footer>
          <p>
            ${t('footer.copyright', {
              year: new Date().getFullYear(),
              siteName: site.name
            })}
          </p>
        </footer>
      </body>
    </html>
  `;
};
```

## API Reference

### Translation Functions

| Function | Description | Example |
|----------|-------------|---------|
| `t(key, params?)` | Translate a key | `t('theme.read_more')` |
| `tn(key, count, params?)` | Translate with pluralization | `tn('comments', 5)` |
| `hasTranslation(key)` | Check if translation exists | `hasTranslation('theme.custom')` |
| `getAllTranslations()` | Get all translations | `getAllTranslations()` |

### Locale Functions

| Function | Description | Example |
|----------|-------------|---------|
| `setLocale(locale, theme?)` | Set current locale | `setLocale('es')` |
| `getLocale()` | Get current locale | `getLocale()` |
| `isRTL(locale?)` | Check if RTL | `isRTL()` |
| `getDir(locale?)` | Get text direction | `getDir()` |
| `getLocaleConfig(locale?)` | Get locale info | `getLocaleConfig('ar')` |
| `getAvailableLocales()` | Get all locales | `getAvailableLocales()` |

### HTML Attribute Helpers

| Function | Description | Example |
|----------|-------------|---------|
| `getLangAttr()` | Get lang attribute | `<html lang="${getLangAttr()}">` |
| `getDirAttr(locale?)` | Get dir attribute | `<html dir="${getDirAttr()}">` |

### Formatting Functions

| Function | Description | Example |
|----------|-------------|---------|
| `formatLocalizedDate(date, locale?, options?)` | Format date | `formatLocalizedDate(new Date())` |
| `formatLocalizedNumber(num, locale?, options?)` | Format number | `formatLocalizedNumber(1234)` |
| `formatCurrency(amount, currency, locale?)` | Format currency | `formatCurrency(99.99, 'USD')` |

### Theme Functions

| Function | Description | Example |
|----------|-------------|---------|
| `loadThemeTranslations(theme, locale)` | Load translations | `await loadThemeTranslations('my-theme', 'es')` |
| `getThemeLocales(theme)` | Get theme locales | `await getThemeLocales('my-theme')` |

## Best Practices

### 1. Use Semantic Keys

```json
// ✅ Good - Descriptive keys
{
  "theme": {
    "read_more": "Read More",
    "posted_on": "Posted on {date}"
  }
}

// ❌ Bad - Generic keys
{
  "theme": {
    "btn1": "Read More",
    "text1": "Posted on {date}"
  }
}
```

### 2. Group Related Translations

```json
{
  "theme": { /* General theme strings */ },
  "comments": { /* Comment-related strings */ },
  "newsletter": { /* Newsletter strings */ },
  "footer": { /* Footer strings */ }
}
```

### 3. Always Provide Fallback

```typescript
// ✅ Good - Has fallback
const text = hasTranslation('theme.custom')
  ? t('theme.custom')
  : 'Default text';

// ❌ Bad - No fallback
const text = t('theme.custom'); // Returns key if not found
```

### 4. Use Parameters for Dynamic Content

```json
// ✅ Good
{
  "theme": {
    "posted_on": "Posted on {date} by {author}"
  }
}

// ❌ Bad - Hard to translate
{
  "theme": {
    "posted": "Posted on",
    "by": "by"
  }
}
```

### 5. Test RTL Layout

```css
/* Add RTL-specific styles */
[dir="rtl"] .sidebar {
  float: right; /* Instead of left */
}

[dir="rtl"] .text {
  text-align: right; /* Instead of left */
}
```

## Troubleshooting

### Translations Not Loading

1. **Check file exists:**
   ```bash
   ls src/themes/my-theme/locales/
   ```

2. **Verify JSON is valid:**
   ```bash
   cat src/themes/my-theme/locales/en.json | jq .
   ```

3. **Load translations manually:**
   ```typescript
   await loadThemeTranslations('my-theme', 'en');
   ```

### Translation Key Not Found

1. **Check key exists in translation file:**
   ```typescript
   const allTranslations = getAllTranslations();
   console.log(allTranslations);
   ```

2. **Use fallback:**
   ```typescript
   const text = hasTranslation('theme.custom')
     ? t('theme.custom')
     : 'Fallback text';
   ```

### RTL Not Working

1. **Check locale is RTL:**
   ```typescript
   console.log(isRTL('ar')); // Should be true
   ```

2. **Verify HTML attributes:**
   ```html
   <html lang="ar" dir="rtl">
   ```

3. **Add RTL styles:**
   ```css
   [dir="rtl"] {
     direction: rtl;
     text-align: right;
   }
   ```

## License

MIT
