import { walk } from "https://deno.land/std@0.224.0/fs/walk.ts";
import { join } from "https://deno.land/std@0.224.0/path/mod.ts";

const DISALLOWED_EXT = new Set([
  ".sh",
  ".bat",
  ".cmd",
  ".exe",
  ".dll",
  ".so",
  ".dylib",
]);
const MAX_FILE_BYTES = 5 * 1024 * 1024; // 5MB por archivo

export async function scanPlugin(plugin: string) {
  const root = join(Deno.cwd(), "plugins", plugin);
  const issues: string[] = [];
  try {
    for await (const entry of walk(root, { includeFiles: true, includeDirs: false })) {
      const ext = entry.path.split(".").pop();
      if (ext && DISALLOWED_EXT.has("." + ext)) {
        issues.push(`Archivo con extensión no permitida: ${entry.path}`);
      }
      const info = await Deno.stat(entry.path);
      if (info.size > MAX_FILE_BYTES) {
        issues.push(`Archivo demasiado grande (${info.size} bytes): ${entry.path}`);
      }
    }
  } catch (err) {
    throw new Error(`No se pudo escanear el plugin ${plugin}: ${err instanceof Error ? err.message : String(err)}`);
  }

  if (issues.length > 0) {
    throw new Error(`Escaneo de seguridad falló para ${plugin}:\n- ${issues.join("\n- ")}`);
  }
  return true;
}
