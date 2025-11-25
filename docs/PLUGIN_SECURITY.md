# Plugin System Security Guide

This guide covers the security features implemented in the LexCMS plugin system.

## Table of Contents

1. [Overview](#overview)
2. [Rate Limiting](#rate-limiting)
3. [Audit Logging](#audit-logging)
4. [Integrity Verification](#integrity-verification)
5. [Sandboxing & Resource Limits](#sandboxing--resource-limits)
6. [CLI Tools](#cli-tools)
7. [Configuration](#configuration)
8. [Best Practices](#best-practices)

---

## Overview

The LexCMS plugin system includes four critical security layers:

1. **Rate Limiting** - Prevents plugins from overwhelming system resources
2. **Audit Logging** - Tracks all sensitive plugin operations
3. **Integrity Verification** - Ensures plugins haven't been tampered with
4. **Sandboxing** - Isolates plugins and enforces resource limits

---

## Rate Limiting

### How It Works

Uses a **Token Bucket** algorithm to limit operations per minute:

- **Database Queries**: 10/min (default)
- **HTTP Requests**: 30/min (default)
- **File Operations**: 20/min (default)
- **Hook Executions**: 100/min (default)

### Configuration

```bash
# In .env file
PLUGIN_RATE_LIMIT_DB_QUERIES=10
PLUGIN_RATE_LIMIT_HTTP_REQUESTS=30
PLUGIN_RATE_LIMIT_FILE_OPS=20
```

### CLI Commands

```bash
# View rate limit stats for a plugin
deno task plugin limits <plugin-name>

# Reset rate limits for a plugin
deno task plugin reset-limits <plugin-name>
```

### Example Output

```
📊 Rate limit stats for plugin: hello-world

Operation: database
  Total Requests: 45
  Blocked: 2 (4.44%)

Operation: network
  Total Requests: 120
  Blocked: 5 (4.17%)
```

---

## Audit Logging

### What Gets Logged

- Database queries
- Network requests
- File operations
- Permission checks
- Security violations
- Lifecycle events (install/activate/deactivate)
- Settings changes

### Configuration

```bash
# Number of days to retain logs
PLUGIN_AUDIT_RETENTION_DAYS=90
```

### CLI Commands

```bash
# View audit logs for a plugin
deno task plugin audit <plugin-name>

# Filter by action type
deno task plugin audit <plugin-name> --action database:query

# Limit number of results
deno task plugin audit <plugin-name> --limit 100

# View overall statistics
deno task plugin audit-stats

# Cleanup old logs
deno task plugin cleanup 90
```

### Example Output

```
📋 Audit logs for plugin: hello-world

ℹ️ 2025-01-22T10:30:45.123Z
   Action: lifecycle:activate
   Details: {"version":"1.0.0"}

⚠️ 2025-01-22T10:31:12.456Z
   Action: security:rate_limit_exceeded
   Details: {"operation":"database","limit":10}

Total logs: 45
```

---

## Integrity Verification

### How It Works

Generates **SHA-256 checksums** for all plugin files and stores them in `integrity.json`. Before loading, the system verifies that files haven't been modified.

### Signing a Plugin

```bash
# Generate checksums for a plugin
deno task plugin sign <plugin-name>
```

This creates `plugins/<plugin-name>/integrity.json`:

```json
{
  "checksums": {
    "index.ts": "sha256-abc123...",
    "plugin.json": "sha256-def456...",
    "README.md": "sha256-ghi789..."
  },
  "algorithm": "sha256",
  "generatedAt": 1705920645123
}
```

### Verifying a Plugin

```bash
# Verify plugin integrity
deno task plugin verify <plugin-name>
```

**Success:**
```
✅ Plugin integrity verified successfully

Integrity Score: 100%
Modified Files: 0
Missing Files: 0
Extra Files: 1
```

**Failure (tampering detected):**
```
❌ Plugin integrity verification failed

Errors:
  - File modified: index.ts (expected: sha256-abc..., actual: sha256-xyz...)

Integrity Score: 50%
Modified Files: 1
Missing Files: 0
Extra Files: 1
```

### Configuration

```bash
# Skip integrity checks (NOT recommended for production)
PLUGIN_SKIP_INTEGRITY_CHECK=false

# Require all plugins to have checksums
PLUGIN_REQUIRE_CHECKSUMS=false
```

> [!NOTE]
> In development mode (`DENO_ENV=development`), integrity checks are **skipped by default** to facilitate rapid iteration, unless `PLUGIN_REQUIRE_CHECKSUMS=true` is explicitly set.

### Automatic Verification

The system automatically verifies plugins during loading:

```typescript
// In PluginLoader.ts
await this.verifyPluginIntegrity(pluginName, manifest);
```

If verification fails, the plugin won't load.

---

## Sandboxing & Resource Limits

### Resource Monitoring

Tracks per-plugin resource usage:

- **Memory Usage** (MB)
- **CPU Time** (ms)
- **Operation Counts** (database, network, file, hooks)

### Limits

```bash
# Maximum memory per plugin (MB)
PLUGIN_MAX_MEMORY_MB=256

# Maximum execution time per operation (ms)
PLUGIN_MAX_EXECUTION_TIME=5000
```

### Worker Permissions

Plugins run in **Deno Workers** with granular permissions based on their manifest:

```json
{
  "permissions": [
    "network:external",  // Allows HTTP requests
    "system:files"       // Allows file operations (restricted to plugin dir)
  ]
}
```

**Permission Mapping:**
- `network:external` → `net: true`
- `system:files` → `read: ["./plugins/plugin-name"]`, `write: ["./plugins/plugin-name"]`
- `system:shell` → `run: true` (⚠️ dangerous, logs warning)

### Execution Timeouts

All critical operations have timeouts:

```typescript
// Database query with timeout
await this.executeWithTimeout(
  async () => await this.api.query(sql, params),
  'database:query'
);
```

If an operation exceeds the timeout, it's terminated and logged.

### Automatic Enforcement

The `PluginManager` checks resource limits every 30 seconds:

```typescript
// Automatically deactivates plugins with critical violations
await this.enforceResourceLimits();
```

---

## CLI Tools

The plugin CLI (`scripts/plugin-cli.ts`) provides management commands:

```bash
# Integrity
deno task plugin sign <plugin-name>
deno task plugin verify <plugin-name>

# Audit Logs
deno task plugin audit <plugin-name> [--limit N] [--action TYPE]
deno task plugin audit-stats

# Rate Limits
deno task plugin limits <plugin-name>
deno task plugin reset-limits <plugin-name>

# Maintenance
deno task plugin cleanup <days>

# Help
deno task plugin help
```

---

## Configuration

### Environment Variables

See `.env.plugin.example` for all available options.

**Quick Reference:**

| Variable | Default | Description |
|----------|---------|-------------|
| `PLUGIN_RATE_LIMIT_DB_QUERIES` | 10 | DB queries per minute |
| `PLUGIN_RATE_LIMIT_HTTP_REQUESTS` | 30 | HTTP requests per minute |
| `PLUGIN_RATE_LIMIT_FILE_OPS` | 20 | File operations per minute |
| `PLUGIN_SKIP_INTEGRITY_CHECK` | false | Skip integrity verification |
| `PLUGIN_REQUIRE_CHECKSUMS` | false | Require all plugins to have checksums |
| `PLUGIN_MAX_MEMORY_MB` | 256 | Max memory per plugin (MB) |
| `PLUGIN_MAX_EXECUTION_TIME` | 5000 | Max execution time per operation (ms) |
| `PLUGIN_AUDIT_RETENTION_DAYS` | 90 | Days to keep audit logs |
| `PLUGIN_STRICT_MODE` | false | Enable strict security enforcement |

### Recommended Settings

**Development:**
```bash
PLUGIN_SKIP_INTEGRITY_CHECK=true
PLUGIN_STRICT_MODE=false
PLUGIN_MAX_EXECUTION_TIME=30000
```

**Production:**
```bash
PLUGIN_REQUIRE_CHECKSUMS=true
PLUGIN_STRICT_MODE=true
PLUGIN_AUDIT_RETENTION_DAYS=365
PLUGIN_MAX_MEMORY_MB=128
```

---

## Best Practices

### For Plugin Developers

1. **Request Minimal Permissions**
   ```json
   {
     "permissions": [
       "database:read"  // Only request what you need
     ]
   }
   ```

2. **Sign Your Plugins**
   ```bash
   deno task plugin sign my-plugin
   ```
   Include `integrity.json` in your distribution.

3. **Test Resource Usage**
   Monitor your plugin's resource consumption during development.

4. **Handle Rate Limits Gracefully**
   ```typescript
   try {
     await api.query(sql);
   } catch (error) {
     if (error.message.includes('rate limit')) {
       // Wait and retry
     }
   }
   ```

### For Administrators

1. **Enable Integrity Checks in Production**
   ```bash
   PLUGIN_REQUIRE_CHECKSUMS=true
   ```

2. **Monitor Audit Logs Regularly**
   ```bash
   deno task plugin audit-stats
   ```

3. **Review Security Violations**
   ```bash
   deno task plugin audit <plugin-name> --action security:violation
   ```

4. **Set Appropriate Rate Limits**
   Adjust based on your server capacity and plugin usage patterns.

5. **Regular Cleanup**
   ```bash
   # Run monthly
   deno task plugin cleanup 90
   ```

---

## Troubleshooting

### Plugin Won't Load

**Error:** `Plugin failed integrity verification`

**Solution:**
```bash
# Regenerate checksums
deno task plugin sign <plugin-name>

# Or skip checks temporarily (not recommended)
PLUGIN_SKIP_INTEGRITY_CHECK=true
```

### Rate Limit Errors

**Error:** `Rate limit exceeded for operation: database`

**Solutions:**
1. Increase the limit: `PLUGIN_RATE_LIMIT_DB_QUERIES=50`
2. Optimize plugin code to reduce queries
3. Reset limits: `deno task plugin reset-limits <plugin-name>`

### Worker Permission Errors

**Error:** `Unstable API 'Worker.deno.permissions'`

**Solution:**
Add `--unstable-worker-options` flag to your Deno command:
```json
{
  "tasks": {
    "dev": "deno run --allow-all --unstable-worker-options --watch src/main.ts"
  }
}
```

### High Memory Usage

**Warning:** `Plugin exceeded memory limit`

**Solutions:**
1. Increase limit: `PLUGIN_MAX_MEMORY_MB=512`
2. Investigate plugin for memory leaks
3. The plugin will be automatically deactivated if violations are critical

---

## Architecture

### Components

```
src/lib/plugin-system/
├── PluginRateLimiter.ts      # Rate limiting (Token Bucket)
├── PluginAuditor.ts           # Audit logging
├── PluginIntegrity.ts         # Integrity verification
├── PluginResourceMonitor.ts   # Resource tracking
├── PluginWorker.ts            # Worker isolation
├── PluginManager.ts           # High-level management
├── PluginLoader.ts            # Plugin loading
└── PluginAPI.ts               # Plugin API
```

### Data Flow

```
Plugin Load Request
    ↓
PluginLoader.loadPlugin()
    ↓
PluginIntegrity.verify() ← Check integrity
    ↓
PluginWorker.load() ← Create isolated worker
    ↓
PluginResourceMonitor.startMonitoring() ← Track resources
    ↓
Plugin Activated
    ↓
PluginAPI methods ← Rate limiting + Audit logging
    ↓
PluginManager.enforceResourceLimits() ← Periodic checks (every 30s)
```

---

## Future Enhancements

- [ ] Digital signature verification (RSA/ECDSA)
- [ ] Plugin marketplace with verified signatures
- [ ] Real-time resource usage dashboard
- [ ] Automated security scanning
- [ ] Plugin dependency vulnerability checking
- [ ] Network request whitelisting
- [ ] Filesystem access sandboxing improvements

---

## Support

For issues or questions:
- GitHub Issues: [lexcms/cms/issues](https://github.com/lexcms/cms/issues)
- Documentation: [docs.lexcms.com](https://docs.lexcms.com)
- Community: [discord.gg/lexcms](https://discord.gg/lexcms)
