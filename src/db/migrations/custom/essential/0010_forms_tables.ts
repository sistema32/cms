/**
 * Migration: Add Forms Tables
 * 
 * Creates tables for Form Builder functionality
 */

import type { CustomMigration } from "../../types.ts";

export const migration: CustomMigration = {
    id: "0010_forms_tables",
    name: "Add Forms Tables",
    description: "Creates tables for Form Builder: forms, form_fields, form_submissions",

    async up(db) {
        console.log("📝 Creating forms tables...");

        // Create forms table
        await db.run(`
      CREATE TABLE IF NOT EXISTS forms (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        slug TEXT NOT NULL UNIQUE,
        description TEXT,
        settings TEXT,
        status TEXT NOT NULL DEFAULT 'active',
        created_by INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        created_at INTEGER NOT NULL DEFAULT (unixepoch()),
        updated_at INTEGER NOT NULL DEFAULT (unixepoch())
      )
    `);

        // Create form_fields table
        await db.run(`
      CREATE TABLE IF NOT EXISTS form_fields (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        form_id INTEGER NOT NULL REFERENCES forms(id) ON DELETE CASCADE,
        type TEXT NOT NULL,
        label TEXT NOT NULL,
        name TEXT NOT NULL,
        placeholder TEXT,
        help_text TEXT,
        required INTEGER NOT NULL DEFAULT 0,
        validation TEXT,
        options TEXT,
        conditional_logic TEXT,
        order_index INTEGER NOT NULL DEFAULT 0,
        is_visible INTEGER NOT NULL DEFAULT 1,
        created_at INTEGER NOT NULL DEFAULT (unixepoch())
      )
    `);

        // Create form_submissions table
        await db.run(`
      CREATE TABLE IF NOT EXISTS form_submissions (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        form_id INTEGER NOT NULL REFERENCES forms(id) ON DELETE CASCADE,
        data TEXT NOT NULL,
        user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
        ip_address TEXT,
        user_agent TEXT,
        referrer TEXT,
        status TEXT NOT NULL DEFAULT 'new',
        notes TEXT,
        submitted_at INTEGER NOT NULL DEFAULT (unixepoch()),
        read_at INTEGER
      )
    `);

        // Create indexes for better performance
        await db.run(`
      CREATE INDEX IF NOT EXISTS idx_forms_slug ON forms(slug)
    `);

        await db.run(`
      CREATE INDEX IF NOT EXISTS idx_forms_status ON forms(status)
    `);

        await db.run(`
      CREATE INDEX IF NOT EXISTS idx_form_fields_form_id ON form_fields(form_id, order_index)
    `);

        await db.run(`
      CREATE INDEX IF NOT EXISTS idx_form_submissions_form_id ON form_submissions(form_id, submitted_at DESC)
    `);

        await db.run(`
      CREATE INDEX IF NOT EXISTS idx_form_submissions_status ON form_submissions(status)
    `);

        console.log("✅ Forms tables created successfully");
    },

    async down(db) {
        console.log("📝 Removing forms tables...");

        await db.run("DROP INDEX IF EXISTS idx_form_submissions_status");
        await db.run("DROP INDEX IF EXISTS idx_form_submissions_form_id");
        await db.run("DROP INDEX IF EXISTS idx_form_fields_form_id");
        await db.run("DROP INDEX IF EXISTS idx_forms_status");
        await db.run("DROP INDEX IF EXISTS idx_forms_slug");

        await db.run("DROP TABLE IF EXISTS form_submissions");
        await db.run("DROP TABLE IF EXISTS form_fields");
        await db.run("DROP TABLE IF EXISTS forms");

        console.log("✅ Forms tables removed");
    },
};
