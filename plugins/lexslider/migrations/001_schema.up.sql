CREATE TABLE IF NOT EXISTS plugin_lexslider_sliders (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    width INTEGER DEFAULT 1200,
    height INTEGER DEFAULT 600,
    type TEXT DEFAULT 'simple',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS plugin_lexslider_slides (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    slider_id INTEGER NOT NULL,
    title TEXT DEFAULT 'Slide',
    background_image TEXT,
    ordering INTEGER DEFAULT 0,
    ken_burns INTEGER DEFAULT 0,
    transition TEXT DEFAULT 'fade',
    duration INTEGER DEFAULT 500,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (slider_id) REFERENCES plugin_lexslider_sliders(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS plugin_lexslider_layers (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    slide_id INTEGER NOT NULL,
    name TEXT DEFAULT 'Layer',
    type TEXT NOT NULL,
    content TEXT,
    style TEXT,
    ordering INTEGER DEFAULT 0,
    locked INTEGER DEFAULT 0,
    hidden INTEGER DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (slide_id) REFERENCES plugin_lexslider_slides(id) ON DELETE CASCADE
);
