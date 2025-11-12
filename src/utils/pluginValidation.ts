/**
 * Plugin Validation Utilities
 * Provides validation functions for plugin operations
 */

/**
 * Validate plugin name format
 * Must be lowercase alphanumeric with dashes only
 */
export function validatePluginName(name: string): {
  valid: boolean;
  error?: string;
} {
  if (!name || typeof name !== "string") {
    return { valid: false, error: "Plugin name is required" };
  }

  const trimmedName = name.trim();

  if (trimmedName.length === 0) {
    return { valid: false, error: "Plugin name cannot be empty" };
  }

  if (trimmedName.length > 100) {
    return { valid: false, error: "Plugin name is too long (max 100 characters)" };
  }

  if (!/^[a-z0-9-]+$/.test(trimmedName)) {
    return {
      valid: false,
      error:
        "Plugin name must be lowercase alphanumeric with dashes only (e.g., 'my-plugin')",
    };
  }

  // Prevent path traversal
  if (trimmedName.includes("..") || trimmedName.includes("/") || trimmedName.includes("\\")) {
    return { valid: false, error: "Invalid plugin name format" };
  }

  // Reserved names
  const reserved = ["system", "core", "admin", "api", "root"];
  if (reserved.includes(trimmedName)) {
    return {
      valid: false,
      error: `Plugin name '${trimmedName}' is reserved`,
    };
  }

  return { valid: true };
}

/**
 * Validate plugin settings object
 * Ensures settings don't exceed size limits and contain valid data
 */
export function validatePluginSettings(settings: any): {
  valid: boolean;
  error?: string;
} {
  if (settings === null || settings === undefined) {
    return { valid: true }; // null/undefined is acceptable
  }

  if (typeof settings !== "object" || Array.isArray(settings)) {
    return { valid: false, error: "Settings must be an object" };
  }

  // Check JSON size (max 1MB)
  try {
    const jsonString = JSON.stringify(settings);
    const sizeInBytes = new TextEncoder().encode(jsonString).length;
    const maxSize = 1024 * 1024; // 1MB

    if (sizeInBytes > maxSize) {
      return {
        valid: false,
        error: `Settings object is too large (max ${maxSize / 1024}KB)`,
      };
    }
  } catch (error) {
    return { valid: false, error: "Settings object is not serializable" };
  }

  // Check for circular references
  try {
    JSON.stringify(settings);
  } catch (error) {
    return { valid: false, error: "Settings object contains circular references" };
  }

  return { valid: true };
}

/**
 * Validate plugin version format (semver)
 */
export function validatePluginVersion(version: string): {
  valid: boolean;
  error?: string;
} {
  if (!version || typeof version !== "string") {
    return { valid: false, error: "Version is required" };
  }

  const semverRegex = /^\d+\.\d+\.\d+(-[a-zA-Z0-9.-]+)?(\+[a-zA-Z0-9.-]+)?$/;

  if (!semverRegex.test(version)) {
    return {
      valid: false,
      error: "Version must follow semantic versioning (e.g., 1.0.0 or 1.0.0-beta.1)",
    };
  }

  return { valid: true };
}

/**
 * Sanitize plugin name for safe filesystem operations
 */
export function sanitizePluginName(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9-]/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

/**
 * Validate marketplace download request
 */
export function validateMarketplaceDownload(pluginData: any): {
  valid: boolean;
  error?: string;
} {
  if (!pluginData || typeof pluginData !== "object") {
    return { valid: false, error: "Invalid plugin data" };
  }

  const nameValidation = validatePluginName(pluginData.name);
  if (!nameValidation.valid) {
    return nameValidation;
  }

  if (!pluginData.version) {
    return { valid: false, error: "Plugin version is required" };
  }

  const versionValidation = validatePluginVersion(pluginData.version);
  if (!versionValidation.valid) {
    return versionValidation;
  }

  // Validate required metadata
  if (!pluginData.displayName || typeof pluginData.displayName !== "string") {
    return { valid: false, error: "Plugin display name is required" };
  }

  if (!pluginData.author || typeof pluginData.author !== "string") {
    return { valid: false, error: "Plugin author is required" };
  }

  return { valid: true };
}

