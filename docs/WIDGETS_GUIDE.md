# Widget System Guide

Complete guide for using the LexCMS widget system.

## Overview

The widget system allows you to add dynamic, reusable components to your themes. Widgets can be placed in designated widget areas (like sidebars, footers, etc.) and configured through the admin panel.

## Key Concepts

### Widget Areas

**Widget Areas** are designated sections in your theme where widgets can be placed. Common widget areas include:

- Sidebar (primary, secondary)
- Footer columns
- Header sections
- Homepage sections

### Widgets

**Widgets** are modular components that can be added to widget areas. They can display dynamic content like:

- Search forms
- Recent posts
- Categories
- Tags
- Custom HTML
- Social media feeds
- And more...

## Built-in Widgets

LexCMS includes 5 built-in widgets:

### 1. Search Widget 🔍

Displays a search form.

**Settings:**
- **Placeholder Text**: Text shown in the search input
- **Button Text**: Text shown on the search button
- **Show Search Icon**: Display a search icon
- **Search URL**: URL to submit the form to

### 2. Recent Posts Widget 📝

Displays a list of recent posts.

**Settings:**
- **Number of Posts**: How many posts to show (1-20)
- **Show Excerpt**: Display post excerpt
- **Show Date**: Display publication date
- **Show Author**: Display post author
- **Show Thumbnail**: Display featured image
- **Content Type**: Which content type to display

### 3. Custom HTML Widget ⚙️

Allows adding custom HTML content.

**Settings:**
- **HTML Content**: Your custom HTML
- **Escape HTML**: Escape HTML for safety (recommended)

**⚠️ Warning**: Disable "Escape HTML" only with trusted content to prevent XSS attacks.

### 4. Categories Widget 📁

Displays a list of categories.

**Settings:**
- **Show Post Count**: Display number of posts
- **Show Hierarchy**: Display subcategories indented
- **Hide Empty Categories**: Don't show empty categories
- **Maximum Categories**: Limit number shown (0 = no limit)
- **Content Type**: Which content type's categories

### 5. Tags Widget 🏷️

Displays tags as a cloud or list.

**Settings:**
- **Display Style**: Cloud or List
- **Show Post Count**: Display number of posts
- **Maximum Tags**: Limit number shown
- **Minimum Font Size**: Smallest font size for cloud (px)
- **Maximum Font Size**: Largest font size for cloud (px)

## Using Widgets in Themes

### 1. Define Widget Areas in theme.json

```json
{
  "name": "my-theme",
  "version": "1.0.0",
  "supports": {
    "widgets": true,
    "widgetAreas": [
      {
        "id": "sidebar-primary",
        "name": "Primary Sidebar",
        "description": "Main sidebar for blog posts"
      },
      {
        "id": "footer-1",
        "name": "Footer Column 1"
      },
      {
        "id": "footer-2",
        "name": "Footer Column 2"
      }
    ]
  }
}
```

### 2. Render Widget Areas in Templates

```typescript
import { html, renderWidgetArea } from "../sdk/index.ts";
import type { BlogTemplateProps } from "../sdk/index.ts";

export const BlogTemplate = async (props: BlogTemplateProps) => {
  const { site, posts, pagination } = props;

  return html`
    <!DOCTYPE html>
    <html>
      <head>
        <title>${site.name} - Blog</title>
      </head>
      <body>
        <main class="blog-main">
          <h1>Blog</h1>
          <!-- Blog content here -->
        </main>

        <aside class="sidebar">
          ${await renderWidgetArea("sidebar-primary", {
            site,
            theme: "my-theme",
          })}
        </aside>

        <footer>
          <div class="footer-columns">
            <div class="footer-column">
              ${await renderWidgetArea("footer-1", {
                site,
                theme: "my-theme",
              })}
            </div>
            <div class="footer-column">
              ${await renderWidgetArea("footer-2", {
                site,
                theme: "my-theme",
              })}
            </div>
          </div>
        </footer>
      </body>
    </html>
  `;
};
```

### 3. Helper for Widget Context

