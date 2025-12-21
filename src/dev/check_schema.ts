
import { db } from "@/config/db.ts";
import { sql } from "drizzle-orm";

async function checkSchema() {
    try {
        const result = await db.run(sql`PRAGMA table_info(menus);`);
        console.log("Menus table columns:", JSON.stringify(result.rows, null, 2));
    } catch (e) {
        console.error("Error checking schema:", e);
    }
}

checkSchema();
