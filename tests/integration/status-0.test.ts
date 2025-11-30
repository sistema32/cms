import { app } from "../../src/app.ts";

Deno.test("no middleware should produce status 0 on /admincp", async () => {
const req = new Request("http://localhost/admincp", { method: "GET" });
const res = await app.fetch(req);
  if (!res) {
    throw new Error("No response returned");
  }
  if (res.status === 0) {
    throw new Error("Middleware chain returned status 0");
  }
  if (res.status >= 500) {
    const text = await res.text();
    throw new Error(`Unexpected server error: ${res.status} body=${text}`);
  }
});
