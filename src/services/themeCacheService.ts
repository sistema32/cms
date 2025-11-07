/**
 * Theme Cache Service - Sistema de caché inteligente para templates
 * Mejora el rendimiento cachéando templates compilados, configuraciones y assets
 */

import { createHash } from "../lib/utils/crypto.ts";
import type { ThemeConfig } from "./themeService.ts";

export interface CachedTemplate {
  module: any;
  hash: string;
  timestamp: number;
  path: string;
  size: number;
}

export interface CachedConfig {
  config: ThemeConfig;
  timestamp: number;
}

export interface CacheStats {
  templates: {
    total: number;
    hits: number;
    misses: number;
    hitRate: number;
  };
  configs: {
    total: number;
    hits: number;
    misses: number;
    hitRate: number;
  };
  memory: {
    templatesSize: number;
    configsSize: number;
    totalSize: number;
  };
}

class ThemeCacheService {
  private templateCache = new Map<string, CachedTemplate>();
  private configCache = new Map<string, CachedConfig>();
  private fileHashCache = new Map<string, string>();

  // Stats
  private stats = {
    templateHits: 0,
    templateMisses: 0,
    configHits: 0,
    configMisses: 0,
  };

  // Configuración
  private readonly TTL = 3600000; // 1 hora en producción
  private readonly MAX_CACHE_SIZE = 100; // Máximo de templates en caché
  private readonly ENABLE_CACHE = Deno.env.get("NODE_ENV") !== "development";

  /**
   * Obtiene un template desde caché o retorna null
   */
  async getCachedTemplate(path: string): Promise<any | null> {
    if (!this.ENABLE_CACHE) {
      return null; // En desarrollo, no usar caché
    }

    const cached = this.templateCache.get(path);
    if (!cached) {
      this.stats.templateMisses++;
      return null;
    }

    // Verificar si expiró
    if (this.isExpired(cached.timestamp)) {
      this.templateCache.delete(path);
      this.stats.templateMisses++;
      return null;
    }

    // Verificar si el archivo cambió
    const currentHash = await this.getFileHash(path);
    if (currentHash !== cached.hash) {
      this.templateCache.delete(path);
      this.stats.templateMisses++;
      return null;
    }

    this.stats.templateHits++;
    return cached.module;
  }

  /**
   * Cachea un template
   */
  async cacheTemplate(path: string, module: any): Promise<void> {
    if (!this.ENABLE_CACHE) return;

    // Limitar tamaño del caché
    if (this.templateCache.size >= this.MAX_CACHE_SIZE) {
      this.evictOldestTemplate();
    }

    const hash = await this.getFileHash(path);
    const stats = await Deno.stat(path);

    this.templateCache.set(path, {
      module,
      hash,
      timestamp: Date.now(),
      path,
      size: stats.size,
    });
  }

  /**
   * Obtiene una configuración desde caché
   */
  getCachedConfig(themeName: string): ThemeConfig | null {
    if (!this.ENABLE_CACHE) return null;

    const cached = this.configCache.get(themeName);
    if (!cached) {
      this.stats.configMisses++;
      return null;
    }

    if (this.isExpired(cached.timestamp)) {
      this.configCache.delete(themeName);
      this.stats.configMisses++;
      return null;
    }

    this.stats.configHits++;
    return cached.config;
  }

  /**
   * Cachea una configuración de theme
   */
  cacheConfig(themeName: string, config: ThemeConfig): void {
    if (!this.ENABLE_CACHE) return;

    this.configCache.set(themeName, {
      config,
      timestamp: Date.now(),
    });
  }

  /**
   * Invalida el caché de un theme específico
   */
  invalidateThemeCache(themeName: string): void {
    // Eliminar configuración
    this.configCache.delete(themeName);

    // Eliminar templates del theme
    const themePrefix = `/themes/${themeName}/`;
    for (const [path] of this.templateCache) {
      if (path.includes(themePrefix)) {
        this.templateCache.delete(path);
      }
    }

    console.log(`🗑️  Cache invalidated for theme: ${themeName}`);
  }

  /**
   * Invalida todo el caché
   */
  invalidateAll(): void {
    this.templateCache.clear();
    this.configCache.clear();
    this.fileHashCache.clear();
    console.log("🗑️  All cache cleared");
  }

  /**
   * Obtiene estadísticas del caché
   */
  getStats(): CacheStats {
    const templateHitRate = this.stats.templateHits + this.stats.templateMisses > 0
      ? (this.stats.templateHits /
        (this.stats.templateHits + this.stats.templateMisses)) * 100
      : 0;

    const configHitRate = this.stats.configHits + this.stats.configMisses > 0
      ? (this.stats.configHits /
        (this.stats.configHits + this.stats.configMisses)) * 100
      : 0;

    const templatesSize = Array.from(this.templateCache.values())
      .reduce((sum, t) => sum + t.size, 0);

    const configsSize = JSON.stringify(Array.from(this.configCache.values()))
      .length;

    return {
      templates: {
        total: this.templateCache.size,
        hits: this.stats.templateHits,
        misses: this.stats.templateMisses,
        hitRate: Math.round(templateHitRate * 100) / 100,
      },
      configs: {
        total: this.configCache.size,
        hits: this.stats.configHits,
        misses: this.stats.configMisses,
        hitRate: Math.round(configHitRate * 100) / 100,
      },
      memory: {
        templatesSize,
        configsSize,
        totalSize: templatesSize + configsSize,
      },
    };
  }

  /**
   * Pre-calienta el caché cargando templates comunes
   */
  async warmup(themeName: string, templates: string[]): Promise<void> {
    console.log(`🔥 Warming up cache for theme: ${themeName}`);

    for (const template of templates) {
      try {
        const path = `${Deno.cwd()}/src/themes/${themeName}/templates/${template}.tsx`;
        const module = await import(`file://${path}`);
        await this.cacheTemplate(path, module);
      } catch (error) {
        console.error(`Failed to warmup template ${template}:`, error);
      }
    }

    console.log(`✅ Cache warmed up with ${templates.length} templates`);
  }

  /**
   * Calcula hash de un archivo para detectar cambios
   */
  private async getFileHash(path: string): Promise<string> {
    // Usar caché de hashes para evitar leer el archivo múltiples veces
    const cached = this.fileHashCache.get(path);
    if (cached) return cached;

    try {
      const content = await Deno.readFile(path);
      const hash = createHash("SHA-256");
      hash.update(content);
      const hashValue = await hash.digest("hex");

      this.fileHashCache.set(path, hashValue);
      return hashValue;
    } catch {
      return "";
    }
  }

  /**
   * Verifica si un item expiró
   */
  private isExpired(timestamp: number): boolean {
    return Date.now() - timestamp > this.TTL;
  }

  /**
   * Elimina el template más antiguo del caché
   */
  private evictOldestTemplate(): void {
    let oldestKey: string | null = null;
    let oldestTime = Infinity;

    for (const [key, value] of this.templateCache) {
      if (value.timestamp < oldestTime) {
        oldestTime = value.timestamp;
        oldestKey = key;
      }
    }

    if (oldestKey) {
      this.templateCache.delete(oldestKey);
    }
  }

  /**
   * Reset de estadísticas
   */
  resetStats(): void {
    this.stats = {
      templateHits: 0,
      templateMisses: 0,
      configHits: 0,
      configMisses: 0,
    };
  }
}

// Singleton
export const themeCacheService = new ThemeCacheService();
