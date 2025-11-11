/**
 * Theme Validator and Linter CLI
 * Valida la estructura, configuración y código de themes
 */

import { join } from "@std/path";
import { parse } from "@std/flags";
import { colors } from "cliffy/ansi";

interface ValidationResult {
  valid: boolean;
  errors: ValidationError[];
  warnings: ValidationWarning[];
  score: number;
}

interface ValidationError {
  type: string;
  message: string;
  file?: string;
  line?: number;
}

interface ValidationWarning {
  type: string;
  message: string;
  file?: string;
  line?: number;
}

class ThemeValidator {
  private themePath: string;
  private themeName: string;
  private errors: ValidationError[] = [];
  private warnings: ValidationWarning[] = [];
  private score = 100;

  constructor(themeName: string) {
    this.themeName = themeName;
    this.themePath = join(Deno.cwd(), "src", "themes", themeName);
  }

  /**
   * Ejecuta todas las validaciones
   */
  async validate(): Promise<ValidationResult> {
    console.log(colors.bold(`\n🔍 Validating theme: ${this.themeName}\n`));

    // Validaciones
    await this.validateStructure();
    await this.validateThemeJson();
    await this.validateTemplates();
    await this.validatePartials();
    await this.validateAssets();
    await this.validateTypeScript();
    await this.validateAccessibility();
    await this.validateSecurity();

    const valid = this.errors.length === 0;

    return {
      valid,
      errors: this.errors,
      warnings: this.warnings,
      score: Math.max(0, this.score),
    };
  }

  /**
   * Valida que el theme tenga la estructura correcta
   */
  private async validateStructure(): Promise<void> {
    console.log("📁 Checking theme structure...");

    // Verificar que el directorio existe
    try {
      const stat = await Deno.stat(this.themePath);
      if (!stat.isDirectory) {
        this.addError("structure", `Theme path is not a directory: ${this.themePath}`);
        return;
      }
    } catch {
      this.addError("structure", `Theme directory not found: ${this.themePath}`);
      return;
    }

    // Verificar archivos requeridos
    const requiredFiles = [
      "theme.json",
      "templates/home.tsx",
      "partials/Header.tsx",
      "partials/Footer.tsx",
    ];

    for (const file of requiredFiles) {
      const filePath = join(this.themePath, file);
      try {
        await Deno.stat(filePath);
      } catch {
        this.addError("structure", `Required file missing: ${file}`);
      }
    }

    // Verificar directorios recomendados
    const recommendedDirs = ["templates", "partials", "assets", "helpers"];
    for (const dir of recommendedDirs) {
      const dirPath = join(this.themePath, dir);
      try {
        const stat = await Deno.stat(dirPath);
        if (!stat.isDirectory) {
          this.addWarning("structure", `Recommended directory missing: ${dir}`);
        }
      } catch {
        this.addWarning("structure", `Recommended directory missing: ${dir}`);
      }
    }

    console.log(colors.green("  ✓ Structure check completed\n"));
  }

  /**
   * Valida theme.json
   */
  private async validateThemeJson(): Promise<void> {
    console.log("📋 Validating theme.json...");

    const configPath = join(this.themePath, "theme.json");

    try {
      const content = await Deno.readTextFile(configPath);
      const config = JSON.parse(content);

      // Campos requeridos
      const requiredFields = [
        "name",
        "displayName",
        "version",
        "description",
        "author",
        "license",
        "config",
      ];

      for (const field of requiredFields) {
        if (!(field in config)) {
          this.addError("config", `Missing required field in theme.json: ${field}`);
        }
      }

      // Validar author
      if (config.author) {
        if (!config.author.name) {
          this.addError("config", "author.name is required in theme.json");
        }
        if (!config.author.email) {
          this.addWarning("config", "author.email is recommended in theme.json");
        }
      }

      // Validar version format (semver)
      if (config.version && !this.isValidSemver(config.version)) {
        this.addWarning("config", `Version should follow semver format: ${config.version}`);
      }

      // Validar config.posts_per_page
      if (!config.config?.posts_per_page) {
        this.addWarning("config", "config.posts_per_page is recommended");
      }

      // Validar custom settings
      if (config.config?.custom) {
        this.validateCustomSettings(config.config.custom);
      }

      console.log(colors.green("  ✓ theme.json validated\n"));
    } catch (error) {
      if (error instanceof SyntaxError) {
        this.addError("config", `Invalid JSON in theme.json: ${error.message}`);
      } else {
        this.addError("config", `Error reading theme.json: ${error.message}`);
      }
    }
  }

