# Hello World Plugin

A simple example plugin for LexCMS that demonstrates the plugin system.

## Features

- 👋 Simple activation/deactivation
- 🎣 Hook registration example
- ⚙️ Settings management example
- 📝 Well-commented code for learning

## Purpose

This plugin is designed to:

1. **Demonstrate** how to create a basic LexCMS plugin
2. **Test** the plugin system
3. **Provide** a template for new plugin development

## What it does

When activated, this plugin:

1. Logs a welcome message
2. Registers a hook for `content:beforeCreate` event
3. Logs information when content is created

## Installation

This plugin comes pre-installed with LexCMS for demonstration purposes.

To install via API:

```bash
POST /api/plugins/hello-world/install
```

## Activation

To activate via API:

```bash
POST /api/plugins/hello-world/activate
```

## Usage

Once activated, create any content and you'll see the plugin's hook in action in the server logs.

## Code Structure

```
hello-world/
├── plugin.json    # Plugin metadata and configuration
├── index.ts       # Main plugin class
└── README.md      # This file
```

## Plugin Development

### Required Files

1. **plugin.json** - Plugin manifest with metadata
2. **index.ts** - Plugin entry point with default export

### Required Methods

Your plugin class must implement:

- `constructor(api: PluginAPI)` - Initialize plugin
- `onActivate()` - Called when plugin is activated
- `onDeactivate()` - Called when plugin is deactivated

### Optional Methods

- `onSettingsUpdate(settings)` - Called when settings change

## API

The `PluginAPI` provides:

- `getPluginName()` - Get plugin name
- `getManifest()` - Get plugin manifest
- `getSettings()` - Get current settings
- `registerHook(name, handler)` - Register event hook
- `log(message)` - Log message
- `db()` - Access database

## Example Hook Registration

```typescript
await this.api.registerHook('content:beforeCreate', async (data) => {
  // Modify or validate data before content creation
  console.log('Creating content:', data.title);
  return data;
});
```

## Available Hooks

- `content:beforeCreate` - Before content is created
- `content:afterCreate` - After content is created
- `content:beforeUpdate` - Before content is updated
- `content:afterUpdate` - After content is updated
- `content:beforeDelete` - Before content is deleted
- `content:afterDelete` - After content is deleted
- `media:afterUpload` - After media file is uploaded
- `media:beforeDelete` - Before media file is deleted
- `media:getUrl` - Modify media URL

## License

MIT
