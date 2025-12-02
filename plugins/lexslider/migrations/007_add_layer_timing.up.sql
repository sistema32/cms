-- Add timing columns to plugin_lexslider_layers table
ALTER TABLE plugin_lexslider_layers ADD COLUMN start_time INTEGER DEFAULT 0;
ALTER TABLE plugin_lexslider_layers ADD COLUMN duration INTEGER DEFAULT 5000;
