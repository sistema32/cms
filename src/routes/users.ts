import { Hono } from "hono";
import * as userController from "../controllers/userController.ts";
import { authMiddleware } from "../middleware/auth.ts";

const users = new Hono();

// Todas las rutas de usuarios requieren autenticación
users.use("*", authMiddleware);

users.get("/", userController.getAllUsers);
users.get("/:id", userController.getUserById);
users.put("/:id", userController.updateUser);
users.delete("/:id", userController.deleteUser);

export default users;
