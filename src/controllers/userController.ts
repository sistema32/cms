import { Context } from "hono";
import * as userService from "../services/userService.ts";
import { updateUserSchema } from "../utils/validation.ts";

/**
 * GET /api/users
 */
export async function getAllUsers(c: Context) {
  try {
    const users = await userService.getAllUsers();

    return c.json({
      success: true,
      data: users,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Error al obtener usuarios";
    return c.json({ success: false, error: message }, 500);
  }
}

/**
 * GET /api/users/:id
 */
export async function getUserById(c: Context) {
  try {
    const id = Number(c.req.param("id"));

    if (isNaN(id)) {
      return c.json({ success: false, error: "ID inválido" }, 400);
    }

    const user = await userService.getUserById(id);

    if (!user) {
      return c.json({ success: false, error: "Usuario no encontrado" }, 404);
    }

    return c.json({
      success: true,
      data: user,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Error al obtener usuario";
    return c.json({ success: false, error: message }, 500);
  }
}

/**
 * PUT /api/users/:id
 */
export async function updateUser(c: Context) {
  try {
    const id = Number(c.req.param("id"));

    if (isNaN(id)) {
      return c.json({ success: false, error: "ID inválido" }, 400);
    }

    const body = await c.req.json();
    const data = updateUserSchema.parse(body);

    const user = await userService.updateUser(id, data);

    return c.json({
      success: true,
      data: user,
      message: "Usuario actualizado exitosamente",
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Error al actualizar usuario";
    return c.json({ success: false, error: message }, 500);
  }
}

/**
 * DELETE /api/users/:id
 */
export async function deleteUser(c: Context) {
  try {
    const id = Number(c.req.param("id"));

    if (isNaN(id)) {
      return c.json({ success: false, error: "ID inválido" }, 400);
    }

    await userService.deleteUser(id);

    return c.json({
      success: true,
      message: "Usuario eliminado exitosamente",
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Error al eliminar usuario";
    return c.json({ success: false, error: message }, 500);
  }
}
