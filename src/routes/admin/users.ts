import { Hono } from "hono";
import { eq } from "drizzle-orm";
import { env } from "../../config/env.ts";
import { db } from "../../db/index.ts";
import { users } from "../../db/schema.ts";
import { userService } from "@/services/auth/userService.ts";
import { roleService } from "@/services/auth/roleService.ts";
import { permissionService } from "@/services/auth/permissionService.ts";
import { notificationService } from "../../lib/email/index.ts";
import UsersNexusPage from "../../admin/pages/system/UsersNexus.tsx";
import RolesNexusPage from "../../admin/pages/system/RolesNexus.tsx";
import PermissionsNexusPage from "../../admin/pages/system/PermissionsNexus.tsx";
import { parseNullableField, parseStringField } from "./helpers.ts";
import { normalizeNotifications, type NormalizedNotification } from "./helpers.ts";

export const usersRouter = new Hono();

const normalizeUser = (user: any) => ({
    id: user.userId ?? user.id,
    name: (user.name as string | null) || user.email,
    email: user.email,
});

/**
 * GET /users - Users list with filters and pagination
 */
usersRouter.get("/users", async (c) => {
    try {
        const user = c.get("user");

        // Verificar permiso para ver usuarios
        const hasPermission = await permissionService.userHasPermission(
            user.userId,
            "users",
            "read",
        );
        if (!hasPermission) {
            return c.html(
                `<h1>Acceso Denegado</h1><p>No tienes permiso para ver usuarios</p>`,
                403,
            );
        }

        const query = c.req.query();

        // Obtener filtros de la query
        const filters: any = {};
        if (query.search) filters.search = query.search;
        if (query.status) filters.status = query.status;
        if (query.roleId) filters.roleId = parseInt(query.roleId);
        if (query.limit) filters.limit = parseInt(query.limit) || 20;
        if (query.offset) filters.offset = parseInt(query.offset) || 0;

        const [usersResult, rolesData, stats, userPermissions] = await Promise.all([
            userService.getUsersWithFilters(filters),
            db.query.roles.findMany(),
            userService.getUserStats(),
            permissionService.getUserPermissions(user.userId),
        ]);

        // Get notifications for the user
        let notifications: NormalizedNotification[] = [];
        let unreadNotificationCount = 0;
        try {
            notifications = normalizeNotifications(await notificationService.getForUser({
                userId: user.userId,
                isRead: false,
                limit: 5,
                offset: 0,
            }));
            unreadNotificationCount = await notificationService.getUnreadCount(
                user.userId,
            );
        } catch (error) {
            console.error("Error loading notifications:", error);
        }

        const mappedUsers = usersResult.users.map((u) => ({
            ...u,
            name: u.name ?? u.email,
            role: u.role
                ? { id: u.role.id, name: u.role.name ?? "Unknown", isSystem: (u.role as any).isSystem }
                : undefined,
            twoFactorEnabled: u.twoFactorEnabled ?? false,
            createdAt: u.createdAt ?? new Date(),
        }));

        return c.html(UsersNexusPage({
            user: normalizeUser(user),
            users: mappedUsers,
            roles: rolesData,
            stats,
            filters,
            pagination: {
                total: usersResult.total,
                hasMore: usersResult.hasMore,
                offset: filters.offset || 0,
                limit: filters.limit || 20,
            },
            userPermissions: userPermissions.map((p) => `${p.module}:${p.action}`),
            notifications,
            unreadNotificationCount,
        }));
    } catch (error: any) {
        console.error("Error loading users:", error);
        return c.text("Error al cargar usuarios", 500);
    }
});

usersRouter.post("/users/create", async (c) => {
    try {
        const user = c.get("user");

        // Verificar permiso para crear usuarios
        const hasPermission = await permissionService.userHasPermission(
            user.userId,
            "users",
            "create",
        );
        if (!hasPermission) {
            return c.text("No tienes permiso para crear usuarios", 403);
        }

        const body = await c.req.parseBody();
        const { hashPassword } = await import("../../utils/password.ts");
        const hashedPassword = await hashPassword(body.password as string);

        await db.insert(users).values({
            name: body.name as string,
            email: body.email as string,
            password: hashedPassword,
            roleId: body.roleId ? parseInt(body.roleId as string) : null,
            status: (body.status as string) || "active",
        });
        return c.redirect(`${env.ADMIN_PATH}/users`);
    } catch (error: any) {
        console.error("Error creating user:", error);
        return c.text("Error al crear usuario: " + error.message, 500);
    }
});

