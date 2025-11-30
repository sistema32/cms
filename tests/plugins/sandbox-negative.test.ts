import { createReadOnlyDbClient } from "../../src/services/pluginDbSandbox.ts";
import { httpFetch } from "../../src/services/pluginHttpSandbox.ts";
import { FsSandbox } from "../../src/services/pluginFsSandbox.ts";

Deno.test("DB sandbox rejects write", async () => {
  const db = createReadOnlyDbClient(async () => ({ rows: [] }));
  let threw = false;
  try {
    await db.query("insert into t values (1)");
  } catch {
    threw = true;
  }
  if (!threw) throw new Error("Expected DB sandbox to reject write");
});

Deno.test("HTTP sandbox rejects disallowed host", async () => {
  let threw = false;
  try {
    await httpFetch("https://example.com", {}, { allowlist: ["allowed.com"], timeoutMs: 10 });
  } catch {
    threw = true;
  }
  if (!threw) throw new Error("Expected HTTP sandbox to reject host");
});

Deno.test("FS sandbox rejects write", async () => {
  const fs = new FsSandbox("/tmp");
  let threw = false;
  try {
    // @ts-ignore testing forbidden method
    await fs.writeFile("x.txt", "test");
  } catch {
    threw = true;
  }
  if (!threw) throw new Error("Expected FS sandbox to reject write");
});
