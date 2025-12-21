import { Context } from "hono";
import * as permissionService from "@/services/auth/permissionService.ts";
import { z } from "zod";
import { AppError, parseNumericParam } from "@/platform/errors.ts";
import { getErrorMessage } from "@/utils/errors.ts";

// Esquemas de validación
const createPermissionSchema = z.object({
  module: z.string().min(2, "El módulo debe tener al menos 2 caracteres"),
  action: z.string().min(2, "La acción debe tener al menos 2 caracteres"),
  description: z.string().optional(),
});

const updatePermissionSchema = z.object({
  module: z.string().min(2).optional(),
  action: z.string().min(2).optional(),
  description: z.string().optional(),
});

/**
 * GET /api/permissions
 */
export async function getAllPermissions(c: Context) {
  try {
    const permissions = await permissionService.getAllPermissions();

    return c.json({
      success: true,
      data: permissions,
    });
  } catch (error) {
    const message = getErrorMessage(error);
    throw new AppError("permission_list_failed", message, 500);
  }
}

/**
 * GET /api/permissions/:id
 */
export async function getPermissionById(c: Context) {
  try {
    const id = parseNumericParam(c.req.param("id"), "ID");

    const permission = await permissionService.getPermissionById(id);

    return c.json({
      success: true,
      data: permission,
    });
  } catch (error) {
    const message = getErrorMessage(error);
    throw error instanceof AppError ? error : new AppError("permission_get_failed", message, 404);
  }
}

/**
 * GET /api/permissions/module/:module
 */
export async function getPermissionsByModule(c: Context) {
  try {
    const module = c.req.param("module");

    const permissions = await permissionService.getPermissionsByModule(module);

    return c.json({
      success: true,
      data: permissions,
    });
  } catch (error) {
    const message = getErrorMessage(error);
    throw new AppError("permission_module_failed", message, 500);
  }
}

/**
 * POST /api/permissions
 */
export async function createPermission(c: Context) {
  try {
    const body = await c.req.json();
    const data = createPermissionSchema.parse(body);

    const permission = await permissionService.createPermission(data);

    return c.json(
      {
        success: true,
        data: permission,
        message: "Permiso creado exitosamente",
      },
      201
    );
  } catch (error) {
    if (error instanceof z.ZodError) {
      throw AppError.fromCatalog("validation_error", { details: { issues: error.errors } });
    }
    const message = getErrorMessage(error);
    throw new AppError("permission_create_failed", message, 400);
  }
}

/**
 * PUT /api/permissions/:id
 */
export async function updatePermission(c: Context) {
  try {
    const id = parseNumericParam(c.req.param("id"), "ID");

    const body = await c.req.json();
    const data = updatePermissionSchema.parse(body);

    const permission = await permissionService.updatePermission(id, data);

    return c.json({
      success: true,
      data: permission,
      message: "Permiso actualizado exitosamente",
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      throw AppError.fromCatalog("validation_error", { details: { issues: error.errors } });
    }
    const message = getErrorMessage(error);
    throw new AppError("permission_update_failed", message, 400);
  }
}

/**
 * DELETE /api/permissions/:id
 */
export async function deletePermission(c: Context) {
  try {
    const id = parseNumericParam(c.req.param("id"), "ID");

    await permissionService.deletePermission(id);

    return c.json({
      success: true,
      message: "Permiso eliminado exitosamente",
    });
  } catch (error) {
    const message = getErrorMessage(error);
    throw new AppError("permission_delete_failed", message, 400);
  }
}

/**
 * GET /api/users/:userId/permissions
 */
export async function getUserPermissions(c: Context) {
  try {
    const userId = parseNumericParam(c.req.param("userId"), "User ID");

    const permissions = await permissionService.getUserPermissions(userId);

    return c.json({
      success: true,
      data: permissions,
    });
  } catch (error) {
    const message = getErrorMessage(error);
    throw new AppError("user_permissions_failed", message, 500);
  }
}

/**
 * GET /api/permissions/grouped
 */
export async function getPermissionsGrouped(c: Context) {
  try {
    const grouped = await permissionService.getPermissionsGroupedByModule();

    return c.json({
      success: true,
      data: grouped,
    });
  } catch (error) {
    const message = getErrorMessage(error);
    throw new AppError("permission_group_failed", message, 500);
  }
}

/**
 * GET /api/permissions/modules
 */
export async function getAllModules(c: Context) {
  try {
    const modules = await permissionService.getAllModules();

    return c.json({
      success: true,
      data: modules,
    });
  } catch (error) {
    const message = getErrorMessage(error);
    throw new AppError("permission_modules_failed", message, 500);
  }
}

/**
 * GET /api/permissions/stats
 */
export async function getPermissionStats(c: Context) {
  try {
    const stats = await permissionService.getPermissionStats();

    return c.json({
      success: true,
      data: stats,
    });
  } catch (error) {
    const message = getErrorMessage(error);
    throw new AppError("permission_stats_failed", message, 500);
  }
}

/**
 * GET /api/permissions/search?q=query
 */
export async function searchPermissions(c: Context) {
  try {
    const query = c.req.query("q");

    if (!query) {
      throw AppError.fromCatalog("validation_error", { message: "Query requerido" });
    }

    const permissions = await permissionService.searchPermissions(query);

    return c.json({
      success: true,
      data: permissions,
    });
  } catch (error) {
    const message = getErrorMessage(error);
    throw error instanceof AppError ? error : new AppError("permission_search_failed", message, 500);
  }
}
