/**
 * Theme Generator CLI
 * Scaffolding automático de nuevos themes con wizard interactivo
 */

import { join } from "https://deno.land/std@0.224.0/path/mod.ts";
import { parse } from "https://deno.land/std@0.224.0/flags/mod.ts";
import { colors } from "https://deno.land/x/cliffy@v1.0.0-rc.3/ansi/colors.ts";
import { Input, Select, Checkbox, Confirm } from "https://deno.land/x/cliffy@v1.0.0-rc.3/prompt/mod.ts";
import { ensureDir } from "https://deno.land/std@0.224.0/fs/mod.ts";

interface ThemeOptions {
  name: string;
  displayName: string;
  description: string;
  author: string;
  email: string;
  license: string;
  template: "blank" | "base" | "default";
  isChildTheme?: boolean;
  parentTheme?: string;
  features: string[];
  colorScheme: "light" | "dark" | "both";
  cssFramework: "tailwind" | "custom" | "none";
}

class ThemeGenerator {
  private options: ThemeOptions;
  private themePath: string;

  constructor(options: ThemeOptions) {
    this.options = options;
    this.themePath = join(Deno.cwd(), "src", "themes", options.name);
  }

  /**
   * Genera el theme completo
   */
  async generate(): Promise<void> {
    console.log(colors.bold(`\n🎨 Generating theme: ${this.options.displayName}\n`));

    // Verificar que no exista
    try {
      await Deno.stat(this.themePath);
      throw new Error(`Theme "${this.options.name}" already exists`);
    } catch (error) {
      if (!(error instanceof Deno.errors.NotFound)) {
        throw error;
      }
    }

    // Crear estructura
    await this.createStructure();
    await this.createThemeJson();
    await this.createTemplates();
    await this.createPartials();
    await this.createHelpers();
    await this.createAssets();
    await this.createReadme();
    await this.createChangelog();

    console.log(colors.green.bold("\n✓ Theme created successfully! 🎉\n"));
    this.printNextSteps();
  }

  /**
   * Crea la estructura de directorios
   */
  private async createStructure(): Promise<void> {
    console.log("📁 Creating directory structure...");

    const dirs = [
      "",
      "templates",
      "partials",
      "helpers",
      "assets",
      "assets/css",
      "assets/js",
      "assets/images",
      "types",
    ];

    for (const dir of dirs) {
      await ensureDir(join(this.themePath, dir));
    }

    console.log(colors.green("  ✓ Directory structure created\n"));
  }

  /**
   * Crea theme.json
   */
  private async createThemeJson(): Promise<void> {
    console.log("📋 Creating theme.json...");

    const config: any = {
      name: this.options.name,
      displayName: this.options.displayName,
      version: "1.0.0",
      description: this.options.description,
      author: {
        name: this.options.author,
        email: this.options.email,
        url: "",
      },
      license: this.options.license,
      screenshots: {
        desktop: "assets/images/screenshot-desktop.jpg",
        mobile: "assets/images/screenshot-mobile.jpg",
      },
      config: {
        posts_per_page: 10,
        image_sizes: {
          small: { width: 400 },
          medium: { width: 800 },
          large: { width: 1200 },
        },
        custom: this.getCustomSettings(),
      },
      supports: {
        comments: this.options.features.includes("comments"),
        customSettings: true,
        widgets: this.options.features.includes("widgets"),
        menus: ["header", "footer"],
        postFormats: ["standard"],
        customTemplates: true,
        darkMode: this.options.features.includes("dark-mode"),
        responsiveDesign: true,
        seo: true,
      },
      templates: {
        home: "templates/home.tsx",
        blog: "templates/blog.tsx",
        post: "templates/post.tsx",
        page: "templates/page.tsx",
      },
      partials: {
        header: "partials/Header.tsx",
        footer: "partials/Footer.tsx",
        postCard: "partials/PostCard.tsx",
      },
    };

    // Agregar parent si es child theme
    if (this.options.isChildTheme && this.options.parentTheme) {
      config.parent = this.options.parentTheme;
    }

    const content = JSON.stringify(config, null, 2);
    await Deno.writeTextFile(join(this.themePath, "theme.json"), content);

    console.log(colors.green("  ✓ theme.json created\n"));
  }

