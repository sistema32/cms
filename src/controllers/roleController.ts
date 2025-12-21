import { Context } from "hono";
import * as roleService from "@/services/auth/roleService.ts";
import { z } from "zod";
import { AppError, parseNumericParam } from "@/platform/errors.ts";
import { getErrorMessage } from "@/utils/errors.ts";
import { createLogger } from "@/platform/logger.ts";

const log = createLogger("roleController");

// Esquemas de validación
const createRoleSchema = z.object({
  name: z.string().min(2, "El nombre debe tener al menos 2 caracteres"),
  description: z.string().optional(),
});

const updateRoleSchema = z.object({
  name: z.string().min(2).optional(),
  description: z.string().optional(),
});

const assignPermissionsSchema = z.object({
  permissionIds: z.array(z.number()).min(0),
});

/**
 * GET /api/roles
 */
export async function getAllRoles(c: Context) {
  try {
    const roles = await roleService.getAllRoles();

    return c.json({
      success: true,
      data: roles,
    });
  } catch (error) {
    log.error("Error al obtener roles", error instanceof Error ? error : undefined);
    throw new AppError("role_list_failed", getErrorMessage(error), 500);
  }
}

/**
 * GET /api/roles/:id
 */
export async function getRoleById(c: Context) {
  try {
    const id = parseNumericParam(c.req.param("id"), "ID de rol");

    const role = await roleService.getRoleById(id);

    if (!role) {
      throw new AppError("role_not_found", "Rol no encontrado", 404);
    }

    return c.json({
      success: true,
      data: role,
    });
  } catch (error) {
    if (error instanceof AppError) throw error;
    log.error("Error al obtener rol", error instanceof Error ? error : undefined);
    throw new AppError("role_get_failed", getErrorMessage(error), 404);
  }
}

/**
 * POST /api/roles
 */
export async function createRole(c: Context) {
  try {
    const body = await c.req.json();
    const data = createRoleSchema.parse(body);

    const role = await roleService.createRole(data);

    return c.json(
      {
        success: true,
      data: role,
      message: "Rol creado exitosamente",
    },
      201,
    );
  } catch (error) {
    if (error instanceof z.ZodError) {
      throw AppError.fromCatalog("validation_error", { details: { issues: error.errors } });
    }
    throw error instanceof AppError ? error : new AppError("role_create_failed", getErrorMessage(error), 400);
  }
}

/**
 * PUT /api/roles/:id
 */
