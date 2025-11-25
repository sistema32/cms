import * as settingsService from "../../services/settingsService.ts";

/**
 * Formatting Helpers - Functions for formatting dates, text, etc.
 */

/**
 * Format a date according to configured format
 */
export async function formatDate(date: Date, format?: string): Promise<string> {
    const dateFormat = format ||
        await settingsService.getSetting("date_format", "DD/MM/YYYY");

    // Simple date formatting implementation
    // TODO: Use more robust date formatting library
    const day = String(date.getDate()).padStart(2, "0");
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const year = date.getFullYear();

    return dateFormat
        .replace("DD", day)
        .replace("MM", month)
        .replace("YYYY", String(year));
}

/**
 * Format time according to configured format
 */
export async function formatTime(date: Date, format?: string): Promise<string> {
    const timeFormat = format ||
        await settingsService.getSetting("time_format", "HH:mm");

    const hours = String(date.getHours()).padStart(2, "0");
    const minutes = String(date.getMinutes()).padStart(2, "0");

    return timeFormat
        .replace("HH", hours)
        .replace("mm", minutes);
}

/**
 * Extract an excerpt from content
 */
export function excerpt(content: string, words = 50): string {
    if (!content) return "";

    // Remove HTML tags
    const textOnly = content.replace(/<[^>]*>/g, "");

    // Split into words
    const wordArray = textOnly.split(/\s+/);

    // Take only first N words
    if (wordArray.length <= words) {
        return textOnly;
    }

    return wordArray.slice(0, words).join(" ") + "...";
}
