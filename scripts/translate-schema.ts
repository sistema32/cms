import { walk } from "https://deno.land/std@0.208.0/fs/walk.ts";
import { join } from "https://deno.land/std@0.208.0/path/mod.ts";

const SOURCE_DIR = "./src/db/schema/sqlite";
const TARGET_DIRS = {
    postgresql: "./src/db/schema/postgresql",
    mysql: "./src/db/schema/mysql",
};

console.log("🔄 Starting schema translation...");

async function translateSchema() {
    for await (const entry of walk(SOURCE_DIR, { includeDirs: false, exts: [".ts"] })) {
        const content = await Deno.readTextFile(entry.path);
        console.log(`Processing ${entry.name}...`);

        // Translate to PostgreSQL
        const pgContent = translateToPostgres(content);
        await Deno.writeTextFile(join(TARGET_DIRS.postgresql, entry.name), pgContent);

        // Translate to MySQL
        const mysqlContent = translateToMysql(content);
        await Deno.writeTextFile(join(TARGET_DIRS.mysql, entry.name), mysqlContent);
    }

    console.log("✅ Schema translation complete!");
}

function translateToPostgres(content: string): string {
    let translated = content;

    // 1. Imports
    translated = translated.replace(
        /drizzle-orm\/sqlite-core/g,
        "drizzle-orm/pg-core"
    );

    // 2. Table definition
    translated = translated.replace(/sqliteTable/g, "pgTable");

    // 3. Data Types Mapping

    // Handle Primary Keys with autoIncrement
    // SQLite: integer("id").primaryKey({ autoIncrement: true })
    // PG: serial("id").primaryKey()
    translated = translated.replace(
        /integer\("id"\)\.primaryKey\({ autoIncrement: true }\)/g,
        'serial("id").primaryKey()'
    );

    // Handle Timestamps
    // SQLite: integer("created_at", { mode: "timestamp" })
    // PG: timestamp("created_at")
    translated = translated.replace(
        /integer\("([\w_]+)", \{ mode: "timestamp" \}\)/g,
        'timestamp("$1")'
    );

    // Handle Booleans
    // SQLite: integer("is_active", { mode: "boolean" })
    // PG: boolean("is_active")
    translated = translated.replace(
        /integer\("([\w_]+)", \{ mode: "boolean" \}\)/g,
        'boolean("$1")'
    );

    // Handle Unix Epoch default
    // SQLite: default(sql`(unixepoch())`)
    // PG: defaultNow()
    translated = translated.replace(
        /\.default\(sql`\(unixepoch\(\)\)`\)/g,
        ".defaultNow()"
    );

    return translated;
}

function translateToMysql(content: string): string {
    let translated = content;

    // 1. Imports
    translated = translated.replace(
        /drizzle-orm\/sqlite-core/g,
        "drizzle-orm/mysql-core"
    );

    // 2. Table definition
    translated = translated.replace(/sqliteTable/g, "mysqlTable");

    // 3. Data Types Mapping

    // Handle Primary Keys with autoIncrement
    // SQLite: integer("id").primaryKey({ autoIncrement: true })
    // MySQL: serial("id").primaryKey()
    translated = translated.replace(
        /integer\("id"\)\.primaryKey\({ autoIncrement: true }\)/g,
        'serial("id").primaryKey()'
    );

    // Handle Timestamps
    // SQLite: integer("created_at", { mode: "timestamp" })
    // MySQL: timestamp("created_at")
    translated = translated.replace(
        /integer\("([\w_]+)", \{ mode: "timestamp" \}\)/g,
        'timestamp("$1")'
    );

    // Handle Booleans
    // SQLite: integer("is_active", { mode: "boolean" })
    // MySQL: boolean("is_active")
    translated = translated.replace(
        /integer\("([\w_]+)", \{ mode: "boolean" \}\)/g,
        'boolean("$1")'
    );

    // Handle Unix Epoch default
    // SQLite: default(sql`(unixepoch())`)
    // MySQL: default(sql`(now())`)
    translated = translated.replace(
        /\.default\(sql`\(unixepoch\(\)\)`\)/g,
        ".defaultNow()"
    );

    return translated;
}

translateSchema();