export async function updateRole(c: Context) {
  try {
    const id = parseNumericParam(c.req.param("id"), "ID de rol");

    const body = await c.req.json();
    const data = updateRoleSchema.parse(body);

    const role = await roleService.updateRole(id, data);

    return c.json({
      success: true,
      data: role,
      message: "Rol actualizado exitosamente",
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      throw AppError.fromCatalog("validation_error", { details: { issues: error.errors } });
    }
    throw error instanceof AppError ? error : new AppError("role_update_failed", getErrorMessage(error), 400);
  }
}

/**
 * DELETE /api/roles/:id
 */
export async function deleteRole(c: Context) {
  try {
    const id = parseNumericParam(c.req.param("id"), "ID de rol");

    await roleService.deleteRole(id);

    return c.json({
      success: true,
      message: "Rol eliminado exitosamente",
    });
  } catch (error) {
    log.error("Error al eliminar rol", error instanceof Error ? error : undefined);
    throw error instanceof AppError ? error : new AppError("role_delete_failed", getErrorMessage(error), 400);
  }
}

/**
 * POST /api/roles/:id/permissions
 */
export async function assignPermissionsToRole(c: Context) {
  try {
    const id = parseNumericParam(c.req.param("id"), "ID de rol");

    const body = await c.req.json();
    const data = assignPermissionsSchema.parse(body);

    const role = await roleService.assignPermissionsToRole(
      id,
      data.permissionIds,
    );

    return c.json({
      success: true,
      data: role,
      message: "Permisos asignados exitosamente",
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      throw AppError.fromCatalog("validation_error", { details: { issues: error.errors } });
    }
    throw error instanceof AppError ? error : new AppError("role_permissions_assign_failed", getErrorMessage(error), 400);
  }
}

/**
 * GET /api/roles/:id/permissions
 */
export async function getRolePermissions(c: Context) {
  try {
    const id = parseNumericParam(c.req.param("id"), "ID de rol");

    const permissions = await roleService.getRolePermissions(id);

    return c.json({
      success: true,
      data: permissions,
    });
  } catch (error) {
    throw error instanceof AppError ? error : new AppError("role_permissions_get_failed", getErrorMessage(error), 404);
  }
}

/**
 * GET /api/roles/stats
 */
export async function getRoleStats(c: Context) {
  try {
    const stats = await roleService.getRoleStats();

    return c.json({
      success: true,
      data: stats,
    });
  } catch (error) {
    throw new AppError("role_stats_failed", getErrorMessage(error), 500);
  }
}

/**
 * GET /api/roles/:id/with-stats
 */
export async function getRoleWithStats(c: Context) {
  try {
    const id = parseNumericParam(c.req.param("id"), "ID de rol");

    const role = await roleService.getRoleByIdWithStats(id);

    return c.json({
      success: true,
      data: role,
    });
  } catch (error) {
    throw error instanceof AppError ? error : new AppError("role_get_failed", getErrorMessage(error), 404);
  }
}

/**
 * GET /api/roles/all-with-stats
 */
export async function getAllRolesWithStats(c: Context) {
  try {
    const roles = await roleService.getAllRolesWithStats();

    return c.json({
      success: true,
      data: roles,
    });
  } catch (error) {
    throw new AppError("role_list_failed", getErrorMessage(error), 500);
  }
}

/**
 * POST /api/roles/:id/permissions/add
 */
export async function addPermissionToRole(c: Context) {
  try {
    const id = parseNumericParam(c.req.param("id"), "ID de rol");

    const body = await c.req.json();
    const { permissionId } = z.object({ permissionId: z.number() }).parse(body);

    const role = await roleService.addPermissionToRole(id, Number(permissionId));

    return c.json({
      success: true,
      data: role,
      message: "Permiso agregado exitosamente",
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      throw AppError.fromCatalog("validation_error", { details: { issues: error.errors } });
    }
    throw error instanceof AppError ? error : new AppError("role_permission_add_failed", getErrorMessage(error), 400);
  }
}

/**
 * POST /api/roles/:id/permissions/remove
 */
export async function removePermissionFromRole(c: Context) {
  try {
    const id = parseNumericParam(c.req.param("id"), "ID de rol");

    const body = await c.req.json();
    const { permissionId } = z.object({ permissionId: z.number() }).parse(body);

    const role = await roleService.removePermissionFromRole(id, Number(permissionId));

    return c.json({
      success: true,
      data: role,
      message: "Permiso removido exitosamente",
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      throw AppError.fromCatalog("validation_error", { details: { issues: error.errors } });
    }
    throw error instanceof AppError ? error : new AppError("role_permission_remove_failed", getErrorMessage(error), 400);
  }
}

/**
 * POST /api/roles/:id/clone
 */
export async function cloneRole(c: Context) {
  try {
    const id = parseNumericParam(c.req.param("id"), "ID de rol");

    const body = await c.req.json();
    const { name, description } = z.object({
      name: z.string().min(1, "Nombre requerido"),
      description: z.string().optional(),
    }).parse(body);

    const role = await roleService.cloneRole(id, name, description);

    return c.json({
      success: true,
      data: role,
      message: "Rol clonado exitosamente",
    }, 201);
  } catch (error) {
    if (error instanceof z.ZodError) {
      throw AppError.fromCatalog("validation_error", { details: { issues: error.errors } });
    }
    throw error instanceof AppError ? error : new AppError("role_clone_failed", getErrorMessage(error), 400);
  }
}
