import { assertEquals, assertStringIncludes } from "https://deno.land/std@0.208.0/assert/mod.ts";
import { DOMParser } from "https://deno.land/x/deno_dom@v0.1.43/deno-dom-wasm.ts";

/**
 * Security Tests - XSS Protection
 *
 * Tests to verify XSS vulnerabilities have been fixed in Nexus pages
 */

Deno.test("RolesNexus: should not have inline onclick handlers with string interpolation", async () => {
  const content = await Deno.readTextFile("./src/admin/pages/RolesNexus.tsx");

  // Should NOT contain onclick with string interpolation and manual escaping
  const vulnerablePattern = /onclick=["']deleteRole\(\$\{.*?\.replace\(/;
  assertEquals(
    vulnerablePattern.test(content),
    false,
    "Found vulnerable onclick handler with string interpolation and manual escaping"
  );

  // Should contain data attributes instead
  assertStringIncludes(
    content,
    'data-role-id="${role.id}"',
    "Should use data-role-id attribute"
  );

  assertStringIncludes(
    content,
    'data-role-name="${role.name}"',
    "Should use data-role-name attribute"
  );

  assertStringIncludes(
    content,
    'class="action-btn danger btn-delete-role"',
    "Should use btn-delete-role class for event delegation"
  );
});

Deno.test("RolesNexus: should use DOM API instead of innerHTML concatenation", async () => {
  const content = await Deno.readTextFile("./src/admin/pages/RolesNexus.tsx");

  // Should use DOM API
  assertStringIncludes(
    content,
    "document.createElement('div')",
    "Should use createElement for DOM manipulation"
  );

  assertStringIncludes(
    content,
    ".textContent =",
    "Should use textContent instead of innerHTML for text"
  );

  // Should have XSS safe comments
  assertStringIncludes(
    content,
    "// XSS safe",
    "Should have XSS safety documentation"
  );

  // Should NOT have innerHTML with concatenation
  const vulnerablePattern = /innerHTML\s*=\s*['"]?.*?\+.*?module/;
  assertEquals(
    vulnerablePattern.test(content),
    false,
    "Should not use innerHTML with string concatenation"
  );
});

Deno.test("RolesNexus: should have event listeners setup", async () => {
  const content = await Deno.readTextFile("./src/admin/pages/RolesNexus.tsx");

  assertStringIncludes(
    content,
    "document.addEventListener('DOMContentLoaded'",
    "Should set up event listeners on DOMContentLoaded"
  );

  assertStringIncludes(
    content,
    "e.target.closest('.btn-delete-role')",
    "Should use event delegation with closest()"
  );

  assertStringIncludes(
    content,
    "// Initialize event listeners (XSS safe - no inline onclick)",
    "Should document XSS safety in event listener setup"
  );
});

Deno.test("UsersNexus: should not have inline onclick handlers with string interpolation", async () => {
  const content = await Deno.readTextFile("./src/admin/pages/UsersNexus.tsx");

  // Should NOT contain onclick with string interpolation
  const vulnerablePattern = /onclick=["']editUser\(\$\{.*?\.replace\(/;
  assertEquals(
    vulnerablePattern.test(content),
    false,
    "Found vulnerable onclick handler with string interpolation"
  );

  // Should contain data attributes
  assertStringIncludes(
    content,
    'data-user-id="${u.id}"',
    "Should use data-user-id attribute"
  );

  assertStringIncludes(
    content,
    'data-user-name="${u.name || ""}"',
    "Should use data-user-name attribute"
  );

  assertStringIncludes(
    content,
    'data-user-email="${u.email}"',
    "Should use data-user-email attribute"
  );

  assertStringIncludes(
    content,
    'class="action-btn btn-edit-user"',
    "Should use btn-edit-user class for event delegation"
  );

  assertStringIncludes(
    content,
    'class="action-btn danger btn-delete-user"',
    "Should use btn-delete-user class for event delegation"
  );
});

Deno.test("UsersNexus: should have event listeners setup", async () => {
  const content = await Deno.readTextFile("./src/admin/pages/UsersNexus.tsx");

  assertStringIncludes(
    content,
    "document.addEventListener('DOMContentLoaded'",
    "Should set up event listeners on DOMContentLoaded"
  );

  assertStringIncludes(
    content,
    "e.target.closest('.btn-edit-user')",
    "Should use event delegation for edit buttons"
  );

  assertStringIncludes(
    content,
    "e.target.closest('.btn-delete-user')",
    "Should use event delegation for delete buttons"
  );

  assertStringIncludes(
    content,
    "// Initialize event listeners (XSS safe - no inline onclick)",
    "Should document XSS safety in event listener setup"
  );
});

Deno.test("SettingsNexus: should not have vulnerable patterns", async () => {
  const content = await Deno.readTextFile("./src/admin/pages/SettingsNexus.tsx");

  // Settings doesn't have dynamic onclick handlers, but verify no innerHTML abuse
  const dangerousInnerHTML = /innerHTML\s*=\s*[^;]*\$\{/;
  assertEquals(
    dangerousInnerHTML.test(content),
    false,
    "Should not have innerHTML with template literal interpolation"
  );
});

Deno.test("ContentListNexus: should not have vulnerable patterns", async () => {
  const content = await Deno.readTextFile("./src/admin/pages/ContentListNexus.tsx");

  // Verify no dangerous patterns
  const dangerousInnerHTML = /innerHTML\s*=\s*[^;]*\$\{/;
  assertEquals(
    dangerousInnerHTML.test(content),
    false,
    "Should not have innerHTML with template literal interpolation"
  );
});

Deno.test("Security: verify no eval() usage in Nexus pages", async () => {
  const nexusFiles = [
    "./src/admin/pages/RolesNexus.tsx",
    "./src/admin/pages/UsersNexus.tsx",
    "./src/admin/pages/SettingsNexus.tsx",
    "./src/admin/pages/ContentListNexus.tsx",
    "./src/admin/pages/DashboardNexus.tsx",
    "./src/admin/pages/LoginNexus.tsx",
  ];

  for (const file of nexusFiles) {
    const content = await Deno.readTextFile(file);
    assertEquals(
      content.includes("eval("),
      false,
      `${file} should not contain eval()`
    );
  }
});

Deno.test("Security: verify authorization checks in Nexus pages", async () => {
  const filesWithAuth = [
    "./src/admin/pages/RolesNexus.tsx",
    "./src/admin/pages/UsersNexus.tsx",
  ];

  for (const file of filesWithAuth) {
    const content = await Deno.readTextFile(file);

    assertStringIncludes(
      content,
      "hasPermission",
      `${file} should have hasPermission checks`
    );

    assertStringIncludes(
      content,
      "canCreate",
      `${file} should check canCreate permission`
    );

    assertStringIncludes(
      content,
      "canUpdate",
      `${file} should check canUpdate permission`
    );

    assertStringIncludes(
      content,
      "canDelete",
      `${file} should check canDelete permission`
    );
  }
});
