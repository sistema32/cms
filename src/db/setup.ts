#!/usr/bin/env -S deno run -A

/**
 * Database Setup Script
 * 
 * Usage:
 *   deno task db:setup              # Setup with essential data only
 *   deno task db:setup --demo       # Setup with demo data included
 *   deno task db:setup --help       # Show help
 */

import { parseArgs } from "https://deno.land/std@0.224.0/cli/parse_args.ts";

const args = parseArgs(Deno.args, {
  boolean: ["demo", "help"],
  alias: {
    d: "demo",
    h: "help",
  },
});

if (args.help) {
  console.log(`
🗄️  Database Setup Script

Usage:
  deno task db:setup              Setup with essential data only (production-ready)
  deno task db:setup --demo       Setup with demo/test data included (development)
  deno task db:setup --help       Show this help message

Options:
  --demo, -d    Include optional demo data (test posts, comments)
  --help, -h    Show this help message

Examples:
  # Production setup (minimal data)
  deno task db:setup

  # Development setup (with demo content)
  deno task db:setup --demo

What gets installed:
  ✅ Essential (always):
     - Database schema (46 tables)
     - Roles and permissions
     - Content types, categories, tags
     - Default settings
     - Default menus
     - Admin user (admin@lexcms.local / admin123)

  📝 Demo data (with --demo):
     - 3 sample blog posts
     - 4 test comments
`);
  Deno.exit(0);
}

console.log("🚀 Starting database setup...\n");

// 1. Generate migrations
console.log("📦 Generating migrations...");
const generateCommand = new Deno.Command("deno", {
  args: ["task", "db:generate"],
  stdout: "inherit",
  stderr: "inherit",
});

const generateResult = await generateCommand.output();
if (generateResult.code !== 0) {
  console.error("❌ Migration generation failed");
  Deno.exit(generateResult.code);
}

// 2. Run migrations
console.log("\n📦 Running migrations...");
const migrateCommand = new Deno.Command("deno", {
  args: ["task", "db:migrate"],
  stdout: "inherit",
  stderr: "inherit",
});

const migrateResult = await migrateCommand.output();
if (migrateResult.code !== 0) {
  console.error("❌ Migration failed");
  Deno.exit(migrateResult.code);
}

// 3. Run seeds
console.log("\n🌱 Seeding database...");
const seedArgs = ["run", "-A", "src/db/seed.ts"];
if (args.demo) {
  seedArgs.push("--demo");
}

const seedCommand = new Deno.Command("deno", {
  args: seedArgs,
  stdout: "inherit",
  stderr: "inherit",
});

const seedResult = await seedCommand.output();

if (seedResult.code === 0) {
  console.log("\n✅ Database setup completed successfully!\n");

  if (!args.demo) {
    console.log("💡 Tip: Run with --demo flag to include sample content for development:");
    console.log("   deno task db:setup --demo\n");
  }
} else {
  console.error("\n❌ Database seeding failed with exit code:", seedResult.code);
  Deno.exit(seedResult.code);
}
