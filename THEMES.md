# LexCMS Themes Documentation

## Overview

LexCMS now includes a multi-theme system with separate homepage and blog listing pages, inspired by WordPress and Ghost theme architecture.

## Available Themes

### 1. Default Theme
- **Style**: Clean and modern
- **Features**: Flexible layouts, customizable colors, sidebar support
- **Best for**: General purpose blogs and websites

### 2. Magazine Theme
- **Style**: Professional newspaper/magazine layout
- **Features**:
  - Editorial-style hero section with featured posts
  - Bold typography (Playfair Display + Lora + Inter)
  - Category badges and breaking news support
  - Magazine-style top bar with date
  - 3-column grid for articles
- **Best for**: News sites, magazines, editorial content

### 3. Minimalist Theme
- **Style**: Clean, simple, content-focused
- **Features**:
  - Minimal design with elegant typography (Inter + Merriweather)
  - Horizontal post card layout
  - Focus on reading experience
  - Optional dark mode
  - No distractions from content
- **Best for**: Personal blogs, writers, portfolios

## Theme System Features

### Homepage vs Blog Separation
- **Homepage** (`/`): Static homepage with featured content, hero section, and customizable sections
- **Blog** (`/blog`): Paginated list of all posts with sidebar
- **Blog Pagination** (`/blog/page/:page`): Paginated blog pages

### Post Types
- **Featured Posts**: Marked posts appear on homepage featured section
- **Sticky Posts**: Pinned to top of blog listing (page 1 only)

### Theme Management

Navigate to **Admin Panel → Appearance → Themes** to:
- View all installed themes
- Activate a theme
- Configure theme-specific settings
- Preview theme screenshots

### Theme Structure

Each theme includes:
```
src/themes/[theme-name]/
├── theme.json              # Theme configuration
├── helpers/
│   └── index.ts           # Helper functions
├── templates/
│   ├── Layout.tsx         # Base layout
│   ├── home.tsx           # Homepage template
│   ├── blog.tsx           # Blog listing template (optional)
│   └── post.tsx           # Single post template (optional)
├── partials/
│   ├── Header.tsx         # Header partial (optional)
│   ├── Footer.tsx         # Footer partial (optional)
│   ├── PostCard.tsx       # Post card component (optional)
│   └── ...                # Other partials
└── assets/
    ├── css/
    │   └── [theme].css    # Theme styles
    └── js/
        └── [theme].js     # Theme scripts
```

### Theme Configuration (theme.json)

Example configuration:
```json
{
  "name": "magazine",
  "displayName": "Magazine Pro",
  "version": "1.0.0",
  "description": "Professional newspaper and magazine style theme",
  "author": {
    "name": "LexCMS Team",
    "email": "hello@lexcms.com"
  },
  "config": {
    "posts_per_page": 12,
    "custom": {
      "primary_color": {
        "type": "color",
        "label": "Primary Color",
        "default": "#c41e3a",
        "group": "design"
      }
    }
  }
}
```

### Custom Settings

Themes can define custom settings that appear in the admin panel:
- **Types**: text, textarea, select, boolean, color, image, url, number
- **Groups**: Organize settings into logical groups (design, layout, homepage, posts, etc.)
- **Descriptions**: Help text for each setting

### Template Hierarchy

LexCMS follows a WordPress-style template hierarchy:
1. Most specific template (e.g., `post-{slug}.tsx`)
2. Type-specific template (e.g., `post.tsx`)
3. Generic template (e.g., `single.tsx`)
4. Index template (`index.tsx`)

## Settings System

### Homepage Settings
Configure at **Admin → Settings → Homepage**:
- Hero title, subtitle, and CTA
- Featured posts count and titles
- About section
- Categories section
- Newsletter section

### Blog Settings
Configure at **Admin → Settings → Blog**:
- Blog title and description
- Layout (grid, list, masonry)
- Sidebar enabled/disabled
- Breadcrumbs visibility

## Database Changes

New fields in `content` table:
- `featured` (boolean): Mark post as featured for homepage
- `sticky` (boolean): Pin post to top of blog listing

## Creating a New Theme

1. Create directory: `src/themes/[your-theme-name]/`
2. Create `theme.json` with configuration
3. Create `helpers/index.ts`:
   ```typescript
   export * from "../../default/helpers/index.ts";
   ```
4. Create templates in `templates/` directory
5. Create partials in `partials/` directory (optional)
6. Add CSS in `assets/css/`
7. Add JS in `assets/js/`
8. Theme will automatically appear in admin panel

## API Reference

### Theme Helpers

Available helper functions (from `default/helpers/index.ts`):
- `getSiteData()`: Get site configuration
- `getCustomSettings()`: Get custom theme settings
- `getPaginatedPosts(page, perPage)`: Get paginated posts with sticky support
- `getFeaturedPosts(limit)`: Get featured posts for homepage
- `getRecentPosts(limit)`: Get recent posts
- `getPagination(page, total)`: Calculate pagination data
- `getPaginationNumbers(current, total, delta)`: Generate page numbers with ellipsis

### Content Service

Functions for managing content:
- `createContent(data)`: Create new post/page with featured/sticky support
- `updateContent(id, data)`: Update existing content
- Supports `featured` and `sticky` boolean fields

## Migration

To apply database changes:
```bash
# Generate migration (already created as 0011_add_featured_sticky.sql)
deno task db:generate

# Apply migration
deno task db:migrate
```

## Best Practices

1. **Reuse Helpers**: Import from default theme instead of duplicating
2. **Template Fallback**: Only override templates you need to customize
3. **Custom Settings**: Group related settings and provide clear descriptions
4. **Responsive Design**: Ensure all themes work on mobile devices
5. **Performance**: Optimize images and minimize custom CSS/JS

## Troubleshooting

### Theme Not Appearing
- Ensure `theme.json` exists in theme directory
- Check JSON syntax is valid
- Verify theme name matches directory name

### Custom Settings Not Saving
- Check field types match expected values
- Ensure field names use underscores, not hyphens
- Verify settings are defined in `theme.json` config.custom

### Templates Not Loading
- Check template paths in `theme.json` match actual files
- Ensure templates export properly
- Verify imports are correct

## Support

For issues or questions:
- GitHub: https://github.com/lexcms/lexcms
- Docs: https://docs.lexcms.com
- Email: support@lexcms.com
