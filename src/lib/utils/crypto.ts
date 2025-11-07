/**
 * Crypto Utilities using Web Crypto API
 *
 * This module provides utility functions for cryptographic operations
 * using the native Web Crypto API available in Deno.
 */

/**
 * Supported hash algorithms
 */
export type HashAlgorithm = "SHA-1" | "SHA-256" | "SHA-384" | "SHA-512";

/**
 * Converts an ArrayBuffer to a hexadecimal string
 *
 * @param buffer - The buffer to convert
 * @returns Hexadecimal string representation
 */
export function bufferToHex(buffer: ArrayBuffer): string {
  const hashArray = Array.from(new Uint8Array(buffer));
  return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
}

/**
 * Converts a hexadecimal string to an ArrayBuffer
 *
 * @param hex - The hexadecimal string to convert
 * @returns ArrayBuffer representation
 */
export function hexToBuffer(hex: string): ArrayBuffer {
  const matches = hex.match(/.{1,2}/g);
  if (!matches) {
    throw new Error("Invalid hex string");
  }
  const bytes = new Uint8Array(matches.map((byte) => parseInt(byte, 16)));
  return bytes.buffer;
}

/**
 * Calculate hash of a string
 *
 * @param data - The string to hash
 * @param algorithm - Hash algorithm to use (default: SHA-256)
 * @returns Promise resolving to hexadecimal hash string
 *
 * @example
 * ```ts
 * const hash = await hashString("Hello World");
 * console.log(hash); // "a591a6d40bf420404a011733cfb7b190d62c65bf0bcda32b57b277d9ad9f146e"
 * ```
 */
export async function hashString(
  data: string,
  algorithm: HashAlgorithm = "SHA-256",
): Promise<string> {
  const encoder = new TextEncoder();
  const dataBuffer = encoder.encode(data);
  const hashBuffer = await crypto.subtle.digest(algorithm, dataBuffer);
  return bufferToHex(hashBuffer);
}

/**
 * Calculate hash of a Uint8Array
 *
 * @param data - The data to hash
 * @param algorithm - Hash algorithm to use (default: SHA-256)
 * @returns Promise resolving to hexadecimal hash string
 *
 * @example
 * ```ts
 * const data = new TextEncoder().encode("Hello World");
 * const hash = await hashBytes(data);
 * console.log(hash);
 * ```
 */
export async function hashBytes(
  data: Uint8Array,
  algorithm: HashAlgorithm = "SHA-256",
): Promise<string> {
  const hashBuffer = await crypto.subtle.digest(algorithm, data);
  return bufferToHex(hashBuffer);
}

/**
 * Calculate hash of a file
 *
 * @param filePath - Path to the file
 * @param algorithm - Hash algorithm to use (default: SHA-256)
 * @returns Promise resolving to hexadecimal hash string
 *
 * @example
 * ```ts
 * const hash = await hashFile("./myfile.txt");
 * console.log(hash);
 * ```
 */
export async function hashFile(
  filePath: string,
  algorithm: HashAlgorithm = "SHA-256",
): Promise<string> {
  const data = await Deno.readFile(filePath);
  const hashBuffer = await crypto.subtle.digest(algorithm, data);
  return bufferToHex(hashBuffer);
}

/**
 * Generate a random hex string of specified length
 *
 * @param length - Number of bytes (result will be length * 2 hex characters)
 * @returns Random hexadecimal string
 *
 * @example
 * ```ts
 * const token = randomHex(32); // 64 character hex string
 * console.log(token);
 * ```
 */
export function randomHex(length: number): string {
  const bytes = new Uint8Array(length);
  crypto.getRandomValues(bytes);
  return bufferToHex(bytes.buffer);
}

/**
 * Compare two strings in constant time to prevent timing attacks
 *
 * @param a - First string
 * @param b - Second string
 * @returns True if strings are equal
 */
export function constantTimeCompare(a: string, b: string): boolean {
  if (a.length !== b.length) {
    return false;
  }

  let result = 0;
  for (let i = 0; i < a.length; i++) {
    result |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }

  return result === 0;
}

/**
 * Legacy compatibility: Create a hash instance similar to Node.js crypto.createHash
 * This provides a familiar API for those migrating from Node.js
 *
 * Note: This is less efficient than using hashString/hashBytes directly
 * as it buffers all data in memory.
 *
 * @param algorithm - Hash algorithm to use
 * @returns Hash instance with update() and digest() methods
 *
 * @example
 * ```ts
 * const hash = createHash("sha256");
 * hash.update("Hello ");
 * hash.update("World");
 * const result = await hash.digest("hex");
 * console.log(result);
 * ```
 */
export function createHash(algorithm: HashAlgorithm) {
  const chunks: Uint8Array[] = [];
  let totalLength = 0;

  return {
    /**
     * Update the hash with more data
     */
    update(data: string | Uint8Array): void {
      const chunk = typeof data === "string"
        ? new TextEncoder().encode(data)
        : data;
      chunks.push(chunk);
      totalLength += chunk.length;
    },

    /**
     * Finalize and return the hash
     */
    async digest(encoding: "hex" | "buffer" = "hex"): Promise<string | ArrayBuffer> {
      // Combine all chunks
      const combined = new Uint8Array(totalLength);
      let offset = 0;
      for (const chunk of chunks) {
        combined.set(chunk, offset);
        offset += chunk.length;
      }

      // Calculate hash
      const hashBuffer = await crypto.subtle.digest(algorithm, combined);

      if (encoding === "hex") {
        return bufferToHex(hashBuffer);
      }
      return hashBuffer;
    },
  };
}
