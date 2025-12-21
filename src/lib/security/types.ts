/**
 * Security System Types
 */

export interface RateLimitConfig {
  windowMs: number; // Time window in milliseconds
  maxRequests: number; // Max requests per window
  skipSuccessfulRequests?: boolean;
  skipFailedRequests?: boolean;
  keyGenerator?: (identifier: string) => string;
}

export interface RateLimitEntry {
  count: number;
  resetTime: number; // Timestamp when the window resets
  firstRequestTime: number;
}

export interface IPBlockRule {
  id?: number;
  ip: string;
  type: "block" | "blacklist" | "whitelist";
  reason?: string;
  expiresAt?: Date;
  createdBy?: number;
  createdAt: Date;
}

export interface SecurityEvent {
  id?: number;
  type: "rate_limit_exceeded" | "ip_blocked" | "suspicious_activity" | "brute_force_attempt" | "sql_injection_attempt" | "xss_attempt";
  ip: string;
  userAgent?: string;
  path?: string;
  method?: string;
  userId?: number;
  details?: string; // JSON
  severity: "low" | "medium" | "high" | "critical";
  createdAt: Date;
}

export interface SecurityStats {
  totalEvents: number;
  blockedIPs: number;
  whitelistedIPs: number;
  rateLimitHits: number;
  suspiciousActivity: number;
  bySeverity: Record<string, number>;
  byType: Record<string, number>;
  topBlockedIPs: { ip: string; count: number }[];
}

export interface SecurityHeaders {
  "X-Content-Type-Options": string;
  "X-Frame-Options": string;
  "X-XSS-Protection": string;
  "Strict-Transport-Security": string;
  "Content-Security-Policy": string;
  "Referrer-Policy": string;
  "Permissions-Policy": string;
}
