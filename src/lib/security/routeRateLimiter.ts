import type { RateLimitRule } from "@/db/schema.ts";
import { createLogger } from "@/platform/logger.ts";
import { rateLimitConfigService } from "@/services/security/rateLimitConfigService.ts";
import { RateLimiter } from "./RateLimiter.ts";

type RouteRateLimitResult =
  | { applied: false }
  | {
    applied: true;
    allowed: boolean;
    remaining: number;
    resetTime: number;
    limit: number;
    rule: RateLimitRule;
  };

type CompiledRule = {
  rule: RateLimitRule;
  limiter: RateLimiter;
  matcher: (path: string) => boolean;
};

const log = createLogger("routeRateLimiter");
const CACHE_TTL = 60_000;

const limiterCache = new Map<number, RateLimiter>();
let compiledRules: CompiledRule[] = [];
let lastLoadedAt = 0;

function buildMatcher(pattern: string): (path: string) => boolean {
  const escaped = pattern
    .replace(/[.*+?^${}()|[\]\\]/g, "\\$&")
    .replace(/\\\*/g, ".*");
  const regex = new RegExp(`^${escaped}$`);
  return (path: string) => regex.test(path);
}

async function loadRules() {
  try {
    const activeRules = await rateLimitConfigService.getActiveRules();
    compiledRules = activeRules
      .filter((rule) => rule.id !== undefined && rule.id !== null)
      .map((rule) => {
        const limiter = limiterCache.get(rule.id!) ??
          new RateLimiter({
            windowMs: rule.windowSeconds * 1000,
            maxRequests: rule.maxRequests,
          });
        limiterCache.set(rule.id!, limiter);
        return {
          rule,
          limiter,
          matcher: buildMatcher(rule.path),
        };
      });
    lastLoadedAt = Date.now();
  } catch (error) {
    log.error(
      "Failed to load route rate limit rules",
      error instanceof Error ? error : undefined,
    );
    lastLoadedAt = Date.now();
  }
}

async function ensureRulesFresh() {
  if (compiledRules.length === 0 || Date.now() - lastLoadedAt > CACHE_TTL) {
    await loadRules();
  }
}

export async function checkRouteRateLimit(
  path: string,
  method: string,
  identifier: string,
): Promise<RouteRateLimitResult> {
  await ensureRulesFresh();

  if (compiledRules.length === 0) {
    return { applied: false };
  }

  const normalizedMethod = method.toUpperCase();
  const candidates = compiledRules.filter(({ rule, matcher }) =>
    matcher(path) &&
    (!rule.method || rule.method.toUpperCase() === normalizedMethod)
  );

  if (candidates.length === 0) {
    return { applied: false };
  }

  // Prefer the most specific rule (longest path pattern)
  const match = candidates.sort((a, b) => b.rule.path.length - a.rule.path.length)[0];
  const result = await match.limiter.check(identifier);

  return {
    applied: true,
    allowed: result.allowed,
    remaining: result.remaining,
    resetTime: result.resetTime,
    limit: match.rule.maxRequests,
    rule: match.rule,
  };
}
