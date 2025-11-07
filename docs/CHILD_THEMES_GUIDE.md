# Child Themes Guide

Complete guide for creating and using child themes in LexCMS.

## What are Child Themes?

Child themes allow you to extend or customize an existing theme (the "parent") without modifying its code. This provides several benefits:

- **Safe updates**: Update the parent theme without losing customizations
- **Minimal code**: Only override what you need
- **Inheritance**: Automatically inherit templates, assets, and settings from parent
- **Easy maintenance**: Keep customizations separate from core theme

## Creating a Child Theme

### Method 1: Using the Generator CLI (Recommended)

```bash
deno task theme:create
```

The wizard will ask:
1. Theme name
2. Display name
3. Description
4. Author details
5. **Create as child theme?** → Select "Yes"
6. **Parent theme** → Select from available themes
7. Base template (usually "Blank" for child themes)
8. Features, color scheme, CSS framework

The generator creates a minimal child theme structure that inherits from the parent.

### Method 2: Manual Creation

1. **Create theme directory:**
```bash
mkdir src/themes/my-child-theme
```

2. **Create theme.json:**
```json
{
  "name": "my-child-theme",
  "displayName": "My Child Theme",
  "version": "1.0.0",
  "description": "Child theme of Corporate",
  "parent": "corporate",
  "author": {
    "name": "Your Name",
    "email": "you@example.com"
  },
  "license": "MIT",
  "config": {
    "posts_per_page": 10
  }
}
```

The key field is `"parent": "corporate"` which establishes the parent-child relationship.

## Theme Hierarchy

LexCMS uses a template hierarchy system similar to WordPress. When looking for a template, it searches in this order:

```
child-theme → parent-theme → grandparent-theme → ... → not found
```

### Example Hierarchy

If you have:
- `my-child-theme` (child of `corporate`)
- `corporate` (child of `base`)
- `base` (no parent)

The hierarchy would be:
```
my-child-theme → corporate → base
```

## Overriding Templates

### Full Override

Create a template with the same name in your child theme to completely replace the parent's template.

**Parent theme (corporate/templates/home.tsx):**
```typescript
export const HomeTemplate = (props) => {
  return html`<h1>Corporate Homepage</h1>`;
};
```

**Child theme (my-child-theme/templates/home.tsx):**
```typescript
export const HomeTemplate = (props) => {
  return html`<h1>Custom Homepage</h1>`;
};
```

The child theme's `home.tsx` will be used instead of the parent's.

### Partial Override

You can also override only specific partials while using the parent's main templates.

**Child theme (my-child-theme/partials/Header.tsx):**
```typescript
import { html, type HeaderProps } from "../sdk/index.ts";

export const Header = (props: HeaderProps) => {
  const { site, custom } = props;

  return html`
    <header class="custom-header">
      <h1>${site.name} - Customized!</h1>
    </header>
  `;
};
```

This Header will be used even when the parent template calls it.

## Extending Parent Templates

You can import and extend parent templates:

```typescript
import { html, type HomeTemplateProps } from "../sdk/index.ts";

// Import parent template
import { HomeTemplate as ParentHome } from "../../corporate/templates/home.tsx";

export const HomeTemplate = (props: HomeTemplateProps) => {
  const { site } = props;

  return html`
    <!-- Add custom header -->
    <div class="child-theme-notice">
      <p>You're viewing the child theme version!</p>
    </div>

    <!-- Render parent content -->
    ${ParentHome(props)}

    <!-- Add custom footer -->
    <div class="child-theme-footer">
      <p>Additional content from child theme</p>
    </div>
  `;
};
```

## Customizing Settings

### Adding Custom Settings

Child themes can add their own settings:

```json
{
  "parent": "corporate",
  "config": {
    "custom": {
      "child_specific_color": {
        "type": "color",
        "label": "Child Theme Color",
        "default": "#ff6b6b",
        "group": "design"
      }
    }
  }
}
```

### Inheriting Parent Settings

All parent settings are automatically inherited. The child can override defaults:

```json
{
  "parent": "corporate",
  "config": {
    "posts_per_page": 15,  // Override parent's 10
    "custom": {
      "primary_color": {
        "default": "#ff0000"  // Override parent default
      }
    }
  }
}
```

## Asset Cascading

### CSS Cascade

