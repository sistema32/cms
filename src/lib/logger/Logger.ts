/**
 * Logger
 * Centralized logging service with configurable levels and formatting
 */

import type { Logger, LoggerConfig, LogLevel, LogEntry } from "./types.ts";

const LOG_LEVELS: Record<LogLevel, number> = {
  debug: 0,
  info: 1,
  warn: 2,
  error: 3,
};

const LOG_COLORS: Record<LogLevel, string> = {
  debug: "\x1b[36m", // Cyan
  info: "\x1b[32m",  // Green
  warn: "\x1b[33m",  // Yellow
  error: "\x1b[31m", // Red
};

const RESET_COLOR = "\x1b[0m";

export class LoggerService implements Logger {
  private config: LoggerConfig;

  constructor(config?: Partial<LoggerConfig>) {
    this.config = {
      level: (config?.level as LogLevel) || "info",
      pretty: config?.pretty ?? true,
      enabled: config?.enabled ?? true,
    };
  }

  /**
   * Update logger configuration
   */
  configure(config: Partial<LoggerConfig>): void {
    this.config = { ...this.config, ...config };
  }

  /**
   * Check if a log level should be logged
   */
  private shouldLog(level: LogLevel): boolean {
    if (!this.config.enabled) return false;
    return LOG_LEVELS[level] >= LOG_LEVELS[this.config.level];
  }

  /**
   * Format log entry for output
   */
  private formatEntry(entry: LogEntry): string {
    const timestamp = entry.timestamp.toISOString();
    const level = entry.level.toUpperCase().padEnd(5);

    if (!this.config.pretty) {
      // JSON format for production/parsing
      return JSON.stringify({
        timestamp,
        level: entry.level,
        message: entry.message,
        ...entry.meta,
        error: entry.error ? {
          message: entry.error.message,
          stack: entry.error.stack,
          name: entry.error.name,
        } : undefined,
      });
    }

    // Pretty format for development
    const color = LOG_COLORS[entry.level];
    let output = `${color}[${timestamp}] ${level}${RESET_COLOR} ${entry.message}`;

    if (entry.meta && Object.keys(entry.meta).length > 0) {
      output += `\n  ${JSON.stringify(entry.meta, null, 2)}`;
    }

    if (entry.error) {
      output += `\n  ${color}Error:${RESET_COLOR} ${entry.error.message}`;
      if (entry.error.stack) {
        output += `\n${entry.error.stack}`;
      }
    }

    return output;
  }

  /**
   * Write log entry to output
   */
  private log(level: LogLevel, message: string, error?: Error, meta?: Record<string, unknown>): void {
    if (!this.shouldLog(level)) return;

    const entry: LogEntry = {
      level,
      message,
      timestamp: new Date(),
      meta,
      error,
    };

    const formatted = this.formatEntry(entry);

    // Output to appropriate console method
    switch (level) {
      case "debug":
        console.debug(formatted);
        break;
      case "info":
        console.info(formatted);
        break;
      case "warn":
        console.warn(formatted);
        break;
      case "error":
        console.error(formatted);
        break;
    }
  }

  /**
   * Log debug message
   */
  debug(message: string, meta?: Record<string, unknown>): void {
    this.log("debug", message, undefined, meta);
  }

  /**
   * Log info message
   */
  info(message: string, meta?: Record<string, unknown>): void {
    this.log("info", message, undefined, meta);
  }

  /**
   * Log warning message
   */
  warn(message: string, meta?: Record<string, unknown>): void {
    this.log("warn", message, undefined, meta);
  }

  /**
   * Log error message
   */
  error(message: string, error?: Error, meta?: Record<string, unknown>): void {
    this.log("error", message, error, meta);
  }
}

// Export singleton instance
export const logger = new LoggerService({
  level: (Deno.env.get("LOG_LEVEL") as LogLevel) || "info",
  pretty: Deno.env.get("LOG_PRETTY") !== "false",
  enabled: Deno.env.get("LOG_ENABLED") !== "false",
});