  /**
   * Valida custom settings
   */
  private validateCustomSettings(custom: Record<string, any>): void {
    const validTypes = ["text", "textarea", "boolean", "select", "color", "image", "url", "number"];

    for (const [key, setting] of Object.entries(custom)) {
      if (!setting.type) {
        this.addError("config", `Custom setting "${key}" missing type`);
      } else if (!validTypes.includes(setting.type)) {
        this.addError("config", `Custom setting "${key}" has invalid type: ${setting.type}`);
      }

      if (!setting.label) {
        this.addWarning("config", `Custom setting "${key}" missing label`);
      }

      if (setting.type === "select" && !setting.options) {
        this.addError("config", `Custom setting "${key}" of type select must have options`);
      }
    }
  }

  /**
   * Valida templates
   */
  private async validateTemplates(): Promise<void> {
    console.log("📄 Validating templates...");

    const templatesDir = join(this.themePath, "templates");

    try {
      for await (const entry of Deno.readDir(templatesDir)) {
        if (entry.isFile && entry.name.endsWith(".tsx")) {
          await this.validateTsxFile(join(templatesDir, entry.name), "template");
        }
      }
      console.log(colors.green("  ✓ Templates validated\n"));
    } catch {
      this.addError("templates", "Could not read templates directory");
    }
  }

  /**
   * Valida partials
   */
  private async validatePartials(): Promise<void> {
    console.log("🧩 Validating partials...");

    const partialsDir = join(this.themePath, "partials");

    try {
      for await (const entry of Deno.readDir(partialsDir)) {
        if (entry.isFile && entry.name.endsWith(".tsx")) {
          await this.validateTsxFile(join(partialsDir, entry.name), "partial");
        }
      }
      console.log(colors.green("  ✓ Partials validated\n"));
    } catch {
      this.addError("partials", "Could not read partials directory");
    }
  }

