/**
 * Logger facade
 * Provee loggers con contexto y formato uniforme sobre el logger central.
 */
import { logger as baseLogger } from "@/lib/logger/index.ts";

type LogMeta = Record<string, unknown>;

export function createLogger(scope?: string) {
  const withScope = (meta?: LogMeta) =>
    scope ? { ...meta, scope } : meta;

  return {
    debug: (message: string, meta?: LogMeta) => baseLogger.debug(message, withScope(meta)),
    info: (message: string, meta?: LogMeta) => baseLogger.info(message, withScope(meta)),
    warn: (message: string, meta?: LogMeta) => baseLogger.warn(message, withScope(meta)),
    error: (message: string, error?: Error, meta?: LogMeta) => baseLogger.error(message, error, withScope(meta)),
  };
}

// Logger global con scope genérico para uso rápido
export const logger = createLogger("app");