  /**
   * Obtiene custom settings según features seleccionadas
   */
  private getCustomSettings(): Record<string, any> {
    const settings: Record<string, any> = {
      primary_color: {
        type: "color",
        label: "Primary Color",
        default: "#0066cc",
        group: "design",
        description: "Main accent color for the theme",
      },
      secondary_color: {
        type: "color",
        label: "Secondary Color",
        default: "#333333",
        group: "design",
        description: "Secondary color for text and UI elements",
      },
      font_family: {
        type: "select",
        label: "Font Family",
        options: ["Inter", "Roboto", "Open Sans", "Lato", "Montserrat"],
        default: "Inter",
        group: "typography",
      },
      show_sidebar: {
        type: "boolean",
        label: "Show Sidebar",
        default: true,
        group: "layout",
      },
    };

    if (this.options.features.includes("dark-mode")) {
      settings.default_theme_mode = {
        type: "select",
        label: "Default Theme Mode",
        options: ["Light", "Dark", "Auto"],
        default: "Light",
        group: "design",
      };
    }

    return settings;
  }

  /**
   * Crea templates
   */
  private async createTemplates(): Promise<void> {
    console.log("📄 Creating templates...");

    // home.tsx
    await this.createHomeTemplate();

    // blog.tsx
    await this.createBlogTemplate();

    // post.tsx
    await this.createPostTemplate();

    // page.tsx
    await this.createPageTemplate();

    console.log(colors.green("  ✓ Templates created\n"));
  }

  private async createHomeTemplate(): Promise<void> {
    const content = `import { html, type HomeTemplateProps, formatDate } from "../sdk/index.ts";
import { Header } from "../partials/Header.tsx";
import { Footer } from "../partials/Footer.tsx";
import { PostCard } from "../partials/PostCard.tsx";

export const HomeTemplate = (props: HomeTemplateProps) => {
  const { site, custom, featuredPosts, recentPosts } = props;

  return html\`
    <!DOCTYPE html>
    <html lang="\${site.language}">
      <head>
        <meta charset="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <title>\${site.name}</title>
        <meta name="description" content="\${site.description}" />
        <link rel="stylesheet" href="/themes/${this.options.name}/assets/css/${this.options.name}.css" />
      </head>
      <body>
        \${Header({ site, custom })}

        <main class="container mx-auto px-4 py-8">
          <section class="hero mb-12 text-center">
            <h1 class="text-4xl font-bold mb-4">\${site.name}</h1>
            <p class="text-xl text-gray-600">\${site.description}</p>
          </section>

          \${featuredPosts && featuredPosts.length > 0 ? html\`
            <section class="featured-posts mb-12">
              <h2 class="text-2xl font-bold mb-6">Featured Posts</h2>
              <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                \${featuredPosts.map(post => PostCard({ post, showExcerpt: true }))}
              </div>
            </section>
          \` : ''}

          \${recentPosts && recentPosts.length > 0 ? html\`
            <section class="recent-posts">
              <h2 class="text-2xl font-bold mb-6">Recent Posts</h2>
              <div class="space-y-4">
                \${recentPosts.map(post => PostCard({ post, size: "small" }))}
              </div>
            </section>
          \` : ''}
        </main>

        \${Footer({ site, custom })}

        <script src="/themes/${this.options.name}/assets/js/${this.options.name}.js"></script>
      </body>
    </html>
  \`;
};

export default HomeTemplate;
`;

    await Deno.writeTextFile(join(this.themePath, "templates", "home.tsx"), content);
  }