When loading CSS, both parent and child stylesheets are loaded:

```html
<!-- Parent CSS loaded first -->
<link rel="stylesheet" href="/themes/corporate/assets/css/corporate.css">

<!-- Child CSS loaded second (can override parent) -->
<link rel="stylesheet" href="/themes/my-child-theme/assets/css/my-child-theme.css">
```

**Child theme CSS:**
```css
/* Override parent styles */
.header {
  background: #ff0000;  /* Override parent's background */
}

/* Add new styles */
.child-theme-notice {
  padding: 20px;
  background: #f0f0f0;
}
```

### Asset Fallback

If an asset doesn't exist in the child theme, it falls back to the parent:

```typescript
// Request: /themes/my-child-theme/assets/images/logo.png
//
// Search order:
// 1. /themes/my-child-theme/assets/images/logo.png
// 2. /themes/corporate/assets/images/logo.png  ← Falls back to this
// 3. /themes/base/assets/images/logo.png
```

## Using Hooks in Child Themes

Child themes can use the hooks system to modify parent behavior:

**Create functions.ts in your child theme:**

```typescript
import {
  registerFilter,
  registerAction,
  AVAILABLE_HOOKS,
  html,
} from "../sdk/index.ts";

/**
 * Setup function - runs when theme initializes
 */
export function setup() {
  // Modify post content
  registerFilter(
    AVAILABLE_HOOKS.POST_CONTENT,
    (content: string, post: any) => {
      // Add reading time from child theme
      return html`
        <div class="child-theme-reading-time">
          Reading time: ${post.readingTime} minutes
        </div>
        ${content}
      `;
    },
    10,
    2
  );

  // Add custom CSS
  registerFilter(AVAILABLE_HOOKS.CUSTOM_CSS, (css: string) => {
    return css + `
      .child-theme-reading-time {
        padding: 10px;
        background: #e0e0e0;
        margin-bottom: 20px;
      }
    `;
  });

  // Add custom scripts
  registerAction(AVAILABLE_HOOKS.FOOTER, () => {
    return html`
      <script>
        console.log('Child theme loaded!');
      </script>
    `;
  });
}

// Auto-run setup
setup();
```

## Helper Functions

### Check if Theme is a Child

```typescript
import { isChildTheme } from "../services/themeService.ts";

const isChild = await isChildTheme("my-child-theme"); // true
```

### Get Parent Theme

```typescript
import { getParentTheme } from "../services/themeService.ts";

const parent = await getParentTheme("my-child-theme"); // "corporate"
```

### Get Theme Hierarchy

```typescript
import { getThemeHierarchy } from "../services/themeService.ts";

const hierarchy = await getThemeHierarchy("my-child-theme");
// ["my-child-theme", "corporate", "base"]
```

### Load Template with Fallback

```typescript
import { loadTemplateWithFallback } from "../services/themeService.ts";

// Automatically searches child → parent → grandparent
const template = await loadTemplateWithFallback("home");
```

### Get Merged Config

```typescript
import { getMergedThemeConfig } from "../services/themeService.ts";

// Get config with all parent settings merged
const config = await getMergedThemeConfig("my-child-theme");
```

## Best Practices

### 1. Keep It Minimal

Only override what you need:

```
✅ Good - Minimal child theme:
my-child-theme/
├── theme.json
├── partials/
│   └── Header.tsx (only override header)
└── assets/
    └── css/
        └── child.css (minimal overrides)

❌ Bad - Copying everything:
my-child-theme/
├── theme.json
├── templates/ (all templates copied)
├── partials/ (all partials copied)
└── assets/ (all assets copied)
```

### 2. Use Hooks Instead of Overriding

```typescript
// ✅ Good - Use hooks
registerFilter(AVAILABLE_HOOKS.POST_CONTENT, (content) => {
  return content + "<p>Custom footer</p>";
});

// ❌ Bad - Override entire template just to add footer
export const PostTemplate = (props) => {
  // 100 lines of duplicated code...
};
```

### 3. Extend Parent Templates

```typescript
// ✅ Good - Extend parent
import { Header as ParentHeader } from "../../parent-theme/partials/Header.tsx";

export const Header = (props) => {
  return html`
    <div class="child-header-wrapper">
      ${ParentHeader(props)}
      <div class="child-addition">Extra content</div>
    </div>
  `;
};

// ❌ Bad - Completely rewrite
export const Header = (props) => {
  // 50 lines of duplicated code from parent...
};
```

