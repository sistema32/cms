/**
 * Form Builder Schema
 * Database schema for custom forms functionality
 */

import {
    integer,
    primaryKey,
    sqliteTable,
    text,
} from "drizzle-orm/sqlite-core";
import { sql } from "drizzle-orm";
import { users } from "./index.ts";

// ============= FORMS =============
export const forms = sqliteTable("forms", {
    id: integer("id").primaryKey({ autoIncrement: true }),
    name: text("name").notNull(),
    slug: text("slug").notNull().unique(),
    description: text("description"),

    // Form configuration
    settings: text("settings"), // JSON: { successMessage, redirectUrl, emailNotifications, etc. }

    // Status
    status: text("status").notNull().default("active"), // active, inactive, archived

    // Metadata
    createdBy: integer("created_by").notNull().references(() => users.id, {
        onDelete: "cascade",
    }),
    createdAt: integer("created_at", { mode: "timestamp" })
        .notNull()
        .default(sql`(unixepoch())`),
    updatedAt: integer("updated_at", { mode: "timestamp" })
        .notNull()
        .default(sql`(unixepoch())`),
});

// ============= FORM_FIELDS =============
export const formFields = sqliteTable("form_fields", {
    id: integer("id").primaryKey({ autoIncrement: true }),
    formId: integer("form_id").notNull().references(() => forms.id, {
        onDelete: "cascade",
    }),

    // Field configuration
    type: text("type").notNull(), // text, email, tel, number, textarea, select, radio, checkbox, file, date
    label: text("label").notNull(),
    name: text("name").notNull(), // Field name for form submission
    placeholder: text("placeholder"),
    helpText: text("help_text"),

    // Validation
    required: integer("required", { mode: "boolean" }).notNull().default(false),
    validation: text("validation"), // JSON: { min, max, pattern, custom }

    // Options for select/radio/checkbox
    options: text("options"), // JSON array: ["Option 1", "Option 2"]

    // Conditional logic
    conditionalLogic: text("conditional_logic"), // JSON: { show_if: { field: "other_field", value: "yes" } }

    // Order and visibility
    orderIndex: integer("order_index").notNull().default(0),
    isVisible: integer("is_visible", { mode: "boolean" }).notNull().default(true),

    // Metadata
    createdAt: integer("created_at", { mode: "timestamp" })
        .notNull()
        .default(sql`(unixepoch())`),
});

// ============= FORM_SUBMISSIONS =============
export const formSubmissions = sqliteTable("form_submissions", {
    id: integer("id").primaryKey({ autoIncrement: true }),
    formId: integer("form_id").notNull().references(() => forms.id, {
        onDelete: "cascade",
    }),

    // Submission data
    data: text("data").notNull(), // JSON with all field values

    // User information (if logged in)
    userId: integer("user_id").references(() => users.id, {
        onDelete: "set null",
    }),

    // Request metadata
    ipAddress: text("ip_address"),
    userAgent: text("user_agent"),
    referrer: text("referrer"),

    // Status
    status: text("status").notNull().default("new"), // new, read, archived, spam

    // Notes (for admin)
    notes: text("notes"),

    // Timestamps
    submittedAt: integer("submitted_at", { mode: "timestamp" })
        .notNull()
        .default(sql`(unixepoch())`),
    readAt: integer("read_at", { mode: "timestamp" }),
});