/**
 * POST /users/edit/:id - Update user
 */
usersRouter.post("/users/edit/:id", async (c) => {
    try {
        const user = c.get("user");

        // Verificar permiso para actualizar usuarios
        const hasPermission = await permissionService.userHasPermission(
            user.userId,
            "users",
            "update",
        );
        if (!hasPermission) {
            return c.text("No tienes permiso para actualizar usuarios", 403);
        }

        const id = parseInt(c.req.param("id"));
        const body = await c.req.parseBody();

        const updateData: any = {
            name: body.name as string,
            email: body.email as string,
            roleId: body.roleId ? parseInt(body.roleId as string) : null,
            status: (body.status as string) || "active",
            updatedAt: new Date(),
        };

        // Only update password if provided
        if (body.password && (body.password as string).trim() !== "") {
            const { hashPassword } = await import("../../utils/password.ts");
            updateData.password = await hashPassword(body.password as string);
        }

        await db.update(users).set(updateData).where(eq(users.id, id));
        return c.redirect(`${env.ADMIN_PATH}/users`);
    } catch (error: any) {
        console.error("Error updating user:", error);
        return c.text("Error al actualizar usuario: " + error.message, 500);
    }
});

usersRouter.post("/users/delete/:id", async (c) => {
    try {
        const user = c.get("user");

        // Verificar permiso para eliminar usuarios
        const hasPermission = await permissionService.userHasPermission(
            user.userId,
            "users",
            "delete",
        );
        if (!hasPermission) {
            return c.json({
                success: false,
                error: "No tienes permiso para eliminar usuarios",
            }, 403);
        }

        const id = parseInt(c.req.param("id"));
        await userService.deleteUser(id);
        return c.json({ success: true });
    } catch (error: any) {
        return c.json({ success: false, error: error.message }, 500);
    }
});

/**
 * POST /users/bulk-status - Bulk update user status
 */
usersRouter.post("/users/bulk-status", async (c) => {
    try {
        const user = c.get("user");

        // Verificar permiso para actualizar usuarios
        const hasPermission = await permissionService.userHasPermission(
            user.userId,
            "users",
            "update",
        );
        if (!hasPermission) {
            return c.json({
                success: false,
                error: "No tienes permiso para actualizar usuarios",
            }, 403);
        }

        const body = await c.req.json();
        const { userIds, status } = body;

        if (!userIds || !Array.isArray(userIds) || userIds.length === 0) {
            return c.json(
                { success: false, error: "No se especificaron usuarios" },
                400,
            );
        }

        if (!["active", "inactive", "suspended"].includes(status)) {
            return c.json({ success: false, error: "Estado inválido" }, 400);
        }

        const updated = await userService.bulkUpdateUserStatus(userIds, status);
        return c.json({ success: true, updated });
    } catch (error: any) {
        console.error("Error bulk updating user status:", error);
        return c.json({ success: false, error: error.message }, 500);
    }
});

/**
 * POST /users/bulk-delete - Bulk delete users
 */
usersRouter.post("/users/bulk-delete", async (c) => {
    try {
        const user = c.get("user");

        // Verificar permiso para eliminar usuarios
        const hasPermission = await permissionService.userHasPermission(
            user.userId,
            "users",
            "delete",
        );
        if (!hasPermission) {
            return c.json({
                success: false,
                error: "No tienes permiso para eliminar usuarios",
            }, 403);
        }

        const body = await c.req.json();
        const { userIds } = body;

        if (!userIds || !Array.isArray(userIds) || userIds.length === 0) {
            return c.json(
                { success: false, error: "No se especificaron usuarios" },
                400,
            );
        }

        const deleted = await userService.deleteUsers(userIds);
        return c.json({ success: true, deleted });
    } catch (error: any) {
        console.error("Error bulk deleting users:", error);
        return c.json({ success: false, error: error.message }, 500);
    }
});

