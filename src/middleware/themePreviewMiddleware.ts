/**
 * Theme Preview Middleware
 * Allows previewing themes without activation
 */

import type { Context, Next } from "hono";
import {
  extractPreviewInfo,
  themePreviewService,
} from "../services/themePreviewService.ts";

/**
 * Middleware to handle theme preview mode
 */
export async function themePreviewMiddleware(c: Context, next: Next) {
  const url = new URL(c.req.url);
  const { isPreview, token } = extractPreviewInfo(url);

  if (isPreview && token) {
    // Verify preview token
    const session = await themePreviewService.verifyPreviewToken(token);

    if (session) {
      // Set preview theme as active
      c.set("activeTheme", session.theme);
      c.set("isPreview", true);
      c.set("previewSession", session);

      // Add preview banner flag
      c.set("showPreviewBanner", true);

      console.log(
        `🎨 Preview mode: ${session.theme} (user: ${session.userId})`,
      );
    } else {
      // Invalid or expired token
      console.warn("⚠️  Invalid preview token");
    }
  }

  await next();

  // Inject preview banner if in preview mode
  if (c.get("showPreviewBanner") && !c.finalized) {
    await injectPreviewBanner(c, token!);
  }
}

/**
 * Inject preview banner into HTML response
 */
async function injectPreviewBanner(c: Context, token: string): Promise<void> {
  const contentType = c.res.headers.get("content-type") || "";

  if (!contentType.includes("text/html")) {
    return;
  }

  try {
    const originalBody = await c.res.text();

    if (!originalBody.includes("<body")) {
      const status = c.res.status && c.res.status >= 100 ? c.res.status : 200;
      c.res = new Response(originalBody, { status, headers: c.res.headers });
      return;
    }

    const session = c.get("previewSession");
    const banner = createPreviewBanner(session.theme, token);

    // Inject banner after <body> tag
    const modifiedBody = originalBody.replace(
      /<body([^>]*)>/i,
      (match) => `${match}\n${banner}`,
    );

    const status = c.res.status && c.res.status >= 100 ? c.res.status : 200;
    c.res = new Response(modifiedBody, {
      status,
      headers: c.res.headers,
    });
  } catch (error) {
    console.error("Error injecting preview banner:", error);
  }
}

/**
 * Create preview banner HTML
 */
function createPreviewBanner(themeName: string, token: string): string {
  return `
<div id="theme-preview-banner" style="
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  padding: 12px 20px;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  font-size: 14px;
  z-index: 999999;
  box-shadow: 0 2px 10px rgba(0,0,0,0.1);
  display: flex;
  align-items: center;
  justify-content: space-between;
">
  <div style="display: flex; align-items: center; gap: 12px;">
    <span style="font-size: 18px;">🎨</span>
    <strong>Preview Mode:</strong>
    <span>${themeName}</span>
    <span style="opacity: 0.8; font-size: 12px; margin-left: 8px;">
      This is a preview. Changes are not saved.
    </span>
  </div>
  <div style="display: flex; gap: 10px;">
    <button onclick="window.location.href=window.location.pathname" style="
      background: rgba(255,255,255,0.2);
      border: 1px solid rgba(255,255,255,0.3);
      color: white;
      padding: 6px 16px;
      border-radius: 4px;
      cursor: pointer;
      font-size: 13px;
      font-weight: 500;
    ">
      Exit Preview
    </button>
    <button onclick="activatePreviewTheme('${token}')" style="
      background: white;
      border: none;
      color: #667eea;
      padding: 6px 16px;
      border-radius: 4px;
      cursor: pointer;
      font-size: 13px;
      font-weight: 600;
    ">
      Activate Theme
    </button>
  </div>
</div>
<script>
  // Adjust body padding to account for banner
  document.body.style.paddingTop = '48px';

  async function activatePreviewTheme(token) {
    if (!confirm('Activate this theme for your site?')) {
      return;
    }

    try {
      const response = await fetch('/api/admin/themes/preview/activate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token })
      });

      const result = await response.json();

      if (result.success) {
        alert('Theme activated successfully!');
        window.location.href = '/admin/appearance/themes';
      } else {
        alert('Error: ' + (result.error || 'Failed to activate theme'));
      }
    } catch (error) {
      alert('Error activating theme: ' + error.message);
    }
  }
</script>
  `.trim();
}

/**
 * Check if request is in preview mode
 */
export function isPreviewMode(c: Context): boolean {
  return c.get("isPreview") === true;
}

/**
 * Get preview theme name
 */
export function getPreviewTheme(c: Context): string | undefined {
  if (isPreviewMode(c)) {
    return c.get("activeTheme");
  }
  return undefined;
}
