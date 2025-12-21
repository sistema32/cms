import { Context } from "hono";
import { ZodError } from "zod";
import { AppError, isAppError } from "@/platform/errors.ts";
import { createLogger } from "@/platform/logger.ts";

const log = createLogger("errorHandler");

export function errorHandler(err: Error, c: Context) {
  // Errores de validación de Zod
  if (err instanceof ZodError) {
    log.warn("Validation error", { path: c.req.path, errors: err.errors });
    return c.json(
      {
        error: "validation_error",
        message: "Datos inválidos",
        details: err.errors.map((e) => ({
          field: e.path.join("."),
          message: e.message,
        })),
      },
      400,
    );
  }

  // JSON mal formado
  if (
    err instanceof SyntaxError && err.message.toLowerCase().includes("json")
  ) {
    log.warn("Invalid JSON payload", { path: c.req.path });
    return c.json(
      {
        error: "invalid_json",
        message: "Payload JSON inválido",
      },
      400,
    );
  }

  if (isAppError(err)) {
    log.warn("Handled AppError", { code: err.code, status: err.status, path: c.req.path });
    // Hono espera el status como segundo argumento numérico
    return c.json(err.toResponse(), err.status as any);
  }

  // Error genérico
  log.error("Unhandled error", err);
  return c.json(
    {
      error: "internal_error",
      message: "Internal server error",
    },
    500,
  );
}
