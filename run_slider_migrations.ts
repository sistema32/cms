import { applyPending } from "./src/services/pluginMigrations.ts";

console.log("Running Smart Slider 3 migrations...");
await applyPending("smart-slider-3");
console.log("✅ Migrations completed!");
Deno.exit(0);
