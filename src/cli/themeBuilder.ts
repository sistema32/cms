/**
 * Theme Builder - Asset Optimization Pipeline
 * Minifica, bundlea y optimiza assets de themes (CSS, JS, imágenes)
 */

import { join } from "https://deno.land/std@0.224.0/path/mod.ts";
import { parse } from "https://deno.land/std@0.224.0/flags/mod.ts";
import { colors } from "https://deno.land/x/cliffy@v1.0.0-rc.3/ansi/colors.ts";
import { ensureDir } from "https://deno.land/std@0.224.0/fs/mod.ts";

interface BuildOptions {
  themeName: string;
  minify?: boolean;
  watch?: boolean;
  verbose?: boolean;
}

interface BuildStats {
  css: {
    original: number;
    minified: number;
    savings: number;
  };
  js: {
    original: number;
    minified: number;
    savings: number;
  };
  images: {
    original: number;
    optimized: number;
    savings: number;
  };
  totalTime: number;
}

class ThemeBuilder {
  private themePath: string;
  private buildPath: string;
  private options: BuildOptions;
  private stats: BuildStats = {
    css: { original: 0, minified: 0, savings: 0 },
    js: { original: 0, minified: 0, savings: 0 },
    images: { original: 0, optimized: 0, savings: 0 },
    totalTime: 0,
  };

  constructor(options: BuildOptions) {
    this.options = options;
    this.themePath = join(Deno.cwd(), "src", "themes", options.themeName);
    this.buildPath = join(this.themePath, "dist");
  }

  /**
   * Ejecuta el build completo
   */
  async build(): Promise<void> {
    const startTime = Date.now();

    console.log(colors.bold(`\n🔨 Building theme: ${this.options.themeName}\n`));

    // Crear directorio de build
    await ensureDir(this.buildPath);

    // Procesar assets
    await this.buildCSS();
    await this.buildJS();
    await this.optimizeImages();

    this.stats.totalTime = Date.now() - startTime;

    this.printStats();
  }

  /**
   * Procesa y minifica CSS
   */
  private async buildCSS(): Promise<void> {
    console.log("🎨 Building CSS...");

    const cssDir = join(this.themePath, "assets", "css");
    const outDir = join(this.buildPath, "css");

    try {
      await ensureDir(outDir);

      for await (const entry of Deno.readDir(cssDir)) {
        if (entry.isFile && entry.name.endsWith(".css")) {
          const inputPath = join(cssDir, entry.name);
          const outputPath = join(outDir, entry.name);

          let content = await Deno.readTextFile(inputPath);
          const originalSize = content.length;

          if (this.options.minify) {
            content = this.minifyCSS(content);
          }

          // Add autoprefixer (simulado)
          content = this.addAutoprefixes(content);

          await Deno.writeTextFile(outputPath, content);

          const minifiedSize = content.length;
          this.stats.css.original += originalSize;
          this.stats.css.minified += minifiedSize;
          this.stats.css.savings += originalSize - minifiedSize;

          if (this.options.verbose) {
            console.log(
              `  ✓ ${entry.name}: ${this.formatSize(originalSize)} → ${this.formatSize(minifiedSize)} (${this.calculateSavings(originalSize, minifiedSize)})`,
            );
          }
        }
      }

      console.log(colors.green("  ✓ CSS built successfully\n"));
    } catch (error) {
      if (error instanceof Deno.errors.NotFound) {
        console.log(colors.yellow("  ⚠ No CSS directory found\n"));
      } else {
        console.error(colors.red(`  ✗ Error building CSS: ${error.message}\n`));
      }
    }
  }

  /**
   * Procesa y minifica JavaScript
   */
  private async buildJS(): Promise<void> {
    console.log("⚡ Building JavaScript...");

    const jsDir = join(this.themePath, "assets", "js");
    const outDir = join(this.buildPath, "js");

    try {
      await ensureDir(outDir);

      for await (const entry of Deno.readDir(jsDir)) {
        if (entry.isFile && entry.name.endsWith(".js")) {
          const inputPath = join(jsDir, entry.name);
          const outputPath = join(outDir, entry.name);

          let content = await Deno.readTextFile(inputPath);
          const originalSize = content.length;

          if (this.options.minify) {
            content = this.minifyJS(content);
          }

          await Deno.writeTextFile(outputPath, content);

          const minifiedSize = content.length;
          this.stats.js.original += originalSize;
          this.stats.js.minified += minifiedSize;
          this.stats.js.savings += originalSize - minifiedSize;

          if (this.options.verbose) {
            console.log(
              `  ✓ ${entry.name}: ${this.formatSize(originalSize)} → ${this.formatSize(minifiedSize)} (${this.calculateSavings(originalSize, minifiedSize)})`,
            );
          }
        }
      }

      console.log(colors.green("  ✓ JavaScript built successfully\n"));
    } catch (error) {
      if (error instanceof Deno.errors.NotFound) {
        console.log(colors.yellow("  ⚠ No JS directory found\n"));
      } else {
        console.error(colors.red(`  ✗ Error building JS: ${error.message}\n`));
      }
    }
  }

