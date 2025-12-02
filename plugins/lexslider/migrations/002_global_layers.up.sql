CREATE TABLE IF NOT EXISTS plugin_lexslider_global_layers (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    slider_id INTEGER NOT NULL,
    type TEXT NOT NULL,
    content TEXT NOT NULL, -- JSON
    style TEXT NOT NULL,   -- JSON
    ordering INTEGER DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(slider_id) REFERENCES plugin_lexslider_sliders(id) ON DELETE CASCADE
);
