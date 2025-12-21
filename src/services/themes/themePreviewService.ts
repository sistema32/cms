// @ts-nocheck
/**
 * Theme Preview Service
 * Allows previewing themes before activation
 */

import { generateToken, verifyToken } from "@/utils/jwt.ts";

export interface PreviewSession {
  token: string;
  theme: string;
  userId: number;
  createdAt: Date;
  expiresAt: Date;
}

class ThemePreviewService {
  private sessions = new Map<string, PreviewSession>();
  private readonly SESSION_DURATION = 3600000; // 1 hour in ms

  /**
   * Create a preview session for a theme
   */
  async createPreviewSession(
    theme: string,
    userId: number
  ): Promise<PreviewSession> {
    // Generate secure token
    const token = await generateToken({
      type: "theme_preview",
      theme,
      userId,
    }, "1h");

    const session: PreviewSession = {
      token,
      theme,
      userId,
      createdAt: new Date(),
      expiresAt: new Date(Date.now() + this.SESSION_DURATION),
    };

    this.sessions.set(token, session);

    // Auto-cleanup expired session
    setTimeout(() => {
      this.sessions.delete(token);
    }, this.SESSION_DURATION);

    return session;
  }

  /**
   * Verify a preview token
   */
  async verifyPreviewToken(token: string): Promise<PreviewSession | null> {
    try {
      // Verify JWT
      const payload = await verifyToken(token);

      if (payload.type !== "theme_preview") {
        return null;
      }

      // Check if session exists
      const session = this.sessions.get(token);

      if (!session) {
        return null;
      }

      // Check if session is expired
      if (new Date() > session.expiresAt) {
        this.sessions.delete(token);
        return null;
      }

      return session;
    } catch (error) {
      console.error("Error verifying preview token:", error);
      return null;
    }
  }

  /**
   * Get preview session by token
   */
  getSession(token: string): PreviewSession | null {
    const session = this.sessions.get(token);

    if (!session) {
      return null;
    }

    // Check expiration
    if (new Date() > session.expiresAt) {
      this.sessions.delete(token);
      return null;
    }

    return session;
  }

  /**
   * Delete a preview session
   */
  deleteSession(token: string): boolean {
    return this.sessions.delete(token);
  }

  /**
   * End a preview session (alias for deleteSession)
   */
  async endPreviewSession(token: string): Promise<boolean> {
    return this.deleteSession(token);
  }

  /**
   * Get all active sessions for a user
   */
  getUserSessions(userId: number): PreviewSession[] {
    const sessions: PreviewSession[] = [];

    for (const session of this.sessions.values()) {
      if (session.userId === userId) {
        // Check if not expired
        if (new Date() <= session.expiresAt) {
          sessions.push(session);
        } else {
          // Clean up expired session
          this.sessions.delete(session.token);
        }
      }
    }

    return sessions;
  }

  /**
   * Clean up all expired sessions
   */
  cleanupExpiredSessions(): number {
    let cleaned = 0;
    const now = new Date();

    for (const [token, session] of this.sessions.entries()) {
      if (now > session.expiresAt) {
        this.sessions.delete(token);
        cleaned++;
      }
    }

    return cleaned;
  }

  /**
   * Get active session count
   */
  getActiveSessionCount(): number {
    this.cleanupExpiredSessions();
    return this.sessions.size;
  }

  /**
   * Clear all sessions
   */
  clearAllSessions(): void {
    this.sessions.clear();
  }
}

// Singleton instance
export const themePreviewService = new ThemePreviewService();

/**
 * Helper to create preview URL
 */
export function createPreviewUrl(
  baseUrl: string,
  token: string,
  path = "/"
): string {
  const url = new URL(path, baseUrl);
  url.searchParams.set("preview_theme", "true");
  url.searchParams.set("preview_token", token);
  return url.toString();
}

/**
 * Extract preview info from request
 */
export function extractPreviewInfo(url: URL): {
  isPreview: boolean;
  token?: string;
} {
  const isPreview = url.searchParams.get("preview_theme") === "true";
  const token = url.searchParams.get("preview_token") || undefined;

  return { isPreview, token };
}
