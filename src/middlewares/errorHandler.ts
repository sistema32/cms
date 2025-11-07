import { Context } from "hono";
import { ZodError } from "zod";

export function errorHandler(err: Error, c: Context) {
  console.error("Error:", err);

  // Errores de validación de Zod
  if (err instanceof ZodError) {
    return c.json(
      {
        error: "Validation error",
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
    return c.json(
      {
        error: "Invalid JSON payload",
      },
      400,
    );
  }

  // Error genérico
  return c.json(
    {
      error: err.message || "Internal server error",
    },
    500,
  );
}
