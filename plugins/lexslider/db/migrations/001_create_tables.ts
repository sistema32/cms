import { sql } from "drizzle-orm";
import type { PluginAPI } from "../../src/lib/plugin-system/PluginAPI.ts";

/**
 * LexSlider Database Schema
 * Creates tables for sliders and slides
 */

export async function up(api: PluginAPI) {
    // Create sliders table
    await api.query(`
    CREATE TABLE IF NOT EXISTS lexslider_sliders (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      alias TEXT UNIQUE,
      type TEXT DEFAULT 'simple',
      width INTEGER DEFAULT 1200,
      height INTEGER DEFAULT 600,
      responsive TEXT DEFAULT '{}',
      settings TEXT DEFAULT '{}',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      created_by INTEGER,
      FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL
    )
  `);

    // Create slides table
    await api.query(`
    CREATE TABLE IF NOT EXISTS lexslider_slides (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      slider_id INTEGER NOT NULL,
      title TEXT,
      ordering INTEGER DEFAULT 0,
      published INTEGER DEFAULT 1,
      background TEXT DEFAULT '{}',
      layers TEXT DEFAULT '[]',
      settings TEXT DEFAULT '{}',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (slider_id) REFERENCES lexslider_sliders(id) ON DELETE CASCADE
    )
  `);

    // Create indexes
    await api.query(`
    CREATE INDEX IF NOT EXISTS idx_sliders_alias ON lexslider_sliders(alias)
  `);

    await api.query(`
    CREATE INDEX IF NOT EXISTS idx_slides_slider_id ON lexslider_slides(slider_id)
  `);

    await api.query(`
    CREATE INDEX IF NOT EXISTS idx_slides_ordering ON lexslider_slides(ordering)
  `);

    api.log("LexSlider tables created successfully");
}

export async function down(api: PluginAPI) {
    await api.query(`DROP TABLE IF EXISTS lexslider_slides`);
    await api.query(`DROP TABLE IF EXISTS lexslider_sliders`);

    api.log("LexSlider tables dropped");
}
