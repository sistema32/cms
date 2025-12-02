-- Add updated_at column to sliders table
ALTER TABLE plugin_lexslider_sliders ADD COLUMN updated_at DATETIME DEFAULT CURRENT_TIMESTAMP;
