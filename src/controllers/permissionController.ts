import { Context } from "hono";
import * as permissionService from "../services/permissionService.ts";
import { z } from "zod";

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
    const message = error instanceof Error
      ? error.message
      : "Error al obtener permisos";
    return c.json({ success: false, error: message }, 500);
  }
}

/**
 * GET /api/permissions/:id
 */
export async function getPermissionById(c: Context) {
  try {
    const id = Number(c.req.param("id"));

    if (isNaN(id)) {
      return c.json({ success: false, error: "ID inválido" }, 400);
    }

    const permission = await permissionService.getPermissionById(id);

    return c.json({
      success: true,
      data: permission,
    });
  } catch (error) {
    const message = error instanceof Error
      ? error.message
      : "Error al obtener permiso";
    return c.json({ success: false, error: message }, 404);
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
    const message = error instanceof Error
      ? error.message
      : "Error al obtener permisos";
    return c.json({ success: false, error: message }, 500);
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
    const message = error instanceof Error
      ? error.message
      : "Error al crear permiso";
    return c.json({ success: false, error: message }, 400);
  }
}

/**
 * PUT /api/permissions/:id
 */
export async function updatePermission(c: Context) {
  try {
    const id = Number(c.req.param("id"));

    if (isNaN(id)) {
      return c.json({ success: false, error: "ID inválido" }, 400);
    }

    const body = await c.req.json();
    const data = updatePermissionSchema.parse(body);

    const permission = await permissionService.updatePermission(id, data);

    return c.json({
      success: true,
      data: permission,
      message: "Permiso actualizado exitosamente",
    });
  } catch (error) {
    const message = error instanceof Error
      ? error.message
      : "Error al actualizar permiso";
    return c.json({ success: false, error: message }, 400);
  }
}

/**
 * DELETE /api/permissions/:id
 */
export async function deletePermission(c: Context) {
  try {
    const id = Number(c.req.param("id"));

    if (isNaN(id)) {
      return c.json({ success: false, error: "ID inválido" }, 400);
    }

    await permissionService.deletePermission(id);

    return c.json({
      success: true,
      message: "Permiso eliminado exitosamente",
    });
  } catch (error) {
    const message = error instanceof Error
      ? error.message
      : "Error al eliminar permiso";
    return c.json({ success: false, error: message }, 400);
  }
}

/**
 * GET /api/users/:userId/permissions
 */
export async function getUserPermissions(c: Context) {
  try {
    const userId = Number(c.req.param("userId"));

    if (isNaN(userId)) {
      return c.json({ success: false, error: "ID de usuario inválido" }, 400);
    }

    const permissions = await permissionService.getUserPermissions(userId);

    return c.json({
      success: true,
      data: permissions,
    });
  } catch (error) {
    const message = error instanceof Error
      ? error.message
      : "Error al obtener permisos del usuario";
    return c.json({ success: false, error: message }, 500);
  }
}
