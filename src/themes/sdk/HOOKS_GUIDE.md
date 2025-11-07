# Hooks and Filters Guide

Complete guide for using the LexCMS hooks and filters system.

## Overview

The hooks and filters system allows you to extend and modify theme behavior without editing core files. This is inspired by WordPress's hook system.

## Concepts

### Actions

**Actions** allow you to execute code at specific points in the theme lifecycle. Actions don't return anything.

### Filters

**Filters** allow you to modify data before it's used or displayed. Filters must return the modified value.

## Basic Usage

### Registering an Action

```typescript
import { registerAction, AVAILABLE_HOOKS } from "../sdk/index.ts";

// Register an action
registerAction(AVAILABLE_HOOKS.THEME_SETUP, () => {
  console.log("Theme is being set up!");
});

// With priority (lower = executes earlier)
registerAction(AVAILABLE_HOOKS.THEME_SETUP, () => {
  console.log("This runs first");
}, 5);
```

### Executing an Action

```typescript
import { doAction, AVAILABLE_HOOKS } from "../sdk/index.ts";

// Execute all callbacks registered for this action
await doAction(AVAILABLE_HOOKS.THEME_SETUP);

// With arguments
await doAction(AVAILABLE_HOOKS.AFTER_POST_CONTENT, post);
```

### Registering a Filter

```typescript
import { registerFilter, AVAILABLE_HOOKS } from "../sdk/index.ts";

// Modify post content
registerFilter(AVAILABLE_HOOKS.POST_CONTENT, (content: string) => {
  return content.toUpperCase();
});

// With additional arguments
registerFilter(AVAILABLE_HOOKS.POST_TITLE, (title: string, post: PostData) => {
  return `${title} - ${post.author?.name}`;
}, 10, 2); // Accept 2 arguments
```

### Applying Filters

```typescript
import { applyFilters, AVAILABLE_HOOKS } from "../sdk/index.ts";

// Apply all filters to the content
const modifiedContent = await applyFilters(
  AVAILABLE_HOOKS.POST_CONTENT,
  originalContent,
);

// With additional arguments
const modifiedTitle = await applyFilters(
  AVAILABLE_HOOKS.POST_TITLE,
  post.title,
  post,
);
```

## Available Hooks

### Theme Lifecycle

**THEME_SETUP** (action)
- Runs when theme is being initialized
- Use for: Setup tasks, registering widgets, adding menu locations

**THEME_ACTIVATED** (action)
- Runs when theme is activated
- Use for: One-time setup, migrations, default data

**THEME_DEACTIVATED** (action)
- Runs when theme is deactivated
- Use for: Cleanup tasks

### Template Rendering

**BEFORE_TEMPLATE_RENDER** (action)
- Runs before any template is rendered
- Args: `templateName`, `props`

**AFTER_TEMPLATE_RENDER** (action)
- Runs after template is rendered
- Args: `templateName`, `html`

**TEMPLATE_CONTENT** (filter)
- Modifies template HTML output
- Args: `html`, `templateName`

### Content Rendering

**BEFORE_POST_CONTENT** (action)
- Runs before post content is rendered
- Args: `post`

**AFTER_POST_CONTENT** (action)
- Runs after post content is rendered
- Args: `post`

**POST_CONTENT** (filter)
- Modifies post content
- Args: `content`, `post`

**POST_EXCERPT** (filter)
- Modifies post excerpt
- Args: `excerpt`, `post`

**POST_TITLE** (filter)
- Modifies post title
- Args: `title`, `post`

### Head and Footer

**HEAD** (action)
- Runs in `<head>` section
- Use for: Adding meta tags, scripts, styles

**FOOTER** (action)
- Runs before closing `</body>` tag
- Use for: Adding analytics, scripts

**BEFORE_HEADER** / **AFTER_HEADER** (action)
**BEFORE_FOOTER** / **AFTER_FOOTER** (action)
- Runs around header/footer components

### Settings and Config

**THEME_SETTINGS** (filter)
- Modifies theme settings
- Args: `settings`, `themeName`

**THEME_CONFIG** (filter)
- Modifies theme configuration
- Args: `config`, `themeName`

**CUSTOM_CSS** (filter)
- Adds custom CSS
- Args: `css`

**CUSTOM_JS** (filter)
- Adds custom JavaScript
- Args: `js`

### Menus

**MENU_ITEMS** (filter)
- Modifies menu items
- Args: `items`, `menuSlug`

**MENU_ITEM_CLASSES** (filter)
- Modifies CSS classes for menu items
- Args: `classes`, `item`, `depth`

### SEO

**META_TAGS** (filter)
- Modifies meta tags
- Args: `tags`, `post`

**PAGE_TITLE** (filter)
- Modifies page title
- Args: `title`, `context`

**META_DESCRIPTION** (filter)
- Modifies meta description
- Args: `description`, `post`