/**
 * GET /roles - Roles management with statistics
 */
usersRouter.get("/roles", async (c) => {
    try {
        const user = c.get("user");

        // Verificar permiso para ver roles
        const hasPermission = await permissionService.userHasPermission(
            user.userId,
            "roles",
            "read",
        );
        if (!hasPermission) {
            return c.html(
                `<h1>Acceso Denegado</h1><p>No tienes permiso para ver roles</p>`,
                403,
            );
        }

        const [rolesData, permissionsData, stats, userPermissions] = await Promise
            .all([
                roleService.getAllRolesWithStats(),
                permissionService.getAllPermissions(),
                roleService.getRoleStats(),
                permissionService.getUserPermissions(user.userId),
            ]);

        const formattedRoles = rolesData
            .map((role) => ({
                id: role.id,
                name: role.name,
                description: role.description,
                isSystem: role.isSystem,
                userCount: role.userCount,
                permissionCount: role.permissionCount,
                createdAt: role.createdAt,
                permissions: (role.permissions || []).map((perm) => ({
                    id: perm.id,
                    module: perm.module,
                    action: perm.action,
                    description: perm.description,
                })),
            }))
            .sort((a, b) => a.name.localeCompare(b.name, "es-ES"));

        const sortedPermissions = permissionsData.sort((a, b) => {
            const moduleCompare = a.module.localeCompare(b.module, "es-ES");
            if (moduleCompare !== 0) return moduleCompare;
            return a.action.localeCompare(b.action, "es-ES");
        });

        // Get notifications for the user
        let notifications: NormalizedNotification[] = [];
        let unreadNotificationCount = 0;
        try {
            notifications = normalizeNotifications(await notificationService.getForUser({
                userId: user.userId,
                isRead: false,
                limit: 5,
                offset: 0,
            }));
            unreadNotificationCount = await notificationService.getUnreadCount(
                user.userId,
            );
        } catch (error) {
            console.error("Error loading notifications:", error);
        }

        return c.html(
            RolesNexusPage({
                user: normalizeUser(user),
                roles: formattedRoles,
                permissions: sortedPermissions,
                stats,
                userPermissions: userPermissions.map((p) => `${p.module}:${p.action}`),
                notifications,
                unreadNotificationCount,
            }),
        );
    } catch (error: any) {
        console.error("Error loading roles:", error);
        return c.text("Error al cargar roles", 500);
    }
});

usersRouter.post("/roles/create", async (c) => {
    try {
        const user = c.get("user");

        // Verificar si es superadmin
        const isSuperAdmin = user.userId === 1 ||
            await permissionService.userHasPermission(user.userId, "roles", "create");
        if (!isSuperAdmin) {
            return c.text("Solo superadmin puede crear roles", 403);
        }

        const body = await c.req.parseBody();
        const name = parseStringField(body.name);
        const description = parseNullableField(body.description) ?? null;

        if (!name) {
            return c.text("El nombre del rol es obligatorio", 400);
        }

        await roleService.createRole({ name, description });

        return c.redirect(`${env.ADMIN_PATH}/roles`);
    } catch (error: any) {
        console.error("Error creating role:", error);
        const message = error instanceof Error
            ? error.message
            : "Error al crear rol";
        return c.text(message, 400);
    }
});

usersRouter.post("/roles/edit/:id", async (c) => {
    try {
        const user = c.get("user");

        // Verificar si es superadmin
        const isSuperAdmin = user.userId === 1 ||
            await permissionService.userHasPermission(user.userId, "roles", "update");
        if (!isSuperAdmin) {
            return c.text("Solo superadmin puede actualizar roles", 403);
        }

        const id = Number(c.req.param("id"));
        if (!Number.isFinite(id)) {
            return c.text("ID inválido", 400);
        }

        const body = await c.req.parseBody();
        const name = parseStringField(body.name);
        const description = parseNullableField(body.description) ?? null;

        if (!name) {
            return c.text("El nombre del rol es obligatorio", 400);
        }

        await roleService.updateRole(id, { name, description });

        return c.redirect(`${env.ADMIN_PATH}/roles`);
    } catch (error: any) {
        console.error("Error updating role:", error);
        const message = error instanceof Error
            ? error.message
            : "Error al actualizar rol";
        return c.text(message, 400);
    }
});

