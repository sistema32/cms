import { Context } from "hono";
import * as roleService from "../services/roleService.ts";
import { z } from "zod";

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
    const message = error instanceof Error ? error.message : "Error al obtener roles";
    return c.json({ success: false, error: message }, 500);
  }
}

/**
 * GET /api/roles/:id
 */
export async function getRoleById(c: Context) {
  try {
    const id = Number(c.req.param("id"));

    if (isNaN(id)) {
      return c.json({ success: false, error: "ID inválido" }, 400);
    }

    const role = await roleService.getRoleById(id);

    return c.json({
      success: true,
      data: role,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Error al obtener rol";
    return c.json({ success: false, error: message }, 404);
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
      201
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : "Error al crear rol";
    return c.json({ success: false, error: message }, 400);
  }
}

/**
 * PUT /api/roles/:id
 */
export async function updateRole(c: Context) {
  try {
    const id = Number(c.req.param("id"));

    if (isNaN(id)) {
      return c.json({ success: false, error: "ID inválido" }, 400);
    }

    const body = await c.req.json();
    const data = updateRoleSchema.parse(body);

    const role = await roleService.updateRole(id, data);

    return c.json({
      success: true,
      data: role,
      message: "Rol actualizado exitosamente",
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Error al actualizar rol";
    return c.json({ success: false, error: message }, 400);
  }
}

/**
 * DELETE /api/roles/:id
 */
export async function deleteRole(c: Context) {
  try {
    const id = Number(c.req.param("id"));

    if (isNaN(id)) {
      return c.json({ success: false, error: "ID inválido" }, 400);
    }

    await roleService.deleteRole(id);

    return c.json({
      success: true,
      message: "Rol eliminado exitosamente",
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Error al eliminar rol";
    return c.json({ success: false, error: message }, 400);
  }
}

/**
 * POST /api/roles/:id/permissions
 */
export async function assignPermissionsToRole(c: Context) {
  try {
    const id = Number(c.req.param("id"));

    if (isNaN(id)) {
      return c.json({ success: false, error: "ID inválido" }, 400);
    }

    const body = await c.req.json();
    const data = assignPermissionsSchema.parse(body);

    const role = await roleService.assignPermissionsToRole(
      id,
      data.permissionIds
    );

    return c.json({
      success: true,
      data: role,
      message: "Permisos asignados exitosamente",
    });
  } catch (error) {
    const message = error instanceof Error
      ? error.message
      : "Error al asignar permisos";
    return c.json({ success: false, error: message }, 400);
  }
}

/**
 * GET /api/roles/:id/permissions
 */
export async function getRolePermissions(c: Context) {
  try {
    const id = Number(c.req.param("id"));

    if (isNaN(id)) {
      return c.json({ success: false, error: "ID inválido" }, 400);
    }

    const permissions = await roleService.getRolePermissions(id);

    return c.json({
      success: true,
      data: permissions,
    });
  } catch (error) {
    const message = error instanceof Error
      ? error.message
      : "Error al obtener permisos del rol";
    return c.json({ success: false, error: message }, 404);
  }
}