```typescript
import { createWidgetContext, renderWidgetArea } from "../sdk/index.ts";

export const BlogTemplate = async (props: BlogTemplateProps) => {
  // Create context once, use for multiple areas
  const context = createWidgetContext(props, "my-theme");

  return html`
    <aside>
      ${await renderWidgetArea("sidebar-primary", context)}
    </aside>
  `;
};
```

## Managing Widgets via Admin Panel

### Adding Widgets

1. Go to **Appearance > Widgets** in the admin panel
2. Select a widget area from the list
3. Click "Add Widget"
4. Choose a widget type
5. Configure widget settings
6. Click "Save"

### Reordering Widgets

Drag and drop widgets to reorder them within a widget area.

### Editing Widgets

1. Click on a widget to expand it
2. Modify settings
3. Click "Save"

### Deleting Widgets

1. Click on a widget to expand it
2. Click "Delete"
3. Confirm deletion

## API Usage

### Get Available Widget Types

```bash
GET /api/admin/widgets/types
```

**Response:**
```json
[
  {
    "id": "search",
    "name": "Search",
    "description": "Search form for your site",
    "icon": "🔍",
    "settingsSchema": {
      "placeholder": {
        "type": "text",
        "label": "Placeholder Text",
        "default": "Search..."
      }
    }
  }
]
```

### Get Widget Areas

```bash
GET /api/admin/widgets/areas?theme=my-theme
```

**Response:**
```json
[
  {
    "id": 1,
    "slug": "sidebar-primary",
    "name": "Primary Sidebar",
    "theme": "my-theme",
    "isActive": true,
    "widgets": [...]
  }
]
```

### Create Widget

```bash
POST /api/admin/widgets
Content-Type: application/json

{
  "areaId": 1,
  "type": "recent-posts",
  "title": "Recent Articles",
  "settings": {
    "limit": 5,
    "showDate": true
  },
  "order": 0,
  "isActive": true
}
```

### Update Widget

```bash
PUT /api/admin/widgets/123
Content-Type: application/json

{
  "title": "Latest Posts",
  "settings": {
    "limit": 10
  }
}
```

### Delete Widget

```bash
DELETE /api/admin/widgets/123
```

### Reorder Widgets

```bash
POST /api/admin/widgets/reorder
Content-Type: application/json

{
  "areaId": 1,
  "widgetIds": [3, 1, 2]
}
```

## Creating Custom Widgets

### 1. Create Widget Class

```typescript
// src/widgets/MyCustomWidget.tsx
import { html } from "hono/html";
import type { WidgetClass, WidgetRenderContext } from "./types.ts";

export const MyCustomWidget: WidgetClass = {
  id: "my-custom-widget",
  name: "My Custom Widget",
  description: "A custom widget that does something cool",
  icon: "✨",

  settingsSchema: {
    title: {
      type: "text",
      label: "Title",
      default: "Hello World",
    },
    count: {
      type: "number",
      label: "Item Count",
      default: 5,
      min: 1,
      max: 20,
    },
    showImages: {
      type: "boolean",
      label: "Show Images",
      default: true,
    },
  },

  async render(settings: any, context: WidgetRenderContext) {
    const title = settings.title || "Hello World";
    const count = settings.count || 5;

    return html`
      <div class="my-custom-widget">
        <h3>${title}</h3>
        <p>Count: ${count}</p>
        <p>Site: ${context.site.name}</p>
      </div>
    `;
  },

  async validate(settings: any) {
    const errors: string[] = [];

    if (settings.count && (settings.count < 1 || settings.count > 20)) {
      errors.push("Count must be between 1 and 20");
    }

    return {
      valid: errors.length === 0,
      errors: errors.length > 0 ? errors : undefined,
    };
  },
};
```

### 2. Register Widget

```typescript
// src/widgets/registry.ts
import { widgetRegistry } from "./registry.ts";
import { MyCustomWidget } from "./MyCustomWidget.tsx";

widgetRegistry.register(MyCustomWidget, {
  category: "custom",
  allowMultiple: true,
});
```

## Widget Setting Types

The following setting types are supported:

| Type | Description | Additional Options |
|------|-------------|-------------------|
| `text` | Single-line text input | `placeholder` |
| `textarea` | Multi-line text input | `placeholder` |
| `number` | Number input | `min`, `max` |
| `boolean` | Checkbox | - |
| `color` | Color picker | - |
| `select` | Dropdown select | `options: [{value, label}]` |
| `image` | Image upload | - |

