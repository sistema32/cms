/**
 * Plugin Security Manager
 * Validates permissions and sandboxes plugin operations
 */

import type { PluginManifest, PluginPermission } from './types.ts';

export class PluginSecurityManager {
  private manifest: PluginManifest;

  constructor(manifest: PluginManifest) {
    this.manifest = manifest;
  }

  /**
   * Validate that plugin has a specific permission
   */
  validatePermission(permission: PluginPermission): void {
    if (!this.manifest.permissions.includes(permission)) {
      throw new PluginSecurityError(
        `Plugin "${this.manifest.name}" does not have permission: ${permission}`
      );
    }
  }

  /**
   * Validate database query
   * Checks permissions and prevents dangerous operations
   */
  validateDatabaseQuery(sql: string): void {
    const upperSQL = sql.toUpperCase().trim();

    // Determine required permission based on query type
    if (upperSQL.startsWith('SELECT')) {
      this.validatePermission('database:read');
    } else if (
      upperSQL.startsWith('INSERT') ||
      upperSQL.startsWith('UPDATE') ||
      upperSQL.startsWith('DELETE')
    ) {
      this.validatePermission('database:write');
    }

    // Prevent dangerous operations
    const forbiddenKeywords = [
      'DROP',
      'TRUNCATE',
      'ALTER TABLE',
      'CREATE TABLE',
      'CREATE INDEX',
      'CREATE DATABASE',
      'GRANT',
      'REVOKE',
    ];

    for (const keyword of forbiddenKeywords) {
      if (upperSQL.includes(keyword)) {
        throw new PluginSecurityError(
          `Forbidden SQL keyword: ${keyword}. Plugins cannot modify database schema.`
        );
      }
    }

    // Prevent multiple statements (SQL injection protection)
    const statements = sql.split(';').filter(s => s.trim());
    if (statements.length > 1) {
      throw new PluginSecurityError(
        'Multiple SQL statements are not allowed. Execute queries separately.'
      );
    }
  }

  /**
   * Validate network request
   * Checks permissions and prevents SSRF attacks
   */
  validateNetworkRequest(url: string): void {
    this.validatePermission('network:external');

    try {
      const parsed = new URL(url);

      // Prevent SSRF (Server-Side Request Forgery)
      const forbiddenHosts = [
        'localhost',
        '127.0.0.1',
        '0.0.0.0',
        '::1',
        '169.254.169.254', // AWS metadata
      ];

      const hostname = parsed.hostname.toLowerCase();

      if (forbiddenHosts.includes(hostname)) {
        throw new PluginSecurityError(
          `Forbidden hostname: ${hostname}. Cannot make requests to local/internal services.`
        );
      }

      // Prevent private IP ranges
      if (this.isPrivateIP(hostname)) {
        throw new PluginSecurityError(
          `Private IP address not allowed: ${hostname}`
        );
      }

      // Only allow HTTP/HTTPS protocols
      if (!['http:', 'https:'].includes(parsed.protocol)) {
        throw new PluginSecurityError(
          `Forbidden protocol: ${parsed.protocol}. Only HTTP and HTTPS are allowed.`
        );
      }
    } catch (error) {
      if (error instanceof PluginSecurityError) {
        throw error;
      }
      throw new PluginSecurityError(`Invalid URL: ${url}`);
    }
  }

  /**
   * Validate file system access
   */
  validateFileAccess(path: string): void {
    this.validatePermission('system:files');

    // Prevent path traversal
    if (path.includes('..')) {
      throw new PluginSecurityError(
        'Path traversal not allowed. Cannot access parent directories.'
      );
    }

    // Only allow access to uploads directory and plugin directory
    const allowedPaths = ['/uploads/', `/plugins/${this.manifest.name}/`];

    const isAllowed = allowedPaths.some(allowed => path.startsWith(allowed));

    if (!isAllowed) {
      throw new PluginSecurityError(
        `File access denied. Plugins can only access: ${allowedPaths.join(', ')}`
      );
    }
  }

  /**
   * Validate shell command execution
   */
  validateShellCommand(command: string): void {
    this.validatePermission('system:shell');

    // This is extremely dangerous - plugins should rarely need this
    console.warn(
      `[SECURITY] Plugin "${this.manifest.name}" is executing shell command: ${command}`
    );

    // Prevent command injection
    const dangerous = ['&&', '||', ';', '|', '`', '$', '(', ')'];

    for (const char of dangerous) {
      if (command.includes(char)) {
        throw new PluginSecurityError(
          `Forbidden character in shell command: ${char}`
        );
      }
    }
  }

  /**
   * Check if hostname is a private IP address
   */
  private isPrivateIP(hostname: string): boolean {
    // Check for IPv4 private ranges
    const ipv4Regex = /^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/;
    const match = hostname.match(ipv4Regex);

    if (match) {
      const [, a, b, c, d] = match.map(Number);

      // Private IP ranges:
      // 10.0.0.0 – 10.255.255.255
      // 172.16.0.0 – 172.31.255.255
      // 192.168.0.0 – 192.168.255.255
      if (a === 10) return true;
      if (a === 172 && b >= 16 && b <= 31) return true;
      if (a === 192 && b === 168) return true;
    }

    return false;
  }

  /**
   * Rate limiting check (placeholder)
   */
  checkRateLimit(operation: string): void {
    // TODO: Implement rate limiting per plugin
    // This would prevent plugins from abusing resources
  }
}

/**
 * Plugin Security Error
 */
export class PluginSecurityError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'PluginSecurityError';
  }
}
