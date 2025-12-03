
import { Database } from "jsr:@db/sqlite@0.11";

const db = new Database("./data/db.sqlite");

console.log("🔄 Fixing LexSlider database tables...");

try {
    // 1. Drop old tables if they exist
    console.log("🗑️  Dropping old tables...");
    db.exec("DROP TABLE IF EXISTS lexslider_layers");
    db.exec("DROP TABLE IF EXISTS lexslider_slides");
    db.exec("DROP TABLE IF EXISTS lexslider_sliders");

    // 2. Drop new tables if they exist (to ensure clean state)
    console.log("🗑️  Dropping new tables (if partial)...");
    db.exec("DROP TABLE IF EXISTS plugin_lexslider_layers");
    db.exec("DROP TABLE IF EXISTS plugin_lexslider_slides");
    db.exec("DROP TABLE IF EXISTS plugin_lexslider_sliders");

    // 3. Create new tables
    console.log("✨ Creating new tables...");

    db.exec(`
    CREATE TABLE IF NOT EXISTS plugin_lexslider_sliders (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        width INTEGER DEFAULT 1200,
        height INTEGER DEFAULT 600,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
    `);

    db.exec(`
    CREATE TABLE IF NOT EXISTS plugin_lexslider_slides (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        slider_id INTEGER NOT NULL,
        background_image TEXT,
        ordering INTEGER DEFAULT 0,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (slider_id) REFERENCES plugin_lexslider_sliders(id) ON DELETE CASCADE
    );
    `);

    db.exec(`
    CREATE TABLE IF NOT EXISTS plugin_lexslider_layers (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        slide_id INTEGER NOT NULL,
        type TEXT NOT NULL, -- heading, text, image, button
        content TEXT, -- JSON string
        style TEXT, -- JSON string
        ordering INTEGER DEFAULT 0,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (slide_id) REFERENCES plugin_lexslider_slides(id) ON DELETE CASCADE
    );
    `);

    console.log("✅ Database fixed successfully!");

} catch (err) {
    console.error("❌ Error fixing database:", err);
} finally {
    db.close();
}
