import { assertEquals, assertExists } from "https://deno.land/std@0.224.0/assert/mod.ts";
import { describe, it } from "https://deno.land/std@0.224.0/testing/bdd.ts";
import {
  sanitizeFilename,
  calculateFileHash,
  generateUniqueFilename,
  getMediaType,
  validateFileSize,
} from "../../src/utils/media/fileUtils.ts";

describe("Media Sanitization Tests", () => {
  describe("Filename Sanitization", () => {
    it("should remove dangerous characters", () => {
      const dangerous = [
        { input: "../../../etc/passwd", expected: "etc-passwd" },
        { input: "file;rm -rf /", expected: "file-rm-rf" },
        { input: "file|cat /etc/passwd", expected: "file-cat-etc-passwd" },
        { input: "file$(whoami).txt", expected: "file-whoami.txt" },
        { input: "file`ls`.txt", expected: "file-ls.txt" },
        { input: "file&command.txt", expected: "file-command.txt" },
        { input: "file name.txt", expected: "file-name.txt" },
        { input: "UPPERCASE.TXT", expected: "uppercase.txt" },
      ];

      for (const test of dangerous) {
        const result = sanitizeFilename(test.input);
        assertEquals(result, test.expected);
      }
    });

    it("should remove accents and special characters", () => {
      const tests = [
        { input: "àéîôù.txt", expected: "aeiou.txt" },
        { input: "ñáéíóú.txt", expected: "naeiou.txt" },
        { input: "日本語.txt", expected: ".txt" },
        { input: "файл.txt", expected: ".txt" },
      ];

      for (const test of tests) {
        const result = sanitizeFilename(test.input);
        assertEquals(result, test.expected);
      }
    });

    it("should limit filename length", () => {
      const longName = "a".repeat(100) + ".txt";
      const result = sanitizeFilename(longName);
      // Debería estar limitado a 50 chars + extensión
      assertEquals(result.length <= 54, true);
    });

    it("should preserve file extension", () => {
      const tests = [
        { input: "file.jpg", shouldHave: ".jpg" },
        { input: "file.PNG", shouldHave: ".png" },
        { input: "file.WEBP", shouldHave: ".webp" },
      ];

      for (const test of tests) {
        const result = sanitizeFilename(test.input);
        assertEquals(result.endsWith(test.shouldHave), true);
      }
    });

    it("should handle files without extension", () => {
      const result = sanitizeFilename("filename");
      assertEquals(result, "filename");
    });

    it("should handle multiple dots", () => {
      const result = sanitizeFilename("file.name.with.dots.txt");
      assertEquals(result.endsWith(".txt"), true);
    });
  });

  describe("Hash Generation", () => {
    it("should generate consistent hashes", async () => {
      const data = new TextEncoder().encode("test data");
      const hash1 = await calculateFileHash(data);
      const hash2 = await calculateFileHash(data);

      assertEquals(hash1, hash2);
    });

    it("should generate different hashes for different data", async () => {
      const data1 = new TextEncoder().encode("test data 1");
      const data2 = new TextEncoder().encode("test data 2");

      const hash1 = await calculateFileHash(data1);
      const hash2 = await calculateFileHash(data2);

      assertEquals(hash1 !== hash2, true);
    });

    it("should generate SHA-256 hash (64 chars hex)", async () => {
      const data = new TextEncoder().encode("test");
      const hash = await calculateFileHash(data);

      // SHA-256 en hex es 64 caracteres
      assertEquals(hash.length, 64);
      assertEquals(/^[a-f0-9]{64}$/.test(hash), true);
    });
  });

  describe("Unique Filename Generation", () => {
    it("should include hash and timestamp", () => {
      const hash = "a".repeat(64);
      const filename = generateUniqueFilename(hash, ".webp");

      // Formato: hash_timestamp.ext
      assertEquals(filename.includes("_"), true);
      assertEquals(filename.endsWith(".webp"), true);
      assertEquals(filename.startsWith("aaaaaaaaaaaaaaaa"), true); // Primeros 16 chars del hash
    });

    it("should generate unique filenames", () => {
      const hash = "a".repeat(64);
      const filename1 = generateUniqueFilename(hash, ".webp");

      // Esperar 1ms para que cambie el timestamp
      const start = Date.now();
      while (Date.now() === start) {
        // busy wait
      }

      const filename2 = generateUniqueFilename(hash, ".webp");

      assertEquals(filename1 !== filename2, true);
    });
  });

  describe("Media Type Detection", () => {
    it("should detect image types", () => {
      const imageTypes = [
        "image/jpeg",
        "image/png",
        "image/gif",
        "image/webp",
      ];

      for (const type of imageTypes) {
        assertEquals(getMediaType(type), "image");
      }
    });

    it("should detect video types", () => {
      const videoTypes = [
        "video/mp4",
        "video/webm",
        "video/quicktime",
      ];

      for (const type of videoTypes) {
        assertEquals(getMediaType(type), "video");
      }
    });

    it("should detect audio types", () => {
      const audioTypes = [
        "audio/mpeg",
        "audio/wav",
        "audio/webm",
      ];

      for (const type of audioTypes) {
        assertEquals(getMediaType(type), "audio");
      }
    });

    it("should detect document types", () => {
      const docTypes = [
        "application/pdf",
        "text/plain",
      ];

      for (const type of docTypes) {
        assertEquals(getMediaType(type), "document");
      }
    });

    it("should throw error for unsupported types", () => {
      let thrown = false;
      try {
        getMediaType("application/x-executable");
      } catch (e) {
        thrown = true;
        assertExists((e as Error).message);
      }
      assertEquals(thrown, true);
    });
  });

  describe("File Size Validation", () => {
    it("should accept files within limits", () => {
      // 5MB image (dentro del límite de 10MB)
      const size = 5 * 1024 * 1024;
      validateFileSize(size, "image/jpeg");
      // No debería lanzar error
      assertEquals(true, true);
    });

    it("should reject files exceeding limits", () => {
      // 15MB image (excede el límite de 10MB)
      const size = 15 * 1024 * 1024;
      let thrown = false;

      try {
        validateFileSize(size, "image/jpeg");
      } catch (e) {
        thrown = true;
        const error = e as Error;
        assertExists(error.message);
        assertEquals(error.message.includes("demasiado grande"), true);
      }

      assertEquals(thrown, true);
    });

    it("should have different limits for different types", () => {
      // Video puede ser más grande que imagen
      const videoSize = 50 * 1024 * 1024; // 50MB
      const imageSize = 50 * 1024 * 1024; // 50MB

      // Video debería pasar
      validateFileSize(videoSize, "video/mp4");

      // Imagen debería fallar
      let imageFailed = false;
      try {
        validateFileSize(imageSize, "image/jpeg");
      } catch (e) {
        imageFailed = true;
      }

      assertEquals(imageFailed, true);
    });
  });

  describe("Path Traversal Prevention", () => {
    it("should prevent directory traversal in paths", () => {
      const maliciousPaths = [
        "../../../etc/passwd",
        "..\\..\\..\\windows\\system32",
        "uploads/../../../etc/passwd",
        "uploads/../../config.json",
      ];

      for (const path of maliciousPaths) {
        const sanitized = sanitizeFilename(path);
        // No debería contener ..
        assertEquals(sanitized.includes(".."), false);
        // No debería contener / o \
        assertEquals(sanitized.includes("/"), false);
        assertEquals(sanitized.includes("\\"), false);
      }
    });
  });

  describe("Command Injection Prevention", () => {
    it("should prevent command injection in filenames", () => {
      const maliciousNames = [
        "file; rm -rf /.jpg",
        "file | cat /etc/passwd.jpg",
        "file && ls -la.jpg",
        "file `whoami`.jpg",
        "file $(id).jpg",
      ];

      for (const name of maliciousNames) {
        const sanitized = sanitizeFilename(name);
        // No debería contener caracteres de comando
        assertEquals(sanitized.includes(";"), false);
        assertEquals(sanitized.includes("|"), false);
        assertEquals(sanitized.includes("&"), false);
        assertEquals(sanitized.includes("`"), false);
        assertEquals(sanitized.includes("$"), false);
      }
    });
  });

  describe("Null Byte Injection Prevention", () => {
    it("should prevent null byte injection", () => {
      const malicious = "file.txt\x00.exe";
      const sanitized = sanitizeFilename(malicious);

      // No debería contener null bytes
      assertEquals(sanitized.includes("\x00"), false);
    });
  });

  describe("Unicode Normalization", () => {
    it("should normalize unicode to prevent bypasses", () => {
      // Algunos caracteres unicode pueden parecer diferentes pero ser equivalentes
      const name1 = "café.jpg"; // é como un carácter
      const name2 = "café.jpg"; // é como e + acento combinado

      const sanitized1 = sanitizeFilename(name1);
      const sanitized2 = sanitizeFilename(name2);

      // Deberían producir el mismo resultado sanitizado
      assertEquals(sanitized1, sanitized2);
    });
  });
});
