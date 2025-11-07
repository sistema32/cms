# LexCMS Theme SDK

Complete TypeScript SDK for developing themes in LexCMS.

## Installation

The SDK is built-in to LexCMS. Import it directly in your theme files:

```typescript
import { html, type HomeTemplateProps, formatDate } from "../sdk/index.ts";
```

## Core Concepts

### 1. HTML Tagged Templates

Use the `html` tagged template for rendering:

```typescript
import { html } from "../sdk/index.ts";

export const MyComponent = () => {
  return html`
    <div class="container">
      <h1>Hello World</h1>
    </div>
  `;
};
```

### 2. Template Props

All templates receive typed props:

```typescript
import { html, type HomeTemplateProps } from "../sdk/index.ts";

export const HomeTemplate = (props: HomeTemplateProps) => {
  const { site, custom, featuredPosts } = props;

  return html`
    <h1>${site.name}</h1>
    <p>${site.description}</p>
  `;
};
```

### 3. Available Template Types

- `HomeTemplateProps` - Homepage template
- `BlogTemplateProps` - Blog listing template
- `PostTemplateProps` - Single post template
- `PageTemplateProps` - Page template
- `SearchTemplateProps` - Search results template
- `ArchiveTemplateProps` - Archive template
- `Error404TemplateProps` - 404 error template

## Helper Functions

### Date Formatting

```typescript
import { formatDate } from "../sdk/index.ts";

// Short format: "Jan 1, 2025"
formatDate(post.publishedAt, "short");

// Long format: "January 1, 2025"
formatDate(post.publishedAt, "long");

// Relative: "2 hours ago"
formatDate(post.publishedAt, "relative");
```

### Text Processing

```typescript
import {
  generateExcerpt,
  truncateWords,
  calculateReadingTime,
} from "../sdk/index.ts";

// Generate excerpt
const excerpt = generateExcerpt(post.content, 150);

// Truncate to word count
const short = truncateWords(post.content, 50);

// Calculate reading time
const readTime = calculateReadingTime(post.content); // Returns minutes
```

### Rendering Helpers

#### Pagination

```typescript
import { renderPagination } from "../sdk/index.ts";

renderPagination(pagination, "/blog", {
  showNumbers: true,
  showPrevNext: true,
  maxPages: 7,
  className: "pagination",
});
```

#### Menu

```typescript
import { renderMenu } from "../sdk/index.ts";

renderMenu(menuItems, "main-menu", 3); // Max depth: 3
```

#### Breadcrumbs

```typescript
import { renderBreadcrumbs } from "../sdk/index.ts";

renderBreadcrumbs([
  { title: "Home", url: "/" },
  { title: "Blog", url: "/blog" },
  { title: "Post Title" },
]);
```

#### Category/Tag Lists

```typescript
import { renderCategoryList, renderTagList } from "../sdk/index.ts";

renderCategoryList(categories, {
  showCount: true,
  className: "category-list",
});

renderTagList(tags, {
  showCount: true,
  className: "tag-cloud",
});
```

### SEO Helpers

```typescript
import { renderMetaTags, renderSchemaOrg } from "../sdk/index.ts";

// In <head>
renderMetaTags(post, site);
renderSchemaOrg(post, site);
```

### Security

```typescript
import { sanitizeHtml, escapeAttr } from "../sdk/index.ts";

// Sanitize HTML content
const safe = sanitizeHtml(userInput);

// Escape for HTML attributes
html`<div data-value="${escapeAttr(userInput)}"></div>`;
```

## Complete Example

