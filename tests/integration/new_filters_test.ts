import { assertEquals, assertExists } from "https://deno.land/std@0.224.0/assert/mod.ts";
import { hookManager } from "../../src/lib/plugin-system/HookManager.ts";
import { wp } from "../../src/lib/plugin-system/compat/WPCompat.ts";

Deno.test("Template Filters - theme:template allows override", async () => {
    let filterCalled = false;

    hookManager.addFilter("theme:template", (templatePath: string) => {
        filterCalled = true;
        return "custom/path/to/template.tsx";
    });

    const result = await hookManager.applyFilters("theme:template", "default/template.tsx", "page", "default");

    assertEquals(filterCalled, true);
    assertEquals(result, "custom/path/to/template.tsx");
});

Deno.test("Template Filters - theme:pageTemplate via WP compat", async () => {
    let customPath = "";

    wp.add_filter("page_template", (path: string) => {
        customPath = "plugins/myplugin/templates/custom-page.tsx";
        return customPath;
    });

    const result = await hookManager.applyFilters("theme:pageTemplate", "themes/default/page.tsx");

    assertEquals(result, "plugins/myplugin/templates/custom-page.tsx");
});

Deno.test("Media Filters - media:imageSizes allows custom sizes", async () => {
    const defaultSizes = [
        { name: "thumbnail", width: 150, height: 150 },
        { name: "medium", width: 768 }
    ];

    wp.add_filter("intermediate_image_sizes", (sizes: any[]) => {
        return [
            ...sizes,
            { name: "custom-slider", width: 1200, height: 600 }
        ];
    });

    const result = await hookManager.applyFilters("media:imageSizes", defaultSizes);

    assertEquals(result.length, 3);
    assertEquals(result[2].name, "custom-slider");
});

Deno.test("Content Filters - content:excerpt via WP compat", async () => {
    wp.add_filter("the_excerpt", (excerpt: string) => {
        return `${excerpt} [Read more...]`;
    });

    const result = await hookManager.applyFilters("content:excerpt", "This is a sample excerpt.");

    assertEquals(result, "This is a sample excerpt. [Read more...]");
});

Deno.test("Navigation Filters - nav:menuArgs via WP compat", async () => {
    wp.add_filter("wp_nav_menu_args", (args: Record<string, any>) => {
        return {
            ...args,
            depth: 3,
            customClass: "my-custom-menu"
        };
    });

    const result = await hookManager.applyFilters("nav:menuArgs", { depth: 2 });

    assertEquals(result.depth, 3);
    assertEquals(result.customClass, "my-custom-menu");
});