  /**
   * Valida un archivo TSX
   */
  private async validateTsxFile(filePath: string, type: "template" | "partial"): Promise<void> {
    try {
      const content = await Deno.readTextFile(filePath);
      const fileName = filePath.split("/").pop() || filePath;

      // Buscar exports inválidos
      if (!content.includes("export") && !content.includes("default")) {
        this.addWarning(type, `${fileName} doesn't export any component`);
      }

      // Buscar uso de html`` tagged template
      if (!content.includes("html`")) {
        this.addWarning(type, `${fileName} should use html\`\` tagged templates`);
      }

      // Detectar posibles problemas de seguridad
      if (content.includes("dangerouslySetInnerHTML")) {
        this.addWarning("security", `${fileName} uses dangerouslySetInnerHTML`);
        this.score -= 5;
      }

      // Detectar inline styles (no recomendado)
      if (content.match(/style="\{/)) {
        this.addWarning(type, `${fileName} uses inline styles (use CSS instead)`);
        this.score -= 2;
      }
    } catch (error) {
      this.addError(type, `Error reading ${filePath}: ${error.message}`);
    }
  }

  /**
   * Valida assets
   */
  private async validateAssets(): Promise<void> {
    console.log("🎨 Validating assets...");

    const assetsDir = join(this.themePath, "assets");

    try {
      await Deno.stat(assetsDir);

      // Verificar CSS
      const cssDir = join(assetsDir, "css");
      try {
        for await (const entry of Deno.readDir(cssDir)) {
          if (entry.isFile && entry.name.endsWith(".css")) {
            await this.validateCssFile(join(cssDir, entry.name));
          }
        }
      } catch {
        this.addWarning("assets", "No CSS directory found");
      }

      // Verificar JS
      const jsDir = join(assetsDir, "js");
      try {
        for await (const entry of Deno.readDir(jsDir)) {
          if (entry.isFile && entry.name.endsWith(".js")) {
            await this.validateJsFile(join(jsDir, entry.name));
          }
        }
      } catch {
        // JS es opcional
      }

      console.log(colors.green("  ✓ Assets validated\n"));
    } catch {
      this.addWarning("assets", "No assets directory found");
    }
  }

  /**
   * Valida archivos CSS
   */
  private async validateCssFile(filePath: string): Promise<void> {
    try {
      const content = await Deno.readTextFile(filePath);
      const fileName = filePath.split("/").pop() || filePath;

      // Detectar !important excesivo
      const importantCount = (content.match(/!important/g) || []).length;
      if (importantCount > 10) {
        this.addWarning("assets", `${fileName} has excessive !important (${importantCount})`);
        this.score -= 3;
      }

      // Verificar que no tenga sintaxis inválida obvia
      const openBraces = (content.match(/\{/g) || []).length;
      const closeBraces = (content.match(/\}/g) || []).length;
      if (openBraces !== closeBraces) {
        this.addError("assets", `${fileName} has unmatched braces`);
      }
    } catch (error) {
      this.addError("assets", `Error reading CSS file: ${error.message}`);
    }
  }

  /**
   * Valida archivos JavaScript
   */
  private async validateJsFile(filePath: string): Promise<void> {
    try {
      const content = await Deno.readTextFile(filePath);
      const fileName = filePath.split("/").pop() || filePath;

      // Detectar eval (problema de seguridad)
      if (content.includes("eval(")) {
        this.addError("security", `${fileName} uses eval() - security risk`);
        this.score -= 15;
      }

      // Detectar console.log
      const consoleCount = (content.match(/console\.(log|warn|error)/g) || []).length;
      if (consoleCount > 5) {
        this.addWarning("assets", `${fileName} has many console statements (${consoleCount})`);
        this.score -= 2;
      }
    } catch (error) {
      this.addError("assets", `Error reading JS file: ${error.message}`);
    }
  }

  /**
   * Valida TypeScript compilation
   */
  private async validateTypeScript(): Promise<void> {
    console.log("🔷 Checking TypeScript compilation...");

    try {
      // Intentar compilar templates
      const templatesDir = join(this.themePath, "templates");
      for await (const entry of Deno.readDir(templatesDir)) {
        if (entry.isFile && entry.name.endsWith(".tsx")) {
          const filePath = join(templatesDir, entry.name);
          try {
            await import(`file://${filePath}`);
          } catch (error) {
            this.addError("typescript", `Compilation error in ${entry.name}: ${error.message}`);
          }
        }
      }

      console.log(colors.green("  ✓ TypeScript check completed\n"));
    } catch {
      this.addWarning("typescript", "Could not validate TypeScript compilation");
    }
  }

  /**
   * Valida accesibilidad básica
   */
  private async validateAccessibility(): Promise<void> {
    console.log("♿ Checking accessibility...");

    const templatesDir = join(this.themePath, "templates");

    try {
      for await (const entry of Deno.readDir(templatesDir)) {
        if (entry.isFile && entry.name.endsWith(".tsx")) {
          const filePath = join(templatesDir, entry.name);
          const content = await Deno.readTextFile(filePath);

          // Buscar imágenes sin alt
          const imgMatches = content.matchAll(/<img[^>]*>/g);
          for (const match of imgMatches) {
            if (!match[0].includes("alt=")) {
              this.addWarning("accessibility", `${entry.name} has <img> without alt attribute`);
              this.score -= 3;
            }
          }

          // Buscar inputs sin label
          const inputMatches = content.matchAll(/<input[^>]*>/g);
          let hasLabel = false;
          for (const match of inputMatches) {
            // Verificar que haya un label antes o después
            const surroundingContent = content.slice(
              Math.max(0, match.index! - 200),
              Math.min(content.length, match.index! + 200),
            );
            if (surroundingContent.includes("<label") || match[0].includes("aria-label")) {
              hasLabel = true;
            }
          }

          if (!hasLabel && content.includes("<input")) {
            this.addWarning("accessibility", `${entry.name} may have inputs without labels`);
            this.score -= 2;
          }
        }
      }

      console.log(colors.green("  ✓ Accessibility check completed\n"));
    } catch {
      this.addWarning("accessibility", "Could not validate accessibility");
    }
  }

  /**
   * Valida seguridad
   */
  private async validateSecurity(): Promise<void> {
    console.log("🔒 Checking security...");

    const allFiles: string[] = [];

    // Recolectar todos los archivos TSX
    for (const dir of ["templates", "partials"]) {
      const dirPath = join(this.themePath, dir);
      try {
        for await (const entry of Deno.readDir(dirPath)) {
          if (entry.isFile && entry.name.endsWith(".tsx")) {
            allFiles.push(join(dirPath, entry.name));
          }
        }
      } catch {
        // Ignorar si el directorio no existe
      }
    }

    for (const filePath of allFiles) {
      const content = await Deno.readTextFile(filePath);
      const fileName = filePath.split("/").pop() || filePath;

      // Detectar posible XSS
      if (content.match(/\$\{[^}]*\}/g)) {
        const matches = content.match(/\$\{[^}]*\}/g) || [];
        for (const match of matches) {
          // Si no está escapado
          if (!match.includes("escape") && !match.includes("sanitize")) {
            this.addWarning("security", `${fileName} may have unescaped user input: ${match}`);
            this.score -= 5;
          }
        }
      }

      // Detectar imports de archivos del sistema
      if (content.includes("Deno.readFile") || content.includes("Deno.writeFile")) {
        this.addError("security", `${fileName} attempts file system access`);
        this.score -= 20;
      }

      // Detectar imports de servicios sensibles
      if (content.includes("../../../") || content.match(/\.\.\/\.\.\/\.\.\//)) {
        this.addWarning("security", `${fileName} has suspicious relative imports`);
        this.score -= 3;
      }
    }

    console.log(colors.green("  ✓ Security check completed\n"));
  }

