/**
 * Database Setup Script
 * Runs migrations and then seeds the database
 */

console.log("🚀 Setting up database...\n");

// Step 1: Run migrations
console.log("Step 1: Running migrations...");
const migrateProcess = new Deno.Command("deno", {
  args: ["run", "--allow-all", "src/db/migrate.ts"],
  stdout: "inherit",
  stderr: "inherit",
});

const migrateResult = await migrateProcess.output();

if (!migrateResult.success) {
  console.error("\n❌ Migration failed!");
  Deno.exit(1);
}

// Step 2: Run seed
console.log("\nStep 2: Seeding database...");
const seedProcess = new Deno.Command("deno", {
  args: ["run", "--allow-all", "src/db/seed.ts"],
  stdout: "inherit",
  stderr: "inherit",
});

const seedResult = await seedProcess.output();

if (!seedResult.success) {
  console.error("\n❌ Seeding failed!");
  Deno.exit(1);
}

console.log("\n✅ Database setup complete!");
console.log("\nYou can now:");
console.log("  - Run 'deno task dev' to start the development server");
console.log("  - Login with admin@example.com / admin123");
