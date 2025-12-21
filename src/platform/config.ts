/**
 * Platform config facade
 * Centraliza la lectura de `env` y agrupa opciones derivadas en un único objeto.
 */
import { env } from "@/config/env.ts";

export type LimitsConfig = {
  requestMaxJsonBytes: number;
  requestMaxJsonDepth: number;
};

export type LoggingConfig = {
  level: string;
  pretty: boolean;
  enabled: boolean;
};

export type PlatformConfig = {
  env: typeof env;
  limits: LimitsConfig;
  logging: LoggingConfig;
};

export const appConfig: PlatformConfig = {
  env,
  limits: {
    requestMaxJsonBytes: env.REQUEST_MAX_JSON_BYTES,
    requestMaxJsonDepth: env.REQUEST_MAX_JSON_DEPTH,
  },
  logging: {
    level: env.LOG_LEVEL,
    pretty: env.LOG_PRETTY,
    enabled: env.LOG_ENABLED,
  },
};

export { env };
