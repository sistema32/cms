/**
 * WordPress Compatibility Layer
 * Provides WP-like hooks and shortcodes
 */

export class WPCompat {
    private shortcodes: Map<string, Function> = new Map();

    add_shortcode(tag: string, callback: Function) {
        this.shortcodes.set(tag, callback);
    }

    async do_shortcode(content: string): Promise<string> {
        // Simple regex to find [tag attr="val"]
        // This is a simplified implementation
        const regex = /\[(\w+)([^\]]*)\]/g;

        let result = content;
        let match;

        // We need to handle async replacements, so we can't use replace() directly with async function
        const matches = [];
        while ((match = regex.exec(content)) !== null) {
            matches.push(match);
        }

        for (const match of matches) {
            const [fullMatch, tag, attrsStr] = match;
            const callback = this.shortcodes.get(tag);

            if (callback) {
                const attrs = this.parseAttributes(attrsStr);
                const output = await callback(attrs);
                result = result.replace(fullMatch, output);
            }
        }

        return result;
    }

    private parseAttributes(text: string): Record<string, string> {
        const attrs: Record<string, string> = {};
        const regex = /(\w+)="([^"]*)"/g;
        let match;
        while ((match = regex.exec(text)) !== null) {
            attrs[match[1]] = match[2];
        }
        return attrs;
    }

    // Hooks - wrapper around global pluginAPI if available, or no-op
    add_action(hook: string, callback: Function, priority: number = 10) {
        if ((globalThis as any).pluginAPI) {
            (globalThis as any).pluginAPI.addAction(hook, callback, priority);
        }
    }

    add_filter(hook: string, callback: Function, priority: number = 10) {
        if ((globalThis as any).pluginAPI) {
            (globalThis as any).pluginAPI.addFilter(hook, callback, priority);
        }
    }

    async do_action(hook: string, ...args: any[]) {
        // This usually runs on host, but if called in worker, we might need to RPC?
        // But WP plugins usually call do_action to trigger OTHER plugins.
        // For now, no-op or local.
    }
}

export const wp = new WPCompat();
