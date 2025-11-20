import { getDbType } from "./config/database-type.ts";

const dbType = getDbType();
console.log(`🚀 Generating migrations for ${dbType}...`);

const command = new Deno.Command("deno", {
    args: [
        "run",
        "-A",
        "npm:drizzle-kit",
        "generate",
        "--config=drizzle.config.ts",
    ],
    stdout: "inherit",
    stderr: "inherit",
});

const { code } = await command.output();

if (code === 0) {
    console.log("✅ Migrations generated successfully!");
} else {
    console.error("❌ Error generating migrations");
    Deno.exit(code);
}
