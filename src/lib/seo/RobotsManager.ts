/**
 * Robots.txt Manager
 * Manages robots.txt generation and configuration
 */

import type { RobotsConfig } from "./types.ts";
import { env } from "../../config/env.ts";

export class RobotsManager {
  private static instance: RobotsManager;
  private config: RobotsConfig;

  private constructor() {
    // Default robots.txt configuration
    this.config = {
      userAgents: [
        {
          userAgent: "*",
          allow: ["/"],
          disallow: ["/api/", `/${env.ADMIN_PATH}/`, "/*?*"],
        },
      ],
      sitemaps: [`${env.BASE_URL}/sitemap.xml`],
    };
  }

  static getInstance(): RobotsManager {
    if (!RobotsManager.instance) {
      RobotsManager.instance = new RobotsManager();
    }
    return RobotsManager.instance;
  }

  /**
   * Configure robots.txt
   */
  configure(config: Partial<RobotsConfig>): void {
    this.config = { ...this.config, ...config };
  }

  /**
   * Add user agent rules
   */
  addUserAgent(
    userAgent: string,
    options: {
      allow?: string[];
      disallow?: string[];
      crawlDelay?: number;
    }
  ): void {
    const existingIndex = this.config.userAgents.findIndex(
      (ua) => ua.userAgent === userAgent
    );

    if (existingIndex >= 0) {
      // Update existing
      this.config.userAgents[existingIndex] = {
        userAgent,
        ...options,
      };
    } else {
      // Add new
      this.config.userAgents.push({
        userAgent,
        ...options,
      });
    }
  }

  /**
   * Remove user agent rules
   */
  removeUserAgent(userAgent: string): void {
    this.config.userAgents = this.config.userAgents.filter(
      (ua) => ua.userAgent !== userAgent
    );
  }

  /**
   * Add sitemap URL
   */
  addSitemap(url: string): void {
    if (!this.config.sitemaps) {
      this.config.sitemaps = [];
    }
    if (!this.config.sitemaps.includes(url)) {
      this.config.sitemaps.push(url);
    }
  }

  /**
   * Remove sitemap URL
   */
  removeSitemap(url: string): void {
    if (this.config.sitemaps) {
      this.config.sitemaps = this.config.sitemaps.filter((s) => s !== url);
    }
  }

  /**
   * Generate robots.txt content
   */
  generate(): string {
    let content = "# Robots.txt for LexCMS\n\n";

    // User-agent rules
    for (const ua of this.config.userAgents) {
      content += `User-agent: ${ua.userAgent}\n`;

      // Allow rules
      if (ua.allow && ua.allow.length > 0) {
        for (const path of ua.allow) {
          content += `Allow: ${path}\n`;
        }
      }

      // Disallow rules
      if (ua.disallow && ua.disallow.length > 0) {
        for (const path of ua.disallow) {
          content += `Disallow: ${path}\n`;
        }
      }

      // Crawl delay
      if (ua.crawlDelay !== undefined) {
        content += `Crawl-delay: ${ua.crawlDelay}\n`;
      }

      content += "\n";
    }

    // Sitemaps
    if (this.config.sitemaps && this.config.sitemaps.length > 0) {
      for (const sitemap of this.config.sitemaps) {
        content += `Sitemap: ${sitemap}\n`;
      }
    }

    return content;
  }

  /**
   * Block specific bots (common bad bots)
   */
  blockBadBots(): void {
    const badBots = [
      "AhrefsBot",
      "SemrushBot",
      "DotBot",
      "MJ12bot",
      "BLEXBot",
      "PetalBot",
    ];

    for (const bot of badBots) {
      this.addUserAgent(bot, {
        disallow: ["/"],
      });
    }
  }

  /**
   * Allow specific search engines only
   */
  allowOnlySearchEngines(): void {
    // Block all by default
    this.config.userAgents = [
      {
        userAgent: "*",
        disallow: ["/"],
      },
    ];

    // Allow major search engines
    const searchEngines = [
      "Googlebot",
      "Bingbot",
      "Slurp", // Yahoo
      "DuckDuckBot",
      "Baiduspider",
      "YandexBot",
    ];

    for (const bot of searchEngines) {
      this.addUserAgent(bot, {
        allow: ["/"],
        disallow: ["/api/", `/${env.ADMIN_PATH}/`],
      });
    }
  }

  /**
   * Get current configuration
   */
  getConfig(): RobotsConfig {
    return { ...this.config };
  }
}

export const robotsManager = RobotsManager.getInstance();
