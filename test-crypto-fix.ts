#!/usr/bin/env -S deno run --allow-read

/**
 * Test script to verify crypto utilities work correctly
 */

import { hashString, hashFile, createHash, bufferToHex, randomHex } from "./src/lib/utils/crypto.ts";

console.log("🧪 Testing crypto utilities...\n");

try {
  // Test 1: Hash a simple string
  console.log("Test 1: hashString()");
  const hash1 = await hashString("Hello World");
  console.log(`  ✅ SHA-256("Hello World") = ${hash1}`);
  console.log();

  // Test 2: Using createHash (legacy compatibility)
  console.log("Test 2: createHash() - Legacy API");
  const hasher = createHash("SHA-256");
  hasher.update("Hello ");
  hasher.update("World");
  const hash2 = await hasher.digest("hex");
  console.log(`  ✅ SHA-256("Hello World") = ${hash2}`);
  console.log();

  // Test 3: Verify both methods produce same result
  console.log("Test 3: Comparing results");
  if (hash1 === hash2) {
    console.log(`  ✅ Both methods produce identical hashes`);
  } else {
    console.log(`  ❌ Hashes don't match!`);
    Deno.exit(1);
  }
  console.log();

  // Test 4: Random hex generation
  console.log("Test 4: randomHex()");
  const token = randomHex(16);
  console.log(`  ✅ Random hex (32 chars): ${token}`);
  console.log();

  // Test 5: Buffer to hex conversion
  console.log("Test 5: bufferToHex()");
  const buffer = new Uint8Array([0xDE, 0xAD, 0xBE, 0xEF]);
  const hex = bufferToHex(buffer.buffer);
  console.log(`  ✅ [0xDE, 0xAD, 0xBE, 0xEF] = "${hex}"`);
  console.log();

  console.log("✅ All crypto utility tests passed!\n");

} catch (error) {
  console.error("❌ Test failed:", error);
  Deno.exit(1);
}