  private async createBlogTemplate(): Promise<void> {
    const content = `import { html, type BlogTemplateProps, renderPagination } from "../sdk/index.ts";
import { Header } from "../partials/Header.tsx";
import { Footer } from "../partials/Footer.tsx";
import { PostCard } from "../partials/PostCard.tsx";

export const BlogTemplate = (props: BlogTemplateProps) => {
  const { site, custom, posts, pagination } = props;

  return html\`
    <!DOCTYPE html>
    <html lang="\${site.language}">
      <head>
        <meta charset="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <title>Blog | \${site.name}</title>
        <link rel="stylesheet" href="/themes/${this.options.name}/assets/css/${this.options.name}.css" />
      </head>
      <body>
        \${Header({ site, custom })}

        <main class="container mx-auto px-4 py-8">
          <h1 class="text-3xl font-bold mb-8">Blog</h1>

          \${posts.length > 0 ? html\`
            <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
              \${posts.map(post => PostCard({ post, showExcerpt: true }))}
            </div>

            \${renderPagination(pagination, "/blog")}
          \` : html\`
            <p class="text-center text-gray-600">No posts found.</p>
          \`}
        </main>

        \${Footer({ site, custom })}

        <script src="/themes/${this.options.name}/assets/js/${this.options.name}.js"></script>
      </body>
    </html>
  \`;
};

export default BlogTemplate;
`;

    await Deno.writeTextFile(join(this.themePath, "templates", "blog.tsx"), content);
  }

  private async createPostTemplate(): Promise<void> {
    const content = `import { html, type PostTemplateProps, formatDate } from "../sdk/index.ts";
import { Header } from "../partials/Header.tsx";
import { Footer } from "../partials/Footer.tsx";

export const PostTemplate = (props: PostTemplateProps) => {
  const { site, custom, post } = props;

  return html\`
    <!DOCTYPE html>
    <html lang="\${site.language}">
      <head>
        <meta charset="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <title>\${post.title} | \${site.name}</title>
        <meta name="description" content="\${post.excerpt || ''}" />
        <link rel="stylesheet" href="/themes/${this.options.name}/assets/css/${this.options.name}.css" />
      </head>
      <body>
        \${Header({ site, custom })}

        <main class="container mx-auto px-4 py-8">
          <article class="max-w-3xl mx-auto">
            \${post.featuredImage ? html\`
              <img
                src="\${post.featuredImage}"
                alt="\${post.title}"
                class="w-full rounded-lg mb-8"
              />
            \` : ''}

            <header class="mb-8">
              <h1 class="text-4xl font-bold mb-4">\${post.title}</h1>

              <div class="flex items-center gap-4 text-gray-600">
                \${post.author ? html\`
                  <span>By \${post.author.name}</span>
                \` : ''}
                <time>\${formatDate(post.publishedAt)}</time>
                \${post.readingTime ? html\`
                  <span>\${post.readingTime} min read</span>
                \` : ''}
              </div>
            </header>

            <div class="prose prose-lg max-w-none">
              \${post.content}
            </div>
          </article>
        </main>

        \${Footer({ site, custom })}

        <script src="/themes/${this.options.name}/assets/js/${this.options.name}.js"></script>
      </body>
    </html>
  \`;
};

export default PostTemplate;
`;

    await Deno.writeTextFile(join(this.themePath, "templates", "post.tsx"), content);
  }

  private async createPageTemplate(): Promise<void> {
    const content = `import { html, type PageTemplateProps } from "../sdk/index.ts";
import { Header } from "../partials/Header.tsx";
import { Footer } from "../partials/Footer.tsx";

export const PageTemplate = (props: PageTemplateProps) => {
  const { site, custom, page } = props;

  return html\`
    <!DOCTYPE html>
    <html lang="\${site.language}">
      <head>
        <meta charset="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <title>\${page.title} | \${site.name}</title>
        <meta name="description" content="\${page.excerpt || ''}" />
        <link rel="stylesheet" href="/themes/${this.options.name}/assets/css/${this.options.name}.css" />
      </head>
      <body>
        \${Header({ site, custom })}

        <main class="container mx-auto px-4 py-8">
          <article class="max-w-4xl mx-auto">
            <header class="mb-8">
              <h1 class="text-4xl font-bold">\${page.title}</h1>
            </header>

            <div class="prose prose-lg max-w-none">
              \${page.content}
            </div>
          </article>
        </main>

        \${Footer({ site, custom })}

        <script src="/themes/${this.options.name}/assets/js/${this.options.name}.js"></script>
      </body>
    </html>
  \`;
};

export default PageTemplate;
`;

    await Deno.writeTextFile(join(this.themePath, "templates", "page.tsx"), content);
  }

