import { Context, Next } from "hono";
import { userHasPermission } from "../services/permissionService.ts";
import { logPermissionDenied, logUnauthorizedAccess } from "../utils/securityLogger.ts";

/**
 * Middleware para verificar permisos
 * @param module - Módulo del permiso (ej: "users", "roles")
 * @param action - Acción del permiso (ej: "create", "read", "update", "delete")
 */
export function requirePermission(module: string, action: string) {
  return async (c: Context, next: Next) => {
    const user = c.get("user");

    if (!user) {
      return c.json({ error: "No autorizado" }, 401);
    }

    const hasPermission = await userHasPermission(user.userId, module, action);

    if (!hasPermission) {
      // Log de seguridad
      const ip = c.req.header("x-forwarded-for") || c.req.header("x-real-ip");
      await logPermissionDenied(user.userId, `${module}:${action}`, ip);

      return c.json(
        {
          error: "No tienes permiso para realizar esta acción",
          required: { module, action },
        },
        403
      );
    }

    await next();
  };
}

/**
 * Middleware para verificar si es superadmin o usuario ID 1
 */
export function requireSuperAdmin() {
  return async (c: Context, next: Next) => {
    const user = c.get("user");

    if (!user) {
      return c.json({ error: "No autorizado" }, 401);
    }

    // Usuario ID 1 o superadmin
    const isSuperAdmin = user.userId === 1;

    if (!isSuperAdmin) {
      // Verificar si tiene rol superadmin
      const hasPermission = await userHasPermission(
        user.userId,
        "roles",
        "create"
      );

      if (!hasPermission) {
        return c.json(
          { error: "Solo superadmin puede realizar esta acción" },
          403
        );
      }
    }

    await next();
  };
}

/**
 * Middleware para permitir acceso público (guest)
 * Verifica permisos de guest si no hay usuario autenticado
 */
export function allowPublic(module: string, action: string) {
  return async (c: Context, next: Next) => {
    const user = c.get("user");

    // Si hay usuario autenticado, verificar sus permisos
    if (user) {
      const hasPermission = await userHasPermission(
        user.userId,
        module,
        action
      );

      if (!hasPermission) {
        return c.json(
          {
            error: "No tienes permiso para realizar esta acción",
            required: { module, action },
          },
          403
        );
      }
    }
    // Si no hay usuario, permitir acceso (guest)
    // El endpoint debe manejar qué información mostrar a usuarios públicos

    await next();
  };
}