```typescript
// templates/home.tsx
import {
  html,
  type HomeTemplateProps,
  formatDate,
  renderMenu,
  renderPagination,
} from "../sdk/index.ts";
import { Header } from "../partials/Header.tsx";
import { Footer } from "../partials/Footer.tsx";

export const HomeTemplate = (props: HomeTemplateProps) => {
  const { site, custom, featuredPosts, recentPosts } = props;

  return html`
    <!DOCTYPE html>
    <html lang="${site.language}">
      <head>
        <meta charset="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <title>${site.name}</title>
        <meta name="description" content="${site.description}" />
        <link rel="stylesheet" href="/themes/${custom.theme}/assets/css/style.css" />
      </head>
      <body>
        ${Header({ site, custom })}

        <main class="main-content">
          <section class="hero">
            <h1>${custom.hero_title || site.name}</h1>
            <p>${custom.hero_subtitle || site.description}</p>
          </section>

          ${featuredPosts && featuredPosts.length > 0
            ? html`
              <section class="featured-posts">
                <h2>Featured Posts</h2>
                <div class="post-grid">
                  ${featuredPosts.map(post => html`
                    <article class="post-card">
                      ${post.featuredImage
                        ? html`<img src="${post.featuredImage}" alt="${post.title}" />`
                        : ""}
                      <h3><a href="/${post.slug}">${post.title}</a></h3>
                      <p>${post.excerpt}</p>
                      <div class="post-meta">
                        <time>${formatDate(post.publishedAt)}</time>
                        ${post.author ? html`<span>By ${post.author.name}</span>` : ""}
                      </div>
                    </article>
                  `)}
                </div>
              </section>
            `
            : ""}

          ${recentPosts && recentPosts.length > 0
            ? html`
              <section class="recent-posts">
                <h2>Recent Posts</h2>
                <div class="post-list">
                  ${recentPosts.map(post => html`
                    <article class="post-item">
                      <h4><a href="/${post.slug}">${post.title}</a></h4>
                      <time>${formatDate(post.publishedAt, "relative")}</time>
                    </article>
                  `)}
                </div>
              </section>
            `
            : ""}
        </main>

        ${Footer({ site, custom })}

        <script src="/themes/${custom.theme}/assets/js/main.js"></script>
      </body>
    </html>
  `;
};

export default HomeTemplate;
```

## Type Safety

The SDK provides full TypeScript support:

```typescript
import type {
  PostData,
  CategoryData,
  TagData,
  UserData,
} from "../sdk/index.ts";

// Your types are fully checked
function renderPost(post: PostData) {
  return html`
    <article>
      <h1>${post.title}</h1>
      <!-- TypeScript knows all PostData properties -->
    </article>
  `;
}
```

## Best Practices

### 1. Always use TypeScript

```typescript
// ✅ Good
import type { HomeTemplateProps } from "../sdk/index.ts";
export const HomeTemplate = (props: HomeTemplateProps) => { ... };

// ❌ Bad
export const HomeTemplate = (props: any) => { ... };
```

### 2. Sanitize user input

```typescript
// ✅ Good
import { sanitizeHtml } from "../sdk/index.ts";
const safe = sanitizeHtml(userComment);

// ❌ Bad - XSS vulnerability
html`<div>${userComment}</div>`;
```

### 3. Use semantic HTML

```typescript
// ✅ Good
html`
  <article>
    <header>
      <h1>${post.title}</h1>
      <time datetime="${post.publishedAt}">${formatDate(post.publishedAt)}</time>
    </header>
    <div>${post.content}</div>
  </article>
`;

// ❌ Bad
html`
  <div class="article">
    <div class="title">${post.title}</div>
    <div class="content">${post.content}</div>
  </div>
`;
```

### 4. Provide fallbacks

```typescript
// ✅ Good
const title = custom.hero_title || site.name || "Welcome";

// ❌ Bad
const title = custom.hero_title; // Could be undefined
```

### 5. Optimize images

```typescript
// ✅ Good
html`
  <img
    src="${post.featuredImage}"
    alt="${post.title}"
    loading="lazy"
    width="800"
    height="600"
  />
`;

// ❌ Bad
html`<img src="${post.featuredImage}" />`;
```

## API Reference

See the [Type Definitions](./types.ts) for complete API reference.

## Contributing

To add new helpers or improve the SDK:

1. Add types to `types.ts`
2. Add helpers to `helpers.ts`
3. Export from `index.ts`
4. Update this README
5. Add tests

## License

MIT
