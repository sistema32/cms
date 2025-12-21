import { Context } from "hono";
import * as userService from "@/services/auth/userService.ts";
import { updateUserSchema } from "@/utils/validation.ts";
import { AppError } from "@/platform/errors.ts";
import { getErrorMessage } from "@/utils/errors.ts";
import { createLogger } from "@/platform/logger.ts";

const log = createLogger("userController");

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
    const message = getErrorMessage(error);
    throw new AppError("user_list_failed", message, 500);
  }
}

/**
 * GET /api/users/:id
 */
export async function getUserById(c: Context) {
  try {
    const id = Number(c.req.param("id"));
    if (isNaN(id)) {
      throw AppError.fromCatalog("invalid_id");
    }

    const user = await userService.getUserById(id);

    if (!user) {
      throw AppError.fromCatalog("user_not_found");
    }

    return c.json({
      success: true,
      data: user,
    });
  } catch (error) {
    const message = getErrorMessage(error);
    throw error instanceof AppError ? error : new AppError("user_get_failed", message, 500);
  }
}

/**
 * PUT /api/users/:id
 */
export async function updateUser(c: Context) {
  try {
    const id = Number(c.req.param("id"));
    if (isNaN(id)) {
      throw AppError.fromCatalog("invalid_id");
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
    if (error instanceof AppError) throw error;
    if (error instanceof Error && error.name === "ZodError") {
      throw AppError.fromCatalog("validation_error");
    }
    const message = getErrorMessage(error);
    throw new AppError("user_update_failed", message, 500);
  }
}

/**
 * DELETE /api/users/:id
 */
export async function deleteUser(c: Context) {
  try {
    const id = Number(c.req.param("id"));
    if (isNaN(id)) {
      throw AppError.fromCatalog("invalid_id");
    }

    await userService.deleteUser(id);

    return c.json({
      success: true,
      message: "Usuario eliminado exitosamente",
    });
  } catch (error) {
    log.error("Error al eliminar usuario", error instanceof Error ? error : undefined);
    const message = getErrorMessage(error);
    throw error instanceof AppError ? error : new AppError("user_delete_failed", message, 500);
  }
}