  /**
   * Crea partials
   */
  private async createPartials(): Promise<void> {
    console.log("🧩 Creating partials...");

    // Header.tsx
    await this.createHeaderPartial();

    // Footer.tsx
    await this.createFooterPartial();

    // PostCard.tsx
    await this.createPostCardPartial();

    console.log(colors.green("  ✓ Partials created\n"));
  }

  private async createHeaderPartial(): Promise<void> {
    const content = `import { html, type HeaderProps, renderMenu } from "../sdk/index.ts";

export const Header = (props: HeaderProps) => {
  const { site, custom, menu } = props;

  return html\`
    <header class="bg-white shadow-sm">
      <div class="container mx-auto px-4 py-4">
        <div class="flex items-center justify-between">
          <div class="logo">
            <a href="/" class="text-2xl font-bold" style="color: \${custom.primary_color || '#0066cc'}">
              \${site.name}
            </a>
          </div>

          \${menu ? html\`
            <nav class="hidden md:block">
              \${renderMenu(menu, "main-menu")}
            </nav>
          \` : ''}

          <button class="md:hidden" id="mobile-menu-toggle">
            <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16"/>
            </svg>
          </button>
        </div>
      </div>
    </header>
  \`;
};
`;

    await Deno.writeTextFile(join(this.themePath, "partials", "Header.tsx"), content);
  }

  private async createFooterPartial(): Promise<void> {
    const content = `import { html, type FooterProps } from "../sdk/index.ts";

export const Footer = (props: FooterProps) => {
  const { site, custom } = props;

  return html\`
    <footer class="bg-gray-100 mt-12">
      <div class="container mx-auto px-4 py-8">
        <div class="text-center">
          <p class="text-gray-600">
            © \${new Date().getFullYear()} \${site.name}. All rights reserved.
          </p>
          <p class="text-sm text-gray-500 mt-2">
            Powered by LexCMS
          </p>
        </div>
      </div>
    </footer>
  \`;
};
`;

    await Deno.writeTextFile(join(this.themePath, "partials", "Footer.tsx"), content);
  }

  private async createPostCardPartial(): Promise<void> {
    const content = `import { html, type PostCardProps, formatDate } from "../sdk/index.ts";

export const PostCard = (props: PostCardProps) => {
  const {
    post,
    showExcerpt = false,
    showAuthor = true,
    showDate = true,
    showImage = true,
    size = "medium",
  } = props;

  return html\`
    <article class="post-card \${size}">
      \${showImage && post.featuredImage ? html\`
        <a href="/\${post.slug}">
          <img
            src="\${post.featuredImage}"
            alt="\${post.title}"
            class="w-full h-48 object-cover rounded-lg mb-4"
          />
        </a>
      \` : ''}

      <h3 class="text-xl font-bold mb-2">
        <a href="/\${post.slug}" class="hover:underline">
          \${post.title}
        </a>
      </h3>

      \${showExcerpt && post.excerpt ? html\`
        <p class="text-gray-600 mb-4">\${post.excerpt}</p>
      \` : ''}

      <div class="flex items-center gap-4 text-sm text-gray-500">
        \${showAuthor && post.author ? html\`
          <span>\${post.author.name}</span>
        \` : ''}
        \${showDate ? html\`
          <time>\${formatDate(post.publishedAt)}</time>
        \` : ''}
      </div>
    </article>
  \`;
};
`;

    await Deno.writeTextFile(join(this.themePath, "partials", "PostCard.tsx"), content);
  }

  /**
   * Crea helpers
   */
  private async createHelpers(): Promise<void> {
    console.log("🔧 Creating helpers...");

    const content = `/**
 * Theme helpers
 * Re-export helpers from default theme or add custom ones
 */

// Re-export all helpers from default theme
export * from "../default/helpers/index.ts";

// Add your custom helper functions here
// Example:
// export function customHelper() {
//   return "custom";
// }
`;

    await Deno.writeTextFile(join(this.themePath, "helpers", "index.ts"), content);

    console.log(colors.green("  ✓ Helpers created\n"));
  }