## Examples

### Example 1: Add custom CSS to all pages

```typescript
// In your theme's functions.ts or child theme
import { registerFilter, AVAILABLE_HOOKS } from "../sdk/index.ts";

registerFilter(AVAILABLE_HOOKS.CUSTOM_CSS, (css: string) => {
  return css + `
    .custom-button {
      background: #ff6b6b;
      color: white;
      padding: 10px 20px;
      border-radius: 5px;
    }
  `;
});
```

### Example 2: Modify post content to add reading time

```typescript
import {
  registerFilter,
  AVAILABLE_HOOKS,
  calculateReadingTime,
  html,
} from "../sdk/index.ts";
import type { PostData } from "../sdk/index.ts";

registerFilter(
  AVAILABLE_HOOKS.POST_CONTENT,
  (content: string, post: PostData) => {
    const readTime = calculateReadingTime(content);

    const readTimeHtml = html`
      <div class="reading-time">
        ⏱️ ${readTime} min read
      </div>
    `;

    return readTimeHtml + content;
  },
  10,
  2, // Accept 2 arguments
);
```

### Example 3: Add analytics to footer

```typescript
import { registerAction, AVAILABLE_HOOKS, html } from "../sdk/index.ts";

registerAction(AVAILABLE_HOOKS.FOOTER, () => {
  console.log("Adding analytics script");

  // In real implementation, you would inject this into the template
  const script = html`
    <script>
      // Google Analytics
      window.ga=window.ga||function(){(ga.q=ga.q||[]).push(arguments)};ga.l=+new Date;
      ga('create', 'UA-XXXXX-Y', 'auto');
      ga('send', 'pageview');
    </script>
    <script async src='https://www.google-analytics.com/analytics.js'></script>
  `;

  return script;
});
```

### Example 4: Modify menu items

```typescript
import { registerFilter, AVAILABLE_HOOKS } from "../sdk/index.ts";
import type { MenuItemData } from "../sdk/index.ts";

registerFilter(
  AVAILABLE_HOOKS.MENU_ITEMS,
  (items: MenuItemData[], menuSlug: string) => {
    // Only modify header menu
    if (menuSlug !== "header") return items;

    // Add custom item
    return [
      ...items,
      {
        id: 999,
        title: "Special Link",
        url: "/special",
        order: items.length + 1,
      },
    ];
  },
  10,
  2,
);
```

### Example 5: Add schema.org data to posts

```typescript
import { registerAction, AVAILABLE_HOOKS, html } from "../sdk/index.ts";
import type { PostData } from "../sdk/index.ts";

registerAction(AVAILABLE_HOOKS.HEAD, (post?: PostData) => {
  if (!post) return;

  const schema = {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    headline: post.title,
    description: post.excerpt || "",
    author: {
      "@type": "Person",
      name: post.author?.name || "Unknown",
    },
    datePublished: post.publishedAt,
    dateModified: post.updatedAt,
  };

  return html`
    <script type="application/ld+json">
      ${JSON.stringify(schema)}
    </script>
  `;
});
```

### Example 6: Modify post titles

```typescript
import { registerFilter, AVAILABLE_HOOKS } from "../sdk/index.ts";

registerFilter(
  AVAILABLE_HOOKS.POST_TITLE,
  (title: string, post: PostData) => {
    // Add emoji to featured posts
    if (post.featured) {
      return `⭐ ${title}`;
    }
    return title;
  },
  10,
  2,
);
```

### Example 7: Child theme with custom functions

```typescript
// src/themes/my-child-theme/functions.ts
import {
  registerAction,
  registerFilter,
  AVAILABLE_HOOKS,
  html,
} from "../sdk/index.ts";
import type { PostData } from "../sdk/index.ts";

/**
 * Setup function - runs when theme initializes
 */
export function setup() {
  // Add custom sidebar
  registerAction(AVAILABLE_HOOKS.THEME_SETUP, () => {
    console.log("Child theme initialized");
  });

  // Modify post content
  registerFilter(
    AVAILABLE_HOOKS.POST_CONTENT,
    (content: string, post: PostData) => {
      // Add "Updated on" date if different from published
      if (post.updatedAt !== post.publishedAt) {
        const updated = html`
          <p class="updated-date">
            <em>Last updated: ${new Date(post.updatedAt).toLocaleDateString()}</em>
          </p>
        `;
        return content + updated;
      }
      return content;
    },
    10,
    2,
  );

  // Add custom CSS
  registerFilter(AVAILABLE_HOOKS.CUSTOM_CSS, (css: string) => {
    return css + `
      .updated-date {
        color: #666;
        font-size: 0.9em;
        margin-top: 2rem;
      }
    `;
  });
}

// Auto-run setup
setup();
```

## Priority System

Hooks are executed in order of priority (lowest to highest):