usersRouter.post("/roles/delete/:id", async (c) => {
    try {
        const user = c.get("user");

        // Verificar si es superadmin
        const isSuperAdmin = user.userId === 1 ||
            await permissionService.userHasPermission(user.userId, "roles", "delete");
        if (!isSuperAdmin) {
            return c.json({
                success: false,
                error: "Solo superadmin puede eliminar roles",
            }, 403);
        }

        const id = Number(c.req.param("id"));
        if (!Number.isFinite(id)) {
            return c.json({ success: false, error: "ID inválido" }, 400);
        }

        await roleService.deleteRole(id);

        return c.json({ success: true });
    } catch (error: any) {
        console.error("Error deleting role:", error);
        return c.json(
            {
                success: false,
                error: error instanceof Error ? error.message : "Error al eliminar rol",
            },
            400,
        );
    }
});

/**
 * POST /roles/clone/:id - Clone a role with all its permissions
 */
usersRouter.post("/roles/clone/:id", async (c) => {
    try {
        const user = c.get("user");

        // Verificar si es superadmin
        const isSuperAdmin = user.userId === 1 ||
            await permissionService.userHasPermission(user.userId, "roles", "create");
        if (!isSuperAdmin) {
            return c.text("Solo superadmin puede clonar roles", 403);
        }

        const id = Number(c.req.param("id"));
        if (!Number.isFinite(id)) {
            return c.text("ID inválido", 400);
        }

        const body = await c.req.parseBody();
        const newName = parseStringField(body.newName);
        const newDescription = parseNullableField(body.newDescription);

        if (!newName) {
            return c.text("El nombre del nuevo rol es obligatorio", 400);
        }

        await roleService.cloneRole(id, newName, newDescription || undefined);

        return c.redirect(`${env.ADMIN_PATH}/roles`);
    } catch (error: any) {
        console.error("Error cloning role:", error);
        const message = error instanceof Error
            ? error.message
            : "Error al clonar rol";
        return c.text(message, 400);
    }
});

usersRouter.post("/roles/:id/permissions", async (c) => {
    try {
        const user = c.get("user");

        // Verificar si es superadmin
        const isSuperAdmin = user.userId === 1 ||
            await permissionService.userHasPermission(
                user.userId,
                "role_permissions",
                "update",
            );
        if (!isSuperAdmin) {
            return c.text("Solo superadmin puede asignar permisos a roles", 403);
        }

        const id = Number(c.req.param("id"));
        if (!Number.isFinite(id)) {
            return c.text("ID inválido", 400);
        }

        const formData = await c.req.formData();
        const permissionIds = formData.getAll("permissionIds[]")
            .map((value) => Number(value))
            .filter((value) => Number.isFinite(value)) as number[];

        await roleService.assignPermissionsToRole(id, permissionIds);

        return c.redirect(`${env.ADMIN_PATH}/roles`);
    } catch (error: any) {
        console.error("Error assigning permissions:", error);
        return c.text("Error al asignar permisos al rol", 400);
    }
});

/**
 * GET /permissions - Permissions management with grouping and stats
 */