  /**
   * Crea assets
   */
  private async createAssets(): Promise<void> {
    console.log("🎨 Creating assets...");

    // CSS
    await this.createCSS();

    // JS
    await this.createJS();

    console.log(colors.green("  ✓ Assets created\n"));
  }

  private async createCSS(): Promise<void> {
    const useTailwind = this.options.cssFramework === "tailwind";

    const content = useTailwind
      ? `@tailwind base;
@tailwind components;
@tailwind utilities;

/* Custom styles */
:root {
  --primary-color: #0066cc;
  --secondary-color: #333333;
}

.main-menu {
  @apply flex gap-4;
}

.main-menu li a {
  @apply hover:text-blue-600 transition-colors;
}
`
      : `/* ${this.options.displayName} Theme Styles */

:root {
  --primary-color: #0066cc;
  --secondary-color: #333333;
  --font-family: 'Inter', sans-serif;
}

* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

body {
  font-family: var(--font-family);
  color: var(--secondary-color);
  line-height: 1.6;
}

.container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 1rem;
}

.main-menu {
  display: flex;
  gap: 1rem;
  list-style: none;
}

.main-menu li a {
  color: var(--secondary-color);
  text-decoration: none;
  transition: color 0.3s;
}

.main-menu li a:hover {
  color: var(--primary-color);
}

/* Add your custom styles here */
`;

    await Deno.writeTextFile(
      join(this.themePath, "assets", "css", `${this.options.name}.css`),
      content,
    );
  }

  private async createJS(): Promise<void> {
    const content = `/**
 * ${this.options.displayName} Theme JavaScript
 */

// Mobile menu toggle
document.addEventListener('DOMContentLoaded', () => {
  const toggle = document.getElementById('mobile-menu-toggle');
  const menu = document.querySelector('.main-menu');

  if (toggle && menu) {
    toggle.addEventListener('click', () => {
      menu.classList.toggle('active');
    });
  }
});

// Add your custom JavaScript here
`;

    await Deno.writeTextFile(
      join(this.themePath, "assets", "js", `${this.options.name}.js`),
      content,
    );
  }

  /**
   * Crea README
   */
  private async createReadme(): Promise<void> {
    console.log("📖 Creating README...");

    const content = `# ${this.options.displayName}

${this.options.description}

## Features

${this.options.features.map((f) => `- ${f.charAt(0).toUpperCase() + f.slice(1).replace("-", " ")}`).join("\n")}

## Installation

This theme is pre-installed with LexCMS.

## Development

### Build assets

\`\`\`bash
deno task theme:build --theme ${this.options.name} --minify
\`\`\`

### Watch for changes

\`\`\`bash
deno task theme:build --theme ${this.options.name} --watch
\`\`\`

### Validate theme

\`\`\`bash
deno task theme:validate --theme ${this.options.name}
\`\`\`

## Customization

Edit theme settings in the admin panel under Appearance > Themes.

## License

${this.options.license}

## Author

${this.options.author} (${this.options.email})
`;

    await Deno.writeTextFile(join(this.themePath, "README.md"), content);

    console.log(colors.green("  ✓ README created\n"));
  }

  /**
   * Crea CHANGELOG
   */
  private async createChangelog(): Promise<void> {
    console.log("📝 Creating CHANGELOG...");

    const content = `# Changelog

All notable changes to this theme will be documented in this file.

## [1.0.0] - ${new Date().toISOString().split("T")[0]}

### Added
- Initial release
- Basic templates (home, blog, post, page)
- Basic partials (header, footer, post card)
- Custom settings support
${this.options.features.map((f) => `- ${f.charAt(0).toUpperCase() + f.slice(1).replace("-", " ")} support`).join("\n")}
`;

    await Deno.writeTextFile(join(this.themePath, "CHANGELOG.md"), content);

    console.log(colors.green("  ✓ CHANGELOG created\n"));
  }

  /**
   * Imprime próximos pasos
   */
  private printNextSteps(): void {
    console.log(colors.cyan("Next steps:\n"));
    console.log(`  1. cd src/themes/${this.options.name}`);
    console.log(`  2. Edit theme.json to customize settings`);
    console.log(`  3. Run: deno task theme:build --theme ${this.options.name} --watch`);
    console.log(`  4. Activate the theme in admin panel`);
    console.log(`  5. Customize your theme!\n`);
  }
}

