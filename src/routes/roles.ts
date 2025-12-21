import { Hono } from "hono";
import * as roleController from "@/controllers/roleController.ts";
import { authMiddleware } from "@/middleware/auth.ts";
import { requirePermission, requireSuperAdmin } from "@/middleware/permission.ts";

const roles = new Hono();

// Todas las rutas requieren autenticación
roles.use("*", authMiddleware);

// Listar roles - requiere permiso de lectura
roles.get("/", requirePermission("roles", "read"), roleController.getAllRoles);

// Obtener un rol - requiere permiso de lectura
roles.get("/:id", requirePermission("roles", "read"), roleController.getRoleById);

// Crear rol - solo superadmin
roles.post("/", requireSuperAdmin(), roleController.createRole);

// Actualizar rol - solo superadmin
roles.put("/:id", requireSuperAdmin(), roleController.updateRole);

// Eliminar rol - solo superadmin
roles.delete("/:id", requireSuperAdmin(), roleController.deleteRole);

// Obtener permisos de un rol - requiere permiso de lectura
roles.get(
  "/:id/permissions",
  requirePermission("role_permissions", "read"),
  roleController.getRolePermissions
);

// Asignar permisos a un rol - solo superadmin
roles.post(
  "/:id/permissions",
  requireSuperAdmin(),
  roleController.assignPermissionsToRole
);

export default roles;
