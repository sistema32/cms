import { AppError } from "@/platform/errors.ts";
import { isSafePublicUrl } from "@/utils/validation.ts";

/**
 * Centralized SSRF/public URL guard to enforce allowed protocols and hosts.
 */
export function assertSafePublicUrl(url: string, context = "url"): string {
  if (!url) {
    throw AppError.fromCatalog("invalid_url", {
      message: "URL requerida",
      details: { context },
    });
  }

  if (!isSafePublicUrl(url)) {
    throw AppError.fromCatalog("invalid_url", {
      message: "URL no permitida o apunta a red interna",
      details: { url, context },
    });
  }

  return url;
}

/**
 * Validates and returns the provided URL or undefined for falsy values.
 */
export function optionalSafePublicUrl(
  url: string | undefined | null,
  context = "url",
): string | undefined {
  if (!url) return undefined;
  return assertSafePublicUrl(url, context);
}