/**
 * Wizard interactivo
 */
async function runWizard(): Promise<ThemeOptions> {
  console.log(colors.bold.cyan("\n🎨 LexCMS Theme Generator\n"));

  const name = await Input.prompt({
    message: "Theme name (lowercase, no spaces):",
    validate: (value) => {
      if (!/^[a-z0-9-]+$/.test(value)) {
        return "Theme name must be lowercase letters, numbers, and hyphens only";
      }
      return true;
    },
  });

  const displayName = await Input.prompt({
    message: "Display name:",
    default: name.split("-").map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join(" "),
  });

  const description = await Input.prompt({
    message: "Description:",
    default: `A beautiful theme for LexCMS`,
  });

  const author = await Input.prompt({
    message: "Author name:",
    default: "Your Name",
  });

  const email = await Input.prompt({
    message: "Author email:",
    default: "you@example.com",
  });

  const license = await Select.prompt({
    message: "License:",
    options: ["MIT", "GPL-3.0", "Apache-2.0", "BSD-3-Clause", "ISC"],
    default: "MIT",
  });

  const isChildTheme = await Confirm.prompt({
    message: "Create as child theme?",
    default: false,
  });

  let parentTheme: string | undefined;
  if (isChildTheme) {
    // List available themes
    const { listAvailableThemes } = await import("../services/themeService.ts");
    const availableThemes = await listAvailableThemes();

    if (availableThemes.length === 0) {
      console.log(colors.yellow("⚠ No themes found. Creating standalone theme."));
    } else {
      parentTheme = await Select.prompt({
        message: "Parent theme:",
        options: availableThemes.map(t => ({ name: t, value: t })),
      });
    }
  }

  const template = await Select.prompt({
    message: "Base template:",
    options: [
      { name: "Blank", value: "blank" },
      { name: "Base", value: "base" },
      { name: "Default", value: "default" },
    ],
    default: isChildTheme ? "blank" : "base",
  });

  const features = await Checkbox.prompt({
    message: "Features:",
    options: [
      { name: "Dark mode support", value: "dark-mode", checked: true },
      { name: "Custom settings", value: "custom-settings", checked: true },
      { name: "Widgets", value: "widgets" },
      { name: "Comments", value: "comments" },
    ],
  });

  const colorScheme = await Select.prompt({
    message: "Color scheme:",
    options: [
      { name: "Light", value: "light" },
      { name: "Dark", value: "dark" },
      { name: "Both", value: "both" },
    ],
    default: "both",
  });

  const cssFramework = await Select.prompt({
    message: "CSS framework:",
    options: [
      { name: "Tailwind CSS", value: "tailwind" },
      { name: "Custom CSS", value: "custom" },
      { name: "None", value: "none" },
    ],
    default: "tailwind",
  });

  return {
    name,
    displayName,
    description,
    author,
    email,
    license,
    template: template as "blank" | "base" | "default",
    isChildTheme,
    parentTheme,
    features,
    colorScheme: colorScheme as "light" | "dark" | "both",
    cssFramework: cssFramework as "tailwind" | "custom" | "none",
  };
}

/**
 * Main CLI
 */
async function main() {
  const args = parse(Deno.args, {
    boolean: ["help", "interactive"],
    alias: {
      h: "help",
      i: "interactive",
    },
  });

  if (args.help) {
    console.log(`
Theme Generator CLI

Usage:
  deno task theme:create [options]

Options:
  -i, --interactive     Run interactive wizard (default)
  -h, --help            Show this help

Examples:
  deno task theme:create
  deno task theme:create --interactive
    `);
    Deno.exit(0);
  }

  try {
    const options = await runWizard();

    const generator = new ThemeGenerator(options);
    await generator.generate();
  } catch (error) {
    if (error.message === "User cancelled") {
      console.log(colors.yellow("\nTheme creation cancelled.\n"));
      Deno.exit(0);
    }
    console.error(colors.red(`\n✗ Error: ${error.message}\n`));
    Deno.exit(1);
  }
}

if (import.meta.main) {
  main();
}

export { ThemeGenerator };
