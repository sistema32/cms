import { Hono } from "hono";
import * as userController from "@/controllers/userController.ts";
import { authMiddleware } from "@/middleware/auth.ts";
import { requirePermission } from "@/middleware/permission.ts";

const users = new Hono();

// Todas las rutas de usuarios requieren autenticación
users.use("*", authMiddleware);

// Rutas protegidas con permisos específicos
users.get("/", requirePermission("users", "read"), userController.getAllUsers);
users.get("/:id", requirePermission("users", "read"), userController.getUserById);
users.put("/:id", requirePermission("users", "update"), userController.updateUser);
users.delete("/:id", requirePermission("users", "delete"), userController.deleteUser);

export default users;
