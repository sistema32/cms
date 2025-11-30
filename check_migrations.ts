import { db } from "./src/config/db.ts";
import { sql } from "drizzle-orm";

console.log("Checking plugin_migrations table...");
try {
    const migrations = await db.all(sql`SELECT * FROM plugin_migrations`);
    console.log("Applied migrations:", migrations);

    const plugins = await db.all(sql`SELECT * FROM plugins`);
    console.log("Registered plugins:", plugins);
} catch (err) {
    console.error("Error querying database:", err);
}
Deno.exit(0);
