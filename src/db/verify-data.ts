import { db } from "./index.ts";
import { sql } from "drizzle-orm";

console.log("🔍 Verificando datos de la base de datos...\n");

// Roles
const roles = await db.all(sql`SELECT * FROM roles ORDER BY id`);
console.log("📋 Roles:");
roles.forEach((r: any) => console.log(`  - ${r.name}: ${r.description}`));

// Permissions count
const permsCount = await db.all(sql`SELECT COUNT(*) as count FROM permissions`);
console.log(`\n🔐 Permisos: ${permsCount[0].count} total`);

// Role-Permissions assignments
const rolePermsCount = await db.all(sql`
  SELECT r.name, COUNT(rp.permission_id) as perm_count
  FROM roles r
  LEFT JOIN role_permissions rp ON r.id = rp.role_id
  GROUP BY r.id, r.name
  ORDER BY r.name
`);
console.log("\n🔗 Permisos asignados por rol:");
rolePermsCount.forEach((rp: any) => console.log(`  - ${rp.name}: ${rp.perm_count} permisos`));

// Content Types
const contentTypes = await db.all(sql`SELECT * FROM content_types ORDER BY id`);
console.log("\n📝 Content Types:");
contentTypes.forEach((ct: any) => console.log(`  - ${ct.name} (${ct.slug})`));

// Categories
const categories = await db.all(sql`SELECT * FROM categories ORDER BY "order"`);
console.log(`\n🏷️  Categories: ${categories.length} total`);

// Tags
const tags = await db.all(sql`SELECT * FROM tags ORDER BY name`);
console.log(`\n🏷️  Tags: ${tags.length} total`);

// Menus
const menus = await db.all(sql`SELECT * FROM menus ORDER BY id`);
console.log(`\n🧭 Menus: ${menus.length} total`);
menus.forEach((m: any) => console.log(`  - ${m.name} (${m.slug})`));

// Menu Items count
const menuItemsCount = await db.all(sql`SELECT COUNT(*) as count FROM menu_items`);
console.log(`\n📌 Menu Items: ${menuItemsCount[0].count} total`);

// Settings count
const settingsCount = await db.all(sql`SELECT COUNT(*) as count FROM settings`);
console.log(`\n⚙️  Settings: ${settingsCount[0].count} total`);

// Custom migrations
const customMigrations = await db.all(sql`SELECT * FROM __custom_migrations ORDER BY id`);
console.log(`\n✅ Custom Migrations Applied: ${customMigrations.length}`);
customMigrations.forEach((m: any) => console.log(`  ${m.id}. ${m.name}`));

console.log("\n✨ Verification complete!");
