# LexCMS Plugin System Guide

This guide explains how to use and develop plugins for LexCMS.

## Table of Contents

1. [Overview](#overview)
2. [Using Plugins](#using-plugins)
3. [Available Plugins](#available-plugins)
4. [Creating Plugins](#creating-plugins)
5. [Plugin API Reference](#plugin-api-reference)
6. [Troubleshooting](#troubleshooting)

## Overview

The LexCMS plugin system allows you to extend the functionality of your CMS without modifying core code. Plugins can:

- Hook into various events (content creation, media upload, etc.)
- Access the database
- Register custom routes
- Add custom functionality
- Integrate with external services

## Using Plugins

### Managing Plugins via API

#### List All Plugins

```bash
GET /api/plugins
Authorization: Bearer <token>
```

Returns all installed plugins.

#### List Available Plugins

```bash
GET /api/plugins/available
Authorization: Bearer <token>
```

Returns plugins that can be installed.

#### Get Plugin Details

```bash
GET /api/plugins/:name
Authorization: Bearer <token>
```

#### Install a Plugin

```bash
POST /api/plugins/:name/install
Authorization: Bearer <token>
Content-Type: application/json

{
  "activate": true
}
```

#### Activate a Plugin

```bash
POST /api/plugins/:name/activate
Authorization: Bearer <token>
```

#### Deactivate a Plugin

```bash
POST /api/plugins/:name/deactivate
Authorization: Bearer <token>
```

#### Uninstall a Plugin

```bash
DELETE /api/plugins/:name
Authorization: Bearer <token>
```

#### Update Plugin Settings

```bash
PATCH /api/plugins/:name/settings
Authorization: Bearer <token>
Content-Type: application/json

{
  "settings": {
    "key": "value"
  }
}
```

### Plugin States

- **Available** - Plugin exists in `/plugins` directory but not installed
- **Installed** - Plugin is registered in database but not active
- **Active** - Plugin is loaded and running
- **Error** - Plugin failed to load or activate

## Available Plugins

### Hello World

**Location:** `/plugins/hello-world`

A simple example plugin demonstrating the plugin system.

- Category: example
- Hooks: `content:beforeCreate`
- Perfect for learning and testing

### Cloudflare CDN

**Location:** `/plugins/cdn-cloudflare`

Automatically upload and serve media files from Cloudflare CDN.

- Category: cdn
- Hooks: `media:afterUpload`, `media:beforeDelete`, `media:getUrl`
- Improves site performance with global CDN

## Creating Plugins

### Plugin Structure

Every plugin must have this structure:

```
my-plugin/
├── plugin.json    # Required: Plugin manifest
├── index.ts       # Required: Main entry point
└── README.md      # Recommended: Documentation
```

### 1. Create Plugin Manifest (plugin.json)

```json
{
  "name": "my-plugin",
  "version": "1.0.0",
  "displayName": "My Awesome Plugin",
  "description": "What this plugin does",
  "author": "Your Name",
  "license": "MIT",
  "homepage": "https://github.com/username/my-plugin",

  "compatibility": {
    "lexcms": ">=1.0.0",
    "deno": ">=1.40.0"
  },

  "dependencies": {},

  "permissions": [
    "database:read",
    "database:write"
  ],

  "hooks": [
    "content:beforeCreate"
  ],

  "settings": {},

  "category": "utility",
  "tags": ["tag1", "tag2"]
}
```

#### Required Fields

- `name` - Lowercase, alphanumeric with dashes only
- `version` - Semantic versioning (e.g., "1.0.0")
- `displayName` - Human-readable name
- `description` - What the plugin does
- `author` - Your name or organization
- `license` - License type (MIT, GPL, etc.)
- `compatibility.lexcms` - Compatible LexCMS version
- `permissions` - Array of required permissions

#### Optional Fields

- `homepage` - Project URL
- `dependencies` - External dependencies
- `hooks` - Hooks this plugin registers
- `settings` - Default settings
- `category` - Plugin category
- `tags` - Search tags

### 2. Create Plugin Class (index.ts)

```typescript
import type { PluginAPI } from '../../src/lib/plugin-system/PluginAPI.ts';

export default class MyPlugin {
  private api: PluginAPI;

  constructor(api: PluginAPI) {
    this.api = api;
  }

  /**
   * Required: Called when plugin is activated
   */
  async onActivate() {
    console.log('MyPlugin activated!');

    // Register hooks
    await this.api.registerHook('content:beforeCreate', async (data) => {
      // Do something with the data
      return data;
    });
  }

  /**
   * Required: Called when plugin is deactivated
   */
  async onDeactivate() {
    console.log('MyPlugin deactivated');
  }

  /**
   * Optional: Called when settings are updated
   */
  async onSettingsUpdate(settings: Record<string, any>) {
    console.log('Settings updated:', settings);
  }
}
```

### 3. Available Hooks

#### Content Hooks

- `content:beforeCreate` - Before content is created
- `content:afterCreate` - After content is created
- `content:beforeUpdate` - Before content is updated
- `content:afterUpdate` - After content is updated
- `content:beforeDelete` - Before content is deleted
- `content:afterDelete` - After content is deleted

#### Media Hooks

- `media:afterUpload` - After media file is uploaded
- `media:beforeDelete` - Before media file is deleted
- `media:getUrl` - Modify media URL (useful for CDN)

#### Custom Hooks

You can also trigger custom hooks:

```typescript
await hookManager.executeHook('my-plugin:customEvent', data);
```

## Plugin API Reference

The `PluginAPI` provides these methods:

### Information

- `getPluginName(): string` - Get plugin name
- `getManifest(): PluginManifest` - Get plugin manifest
- `getSettings(): Record<string, any>` - Get current settings

### Hooks

- `registerHook(name: string, handler: Function): Promise<void>` - Register event hook

### Logging

- `log(message: string, level?: string): void` - Log message

### Database

- `db()` - Access Drizzle ORM database instance

### HTTP

- `fetch(url: string, options?: RequestInit): Promise<Response>` - Make HTTP requests

## Plugin Permissions

Declare required permissions in `plugin.json`:

- `database:read` - Read from database
- `database:write` - Write to database
- `settings:read` - Read system settings
- `settings:write` - Write system settings
- `media:read` - Access media files
- `media:write` - Upload/delete media
- `network:external` - Make external HTTP requests
- `filesystem:read` - Read files
- `filesystem:write` - Write files

## Best Practices

1. **Use Semantic Versioning** - Follow semver for versions
2. **Handle Errors Gracefully** - Don't crash the system
3. **Clean Up Resources** - Properly deactivate hooks and connections
4. **Document Your Plugin** - Include a good README
5. **Test Thoroughly** - Test activation, deactivation, and edge cases
6. **Minimal Permissions** - Only request permissions you need
7. **Performance** - Don't block the event loop
8. **Security** - Validate and sanitize all input

## Troubleshooting

### Plugin Not Showing Up

1. Check plugin directory location: `/plugins/your-plugin/`
2. Verify `plugin.json` exists and is valid JSON
3. Ensure `index.ts` exists
4. Check plugin name is lowercase with dashes only
5. Restart the server

### Plugin Won't Install

1. Check plugin manifest is valid
2. Verify all required fields are present
3. Check compatibility requirements
4. Look at server logs for errors

### Plugin Won't Activate

1. Check that plugin class has `onActivate()` method
2. Verify plugin class is default export
3. Look for errors in `onActivate()` method
4. Check permissions are granted

### Hooks Not Working

1. Verify hook name is correct
2. Check plugin is activated
3. Ensure hook handler returns data (for filters)
4. Look at server logs

## Example Plugins

### Minimal Plugin

```typescript
// plugins/minimal/plugin.json
{
  "name": "minimal",
  "version": "1.0.0",
  "displayName": "Minimal Plugin",
  "description": "Absolute minimum plugin",
  "author": "Me",
  "license": "MIT",
  "compatibility": {
    "lexcms": ">=1.0.0"
  },
  "permissions": []
}

// plugins/minimal/index.ts
export default class MinimalPlugin {
  constructor(api: any) {}
  async onActivate() { console.log('Active!'); }
  async onDeactivate() { console.log('Inactive!'); }
}
```

### Content Logger Plugin

```typescript
export default class ContentLoggerPlugin {
  private api: PluginAPI;

  constructor(api: PluginAPI) {
    this.api = api;
  }

  async onActivate() {
    // Log all content creations
    await this.api.registerHook('content:afterCreate', async (data) => {
      this.api.log(`New content created: ${data.title}`);
      return data;
    });

    // Log all content updates
    await this.api.registerHook('content:afterUpdate', async (data) => {
      this.api.log(`Content updated: ${data.title}`);
      return data;
    });
  }

  async onDeactivate() {
    this.api.log('Content Logger deactivated');
  }
}
```

## Getting Help

- Check the [PLUGIN_SYSTEM.md](./PLUGIN_SYSTEM.md) technical documentation
- Look at example plugins in `/plugins`
- Review server logs for errors
- Check the API documentation

## Contributing

Want to share your plugin?

1. Create a GitHub repository
2. Follow the plugin structure above
3. Add comprehensive README
4. Test thoroughly
5. Share with the community!

## License

This guide is part of LexCMS and follows the same license.