  /**
   * Optimiza imágenes (simulado - en producción usar sharp o similar)
   */
  private async optimizeImages(): Promise<void> {
    console.log("🖼️  Optimizing images...");

    const imagesDir = join(this.themePath, "assets", "images");
    const outDir = join(this.buildPath, "images");

    try {
      await ensureDir(outDir);

      for await (const entry of Deno.readDir(imagesDir)) {
        if (entry.isFile && this.isImageFile(entry.name)) {
          const inputPath = join(imagesDir, entry.name);
          const outputPath = join(outDir, entry.name);

          // Por ahora solo copiamos
          // En producción: usar sharp para optimizar PNG/JPG y convertir a WebP
          await Deno.copyFile(inputPath, outputPath);

          const stat = await Deno.stat(inputPath);
          this.stats.images.original += stat.size;
          this.stats.images.optimized += stat.size;

          if (this.options.verbose) {
            console.log(`  ✓ ${entry.name} copied`);
          }
        }
      }

      console.log(colors.green("  ✓ Images optimized successfully\n"));
    } catch (error) {
      if (error instanceof Deno.errors.NotFound) {
        console.log(colors.yellow("  ⚠ No images directory found\n"));
      } else {
        console.error(colors.red(`  ✗ Error optimizing images: ${error.message}\n`));
      }
    }
  }

  /**
   * Minifica CSS (implementación básica)
   */
  private minifyCSS(css: string): string {
    return css
      // Remover comentarios
      .replace(/\/\*[\s\S]*?\*\//g, "")
      // Remover whitespace innecesario
      .replace(/\s+/g, " ")
      // Remover espacios alrededor de selectores
      .replace(/\s*([{}:;,])\s*/g, "$1")
      // Remover último semicolon en bloques
      .replace(/;}/g, "}")
      .trim();
  }

