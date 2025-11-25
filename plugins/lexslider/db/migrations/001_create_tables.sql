-- LexSlider Tables Migration
-- Creates tables for sliders and slides

CREATE TABLE IF NOT EXISTS lexslider_sliders (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    alias TEXT UNIQUE,
    type TEXT NOT NULL DEFAULT 'simple',
    width INTEGER NOT NULL DEFAULT 1200,
    height INTEGER NOT NULL DEFAULT 600,
    responsive TEXT NOT NULL DEFAULT '{}',
    settings TEXT NOT NULL DEFAULT '{}',
    created_by INTEGER NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS lexslider_slides (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    slider_id INTEGER NOT NULL,
    title TEXT,
    ordering INTEGER NOT NULL DEFAULT 0,
    published INTEGER NOT NULL DEFAULT 1,
    background TEXT NOT NULL DEFAULT '{}',
    layers TEXT NOT NULL DEFAULT '[]',
    settings TEXT NOT NULL DEFAULT '{}',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (slider_id) REFERENCES lexslider_sliders(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_lexslider_sliders_alias ON lexslider_sliders(alias);
CREATE INDEX IF NOT EXISTS idx_lexslider_slides_slider_id ON lexslider_slides(slider_id);
CREATE INDEX IF NOT EXISTS idx_lexslider_slides_ordering ON lexslider_slides(ordering);
