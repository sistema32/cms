/**
 * XSS Protection Helper
 * Escapes HTML special characters to prevent XSS attacks
 */
export function escapeHtml(str: string | null | undefined): string {
    if (str === null || str === undefined) return '';
    return String(str)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
}

/**
 * Escape HTML for use in attributes (more restrictive)
 */
export function escapeAttr(str: string | null | undefined): string {
    if (str === null || str === undefined) return '';
    return String(str)
        .replace(/&/g, '&amp;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/`/g, '&#96;');
}

/**
 * Sanitize URL for safe use in href/src attributes
 */
export function sanitizeUrl(url: string | null | undefined): string {
    if (!url) return '#';
    const trimmed = String(url).trim();

    // Block javascript: and data: URLs (XSS vectors)
    if (/^(javascript|data|vbscript):/i.test(trimmed)) {
        return '#';
    }

    return escapeAttr(trimmed);
}
