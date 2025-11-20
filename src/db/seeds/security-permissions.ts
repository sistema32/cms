/**
 * Seed Security Permissions
 * Adds security management permissions to the database
 */

import { db } from "../index.ts";
import { permissions, rolePermissions, roles } from "../schema.ts";
import { eq, and } from "drizzle-orm";

async function seedSecurityPermissions() {
    console.log("🔐 Seeding security permissions...");

    // Define security permissions
    const securityPerms = [
        {
            module: "security",
            action: "view",
            description: "View security dashboard and logs",
        },
        {
            module: "security",
            action: "manage_ips",
            description: "Manage IP blacklist and whitelist",
        },
        {
            module: "security",
            action: "manage_rules",
            description: "Manage security rules and rate limiting",
        },
        {
            module: "security",
            action: "manage_settings",
            description: "Manage security settings and configuration",
        },
        {
            module: "security",
            action: "export_logs",
            description: "Export security logs",
        },
    ];

    // Insert permissions
    for (const perm of securityPerms) {
        const existing = await db.select()
            .from(permissions)
            .where(
                and(
                    eq(permissions.module, perm.module),
                    eq(permissions.action, perm.action)
                )
            )
            .limit(1);

        if (existing.length === 0) {
            await db.insert(permissions).values(perm);
            console.log(`  ✅ Created permission: ${perm.module}.${perm.action}`);
        } else {
            console.log(`  ⏭️  Permission already exists: ${perm.module}.${perm.action}`);
        }
    }

    // Assign all security permissions to admin role
    const [adminRole] = await db.select()
        .from(roles)
        .where(eq(roles.name, "admin"))
        .limit(1);

    if (adminRole) {
        const allSecurityPerms = await db.select()
            .from(permissions)
            .where(eq(permissions.module, "security"));

        for (const perm of allSecurityPerms) {
            const existing = await db.select()
                .from(rolePermissions)
                .where(
                    and(
                        eq(rolePermissions.roleId, adminRole.id),
                        eq(rolePermissions.permissionId, perm.id)
                    )
                )
                .limit(1);

            if (existing.length === 0) {
                await db.insert(rolePermissions).values({
                    roleId: adminRole.id,
                    permissionId: perm.id,
                });
                console.log(`  ✅ Assigned ${perm.module}.${perm.action} to admin role`);
            }
        }
    }

    console.log("✅ Security permissions seeded successfully!\n");
}

// Run if executed directly
if (import.meta.main) {
    await seedSecurityPermissions();
    Deno.exit(0);
}

export { seedSecurityPermissions };
