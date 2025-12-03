/**
 * Script para re-registrar el plugin lexslider con los permisos corregidos
 */

import { db } from "../src/config/db.ts";
import { plugins } from "../src/db/schema.ts";
import { eq } from "drizzle-orm";

const PLUGIN_NAME = "lexslider";

console.log(`\n🔄 Re-registrando plugin: ${PLUGIN_NAME}\n`);

try {
    // 1. Eliminar el plugin de la base de datos
    console.log("1️⃣ Eliminando registro antiguo...");
    const result = await db.delete(plugins).where(eq(plugins.name, PLUGIN_NAME));
    console.log("   ✅ Plugin eliminado de la base de datos");

    console.log("\n2️⃣ El plugin se volverá a descubrir automáticamente");
    console.log("   ℹ️  Al reiniciar el servidor, el sistema lo detectará");
    console.log("   ℹ️  Los permisos se auto-otorgarán basándose en el manifest.json actualizado");

    console.log("\n✅ Proceso completado!");
    console.log("\n📝 Siguiente paso:");
    console.log("   1. Reinicia el servidor: deno task start");
    console.log("   2. El plugin se registrará automáticamente con los permisos correctos");
    console.log("   3. Actívalo desde el panel admin o API\n");

} catch (err) {
    console.error("❌ Error:", err);
    Deno.exit(1);
}

Deno.exit(0);
