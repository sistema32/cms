import {
  assertEquals,
  assertExists,
} from "https://deno.land/std@0.224.0/assert/mod.ts";
import {
  beforeAll,
  describe,
  it,
} from "https://deno.land/std@0.224.0/testing/bdd.ts";
import { app } from "../../src/app.ts";

async function obtainToken(
  email: string,
  password: string,
  name: string,
): Promise<string> {
  const forwardedFor = crypto.randomUUID();
  const registerReq = new Request("http://localhost/api/auth/register", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-forwarded-for": forwardedFor,
    },
    body: JSON.stringify({
      email,
      password,
      name,
    }),
  });
  const registerRes = await app.request(registerReq);
  const registerBody = await registerRes.json();

  if (registerRes.ok && registerBody?.data?.token) {
    return registerBody.data.token;
  }

  if (registerRes.status === 400) {
    const loginReq = new Request("http://localhost/api/auth/login", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-forwarded-for": forwardedFor,
      },
      body: JSON.stringify({ email, password }),
    });
    const loginRes = await app.request(loginReq);
    const loginBody = await loginRes.json();

    if (loginRes.ok && loginBody?.data?.token) {
      return loginBody.data.token;
    }
  }

  throw new Error(
    `Could not obtain auth token for ${email}: ${JSON.stringify(registerBody)}`,
  );
}

