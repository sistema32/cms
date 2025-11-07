import { Context, Next } from "hono";
import {
  hasPermission,
  hasAnyPermission,
  hasAllPermissions,
  isSuperAdmin,
  hasRole,
} from "../services/authorizationService.ts";
import { auditLogs } from "../db/schema.ts";
import { db } from "../config/db.ts";

/**
 * Middleware que requiere un permiso específico
 */
export function requirePermission(module: string, action: string) {
  return async (c: Context, next: Next) => {
    const user = c.get("user");

    if (!user) {
      return c.json({ error: "No autorizado" }, 401);
    }

    const hasAccess = await hasPermission(user.userId, module, action);

    if (!hasAccess) {
      // Log de intento de acceso no autorizado
      try {
        await db.insert(auditLogs).values({
          userId: user.userId,
          userEmail: user.email,
          action: "access_denied",
          entity: module,
          entityId: null,
          description: `Intento de acceso denegado: ${module}.${action}`,
          level: "warning",
          ipAddress: c.req.header("x-forwarded-for") || c.req.header("x-real-ip") || "unknown",
          userAgent: c.req.header("user-agent") || "unknown",
        });
      } catch (error) {
        console.error("Error al registrar intento de acceso:", error);
      }

      return c.json({
        error: "Acceso denegado",
        message: `No tienes permiso para: ${module}.${action}`,
      }, 403);
    }

    await next();
  };
}

/**
 * Middleware que requiere CUALQUIERA de los permisos especificados
 */
export function requireAnyPermission(
  permissions: Array<{ module: string; action: string }>
) {
  return async (c: Context, next: Next) => {
    const user = c.get("user");

    if (!user) {
      return c.json({ error: "No autorizado" }, 401);
    }

    const hasAccess = await hasAnyPermission(user.userId, permissions);

    if (!hasAccess) {
      const permList = permissions.map(p => `${p.module}.${p.action}`).join(", ");
      return c.json({
        error: "Acceso denegado",
        message: `Requiere al menos uno de estos permisos: ${permList}`,
      }, 403);
    }

    await next();
  };
}

/**
 * Middleware que requiere TODOS los permisos especificados
 */
export function requireAllPermissions(
  permissions: Array<{ module: string; action: string }>
) {
  return async (c: Context, next: Next) => {
    const user = c.get("user");

    if (!user) {
      return c.json({ error: "No autorizado" }, 401);
    }

    const hasAccess = await hasAllPermissions(user.userId, permissions);

    if (!hasAccess) {
      const permList = permissions.map(p => `${p.module}.${p.action}`).join(", ");
      return c.json({
        error: "Acceso denegado",
        message: `Requiere todos estos permisos: ${permList}`,
      }, 403);
    }

    await next();
  };
}

/**
 * Middleware que requiere un rol específico
 */
export function requireRole(roleName: string) {
  return async (c: Context, next: Next) => {
    const user = c.get("user");

    if (!user) {
      return c.json({ error: "No autorizado" }, 401);
    }

    const hasRequiredRole = await hasRole(user.userId, roleName);

    if (!hasRequiredRole) {
      return c.json({
        error: "Acceso denegado",
        message: `Requiere el rol: ${roleName}`,
      }, 403);
    }

    await next();
  };
}

/**
 * Middleware que requiere ser superadministrador
 */
export function requireSuperAdmin() {
  return async (c: Context, next: Next) => {
    const user = c.get("user");

    if (!user) {
      return c.json({ error: "No autorizado" }, 401);
    }

    const isSuperAdminUser = await isSuperAdmin(user.userId);

    if (!isSuperAdminUser) {
      return c.json({
        error: "Acceso denegado",
        message: "Solo superadministradores pueden acceder a este recurso",
      }, 403);
    }

    await next();
  };
}

/**
 * Middleware que requiere acceso al dashboard
 */
export function requireDashboardAccess() {
  return requirePermission("dashboard", "access");
}

/**
 * Middleware para verificar propiedad de recursos
 * Útil para permitir que usuarios editen solo su propio contenido
 */
export function requireOwnershipOr(module: string, action: string) {
  return async (c: Context, next: Next) => {
    const user = c.get("user");

    if (!user) {
      return c.json({ error: "No autorizado" }, 401);
    }

    // Los superadmin siempre pueden acceder
    if (await isSuperAdmin(user.userId)) {
      await next();
      return;
    }

    // Verificar si tiene el permiso general (para acceder a recursos de otros)
    const hasGeneralPermission = await hasPermission(user.userId, module, action);

    if (hasGeneralPermission) {
      await next();
      return;
    }

    // Si no tiene el permiso general, debe ser el dueño del recurso
    // Esto debe verificarse en el controlador usando el resourceOwnerId
    // Aquí solo verificamos que tenga el permiso base para su propio contenido
    const hasOwnPermission = await hasPermission(user.userId, module, `${action}_own`);

    if (!hasOwnPermission) {
      return c.json({
        error: "Acceso denegado",
        message: "No tienes permiso para realizar esta acción",
      }, 403);
    }

    await next();
  };
}

/**
 * Middleware para permitir acceso público o autenticado
 * Si el usuario está autenticado, se continúa normal
 * Si no está autenticado, se continúa como usuario público
 */
export function optionalAuth() {
  return async (c: Context, next: Next) => {
    // Si hay usuario autenticado, continuar
    const user = c.get("user");
    if (user) {
      await next();
      return;
    }

    // Si no hay usuario, continuar sin autenticación
    // (útil para endpoints que pueden ser públicos o privados)
    await next();
  };
}

/**
 * Helper para crear middleware personalizado con lógica compleja
 */
export function requireCustom(
  checkFn: (userId: number, context: Context) => Promise<boolean>,
  errorMessage = "Acceso denegado"
) {
  return async (c: Context, next: Next) => {
    const user = c.get("user");

    if (!user) {
      return c.json({ error: "No autorizado" }, 401);
    }

    const hasAccess = await checkFn(user.userId, c);

    if (!hasAccess) {
      return c.json({
        error: "Acceso denegado",
        message: errorMessage,
      }, 403);
    }

    await next();
  };
}

/**
 * Middleware para limitar acceso por estado del usuario
 */
export function requireActiveUser() {
  return async (c: Context, next: Next) => {
    const user = c.get("user");

    if (!user) {
      return c.json({ error: "No autorizado" }, 401);
    }

    // Aquí podrías verificar el estado del usuario en la base de datos
    // Por ahora asumimos que si tiene token válido, está activo

    await next();
  };
}
