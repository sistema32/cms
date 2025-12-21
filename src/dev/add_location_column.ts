
import { db } from "@/config/db.ts";
import { sql } from "drizzle-orm";

async function run() {
    try {
        console.log("Adding location column to menus table...");
        await db.run(sql`ALTER TABLE menus ADD COLUMN location TEXT;`);
        console.log("Success!");
    } catch (e) {
        console.error("Failed:", e);
    }
}

run();
