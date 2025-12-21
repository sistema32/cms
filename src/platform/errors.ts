/**
 * AppError
 * Error tipificado con código y status HTTP opcional para respuestas uniformes.
 */
import { getErrorDefinition } from "./errorCatalog.ts";

export class AppError extends Error {
  readonly code: string;
  readonly status: number;
  readonly details?: unknown;
  override readonly cause?: Error;
  readonly trackingCode?: string;

  constructor(
    code: string,
    message?: string,
    status?: number,
    details?: unknown,
    cause?: Error,
  ) {
    const def = getErrorDefinition(code);
    const resolvedMessage = message ?? def?.message ?? code;
    const resolvedStatus = status ?? def?.status ?? 400;

    super(resolvedMessage);
    this.code = code;
    this.status = resolvedStatus;
    this.details = details;
    this.cause = cause;
    this.trackingCode = def?.trackingCode;
    this.name = "AppError";
  }

  static fromCatalog(
    code: string,
    options: {
      message?: string;
      status?: number;
      details?: Record<string, unknown>;
      cause?: Error;
      locale?: string;
    } = {},
  ) {
    const def = getErrorDefinition(code);
    const localeMessage = options.locale && def?.messages?.[options.locale]
      ? def.messages[options.locale]
      : undefined;
    return new AppError(
      code,
      options.message ?? localeMessage ?? def?.message ?? code,
      options.status ?? def?.status ?? 400,
      options.details,
      options.cause,
    );
  }

  toResponse() {
    return {
      error: this.code,
      message: this.message,
      details: this.details,
      trackingCode: this.trackingCode,
    };
  }
}

export function isAppError(error: unknown): error is AppError {
  return error instanceof AppError;
}

/**
 * Helper para asegurar presencia de valores requeridos.
 */
export function assertPresent<T>(value: T | null | undefined, code = "not_found", message = "Resource not found"): T {
  if (value === null || value === undefined) {
    throw new AppError(code, message, 404);
  }
  return value;
}

/**
 * Helper para parsear parámetros numéricos de forma segura.
 */
export function parseNumericParam(raw: string | undefined, label = "ID", status = 400): number {
  const num = Number(raw);
  if (Number.isNaN(num)) {
    throw AppError.fromCatalog("invalid_id", { message: `${label} inválido`, status });
  }
  return num;
}
