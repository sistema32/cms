import { walk } from "https://deno.land/std@0.208.0/fs/walk.ts";
import { join } from "https://deno.land/std@0.208.0/path/mod.ts";
import type { CustomMigration } from "../types.ts";

const CUSTOM_MIGRATIONS_DIR = join(import.meta.dirname!, ".");

// Check environment variable to determine if optional migrations should be loaded
const LOAD_OPTIONAL = Deno.env.get("LOAD_OPTIONAL_MIGRATIONS") === "true";

/**
 * Dynamically loads all custom migration files from essential/ and optionally from optional/
 * Migrations are sorted by ID to ensure consistent execution order
 */
export async function loadCustomMigrations(): Promise<CustomMigration[]> {
    const migrations: CustomMigration[] = [];

    // Always load essential migrations
    const essentialDir = join(CUSTOM_MIGRATIONS_DIR, "essential");
    try {
        for await (const entry of walk(essentialDir, { includeDirs: false, exts: [".ts"] })) {
            if (entry.name === "index.ts") continue;

            const module = await import(entry.path);
            if (module.migration) {
                migrations.push(module.migration);
            }
        }
    } catch (error) {
        console.warn("⚠️  No essential migrations found or error loading:", error instanceof Error ? error.message : error);
    }

    // Optionally load optional migrations
    if (LOAD_OPTIONAL) {
        const optionalDir = join(CUSTOM_MIGRATIONS_DIR, "optional");
        try {
            for await (const entry of walk(optionalDir, { includeDirs: false, exts: [".ts"] })) {
                if (entry.name === "index.ts") continue;

                const module = await import(entry.path);
                if (module.migration) {
                    migrations.push(module.migration);
                }
            }
            console.log("ℹ️  Optional migrations loaded (LOAD_OPTIONAL_MIGRATIONS=true)");
        } catch (error) {
            console.warn("⚠️  No optional migrations found or error loading:", error instanceof Error ? error.message : error);
        }
    } else {
        console.log("ℹ️  Skipping optional migrations (set LOAD_OPTIONAL_MIGRATIONS=true to include)");
    }

    // Sort by ID to ensure consistent order
    return migrations.sort((a, b) => a.id.localeCompare(b.id));
}
