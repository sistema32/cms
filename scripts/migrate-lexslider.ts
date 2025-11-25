#!/usr/bin/env -S deno run --allow-read --allow-write --allow-env

/**
 * LexSlider Migration Script
 * 
 * This script applies the LexSlider database migration to create the required tables.
 * Run this after installing the plugin.
 * 
 * Usage:
 *   deno run --allow-read --allow-write --allow-env scripts/migrate-lexslider.ts
 */

import { db } from "../src/db/index.ts";
import { sql } from "drizzle-orm";

async function runMigration() {
  console.log("🔄 Running LexSlider migration...\n");

  try {
    // Create sliders table
    await db.run(sql`
      CREATE TABLE IF NOT EXISTS lexslider_sliders (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        title TEXT NOT NULL,
        alias TEXT UNIQUE,
        type TEXT NOT NULL DEFAULT 'simple',
        status TEXT NOT NULL DEFAULT 'draft',
        settings TEXT NOT NULL,
        responsive TEXT NOT NULL,
        controls TEXT NOT NULL,
        autoplay TEXT NOT NULL,
        created_by INTEGER,
        created_at INTEGER NOT NULL,
        updated_at INTEGER NOT NULL,
        published_at INTEGER
      )
    `);

    // Create slides table
    await db.run(sql`
      CREATE TABLE IF NOT EXISTS lexslider_slides (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        slider_id INTEGER NOT NULL,
        title TEXT,
        description TEXT,
        "order" INTEGER NOT NULL DEFAULT 0,
        published INTEGER NOT NULL DEFAULT 1,
        background TEXT NOT NULL,
        layers TEXT NOT NULL DEFAULT '[]',
        settings TEXT NOT NULL DEFAULT '{}',
        thumbnail TEXT,
        created_at INTEGER NOT NULL,
        updated_at INTEGER NOT NULL,
        FOREIGN KEY (slider_id) REFERENCES lexslider_sliders(id) ON DELETE CASCADE
      )
    `);

    // Create generators table
    await db.run(sql`
      CREATE TABLE IF NOT EXISTS lexslider_generators (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        slider_id INTEGER NOT NULL,
        type TEXT NOT NULL,
        config TEXT NOT NULL,
        template TEXT NOT NULL,
        created_at INTEGER NOT NULL,
        updated_at INTEGER NOT NULL,
        FOREIGN KEY (slider_id) REFERENCES lexslider_sliders(id) ON DELETE CASCADE
      )
    `);

    // Create indexes
    await db.run(sql`CREATE INDEX IF NOT EXISTS idx_sliders_alias ON lexslider_sliders(alias)`);
    await db.run(sql`CREATE INDEX IF NOT EXISTS idx_sliders_status ON lexslider_sliders(status)`);
    await db.run(sql`CREATE INDEX IF NOT EXISTS idx_slides_slider_id ON lexslider_slides(slider_id)`);
    await db.run(sql`CREATE INDEX IF NOT EXISTS idx_slides_order ON lexslider_slides("order")`);
    await db.run(sql`CREATE INDEX IF NOT EXISTS idx_generators_slider_id ON lexslider_generators(slider_id)`);

    console.log("✅ LexSlider migration completed successfully!\n");
    console.log("📊 Created tables:");
    console.log("   - lexslider_sliders");
    console.log("   - lexslider_slides");
    console.log("   - lexslider_generators");
    console.log("\n📍 Created indexes:");
    console.log("   - idx_sliders_alias");
    console.log("   - idx_sliders_status");
    console.log("   - idx_slides_slider_id");
    console.log("   - idx_slides_order");
    console.log("   - idx_generators_slider_id");
    console.log("\n🎉 LexSlider is now ready to use!");
    console.log("\n📝 Next steps:");
    console.log("   1. Start the server: deno task dev");
    console.log("   2. Create a slider via API: POST /api/sliders");
    console.log("   3. View documentation: plugins/lexslider/INSTALL.md");
  } catch (error: any) {
    console.error("❌ Migration failed:", error.message);
    console.error("\n💡 Troubleshooting:");
    console.error("   - Check if tables already exist");
    console.error("   - Verify database connection");
    console.error("   - Check DATABASE_URL in .env");
    Deno.exit(1);
  }
}

// Run migration
await runMigration();