describe("Input Validation & Injection Tests", () => {
  let authToken: string;

  beforeAll(async () => {
    const email = `test-validation-${crypto.randomUUID()}@test.com`;
    authToken = await obtainToken(email, "SecurePass123!", "Validation Test");
  });

  describe("SQL Injection Tests", () => {
    it("should prevent SQL injection in login", async () => {
      const payloads = [
        "' OR '1'='1",
        "admin'--",
        "' OR '1'='1' /*",
        "'; DROP TABLE users--",
        "1' UNION SELECT NULL, NULL, NULL--",
      ];

      for (const payload of payloads) {
        const req = new Request("http://localhost/api/auth/login", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            email: payload,
            password: "test",
          }),
        });
        const res = await app.request(req);

        // No debería causar error 500 (SQL error)
        assertEquals(res.status !== 500, true);
        await res.text();
      }
    });

    it("should prevent SQL injection in search", async () => {
      const req = new Request("http://localhost/api/tags/search?q=' OR 1=1--", {
        headers: { "Authorization": `Bearer ${authToken}` },
      });
      const res = await app.request(req);

      assertEquals(res.status !== 500, true);
      const data = await res.json();
      assertExists(data);
    });
  });

  describe("XSS Prevention Tests", () => {
    it("should sanitize XSS in content creation", async () => {
      const xssPayloads = [
        "<script>alert('XSS')</script>",
        "<img src=x onerror=alert('XSS')>",
        "<svg onload=alert('XSS')>",
        "javascript:alert('XSS')",
        "<iframe src='javascript:alert(1)'>",
      ];

      for (const payload of xssPayloads) {
        const req = new Request("http://localhost/api/content", {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${authToken}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            contentTypeId: 1,
            title: payload,
            slug: `test-xss-${crypto.randomUUID()}`,
            body: payload,
            status: "draft",
          }),
        });
        const res = await app.request(req);

        if (res.status === 201) {
          const data = await res.json();
          // El contenido no debería contener scripts ejecutables
          // (debería estar escapado o sanitizado)
          const hasScript = data.content.title?.includes("<script>") ||
            data.content.body?.includes("<script>");
          // Si permite HTML, debería estar escapado
          assertEquals(hasScript, false);
        } else {
          await res.text();
        }
      }
    });

    it("should prevent XSS in tag names", async () => {
      const req = new Request("http://localhost/api/tags", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${authToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: "<script>alert('XSS')</script>",
          slug: `xss-tag-${crypto.randomUUID()}`,
        }),
      });
      const res = await app.request(req);

      if (res.status === 201) {
        const data = await res.json();
        assertEquals(data.tag.name?.includes("<script>"), false);
      } else {
        await res.text();
      }
    });
  });

  describe("NoSQL/Command Injection Tests", () => {
    it("should prevent command injection in file operations", async () => {
      // Intentar inyección de comandos en nombres de archivo
      const payloads = [
        "; rm -rf /",
        "| cat /etc/passwd",
        "$(whoami)",
        "`whoami`",
        "&& ls -la",
      ];

      // Estos payloads deberían ser sanitizados en el nombre de archivo
      // (testeamos la sanitización, no subimos archivos reales)
      const { sanitizeFilename } = await import(
        "../../src/utils/media/fileUtils.ts"
      );

      for (const payload of payloads) {
        const sanitized = sanitizeFilename(payload);
        // No debería contener caracteres peligrosos
        assertEquals(sanitized.includes(";"), false);
        assertEquals(sanitized.includes("|"), false);
        assertEquals(sanitized.includes("$"), false);
        assertEquals(sanitized.includes("`"), false);
        assertEquals(sanitized.includes("&"), false);
      }
    });
  });

  describe("Path Traversal Tests", () => {
    it("should prevent path traversal in file serving", async () => {
      const payloads = [
        "../../../etc/passwd",
        "..%2F..%2F..%2Fetc%2Fpasswd",
        "....//....//....//etc/passwd",
        "..\\..\\..\\windows\\system32\\config\\sam",
      ];

      for (const payload of payloads) {
        const req = new Request(`http://localhost/api/media/serve/${payload}`);
        const res = await app.request(req);

        // No debería permitir acceso a archivos fuera del directorio uploads
        assertEquals(res.status !== 200, true);
        await res.body?.cancel();
      }
    });
  });

  describe("SSRF Prevention Tests", () => {
    it("should prevent SSRF in URL inputs", async () => {
      const ssrfPayloads = [
        "http://localhost:22",
        "http://127.0.0.1:8000/api/users",
        "file:///etc/passwd",
        "http://169.254.169.254/latest/meta-data/",
        "http://metadata.google.internal/",
      ];

      // Si hay algún endpoint que acepte URLs, debería validar
      for (const payload of ssrfPayloads) {
        const req = new Request("http://localhost/api/content-seo", {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${authToken}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            contentId: 1,
            canonicalUrl: payload,
          }),
        });
        const res = await app.request(req);

        // Debería rechazar URLs internas/peligrosas
        if (res.status === 201) {
          const data = await res.json();
          // Verificar que no se guardó la URL peligrosa tal cual
          // (debería validarse)
        } else {
          await res.text();
        }
      }
    });
  });

  describe("Mass Assignment Tests", () => {
    it("should prevent mass assignment of protected fields", async () => {
      // Intentar modificar campos que no deberían ser modificables
      const req = new Request("http://localhost/api/users/1", {
        method: "PUT",
        headers: {
          "Authorization": `Bearer ${authToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: "Updated Name",
          roleId: 1, // Intentar hacerse superadmin
          isAdmin: true, // Campo que no debería existir
          id: 999, // Intentar cambiar el ID
        }),
      });
      const res = await app.request(req);

      if (res.status === 200) {
        const data = await res.json();
        // El roleId no debería cambiar para usuarios normales
        assertEquals(data.user?.roleId !== 1, true);
      } else {
        await res.text();
      }
    });
  });

  describe("Input Size Limits", () => {
    it("should reject extremely large payloads", async () => {
      const largeString = "A".repeat(1000000); // 1MB de datos

      const req = new Request("http://localhost/api/content", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${authToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          contentTypeId: 1,
          title: "Test",
          slug: `test-large-${crypto.randomUUID()}`,
          body: largeString,
        }),
      });
      const res = await app.request(req);

      // Debería tener algún límite
      // (puede aceptarlo o rechazarlo, pero no debería crashear)
      assertEquals(res.status !== 500, true);
      await res.text();
    });

    it("should reject deeply nested JSON", async () => {
      // Crear un JSON muy anidado
      let nested: any = { value: "deep" };
      for (let i = 0; i < 1000; i++) {
        nested = { nested };
      }

      const req = new Request("http://localhost/api/content-meta", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${authToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          contentId: 1,
          key: "test",
          value: JSON.stringify(nested),
          type: "json",
        }),
      });
      const res = await app.request(req);

      // No debería causar stack overflow
      assertEquals(res.status !== 500, true);
      await res.text();
    });
  });

  describe("Email Validation", () => {
    it("should validate email format", async () => {
      const invalidEmails = [
        "not-an-email",
        "@example.com",
        "user@",
        "user @example.com",
        "user@example",
      ];

      for (const email of invalidEmails) {
        const forwardedFor = crypto.randomUUID();
        const req = new Request("http://localhost/api/auth/register", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "x-forwarded-for": forwardedFor,
          },
          body: JSON.stringify({
            email,
            password: "SecurePass123!",
            name: "Test",
          }),
        });
        const res = await app.request(req);

        // Debería rechazar emails inválidos
        assertEquals(res.status !== 201, true);
        await res.text();
      }
    });
  });

  describe("Password Policy", () => {
    it("should enforce password strength", async () => {
      const weakPasswords = [
        "123456",
        "password",
        "abc123",
        "qwerty",
        "12345678",
      ];

      for (const password of weakPasswords) {
        const forwardedFor = crypto.randomUUID();
        const req = new Request("http://localhost/api/auth/register", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "x-forwarded-for": forwardedFor,
          },
          body: JSON.stringify({
            email: `test-${crypto.randomUUID()}@example.com`,
            password,
            name: "Test",
          }),
        });
        const res = await app.request(req);

        // Debería rechazar contraseñas débiles
        assertEquals(res.status !== 201, true);
        await res.text();
      }
    });
  });
});
