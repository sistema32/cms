import { Context } from "hono";
import * as authService from "../services/authService.ts";
import { loginSchema, registerSchema } from "../utils/validation.ts";

/**
 * POST /api/auth/register
 */
export async function register(c: Context) {
  try {
    let body: unknown;
    try {
      body = await c.req.json();
    } catch (error) {
      if (error instanceof SyntaxError) {
        return c.json(
          { success: false, error: "Invalid JSON payload" },
          400,
        );
      }
      throw error;
    }
    const data = registerSchema.parse(body);

    const result = await authService.register(data);

    return c.json(
      {
        success: true,
        data: result,
        message: "Usuario registrado exitosamente",
      },
      201,
    );
  } catch (error) {
    if (error instanceof SyntaxError) {
      return c.json(
        { success: false, error: "Invalid JSON payload" },
        400,
      );
    }
    const message = error instanceof Error
      ? error.message
      : "Error al registrar usuario";
    return c.json({ success: false, error: message }, 400);
  }
}

/**
 * POST /api/auth/login
 */
export async function login(c: Context) {
  try {
    let body: unknown;
    try {
      body = await c.req.json();
    } catch (error) {
      if (error instanceof SyntaxError) {
        return c.json(
          { success: false, error: "Invalid JSON payload" },
          400,
        );
      }
      throw error;
    }
    const data = loginSchema.parse(body);

    // Obtener IP y User-Agent para logs de seguridad
    const ip = c.req.header("x-forwarded-for") || c.req.header("x-real-ip");
    const userAgent = c.req.header("user-agent");

    const result = await authService.login(data, ip, userAgent);

    return c.json({
      success: true,
      data: result,
      message: result.requires2FA
        ? "Autenticación parcial. Se requiere código 2FA"
        : "Login exitoso",
    });
  } catch (error) {
    if (error instanceof SyntaxError) {
      return c.json(
        { success: false, error: "Invalid JSON payload" },
        400,
      );
    }
    const message = error instanceof Error
      ? error.message
      : "Error al iniciar sesión";
    return c.json({ success: false, error: message }, 401);
  }
}

/**
 * GET /api/auth/me
 */
export async function me(c: Context) {
  const user = c.get("user");

  return c.json({
    success: true,
    data: user,
  });
}