  /**
   * Helpers
   */
  private addError(type: string, message: string, file?: string, line?: number): void {
    this.errors.push({ type, message, file, line });
    this.score -= 10;
  }

  private addWarning(type: string, message: string, file?: string, line?: number): void {
    this.warnings.push({ type, message, file, line });
    this.score -= 5;
  }

  private isValidSemver(version: string): boolean {
    return /^\d+\.\d+\.\d+(-[a-zA-Z0-9.-]+)?$/.test(version);
  }
}

/**
 * Imprime el resultado de la validación
 */
function printResult(result: ValidationResult): void {
  console.log("\n" + "=".repeat(60) + "\n");

  if (result.errors.length > 0) {
    console.log(colors.red.bold(`✗ ${result.errors.length} Errors found:\n`));
    for (const error of result.errors) {
      console.log(colors.red(`  • [${error.type}] ${error.message}`));
    }
    console.log("");
  }

  if (result.warnings.length > 0) {
    console.log(colors.yellow.bold(`⚠ ${result.warnings.length} Warnings found:\n`));
    for (const warning of result.warnings) {
      console.log(colors.yellow(`  • [${warning.type}] ${warning.message}`));
    }
    console.log("");
  }

  // Score
  const scoreColor = result.score >= 90
    ? colors.green
    : result.score >= 70
    ? colors.yellow
    : colors.red;

  console.log(scoreColor.bold(`Theme score: ${result.score}/100`));

  // Status
  if (result.valid) {
    console.log(colors.green.bold("\n✓ Theme is valid and ready for deployment!\n"));
  } else {
    console.log(colors.red.bold("\n✗ Theme has errors that must be fixed\n"));
  }
}

/**
 * Main CLI
 */
async function main() {
  const args = parse(Deno.args, {
    string: ["theme"],
    boolean: ["help", "json"],
    alias: {
      t: "theme",
      h: "help",
      j: "json",
    },
  });

  if (args.help || !args.theme) {
    console.log(`
Theme Validator CLI

Usage:
  deno task theme:validate --theme <theme-name>

Options:
  -t, --theme <name>    Theme name to validate (required)
  -j, --json            Output as JSON
  -h, --help            Show this help

Examples:
  deno task theme:validate --theme corporate
  deno task theme:validate -t default --json
    `);
    Deno.exit(args.help ? 0 : 1);
  }

  const validator = new ThemeValidator(args.theme);
  const result = await validator.validate();

  if (args.json) {
    console.log(JSON.stringify(result, null, 2));
  } else {
    printResult(result);
  }

  Deno.exit(result.valid ? 0 : 1);
}

if (import.meta.main) {
  main();
}

export { ThemeValidator };
