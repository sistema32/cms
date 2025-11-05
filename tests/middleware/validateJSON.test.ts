import { describe, it } from "https://deno.land/std@0.224.0/testing/bdd.ts";
import { assertEquals } from "https://deno.land/std@0.224.0/assert/assert_equals.ts";
import { Hono } from "hono";
import { validateJSON } from "../../src/middleware/security.ts";

const app = new Hono();
app.use("*", validateJSON);
app.post("/echo", async (c) => {
  const body = await c.req.json();
  return c.json({ body });
});

describe("validateJSON middleware", () => {
  it("allows valid JSON payloads", async () => {
    const res = await app.request("/echo", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ok: true }),
    });
    assertEquals(res.status, 200);
    const json = await res.json();
    assertEquals(json.body.ok, true);
  });

  it("rejects malformed JSON payloads", async () => {
    const res = await app.request("/echo", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: "{ invalid json }",
    });
    assertEquals(res.status, 400);
    const json = await res.json();
    assertEquals(json.error, "Invalid JSON payload");
  });

  it("skips non JSON content types", async () => {
    const res = await app.request("/echo", {
      method: "POST",
      headers: { "Content-Type": "text/plain" },
      body: "not json",
    });
    assertEquals(res.status, 500);
  });
});
