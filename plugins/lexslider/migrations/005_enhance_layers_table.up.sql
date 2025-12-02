-- Add missing columns to plugin_lexslider_layers table
ALTER TABLE plugin_lexslider_layers ADD COLUMN name TEXT DEFAULT 'Layer';
ALTER TABLE plugin_lexslider_layers ADD COLUMN locked INTEGER DEFAULT 0;
ALTER TABLE plugin_lexslider_layers ADD COLUMN hidden INTEGER DEFAULT 0;
ALTER TABLE plugin_lexslider_layers ADD COLUMN updated_at DATETIME DEFAULT CURRENT_TIMESTAMP;
