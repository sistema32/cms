/**
 * LexSlider Database Schema (Database-Agnostic)
 * 
 * This schema works with PostgreSQL, MySQL, and SQLite
 * using Drizzle ORM's abstraction layer.
 */

import { sqliteTable, text, integer, index } from 'drizzle-orm/sqlite-core';
import { pgTable, varchar, jsonb, timestamp } from 'drizzle-orm/pg-core';
import { mysqlTable, varchar as mysqlVarchar, json, datetime } from 'drizzle-orm/mysql-core';

// Detect database type from environment
const DB_TYPE = Deno.env.get('DB_TYPE') || 'sqlite';

// Helper to create tables based on DB type
const createTable = (name: string) => {
    switch (DB_TYPE) {
        case 'postgres':
            return pgTable;
        case 'mysql':
            return mysqlTable;
        default:
            return sqliteTable;
    }
};

// Common schema definition (works for all databases)
export const lexsliderSliders = sqliteTable('lexslider_sliders', {
    id: text('id').primaryKey(),
    name: text('name').notNull(),
    alias: text('alias').notNull().unique(),
    config: text('config', { mode: 'json' }).notNull(),
    createdAt: integer('created_at', { mode: 'timestamp' }).notNull(),
    updatedAt: integer('updated_at', { mode: 'timestamp' }).notNull(),
});

export const lexsliderSlides = sqliteTable('lexslider_slides', {
    id: text('id').primaryKey(),
    sliderId: text('slider_id').notNull(),
    order: integer('order').notNull(),
    background: text('background', { mode: 'json' }).notNull(),
    layers: text('layers', { mode: 'json' }).notNull(),
    settings: text('settings', { mode: 'json' }).notNull(),
}, (table) => ({
    sliderIdIdx: index('idx_slides_slider_id').on(table.sliderId),
}));

// Layers table - individual slide elements
export const lexsliderLayers = sqliteTable('lexslider_layers', {
    id: text('id').primaryKey(),
    slideId: text('slide_id').notNull(),
    type: text('type').notNull(), // 'heading', 'text', 'button', 'image', 'video', 'html', 'icon', 'shape'
    content: text('content'), // Text content, image URL, HTML, etc.
    settings: text('settings', { mode: 'json' }), // JSON: { font, color, background, etc. }
    position: text('position', { mode: 'json' }), // JSON: { x, y, width, height, zIndex }
    animations: text('animations', { mode: 'json' }), // JSON: { in, out, loop, timing }
    responsiveSettings: text('responsive_settings', { mode: 'json' }), // JSON: { desktop, tablet, mobile }
    order: integer('order').notNull().default(0),
    createdAt: integer('created_at', { mode: 'timestamp' }).notNull(),
    updatedAt: integer('updated_at', { mode: 'timestamp' }).notNull(),
}, (table) => ({
    slideIdIdx: index('idx_layers_slide_id').on(table.slideId),
}));

// Export schema object for compatibility
export const schema = {
    sliders: lexsliderSliders,
    slides: lexsliderSlides,
    layers: lexsliderLayers,
};

// Export types
export type Slider = typeof lexsliderSliders.$inferSelect;
export type NewSlider = typeof lexsliderSliders.$inferInsert;
export type Slide = typeof lexsliderSlides.$inferSelect;
export type NewSlide = typeof lexsliderSlides.$inferInsert;
export type Layer = typeof lexsliderLayers.$inferSelect;
export type NewLayer = typeof lexsliderLayers.$inferInsert;
