CREATE TABLE IF NOT EXISTS plugin_smart_slider_3_sliders (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    type TEXT DEFAULT 'simple',
    width INTEGER DEFAULT 1200,
    height INTEGER DEFAULT 600,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS plugin_smart_slider_3_slides (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    slider_id INTEGER NOT NULL,
    title TEXT,
    background_image TEXT,
    ordering INTEGER DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (slider_id) REFERENCES plugin_smart_slider_3_sliders(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS plugin_smart_slider_3_layers (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    slide_id INTEGER NOT NULL,
    type TEXT NOT NULL, -- 'heading', 'text', 'image', 'button'
    content TEXT, -- JSON content configuration
    style TEXT, -- JSON style configuration
    ordering INTEGER DEFAULT 0,
    FOREIGN KEY (slide_id) REFERENCES plugin_smart_slider_3_slides(id) ON DELETE CASCADE
);
