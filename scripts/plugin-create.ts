#!/usr/bin/env -S deno run --allow-read --allow-write --allow-net
/**
 * Plugin Create CLI
 * Scaffolds a new plugin with boilerplate code
 */

import { join } from "@std/path";
import { ensureDir } from "@std/fs";

interface PluginConfig {
    name: string;
    description: string;
    author: string;
    version: string;
    permissions: string[];
}

async function createPlugin(config: PluginConfig) {
    const pluginDir = join(Deno.cwd(), 'plugins', config.name);

    console.log(`Creating plugin: ${config.name}`);
    console.log(`Directory: ${pluginDir}`);

    // Create directory structure
    await ensureDir(join(pluginDir, 'api'));
    await ensureDir(join(pluginDir, 'assets', 'admin'));
    await ensureDir(join(pluginDir, 'assets', 'public'));

    // Create plugin.json
    const manifest = {
        name: config.name,
        version: config.version,
        description: config.description,
        author: config.author,
        license: "MIT",
        entry: "index.ts",
        permissions: config.permissions
    };

    await Deno.writeTextFile(
        join(pluginDir, 'plugin.json'),
        JSON.stringify(manifest, null, 2)
    );

    // Create index.ts
    const indexContent = `import { HostAPI } from '../../src/lib/plugins/api/HostAPI.ts';
import { IPlugin, PluginContext } from '../../src/lib/plugins/api/IPlugin.ts';

export default class ${toPascalCase(config.name)}Plugin implements IPlugin {
    constructor(private api: HostAPI, private context: PluginContext) {}

    async onActivate() {
        this.api.logger.info('${config.name} plugin activated');
        
        // Register routes
        this.api.routes.register('GET', '/hello', async (req) => {
            return {
                status: 200,
                body: { message: 'Hello from ${config.name}!' }
            };
        });
        
        // Register admin panel
        this.api.admin.registerPanel({
            id: '${config.name}',
            title: '${config.description}',
            path: '${config.name}',
            showInMenu: true,
            order: 100,
            component: async () => {
                return \`
                    <!DOCTYPE html>
                    <html>
                    <head>
                        <title>${config.description}</title>
                        <script src="https://cdn.tailwindcss.com"></script>
                    </head>
                    <body class="p-8">
                        <h1 class="text-2xl font-bold mb-4">${config.description}</h1>
                        <p>Welcome to your plugin admin panel!</p>
                    </body>
                    </html>
                \`;
            }
        });
    }

    async onDeactivate() {
        this.api.logger.info('${config.name} plugin deactivated');
    }
}

function toPascalCase(str: string): string {
    return str.split('-').map(word => 
        word.charAt(0).toUpperCase() + word.slice(1)
    ).join('');
}
`;

    await Deno.writeTextFile(join(pluginDir, 'index.ts'), indexContent);

    // Create README.md
    const readmeContent = `# ${config.name}

${config.description}

## Installation

1. The plugin is already in the \`plugins/${config.name}\` directory
2. Go to Admin → Plugins
3. Click "Activate" on ${config.name}

## Usage

### API Endpoint

\`\`\`bash
GET /api/plugins/${config.name}/hello
\`\`\`

### Admin Panel

Navigate to: \`/admincp/plugins/${config.name}\`

## Development

Edit \`index.ts\` to add your plugin logic.

## License

MIT
`;

    await Deno.writeTextFile(join(pluginDir, 'README.md'), readmeContent);

    console.log('\n✅ Plugin created successfully!');
    console.log('\nNext steps:');
    console.log(`1. cd plugins/${config.name}`);
    console.log(`2. Edit index.ts to add your logic`);
    console.log(`3. Go to /admincp/plugins and activate your plugin`);
}

// CLI Interface
if (import.meta.main) {
    const name = prompt('Plugin name (kebab-case):') || 'my-plugin';
    const description = prompt('Description:') || 'My awesome plugin';
    const author = prompt('Author:') || 'Your Name';
    const version = prompt('Version:') || '1.0.0';

    const permissionsInput = prompt('Permissions (comma-separated, e.g., database:read,database:write):') || '';
    const permissions = permissionsInput ? permissionsInput.split(',').map(p => p.trim()) : ['database:read'];

    await createPlugin({
        name,
        description,
        author,
        version,
        permissions
    });
}
