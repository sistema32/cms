import { assertEquals } from "https://deno.land/std@0.224.0/assert/mod.ts";
import { wp } from "../../src/lib/plugin-system/compat/WPCompat.ts";
import { hookManager } from "../../src/lib/plugin-system/HookManager.ts";
import { shortcodeParser } from "../../src/lib/plugin-system/ShortcodeParser.ts";

Deno.test("WPCompat - add_action maps to hookManager.addAction", async () => {
    let actionCalled = false;

    wp.add_action("system:init", () => {
        actionCalled = true;
    });

    await hookManager.doAction("system:init");
    assertEquals(actionCalled, true);
});

Deno.test("WPCompat - add_filter maps to hookManager.addFilter", async () => {
    wp.add_filter("content:title", (title: string) => {
        return `Prefix: ${title}`;
    });

    const result = await hookManager.applyFilters("content:title", "My Post");
    assertEquals(result, "Prefix: My Post");
});

Deno.test("WPCompat - wp_head maps to theme:head filter", async () => {
    wp.add_action("wp_head", () => {
        return '<meta name="generator" content="LexCMS" />';
    });

    const headContent = await hookManager.applyFilters("theme:head", "");
    assertEquals(headContent.includes('<meta name="generator" content="LexCMS" />'), true);
});

Deno.test("WPCompat - Shortcodes", async () => {
    wp.add_shortcode("hello", (attrs) => {
        return `Hello ${attrs.name || "World"}`;
    });

    const content = "Say [hello name='Lex']!";
    const parsed = await wp.do_shortcode(content);

    assertEquals(parsed, "Say Hello Lex!");
});

Deno.test("WPCompat - Nested Shortcodes", async () => {
    wp.add_shortcode("bold", (_attrs, content) => {
        return `<b>${content}</b>`;
    });

    const content = "Make this [bold]bold[/bold]";
    const parsed = await wp.do_shortcode(content);
    assertEquals(parsed, "Make this <b>bold</b>");
});