## Best Practices

### 1. Widget Areas

```json
// ✅ Good - Clear, descriptive names
{
  "widgetAreas": [
    {"id": "sidebar-primary", "name": "Primary Sidebar"},
    {"id": "footer-1", "name": "Footer Column 1"}
  ]
}

// ❌ Bad - Vague names
{
  "widgetAreas": [
    {"id": "area1", "name": "Area 1"},
    {"id": "area2", "name": "Area 2"}
  ]
}
```

### 2. Widget Rendering

```typescript
// ✅ Good - Await widget areas
${await renderWidgetArea("sidebar", context)}

// ❌ Bad - Forgetting await
${renderWidgetArea("sidebar", context)}
```

### 3. Error Handling

```typescript
// ✅ Good - Handle errors gracefully
async render(settings, context) {
  try {
    const data = await fetchData();
    return html`<div>${data}</div>`;
  } catch (error) {
    console.error("Widget error:", error);
    return html`<p class="widget-error">Unable to load content</p>`;
  }
}
```

### 4. Performance

```typescript
// ✅ Good - Cache expensive operations
async render(settings, context) {
  const cacheKey = `widget:${this.id}:${context.site.name}`;
  const cached = cache.get(cacheKey);
  if (cached) return cached;

  const result = await expensiveOperation();
  cache.set(cacheKey, result, { ttl: 3600 });
  return result;
}
```

## Styling Widgets

Widgets have automatic CSS classes for styling:

```css
/* Widget area */
.widget-area {
  display: flex;
  flex-direction: column;
  gap: 2rem;
}

/* Individual widget */
.widget {
  background: #fff;
  padding: 1.5rem;
  border-radius: 8px;
}

.widget-title {
  font-size: 1.25rem;
  font-weight: bold;
  margin-bottom: 1rem;
}

/* Widget-specific styling */
.widget--search { }
.widget--recent-posts { }
.widget--categories { }

/* Widget area-specific styling */
.widget-area--sidebar-primary { }
.widget-area--footer-1 { }
```

## Advanced Usage

### Conditional Widget Rendering

```typescript
export const BlogTemplate = async (props: BlogTemplateProps) => {
  const hasSidebar = await hasWidgetsInArea("sidebar-primary");

  return html`
    <div class="${hasSidebar ? 'with-sidebar' : 'full-width'}">
      <main>...</main>
      ${hasSidebar
        ? html`<aside>${await renderWidgetArea("sidebar-primary", context)}</aside>`
        : ""
      }
    </div>
  `;
};
```

### Widget Areas with Fallback Content

```typescript
const sidebarContent = await renderWidgetArea("sidebar", context);
const hasSidebar = sidebarContent.toString().trim() !== "";

return html`
  <aside>
    ${hasSidebar
      ? sidebarContent
      : html`<div class="default-sidebar">Default sidebar content</div>`
    }
  </aside>
`;
```

## Troubleshooting

### Widgets Not Appearing

1. **Check widget area is defined in theme.json**
   ```json
   {"supports": {"widgets": true, "widgetAreas": [...]}}
   ```

2. **Verify widget is active**
   ```sql
   SELECT * FROM widgets WHERE is_active = 1;
   ```

3. **Check widget area is active**
   ```sql
   SELECT * FROM widget_areas WHERE is_active = 1;
   ```

### Widget Rendering Errors

Check browser console and server logs for error messages:

```bash
# Server logs
tail -f logs/server.log | grep widget

# Check widget validation
curl -X POST http://localhost:3000/api/admin/widgets/validate \
  -H "Content-Type: application/json" \
  -d '{"type":"search","settings":{"placeholder":"Search..."}}'
```

### Widget Not Saving

Check validation errors:

```javascript
const response = await fetch('/api/admin/widgets', {
  method: 'POST',
  headers: {'Content-Type': 'application/json'},
  body: JSON.stringify(widgetData)
});

const result = await response.json();
if (!result.success) {
  console.error('Validation errors:', result.errors);
}
```

## License

MIT
