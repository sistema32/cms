/**
 * Migration Reset Script
 *
 * This script resets the migration tracking table to work with the unified schema.
 * Run this ONLY if you need to reset migration tracking after consolidating migrations.
 *
 * WARNING: This will clear the migration history but will NOT drop existing tables.
 * The unified migration uses IF NOT EXISTS clauses to work safely with existing schemas.
 */

import { db } from "../config/db.ts";
import { sql } from "drizzle-orm";

console.log("🔄 Resetting migration tracking...\n");

try {
  // Clear the migration tracking table
  await db.run(sql`DELETE FROM __drizzle_migrations`);
  console.log("✅ Migration tracking cleared");

  // Mark the unified migration as applied
  await db.run(
    sql`INSERT INTO __drizzle_migrations (hash) VALUES ('0000_initial_schema')`
  );
  console.log("✅ Unified migration marked as applied");

  console.log("\n✅ Migration tracking reset complete!");
  console.log("\nThe system will now use the unified migration schema.");
  console.log("You can safely run 'deno task db:migrate' to apply any future migrations.");
} catch (error) {
  console.error("❌ Error resetting migration tracking:", error);
  Deno.exit(1);
}

Deno.exit(0);