usersRouter.get("/permissions", async (c) => {
    try {
        const user = c.get("user");

        // Verificar permiso para ver permisos
        const hasPermission = await permissionService.userHasPermission(
            user.userId,
            "permissions",
            "read",
        );
        if (!hasPermission) {
            return c.html(
                `<h1>Acceso Denegado</h1><p>No tienes permiso para ver permisos</p>`,
                403,
            );
        }

        let notifications: NormalizedNotification[] = [];
        let unreadNotificationCount = 0;
        try {
            notifications = normalizeNotifications(await notificationService.getForUser({
                userId: user.userId,
                isRead: false,
                limit: 5,
                offset: 0,
            }));
            unreadNotificationCount = await notificationService.getUnreadCount(
                user.userId,
            );
        } catch (error) {
            console.error("Error loading notifications:", error);
        }

        const [
            permissionsData,
            permissionsByModule,
            modules,
            stats,
            userPermissions,
        ] = await Promise.all([
            permissionService.getAllPermissions(),
            permissionService.getPermissionsGroupedByModule(),
            permissionService.getModules(),
            permissionService.getPermissionStats(),
            permissionService.getUserPermissions(user.userId),
        ]);

        const sortedPermissions = permissionsData.sort((a, b) => {
            const moduleCompare = a.module.localeCompare(b.module, "es-ES");
            if (moduleCompare !== 0) return moduleCompare;
            return a.action.localeCompare(b.action, "es-ES");
        });

        return c.html(
            PermissionsNexusPage({
                user: normalizeUser(user),
                permissions: sortedPermissions,
                permissionsByModule,
                modules,
                stats,
                userPermissions: userPermissions.map((p) => `${p.module}:${p.action}`),
                notifications,
                unreadNotificationCount,
            }),
        );
    } catch (error: any) {
        console.error("Error loading permissions:", error);
        return c.text("Error al cargar permisos", 500);
    }
});

usersRouter.post("/permissions/create", async (c) => {
    try {
        const user = c.get("user");

        // Verificar si es superadmin
        const isSuperAdmin = user.userId === 1 ||
            await permissionService.userHasPermission(
                user.userId,
                "permissions",
                "create",
            );
        if (!isSuperAdmin) {
            return c.text("Solo superadmin puede crear permisos", 403);
        }

        const body = await c.req.parseBody();
        const moduleName = parseStringField(body.module);
        const actionName = parseStringField(body.action);
        const description = parseNullableField(body.description) ?? null;

        if (!moduleName || !actionName) {
            return c.text("Módulo y acción son obligatorios", 400);
        }

        await permissionService.createPermission({
            module: moduleName,
            action: actionName,
            description,
        });

        return c.redirect(`${env.ADMIN_PATH}/permissions`);
    } catch (error: any) {
        console.error("Error creating permission:", error);
        const message = error instanceof Error
            ? error.message
            : "Error al crear permiso";
        return c.text(message, 400);
    }
});

usersRouter.post("/permissions/edit/:id", async (c) => {
    try {
        const user = c.get("user");

        // Verificar si es superadmin
        const isSuperAdmin = user.userId === 1 ||
            await permissionService.userHasPermission(
                user.userId,
                "permissions",
                "update",
            );
        if (!isSuperAdmin) {
            return c.text("Solo superadmin puede actualizar permisos", 403);
        }

        const id = Number(c.req.param("id"));
        if (!Number.isFinite(id)) {
            return c.text("ID inválido", 400);
        }

        const body = await c.req.parseBody();
        const moduleName = parseStringField(body.module);
        const actionName = parseStringField(body.action);
        const description = parseNullableField(body.description) ?? null;

        if (!moduleName || !actionName) {
            return c.text("Módulo y acción son obligatorios", 400);
        }

        await permissionService.updatePermission(id, {
            module: moduleName,
            action: actionName,
            description,
        });

        return c.redirect(`${env.ADMIN_PATH}/permissions`);
    } catch (error: any) {
        console.error("Error updating permission:", error);
        const message = error instanceof Error
            ? error.message
            : "Error al actualizar permiso";
        return c.text(message, 400);
    }
});

usersRouter.post("/permissions/delete/:id", async (c) => {
    try {
        const user = c.get("user");

        // Verificar si es superadmin
        const isSuperAdmin = user.userId === 1 ||
            await permissionService.userHasPermission(
                user.userId,
                "permissions",
                "delete",
            );
        if (!isSuperAdmin) {
            return c.json({
                success: false,
                message: "Solo superadmin puede eliminar permisos",
            }, 403);
        }

        const id = Number(c.req.param("id"));
        if (!Number.isFinite(id)) {
            return c.json({ success: false, message: "ID inválido" }, 400);
        }

        await permissionService.deletePermission(id);

        return c.json({ success: true });
    } catch (error: any) {
        console.error("Error deleting permission:", error);
        return c.json(
            {
                success: false,
                message: error instanceof Error
                    ? error.message
                    : "Error al eliminar permiso",
            },
            400,
        );
    }
});
