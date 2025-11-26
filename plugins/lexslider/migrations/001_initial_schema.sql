-- LexSlider Initial Schema Migration
-- Description: Creates tables for the LexSlider plugin

-- Drop existing tables if they exist (to fix schema mismatch)
DROP TABLE IF EXISTS lexslider_layers;
DROP TABLE IF EXISTS lexslider_slides;
DROP TABLE IF EXISTS lexslider_sliders;

-- Create sliders table
CREATE TABLE lexslider_sliders (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    alias TEXT UNIQUE,
    type TEXT DEFAULT 'simple' CHECK(type IN ('simple', 'carousel', 'showcase')),
    width INTEGER DEFAULT 1200,
    height INTEGER DEFAULT 600,
    responsive TEXT DEFAULT '{}',
    settings TEXT DEFAULT '{}',
    created_by INTEGER,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Create slides table
CREATE TABLE lexslider_slides (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    slider_id INTEGER NOT NULL,
    title TEXT,
    ordering INTEGER DEFAULT 0,
    published INTEGER DEFAULT 1,
    background TEXT DEFAULT '{}',
    settings TEXT DEFAULT '{}',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (slider_id) REFERENCES lexslider_sliders(id) ON DELETE CASCADE
);

-- Create layers table
CREATE TABLE lexslider_layers (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    slide_id INTEGER NOT NULL,
    type TEXT NOT NULL CHECK(type IN ('image', 'heading', 'text', 'button', 'video')),
    content TEXT NOT NULL,
    position TEXT DEFAULT '{}',
    style TEXT DEFAULT '{}',
    animation TEXT DEFAULT '{}',
    responsive TEXT DEFAULT '{}',
    ordering INTEGER DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (slide_id) REFERENCES lexslider_slides(id) ON DELETE CASCADE
);

-- Create indexes for better performance
CREATE INDEX idx_lexslider_slides_slider_id ON lexslider_slides(slider_id);
CREATE INDEX idx_lexslider_slides_ordering ON lexslider_slides(ordering);
CREATE INDEX idx_lexslider_layers_slide_id ON lexslider_layers(slide_id);
CREATE INDEX idx_lexslider_layers_ordering ON lexslider_layers(ordering);
CREATE INDEX idx_lexslider_sliders_alias ON lexslider_sliders(alias);

-- Create trigger to update updated_at timestamp for sliders
CREATE TRIGGER update_lexslider_sliders_timestamp 
AFTER UPDATE ON lexslider_sliders
BEGIN
    UPDATE lexslider_sliders SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
END;

-- Create trigger to update updated_at timestamp for slides
CREATE TRIGGER update_lexslider_slides_timestamp 
AFTER UPDATE ON lexslider_slides
BEGIN
    UPDATE lexslider_slides SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
END;

-- Create trigger to update updated_at timestamp for layers
CREATE TRIGGER update_lexslider_layers_timestamp 
AFTER UPDATE ON lexslider_layers
BEGIN
    UPDATE lexslider_layers SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
END;
