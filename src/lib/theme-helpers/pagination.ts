import * as settingsService from "../../services/settingsService.ts";
import type { PaginationData } from "./types.ts";

/**
 * Pagination Helpers - Functions for pagination logic
 */

/**
 * Calculate pagination data
 */
export async function getPagination(
    currentPage: number,
    totalItems: number,
    itemsPerPage?: number,
): Promise<PaginationData> {
    const perPage = itemsPerPage ||
        await settingsService.getSetting("posts_per_page", 10);
    const totalPages = Math.ceil(totalItems / perPage);

    return {
        currentPage,
        totalPages,
        hasNext: currentPage < totalPages,
        hasPrev: currentPage > 1,
        nextPage: currentPage < totalPages ? currentPage + 1 : null,
        prevPage: currentPage > 1 ? currentPage - 1 : null,
    };
}

/**
 * Generate array of page numbers for pagination
 * Example: [1, 2, 3, "...", 8, 9, 10]
 */
export function getPaginationNumbers(
    currentPage: number,
    totalPages: number,
    delta: number = 2,
): (number | string)[] {
    if (totalPages <= 1) return [1];

    const range: (number | string)[] = [];
    const rangeWithDots: (number | string)[] = [];

    // Always include first page
    range.push(1);

    // Include pages around current
    for (let i = currentPage - delta; i <= currentPage + delta; i++) {
        if (i > 1 && i < totalPages) {
            range.push(i);
        }
    }

    // Always include last page
    if (totalPages > 1) {
        range.push(totalPages);
    }

    // Add ellipsis where there are gaps
    let prev = 0;
    for (const page of range) {
        if (typeof page === "number") {
            if (page - prev === 2) {
                rangeWithDots.push(prev + 1);
            } else if (page - prev !== 1) {
                rangeWithDots.push("...");
            }
            rangeWithDots.push(page);
            prev = page;
        }
    }

    return rangeWithDots;
}
