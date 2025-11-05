import { Hono } from "hono";
import * as permissionController from "../controllers/permissionController.ts";
import { authMiddleware } from "../middleware/auth.ts";
import { requirePermission, requireSuperAdmin } from "../middleware/permission.ts";

const permissions = new Hono();

// Todas las rutas requieren autenticación
permissions.use("*", authMiddleware);

// Listar permisos - requiere permiso de lectura
permissions.get(
  "/",
  requirePermission("permissions", "read"),
  permissionController.getAllPermissions
);

// Obtener un permiso - requiere permiso de lectura
permissions.get(
  "/:id",
  requirePermission("permissions", "read"),
  permissionController.getPermissionById
);

// Obtener permisos por módulo - requiere permiso de lectura
permissions.get(
  "/module/:module",
  requirePermission("permissions", "read"),
  permissionController.getPermissionsByModule
);

// Crear permiso - solo superadmin
permissions.post("/", requireSuperAdmin(), permissionController.createPermission);

// Actualizar permiso - solo superadmin
permissions.put("/:id", requireSuperAdmin(), permissionController.updatePermission);

// Eliminar permiso - solo superadmin
permissions.delete(
  "/:id",
  requireSuperAdmin(),
  permissionController.deletePermission
);

export default permissions;
