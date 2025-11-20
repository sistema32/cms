import { type CustomMigration } from "../../types.ts";
import { sql } from "drizzle-orm";

export const migration: CustomMigration = {
    id: "0005_role_permissions_assignments",
    name: "Assign Permissions to Roles",
    up: async (db, dbType) => {
        console.log("  🔗 Assigning permissions to roles...");

        // Obtener IDs de roles y permisos
        const roles = await db.all(sql`SELECT id, name FROM roles`);
        const permissions = await db.all(sql`SELECT id, module, action FROM permissions`);

        const roleMap = new Map(roles.map((r: any) => [r.name, r.id]));
        const permMap = permissions.map((p: any) => ({ id: p.id, module: p.module, action: p.action }));

        // Helper para asignar permisos
        const assignPermissions = async (roleName: string, permFilter: (p: any) => boolean) => {
            const roleId = roleMap.get(roleName);
            if (!roleId) return 0;

            const permsToAssign = permMap.filter(permFilter);

            for (const perm of permsToAssign) {
                if (dbType === "sqlite") {
                    await db.run(sql`
            INSERT OR IGNORE INTO role_permissions (role_id, permission_id)
            VALUES (${roleId}, ${perm.id})
          `);
                } else {
                    await db.execute(sql`
            INSERT INTO role_permissions (role_id, permission_id)
            VALUES (${roleId}, ${perm.id})
            ON CONFLICT (role_id, permission_id) DO NOTHING
          `);
                }
            }

            return permsToAssign.length;
        };

        // SUPERADMIN: Todos los permisos
        const superadminCount = await assignPermissions("superadmin", () => true);
        console.log(`    ✓ Superadmin: ${superadminCount} permissions`);

        // ADMIN: Gestión de contenido, usuarios, media, menus, settings (sin roles/permissions)
        const adminCount = await assignPermissions("admin", (p) =>
            ["users", "content_types", "content", "categories", "tags", "media", "menus", "settings"].includes(p.module)
        );
        console.log(`    ✓ Admin: ${adminCount} permissions`);

        // EDITOR: Solo contenido, categorías, tags, media (read/create/update)
        const editorCount = await assignPermissions("editor", (p) =>
            ["content", "categories", "tags", "media"].includes(p.module) &&
            ["read", "create", "update"].includes(p.action)
        );
        console.log(`    ✓ Editor: ${editorCount} permissions`);

        // USER: Solo lectura de su perfil
        const userCount = await assignPermissions("user", (p) =>
            p.module === "users" && ["read", "update"].includes(p.action)
        );
        console.log(`    ✓ User: ${userCount} permissions`);

        // GUEST: Solo lectura pública
        const guestCount = await assignPermissions("guest", (p) =>
            p.action === "read" && ["content_types", "content", "categories", "tags"].includes(p.module)
        );
        console.log(`    ✓ Guest: ${guestCount} permissions`);

        console.log("  ✅ Role-permission assignments completed");
    },

    down: async (db, dbType) => {
        console.log("  Reverting role-permission assignments...");
    }
};
