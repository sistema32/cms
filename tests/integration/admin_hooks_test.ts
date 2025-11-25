import { assertEquals } from "https://deno.land/std@0.224.0/assert/mod.ts";
import { hookManager } from "../../src/lib/plugin-system/HookManager.ts";
import { wp } from "../../src/lib/plugin-system/compat/WPCompat.ts";
import { getAdminHeadContent, getAdminFooterContent } from "../../src/lib/admin/hooks.ts";

Deno.test("Admin Hooks - admin:init action", async () => {
    let initCalled = false;
    let userData: any = null;

    wp.add_action("admin_init", (user: any) => {
        initCalled = true;
        userData = user;
    });

    const mockUser = { userId: 1, email: "admin@test.com", name: "Admin" };
    await hookManager.doAction("admin:init", mockUser);

    assertEquals(initCalled, true);
    assertEquals(userData.userId, 1);
});

Deno.test("Admin Hooks - admin:head filter", async () => {
    wp.add_filter("admin_head", (html: string) => {
        return html + '<script src="/admin-plugin.js"></script>';
    });

    const headContent = await getAdminHeadContent();

    assertEquals(headContent.includes('<script src="/admin-plugin.js"></script>'), true);
});

Deno.test("Admin Hooks - admin:footer filter", async () => {
    wp.add_filter("admin_footer", (html: string) => {
        return html + '<div id="admin-plugin-footer">Plugin Footer</div>';
    });

    const footerContent = await getAdminFooterContent();

    assertEquals(footerContent.includes('Plugin Footer'), true);
});

Deno.test("Admin Hooks - admin:enqueueScripts action", async () => {
    let scriptEnqueued = false;

    wp.add_action("admin_enqueue_scripts", () => {
        scriptEnqueued = true;
    });

    await hookManager.doAction("admin:enqueueScripts");

    assertEquals(scriptEnqueued, true);
});

Deno.test("Admin Hooks - multiple plugins can inject content", async () => {
    // Clear previous hooks
    const headContent1 = await hookManager.applyFilters("admin:head", "");

    // Plugin 1
    hookManager.addFilter("admin:head", (html: string) => {
        return html + '<style>.plugin1 { color: red; }</style>';
    });

    // Plugin 2
    hookManager.addFilter("admin:head", (html: string) => {
        return html + '<script>console.log("Plugin 2");</script>';
    });

    const finalContent = await getAdminHeadContent();

    assertEquals(finalContent.includes('.plugin1'), true);
    assertEquals(finalContent.includes('Plugin 2'), true);
});
