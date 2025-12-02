# Plugin Development Guide

Welcome to the LexCMS Plugin System! This guide will help you create, configure, and deploy plugins.

## Table of Contents

1. [Quick Start](#quick-start)
2. [Manifest Schema](#manifest-schema)
3. [Permission System](#permission-system)
4. [Sandbox Capabilities](#sandbox-capabilities)
5. [Plugin APIs](#plugin-apis)
6. [Example Plugin](#example-plugin)

---

## Quick Start

### 1. Create Plugin Directory

```bash
mkdir -p plugins/my-plugin
cd plugins/my-plugin
```

### 2. Create Manifest

Create `manifest.json`:

```json
{
  "manifestVersion": "v2",
  "id": "my-plugin",
  "name": "My Plugin",
  "version": "1.0.0",
  "description": "A sample plugin",
  "permissions": [],
  "routes": [],
  "capabilities": {
    "db": [],
    "fs": [],
    "http": []
  }
}
```

### 3. Create Plugin Code

Create `index.ts`:

```typescript
export default async function register(ctx: any) {
  console.log("My plugin loaded!");
  
  // Register route
  ctx.registerRoute(ctx.sandbox, {
    method: "GET",
    path: "/hello",
    permission: "route:GET:/hello",
    handler: async ({ req }: any) => {
      return { message: "Hello from my plugin!" };
    }
  });
}
```

### 4. Activate Plugin

Navigate to `/admincp/plugins` and activate your plugin.

---

## Manifest Schema

### Required Fields

```typescript
{
  manifestVersion: "v2",        // Always "v2"
  id: string,                   // Unique identifier (lowercase, hyphens)
  name: string,                 // Display name
}
```

### Optional Fields

```typescript
{
  version?: string,             // Semantic version (e.g., "1.0.0")
  description?: string,         // Brief description
  permissions?: string[],       // Explicit permissions
  routes?: RouteDefinition[],   // HTTP routes
  hooks?: HookDefinition[],     // Event hooks
  cron?: CronDefinition[],      // Scheduled jobs
  capabilities?: Capabilities,  // Sandbox capabilities
  httpAllowlist?: string[]      // Allowed HTTP domains
}
```

### Route Definition

```typescript
{
  method: "GET" | "POST" | "PUT" | "DELETE" | "PATCH",
  path: string,                 // e.g., "/api/users"
  permission?: string           // Auto-generated if omitted
}
```

**Auto-generated permission format**: `route:METHOD:PATH`

Example: `route:GET:/api/users`

### Hook Definition

```typescript
{
  name: string,                 // Hook name (must start with "cms_")
  permission?: string           // Auto-generated if omitted
}
```

**Auto-generated permission format**: `hook:HOOK_NAME`

Example: `hook:cms_content_saved`

### Cron Definition

```typescript
{
  name: string,                 // Job name
  schedule: string,             // Cron pattern (5 fields)
  permission?: string           // Auto-generated if omitted
}
```

**Cron syntax** (powered by `croner`):
- `*/5 * * * *` - Every 5 minutes
- `0 0 * * *` - Daily at midnight
- `0 9 * * 1` - Every Monday at 9am
- `0 0 1 * *` - First day of month
- `0 */6 * * *` - Every 6 hours

**Auto-generated permission format**: `cron:JOB_NAME`

### Capabilities

```typescript
{
  db?: ("read" | "write")[],    // Database access
  fs?: ("read" | "write")[],    // Filesystem access
  http?: ("outbound")[],        // HTTP requests
}
```

---

## Permission System

### Permission Types

1. **Route Permissions**: `route:METHOD:PATH`
2. **Hook Permissions**: `hook:HOOK_NAME`
3. **Cron Permissions**: `cron:JOB_NAME`
4. **UI Permissions**: 
   - `ui:slot:SLOT_NAME`
   - `ui:asset:css` or `ui:asset:js`
   - `ui:widget:WIDGET_NAME`

### Auto-Granting

Permissions declared in manifest are **auto-granted** when plugin is discovered.

### Manual Permissions

Add custom permissions via manifest:

```json
{
  "permissions": [
    "admin:users:read",
    "admin:users:write"
  ]
}
```

---

## Sandbox Capabilities

Plugins run in isolated workers with controlled capabilities.

### Database Access

```typescript
// Requires: capabilities.db = ["read"] or ["write"]

// Read example
const users = await db.collection('users').findMany({ active: true });
const user = await db.collection('users').findOne({ id: 123 });

// Write example (requires "write")
await db.collection('users').insert({ name: "John", email: "john@example.com" });
await db.collection('users').update({ id: 123 }, { active: false });
```

### Filesystem Access

```typescript
// Requires: capabilities.fs = ["read"]

// Read files within plugin directory only
const content = await fs.readText('config.json');
const data = await fs.readFile('data.bin');
```

**Security**: Path traversal protection - confined to `/plugins/PLUGIN_NAME/`

### HTTP Requests

```typescript
// Requires: capabilities.http = ["outbound"]
// And httpAllowlist = ["api.example.com"]

const response = await fetch('https://api.example.com/data');
const data = await response.json();
```

**Security**: Only domains in `httpAllowlist` are allowed

---

## Plugin APIs

### Register Route

```typescript
ctx.registerRoute(ctx.sandbox, {
  method: "POST",
  path: "/api/users",
  permission: "route:POST:/api/users",
  handler: async ({ req, db }) => {
    const body = await req.json();
    const result = await db.collection('users').insert(body);
    return { success: true, id: result.id };
  }
});
```

**Request object** (`req`):
- `req.method` - HTTP method
- `req.path` - Request path
- `req.query` - Query parameters (object)
- `req.headers` - Headers (object)
- `req.params` - Route parameters (object)
- `req.json()` - Parse as JSON
- `req.text()` - Get as text

### Register Hook

```typescript
ctx.registerHook(ctx.sandbox, {
  name: "cms_content_saved",  // Must start with "cms_"
  permission: "hook:cms_content_saved",
  handler: async (content) => {
    console.log("Content saved:", content.id);
  }
});
```

### Register Cron Job

```typescript
ctx.registerCron("0 0 * * *", async () => {
  // Runs daily at midnight
  console.log("Daily cleanup running...");
}, "cron:cleanup");
```

### Register UI Slot

```typescript
ctx.ui.registerSlot("sidebar", "My Widget", "/plugins/my-plugin/widget.html");
```

**Requires permission**: `ui:slot:sidebar`

### Register Asset

```typescript
ctx.ui.registerAsset("css", "/plugins/my-plugin/styles.css");
ctx.ui.registerAsset("js", "/plugins/my-plugin/script.js");
```

**Requires permissions**: `ui:asset:css`, `ui:asset:js`

---

## Example Plugin

### Complete `manifest.json`

```json
{
  "manifestVersion": "v2",
  "id": "user-analytics",
  "name": "User Analytics",
  "version": "1.0.0",
  "description": "Track and analyze user behavior",
  "permissions": [
    "route:GET:/analytics",
    "route:POST:/analytics/track",
    "hook:cms_user_login",
    "cron:daily-report",
    "ui:slot:dashboard",
    "ui:asset:css"
  ],
  "routes": [
    { "method": "GET", "path": "/analytics" },
    { "method": "POST", "path": "/analytics/track" }
  ],
  "hooks": [
    { "name": "cms_user_login" }
  ],
  "cron": [
    { "name": "daily-report", "schedule": "0 0 * * *" }
  ],
  "capabilities": {
    "db": ["read", "write"],
    "fs": ["read"],
    "http": ["outbound"]
  },
  "httpAllowlist": ["api.analytics.com"]
}
```

### Complete `index.ts`

```typescript
export default async function register(ctx: any) {
  // Register analytics route
  ctx.registerRoute(ctx.sandbox, {
    method: "GET",
    path: "/analytics",
    permission: "route:GET:/analytics",
    handler: async ({ req, db }) => {
      const metrics = await db.collection('analytics_events').findMany({
        limit: 100
      });
      return { success: true, metrics };
    }
  });

  // Track events endpoint
  ctx.registerRoute(ctx.sandbox, {
    method: "POST",
    path: "/analytics/track",
    permission: "route:POST:/analytics/track",
    handler: async ({ req, db }) => {
      const event = await req.json();
      await db.collection('analytics_events').insert({
        ...event,
        timestamp: new Date()
      });
      return { success: true };
    }
  });

  // Hook into user login
  ctx.registerHook(ctx.sandbox, {
    name: "cms_user_login",
    permission: "hook:cms_user_login",
    handler: async (user) => {
      await db.collection('analytics_events').insert({
        type: 'login',
        userId: user.id,
        timestamp: new Date()
      });
    }
  });

  // Daily report cron
  ctx.registerCron("0 0 * * *", async () => {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    
    const events = await db.collection('analytics_events').findMany({
      timestamp: { $gte: yesterday }
    });
    
    console.log(`Daily report: ${events.length} events`);
    
    // Send to external API
    await fetch('https://api.analytics.com/report', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ date: yesterday, count: events.length })
    });
  }, "cron:daily-report");

  // Register dashboard widget
  ctx.ui.registerSlot("dashboard", "Analytics", "/plugins/user-analytics/widget.html");
  
  // Register stylesheet
  ctx.ui.registerAsset("css", "/plugins/user-analytics/styles.css");
}
```

---

## Migrations (Optional)

Create database migrations for your plugin.

### Migration Files

```
plugins/my-plugin/migrations/
  001_initial_schema.up.sql
  001_initial_schema.down.sql
  002_add_index.up.sql
  002_add_index.down.sql
```

### Example Migration

**001_initial_schema.up.sql**:
```sql
CREATE TABLE IF NOT EXISTS analytics_events (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  type TEXT NOT NULL,
  userId INTEGER,
  timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

**001_initial_schema.down.sql**:
```sql
DROP TABLE IF EXISTS analytics_events;
```

---

## Debugging

### Console Logging

```typescript
console.log("Debug message");
console.warn("Warning message");
console.error("Error message");
```

Logs appear in server console with `[worker]` prefix.

### Error Handling

```typescript
try {
  // Plugin code
} catch (err) {
  console.error("Plugin error:", err);
  return { success: false, error: err.message };
}
```

### Common Issues

1. **"Plugin missing permissions"**
   - Add required permissions to manifest.json
   - Re-discover plugin or grant manually

2. **"HTTP sandbox: host not in allowlist"**
   - Add domain to `httpAllowlist` in manifest

3. **"Plugin does not have filesystem read capability"**
   - Add `"fs": ["read"]` to capabilities

4. **"Worker startup failed"**
   - Check console for syntax errors
   - Verify manifest.json is valid JSON

---

## Best Practices

1. **Least Privilege**: Request only required permissions
2. **Error Handling**: Always catch and log errors
3. **Input Validation**: Validate all user input
4. **Database Hygiene**: Use proper indexes, limit queries
5. **HTTP Timeouts**: External APIs have 10s timeout
6. **Cron Performance**: Keep cron jobs fast (<1min)

---

## Next Steps

- Explore existing plugins in `/plugins` directory
- Join the developer community
- Read API reference documentation
- Submit your plugin to the marketplace

**Happy Plugin Development!** 🚀
