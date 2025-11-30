import { PluginManifest, parseManifest } from "./pluginManifest.ts";
import { join } from "https://deno.land/std@0.224.0/path/mod.ts";
import { computeManifestChecksum, computeManifestHmac } from "./manifestChecksum.ts";

export async function loadManifestFromDisk(root: string, name: string): Promise<PluginManifest> {
  const manifestPath = join(root, "plugins", name, "manifest.json");
  const data = await Deno.readTextFile(manifestPath);
  const json = JSON.parse(data);
  const parsed = parseManifest(json);
  const checksum = await computeManifestChecksum(parsed);
  parsed.checksum = checksum;
  if (json.checksum && json.checksum !== checksum) {
    throw new Error("Manifest checksum mismatch");
  }
  const signatureSecret = Deno.env.get("MANIFEST_SIGNATURE_SECRET") ?? Deno.env.get("PLUGIN_SIGNATURE_SECRET");
  if (json.signature) {
    if (signatureSecret) {
      const expected = await computeManifestHmac(data, signatureSecret);
      if (json.signature !== expected) {
        throw new Error("Manifest signature invalid");
      }
    } else {
      // fallback: accept only if signature equals checksum
      if (json.signature !== checksum) {
        throw new Error("Manifest signature invalid");
      }
    }
  }
  return parsed;
}

export async function tryLoadManifest(root: string, name: string): Promise<PluginManifest | null> {
  try {
    return await loadManifestFromDisk(root, name);
  } catch (err) {
    console.error(`[manifest] failed to load manifest for ${name}:`, err);
    return null;
  }
}