/**
 * Validate plugin permissions array
 */
export function validatePluginPermissions(permissions: any): {
  valid: boolean;
  error?: string;
} {
  if (!Array.isArray(permissions)) {
    return { valid: false, error: "Permissions must be an array" };
  }

  const validPermissions = [
    "content:read",
    "content:write",
    "content:delete",
    "media:read",
    "media:write",
    "media:delete",
    "users:read",
    "users:write",
    "settings:read",
    "settings:write",
    "network:external",
    "database:read",
    "database:write",
    "system:shell",
    "system:files",
  ];

  for (const permission of permissions) {
    if (typeof permission !== "string") {
      return { valid: false, error: "All permissions must be strings" };
    }

    if (!validPermissions.includes(permission)) {
      return {
        valid: false,
        error: `Invalid permission: ${permission}`,
      };
    }
  }

  // Check for dangerous permission combinations
  const hasDatabaseWrite = permissions.includes("database:write");
  const hasSystemShell = permissions.includes("system:shell");
  const hasSystemFiles = permissions.includes("system:files");

  if ((hasDatabaseWrite && hasSystemShell) || (hasDatabaseWrite && hasSystemFiles)) {
    // This is allowed but should be logged/monitored
    console.warn(
      "Plugin requesting dangerous permission combination:",
      permissions,
    );
  }

  return { valid: true };
}

/**
 * Rate limiting for plugin operations
 */
const operationTimestamps = new Map<string, number[]>();

export function checkRateLimit(
  operation: string,
  maxAttempts: number = 10,
  windowMs: number = 60000,
): { allowed: boolean; retryAfter?: number } {
  const now = Date.now();
  const timestamps = operationTimestamps.get(operation) || [];

  // Remove timestamps outside the window
  const recentTimestamps = timestamps.filter((ts) => now - ts < windowMs);

  if (recentTimestamps.length >= maxAttempts) {
    const oldestTimestamp = recentTimestamps[0];
    const retryAfter = Math.ceil((oldestTimestamp + windowMs - now) / 1000);
    return { allowed: false, retryAfter };
  }

  // Add current timestamp
  recentTimestamps.push(now);
  operationTimestamps.set(operation, recentTimestamps);

  return { allowed: true };
}

/**
 * Validate plugin compatibility with LexCMS version
 */
export function validateCompatibility(
  requiredVersion: string,
  currentVersion: string = "1.0.0",
): {
  valid: boolean;
  error?: string;
} {
  try {
    // Simple version comparison (can be enhanced with semver library)
    const parseVersion = (v: string) => {
      const match = v.match(/^>=?(\d+)\.(\d+)\.(\d+)/);
      if (match) {
        return {
          operator: v.startsWith(">=") ? ">=" : "=",
          major: parseInt(match[1]),
          minor: parseInt(match[2]),
          patch: parseInt(match[3]),
        };
      }
      return null;
    };

    const required = parseVersion(requiredVersion);
    const current = parseVersion(currentVersion);

    if (!required || !current) {
      return {
        valid: false,
        error: "Invalid version format for compatibility check",
      };
    }

    // Simple comparison
    if (required.operator === ">=") {
      const isCompatible =
        current.major > required.major ||
        (current.major === required.major && current.minor > required.minor) ||
        (current.major === required.major &&
          current.minor === required.minor &&
          current.patch >= required.patch);

      if (!isCompatible) {
        return {
          valid: false,
          error: `Plugin requires LexCMS ${requiredVersion}, current version is ${currentVersion}`,
        };
      }
    }

    return { valid: true };
  } catch (error) {
    return { valid: false, error: "Error checking compatibility" };
  }
}
