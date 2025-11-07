/**
 * Theme Cache Service - EJEMPLO CORREGIDO
 *
 * Este es un ejemplo de cómo debería verse el archivo después de corregir
 * el error de importación de createHash
 */

// ✅ CORRECTO - Usar node:crypto en lugar de std/crypto
import { createHash } from "node:crypto";

/**
 * Genera un hash SHA-256 de un string
 */
export function generateThemeHash(themeContent: string): string {
  const hash = createHash("sha256");
  hash.update(themeContent);
  return hash.digest("hex");
}

/**
 * Genera un hash MD5 de un string (si es necesario)
 */
export function generateThemeHashMD5(themeContent: string): string {
  const hash = createHash("md5");
  hash.update(themeContent);
  return hash.digest("hex");
}

// ===== ALTERNATIVA MODERNA (Web Crypto API) =====
/**
 * Genera un hash SHA-256 usando Web Crypto API
 * Esta es la forma moderna y nativa de Deno
 */
export async function generateThemeHashModern(themeContent: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(themeContent);
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);

  // Convertir el buffer a string hexadecimal
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const hex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');

  return hex;
}

/**
 * Helper para convertir ArrayBuffer a hex string
 */
export function bufferToHex(buffer: ArrayBuffer): string {
  const hashArray = Array.from(new Uint8Array(buffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

// ===== EJEMPLO DE USO =====
/*
// Usando node:crypto (sincrónico)
const hash1 = generateThemeHash("mi contenido");
console.log(hash1); // "abc123..."

// Usando Web Crypto API (asincrónico)
const hash2 = await generateThemeHashModern("mi contenido");
console.log(hash2); // "abc123..."
*/