```typescript
registerAction(AVAILABLE_HOOKS.THEME_SETUP, () => console.log("Third"), 15);
registerAction(AVAILABLE_HOOKS.THEME_SETUP, () => console.log("First"), 5);
registerAction(AVAILABLE_HOOKS.THEME_SETUP, () => console.log("Second"), 10);

// Output: First, Second, Third
```

## Helper Functions

### onThemeSetup

Shortcut for registering theme setup actions:

```typescript
import { onThemeSetup } from "../sdk/index.ts";

onThemeSetup(() => {
  console.log("Theme setup!");
});
```

### onThemeActivated

Shortcut for theme activation:

```typescript
import { onThemeActivated } from "../sdk/index.ts";

onThemeActivated(() => {
  console.log("Theme activated!");
});
```

### filterPostContent

Shortcut for filtering post content:

```typescript
import { filterPostContent } from "../sdk/index.ts";

filterPostContent((content: string) => {
  return content.toUpperCase();
});
```

## Best Practices

### 1. Use appropriate priorities

```typescript
// ✅ Good - use priorities to control order
registerAction(AVAILABLE_HOOKS.THEME_SETUP, setupDatabase, 5);
registerAction(AVAILABLE_HOOKS.THEME_SETUP, setupCache, 10);
registerAction(AVAILABLE_HOOKS.THEME_SETUP, setupUI, 15);
```

### 2. Always return values in filters

```typescript
// ✅ Good
registerFilter(AVAILABLE_HOOKS.POST_TITLE, (title) => {
  return title.toUpperCase();
});

// ❌ Bad - doesn't return value
registerFilter(AVAILABLE_HOOKS.POST_TITLE, (title) => {
  title.toUpperCase(); // Missing return!
});
```

### 3. Handle errors gracefully

```typescript
// ✅ Good
registerFilter(AVAILABLE_HOOKS.POST_CONTENT, (content) => {
  try {
    return processContent(content);
  } catch (error) {
    console.error("Error processing content:", error);
    return content; // Return original on error
  }
});
```

### 4. Check if hooks exist before using

```typescript
import { hasHook, AVAILABLE_HOOKS } from "../sdk/index.ts";

if (hasHook(AVAILABLE_HOOKS.CUSTOM_CSS)) {
  // Hook has registered callbacks
}
```

### 5. Document your hooks

```typescript
/**
 * Adds social share buttons to post content
 * Hook: POST_CONTENT
 * Priority: 20
 * Accepts: content (string), post (PostData)
 */
registerFilter(AVAILABLE_HOOKS.POST_CONTENT, addSocialButtons, 20, 2);
```

## Debugging

### List all registered hooks

```typescript
import { themeHooks } from "../sdk/index.ts";

const hooks = themeHooks.listHooks();
console.log("Actions:", hooks.actions);
console.log("Filters:", hooks.filters);
```

### Get hook statistics

```typescript
import { themeHooks } from "../sdk/index.ts";

const stats = themeHooks.getStats();
console.log("Actions registered:", stats.actionsRegistered);
console.log("Filters registered:", stats.filtersRegistered);
console.log("Actions executed:", stats.actionsExecuted);
console.log("Filters executed:", stats.filtersExecuted);
```

### Check hook count

```typescript
import { themeHooks, AVAILABLE_HOOKS } from "../sdk/index.ts";

const count = themeHooks.getHookCount(AVAILABLE_HOOKS.POST_CONTENT, "filter");
console.log(`${count} filters registered for POST_CONTENT`);
```

## Advanced Usage

### Removing hooks

```typescript
import { removeHook, removeAllHooks, AVAILABLE_HOOKS } from "../sdk/index.ts";

// Remove specific callback
const myCallback = (content: string) => content;
registerFilter(AVAILABLE_HOOKS.POST_CONTENT, myCallback);
removeHook(AVAILABLE_HOOKS.POST_CONTENT, myCallback, "filter");

// Remove all callbacks for a hook
removeAllHooks(AVAILABLE_HOOKS.POST_CONTENT, "filter");
```

### Async callbacks

```typescript
registerFilter(
  AVAILABLE_HOOKS.POST_CONTENT,
  async (content: string, post: PostData) => {
    // Fetch related posts
    const related = await fetchRelatedPosts(post.id);

    // Add related posts section
    return content + renderRelatedPosts(related);
  },
);
```

## Migration from WordPress

If you're familiar with WordPress hooks:

| WordPress | LexCMS |
|-----------|---------|
| `add_action` | `registerAction` |
| `do_action` | `doAction` |
| `add_filter` | `registerFilter` |
| `apply_filters` | `applyFilters` |
| `has_action` / `has_filter` | `hasHook` |
| `remove_action` / `remove_filter` | `removeHook` |
| `remove_all_actions` / `remove_all_filters` | `removeAllHooks` |

## License

MIT
