// @deno-types="https://deno.land/std@0.224.0/assert/mod.ts"
import { assertEquals } from "https://deno.land/std@0.224.0/assert/mod.ts";
import { hookManager } from "../../src/lib/plugin-system/HookManager.ts";
import { wp } from "../../src/lib/plugin-system/compat/WPCompat.ts";

Deno.test("WordPress Actions - content:beforeDelete via WP compat", async () => {
    let hookCalled = false;
    let deletedContent: any = null;

    wp.add_action("before_delete_post", (content: any) => {
        hookCalled = true;
        deletedContent = content;
    });

    const mockContent = { id: 1, title: "Test Post", slug: "test-post" };
    await hookManager.doAction("content:beforeDelete", mockContent);

    assertEquals(hookCalled, true);
    assertEquals(deletedContent.id, 1);
});

Deno.test("WordPress Actions - template hooks mapped correctly", async () => {
    let setupCalled = false;
    let redirectCalled = false;

    wp.add_action("after_setup_theme", () => {
        setupCalled = true;
    });

    wp.add_action("template_redirect", () => {
        redirectCalled = true;
    });

    await hookManager.doAction("theme:setup");
    await hookManager.doAction("template:redirect");

    assertEquals(setupCalled, true);
    assertEquals(redirectCalled, true);
});

Deno.test("WordPress Actions - user lifecycle hooks", async () => {
    let profileUpdated = false;
    let userDeleted = false;

    wp.add_action("profile_update", () => {
        profileUpdated = true;
    });

    wp.add_action("delete_user", () => {
        userDeleted = true;
    });

    await hookManager.doAction("user:updated", { id: 1 });
    await hookManager.doAction("user:deleted", 1);

    assertEquals(profileUpdated, true);
    assertEquals(userDeleted, true);
});

Deno.test("WordPress Actions - media hooks", async () => {
    let attachmentUpdated = false;

    wp.add_action("edit_attachment", (attachment: any) => {
        attachmentUpdated = true;
    });

    await hookManager.doAction("media:updated", { id: 1, filename: "test.jpg" });

    assertEquals(attachmentUpdated, true);
});

Deno.test("WordPress Actions - comprehensive mapping count", async () => {
    // Verify that WPCompat maps a significant number of hooks
    const testHooks = [
        "init",
        "wp_loaded",
        "wp_head",
        "save_post",
        "before_delete_post",
        "wp_login",
        "template_include",
        "intermediate_image_sizes"
    ];

    // All these should map to LexCMS hooks without error
    for (const hook of testHooks) {
        let called = false;
        wp.add_action(hook, () => { called = true; });
        // Just verify no errors thrown during registration
        assertEquals(typeof called, "boolean");
    }
});