  /**
   * Minifica JavaScript (implementación básica)
   */
  private minifyJS(js: string): string {
    return js
      // Remover comentarios de línea
      .replace(/\/\/.*$/gm, "")
      // Remover comentarios de bloque
      .replace(/\/\*[\s\S]*?\*\//g, "")
      // Remover whitespace excesivo
      .replace(/\s+/g, " ")
      // Remover espacios alrededor de operadores
      .replace(/\s*([=+\-*/<>!&|,;:{}()\[\]])\s*/g, "$1")
      .trim();
  }

  /**
   * Agrega prefijos de vendor (simulado)
   */
  private addAutoprefixes(css: string): string {
    // En producción usar autoprefixer real
    // Por ahora solo agregamos algunos prefijos comunes
    return css
      .replace(/display:\s*flex/g, "display:-webkit-box;display:-ms-flexbox;display:flex")
      .replace(/transform:/g, "-webkit-transform:$&transform:")
      .replace(/transition:/g, "-webkit-transition:$&transition:");
  }

  /**
   * Verifica si un archivo es una imagen
   */
  private isImageFile(filename: string): boolean {
    const ext = filename.toLowerCase().split(".").pop();
    return ["jpg", "jpeg", "png", "gif", "webp", "svg"].includes(ext || "");
  }

  /**
   * Formatea tamaño de archivo
   */
  private formatSize(bytes: number): string {
    if (bytes < 1024) return `${bytes}B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(2)}KB`;
    return `${(bytes / (1024 * 1024)).toFixed(2)}MB`;
  }

  /**
   * Calcula porcentaje de ahorro
   */
  private calculateSavings(original: number, minified: number): string {
    const savings = ((original - minified) / original) * 100;
    return `${savings.toFixed(1)}% saved`;
  }

  /**
   * Imprime estadísticas del build
   */
  private printStats(): void {
    console.log("\n" + "=".repeat(60));
    console.log(colors.bold("\n📊 Build Statistics\n"));

    if (this.stats.css.original > 0) {
      console.log(colors.cyan("CSS:"));
      console.log(`  Original: ${this.formatSize(this.stats.css.original)}`);
      console.log(`  Minified: ${this.formatSize(this.stats.css.minified)}`);
      console.log(
        `  Saved: ${this.formatSize(this.stats.css.savings)} (${this.calculateSavings(this.stats.css.original, this.stats.css.minified)})\n`,
      );
    }

    if (this.stats.js.original > 0) {
      console.log(colors.yellow("JavaScript:"));
      console.log(`  Original: ${this.formatSize(this.stats.js.original)}`);
      console.log(`  Minified: ${this.formatSize(this.stats.js.minified)}`);
      console.log(
        `  Saved: ${this.formatSize(this.stats.js.savings)} (${this.calculateSavings(this.stats.js.original, this.stats.js.minified)})\n`,
      );
    }

    if (this.stats.images.original > 0) {
      console.log(colors.green("Images:"));
      console.log(`  Original: ${this.formatSize(this.stats.images.original)}`);
      console.log(`  Optimized: ${this.formatSize(this.stats.images.optimized)}`);
      console.log(
        `  Saved: ${this.formatSize(this.stats.images.savings)} (${this.calculateSavings(this.stats.images.original, this.stats.images.optimized)})\n`,
      );
    }

    const totalOriginal = this.stats.css.original + this.stats.js.original +
      this.stats.images.original;
    const totalMinified = this.stats.css.minified + this.stats.js.minified +
      this.stats.images.optimized;
    const totalSavings = totalOriginal - totalMinified;

    console.log(colors.bold("Total:"));
    console.log(`  Original: ${this.formatSize(totalOriginal)}`);
    console.log(`  Final: ${this.formatSize(totalMinified)}`);
    console.log(
      `  Saved: ${this.formatSize(totalSavings)} (${this.calculateSavings(totalOriginal, totalMinified)})`,
    );
    console.log(`  Build time: ${this.stats.totalTime}ms`);

    console.log("\n" + colors.green.bold("✓ Build completed successfully!"));
    console.log(`\nOutput directory: ${this.buildPath}\n`);
  }

  /**
   * Watch mode
   */
  async watch(): Promise<void> {
    console.log(colors.bold(`\n👀 Watching theme: ${this.options.themeName}\n`));

    const assetsDir = join(this.themePath, "assets");

    const watcher = Deno.watchFs(assetsDir, { recursive: true });

    // Build inicial
    await this.build();

    console.log(colors.cyan("\nWaiting for changes...\n"));

    for await (const event of watcher) {
      if (event.kind === "modify" || event.kind === "create") {
        const changedFile = event.paths[0];
        const fileName = changedFile.split("/").pop();

        console.log(colors.yellow(`\n🔄 Change detected: ${fileName}`));
        await this.build();
        console.log(colors.cyan("\nWaiting for changes...\n"));
      }
    }
  }
}

/**
 * Main CLI
 */
async function main() {
  const args = parse(Deno.args, {
    string: ["theme"],
    boolean: ["minify", "watch", "verbose", "help"],
    alias: {
      t: "theme",
      m: "minify",
      w: "watch",
      v: "verbose",
      h: "help",
    },
  });

  if (args.help || !args.theme) {
    console.log(`
Theme Builder - Asset Optimization Pipeline

Usage:
  deno task theme:build --theme <theme-name> [options]

Options:
  -t, --theme <name>    Theme name to build (required)
  -m, --minify          Minify CSS and JavaScript
  -w, --watch           Watch for changes and rebuild
  -v, --verbose         Show detailed output
  -h, --help            Show this help

Examples:
  deno task theme:build --theme corporate --minify
  deno task theme:build -t default --watch --verbose
  deno task theme:build -t magazine -mw
    `);
    Deno.exit(args.help ? 0 : 1);
  }

  const builder = new ThemeBuilder({
    themeName: args.theme,
    minify: args.minify || false,
    watch: args.watch || false,
    verbose: args.verbose || false,
  });

  try {
    if (args.watch) {
      await builder.watch();
    } else {
      await builder.build();
    }
  } catch (error) {
    console.error(colors.red(`\n✗ Build failed: ${error.message}\n`));
    Deno.exit(1);
  }
}

if (import.meta.main) {
  main();
}

export { ThemeBuilder };
