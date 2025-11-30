import { db } from "./src/config/db.ts";
import { sql } from "drizzle-orm";

console.log("Forcing table creation...");

const createSliders = sql.raw(`
CREATE TABLE IF NOT EXISTS plugin_smart_slider_3_sliders (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    type TEXT DEFAULT 'simple',
    width INTEGER DEFAULT 1200,
    height INTEGER DEFAULT 600,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
`);

const createSlides = sql.raw(`
CREATE TABLE IF NOT EXISTS plugin_smart_slider_3_slides (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    slider_id INTEGER NOT NULL,
    title TEXT,
    background_image TEXT,
    ordering INTEGER DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (slider_id) REFERENCES plugin_smart_slider_3_sliders(id) ON DELETE CASCADE
);
`);

const createLayers = sql.raw(`
CREATE TABLE IF NOT EXISTS plugin_smart_slider_3_layers (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    slide_id INTEGER NOT NULL,
    type TEXT NOT NULL,
    content TEXT,
    style TEXT,
    ordering INTEGER DEFAULT 0,
    FOREIGN KEY (slide_id) REFERENCES plugin_smart_slider_3_slides(id) ON DELETE CASCADE
);
`);

try {
    await db.run(createSliders);
    console.log("Created sliders table");
    await db.run(createSlides);
    console.log("Created slides table");
    await db.run(createLayers);
    console.log("Created layers table");
    console.log("✅ All tables created successfully");
} catch (err) {
    console.error("Error creating tables:", err);
}
Deno.exit(0);
