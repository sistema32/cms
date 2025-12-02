-- Add missing columns to plugin_lexslider_slides table
ALTER TABLE plugin_lexslider_slides ADD COLUMN title TEXT DEFAULT 'Slide';
ALTER TABLE plugin_lexslider_slides ADD COLUMN ken_burns INTEGER DEFAULT 0;
ALTER TABLE plugin_lexslider_slides ADD COLUMN transition TEXT DEFAULT 'fade';
ALTER TABLE plugin_lexslider_slides ADD COLUMN duration INTEGER DEFAULT 500;
ALTER TABLE plugin_lexslider_slides ADD COLUMN updated_at DATETIME DEFAULT CURRENT_TIMESTAMP;
