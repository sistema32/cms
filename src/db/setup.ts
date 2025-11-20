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

// Set environment variable for optional migrations
if (args.demo) {
  console.log("📝 Demo mode enabled - will include test content and comments\n");
  Deno.env.set("LOAD_OPTIONAL_MIGRATIONS", "true");
} else {
  console.log("⚙️  Production mode - essential data only\n");
  Deno.env.set("LOAD_OPTIONAL_MIGRATIONS", "false");
}

// Run migrations
const migrateCommand = new Deno.Command("deno", {
  args: ["run", "-A", "src/db/migrate.ts"],
  stdout: "inherit",
  stderr: "inherit",
});

const { code } = await migrateCommand.output();

if (code === 0) {
  console.log("\n✅ Database setup completed successfully!\n");

  if (!args.demo) {
    console.log("💡 Tip: Run with --demo flag to include sample content for development:");
    console.log("   deno task db:setup --demo\n");
  }

  console.log("🔐 Admin credentials:");
  console.log("   Email: admin@lexcms.local");
  console.log("   Password: admin123\n");
} else {
  console.error("\n❌ Database setup failed with exit code:", code);
  Deno.exit(code);
}