### 4. Document Dependencies

In your README:

```markdown
## Parent Theme Dependency

This child theme requires the **Corporate** theme (v1.0.0 or higher) as its parent.

### Installation
1. Ensure Corporate theme is installed
2. Install this child theme
3. Activate this child theme
```

### 5. Version Compatibility

Update your theme.json when parent version requirements change:

```json
{
  "parent": "corporate",
  "requires": {
    "parent_version": ">=1.0.0"
  }
}
```

## Common Use Cases

### Use Case 1: Color Customization

**Child theme with just color changes:**

```json
{
  "parent": "corporate",
  "config": {
    "custom": {
      "primary_color": { "default": "#e74c3c" },
      "secondary_color": { "default": "#2c3e50" }
    }
  }
}
```

```css
/* assets/css/child.css */
:root {
  --primary-color: #e74c3c;
  --secondary-color: #2c3e50;
}
```

### Use Case 2: Custom Header/Footer

Override only the header and footer partials, keeping all templates.

### Use Case 3: Additional Features

Use hooks to add features without modifying templates:

```typescript
// Add social share buttons
registerFilter(AVAILABLE_HOOKS.POST_CONTENT, (content, post) => {
  const shareButtons = html`
    <div class="social-share">
      <button>Share on Twitter</button>
      <button>Share on Facebook</button>
    </div>
  `;
  return content + shareButtons;
});
```

### Use Case 4: Multilingual Variant

Create a child theme for a specific language:

```
corporate-es/
├── theme.json (parent: "corporate")
├── locales/
│   └── es.json
└── templates/
    └── home.tsx (Spanish-specific homepage)
```

## Validation

Validate your child theme before activation:

```bash
deno task theme:validate --theme my-child-theme
```

This checks:
- Parent theme exists
- No circular dependencies
- Valid theme.json
- All required files present

## Troubleshooting

### Issue: "Parent theme not found"

**Solution:** Ensure the parent theme is installed:
```bash
# List available themes
ls src/themes/

# Verify parent exists
cat src/themes/corporate/theme.json
```

### Issue: Template not loading

**Solution:** Check the template hierarchy:
```typescript
import { getThemeHierarchy } from "../services/themeService.ts";
console.log(await getThemeHierarchy("my-child-theme"));
```

### Issue: Assets not loading

**Solution:** Verify asset path and use fallback:
```typescript
import { getAssetUrlWithFallback } from "../services/themeService.ts";
const logoUrl = await getAssetUrlWithFallback("images/logo.png");
```

### Issue: Circular dependency

**Error:** "Circular parent reference detected"

**Solution:** Check your parent chain:
```
my-theme → corporate → my-theme  ❌ Circular!
```

Fix theme.json to break the circle.

## Example: Complete Child Theme

**File structure:**
```
my-child-theme/
├── theme.json
├── functions.ts
├── partials/
│   └── Header.tsx
├── assets/
│   ├── css/
│   │   └── child.css
│   └── js/
│       └── child.js
└── README.md
```

**theme.json:**
```json
{
  "name": "my-child-theme",
  "displayName": "My Child Theme",
  "parent": "corporate",
  "version": "1.0.0",
  "description": "Customized version of Corporate theme",
  "author": {
    "name": "John Doe",
    "email": "john@example.com"
  },
  "license": "MIT",
  "config": {
    "custom": {
      "accent_color": {
        "type": "color",
        "label": "Accent Color",
        "default": "#e74c3c"
      }
    }
  }
}
```

**functions.ts:**
```typescript
import { registerFilter, AVAILABLE_HOOKS } from "../sdk/index.ts";

export function setup() {
  registerFilter(AVAILABLE_HOOKS.POST_CONTENT, (content) => {
    return content + `<div class="child-signature">From Child Theme</div>`;
  });
}

setup();
```

**partials/Header.tsx:**
```typescript
import { html, type HeaderProps } from "../sdk/index.ts";

export const Header = (props: HeaderProps) => {
  return html`
    <header class="child-header">
      <div class="child-badge">Child Theme Active</div>
      <h1>${props.site.name}</h1>
    </header>
  `;
};
```

## License

MIT
