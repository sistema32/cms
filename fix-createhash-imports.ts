#!/usr/bin/env -S deno run --allow-read --allow-write

/**
 * Script para corregir automáticamente los imports de createHash
 * desde std/crypto a node:crypto
 */

import { walk } from "https://deno.land/std@0.224.0/fs/walk.ts";
import { join } from "https://deno.land/std@0.224.0/path/mod.ts";

console.log("🔍 Buscando archivos con imports de createHash...\n");

const projectRoot = Deno.cwd();
const srcDir = join(projectRoot, "src");

let filesFixed = 0;
let filesScanned = 0;

try {
  for await (const entry of walk(srcDir, { exts: [".ts", ".tsx", ".js", ".jsx"] })) {
    if (entry.isFile) {
      filesScanned++;
      const content = await Deno.readTextFile(entry.path);

      // Buscar el patrón problemático
      const problematicPattern = /import\s*{\s*createHash\s*}\s*from\s*["']https:\/\/deno\.land\/std@[0-9.]+\/crypto\/mod\.ts["'];?/g;

      if (problematicPattern.test(content)) {
        console.log(`📝 Corrigiendo: ${entry.path}`);

        // Reemplazar con el import correcto
        const fixedContent = content.replace(
          problematicPattern,
          'import { createHash } from "node:crypto";'
        );

        // Escribir el archivo corregido
        await Deno.writeTextFile(entry.path, fixedContent);
        filesFixed++;
        console.log(`   ✅ Corregido\n`);
      }
    }
  }

  console.log("\n" + "=".repeat(50));
  console.log(`📊 Resumen:`);
  console.log(`   - Archivos escaneados: ${filesScanned}`);
  console.log(`   - Archivos corregidos: ${filesFixed}`);
  console.log("=".repeat(50));

  if (filesFixed > 0) {
    console.log("\n✅ Corrección completada!");
    console.log("\n⚠️  Recuerda verificar que todo funcione:");
    console.log("   deno task dev\n");
  } else {
    console.log("\nℹ️  No se encontraron archivos con el import problemático.");
  }

} catch (error) {
  console.error("❌ Error durante la corrección:", error);
  Deno.exit(1);
}
