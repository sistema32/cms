/**
 * Migration: Add Performance Indexes
 * 
 * Adds composite indexes to improve query performance for common operations
 */

import type { CustomMigration } from "../../types.ts";

export const migration: CustomMigration = {
    id: "0009_performance_indexes",
    name: "Add Performance Indexes",
    description: "Adds composite indexes for better query performance",

    async up(db) {
        console.log("📊 Adding performance indexes...");

        // Index for content queries (status + type + published date)
        await db.run(`
      CREATE INDEX IF NOT EXISTS idx_content_status_type_published 
      ON content(status, content_type_id, published_at DESC)
    `);

        // Index for content by author
        await db.run(`
      CREATE INDEX IF NOT EXISTS idx_content_author 
      ON content(author_id, status, created_at DESC)
    `);

        // Index for comments by content and status
        await db.run(`
      CREATE INDEX IF NOT EXISTS idx_comments_content_status 
      ON comments(content_id, status, created_at DESC)
    `);

        // Index for media by uploader
        await db.run(`
      CREATE INDEX IF NOT EXISTS idx_media_uploader 
      ON media(uploaded_by, created_at DESC)
    `);

        // Index for media by type
        await db.run(`
      CREATE INDEX IF NOT EXISTS idx_media_type 
      ON media(type, created_at DESC)
    `);

        // Index for audit logs by user
        await db.run(`
      CREATE INDEX IF NOT EXISTS idx_audit_logs_user 
      ON audit_logs(user_id, created_at DESC)
    `);

        // Index for audit logs by entity
        await db.run(`
      CREATE INDEX IF NOT EXISTS idx_audit_logs_entity 
      ON audit_logs(entity, entity_id, created_at DESC)
    `);

        // Index for content revisions
        await db.run(`
      CREATE INDEX IF NOT EXISTS idx_content_revisions_content 
      ON content_revisions(content_id, revision_number DESC)
    `);

        console.log("✅ Performance indexes created successfully");
    },

    async down(db) {
        console.log("📊 Removing performance indexes...");

        await db.run("DROP INDEX IF EXISTS idx_content_status_type_published");
        await db.run("DROP INDEX IF EXISTS idx_content_author");
        await db.run("DROP INDEX IF EXISTS idx_comments_content_status");
        await db.run("DROP INDEX IF EXISTS idx_media_uploader");
        await db.run("DROP INDEX IF EXISTS idx_media_type");
        await db.run("DROP INDEX IF EXISTS idx_audit_logs_user");
        await db.run("DROP INDEX IF EXISTS idx_audit_logs_entity");
        await db.run("DROP INDEX IF EXISTS idx_content_revisions_content");

        console.log("✅ Performance indexes removed");
    },
};
