// @ts-nocheck

import { ensureDir } from "@std/fs";
import { join } from "@std/path";
import { decompress } from "compress";

export async function installPluginFromUrl(id: string, url: string, checksum?: string) {
    console.log(`[installer] Installing plugin ${id} from ${url}...`);

    // 1. Download
    const res = await fetch(url);
    if (!res.ok) {
        throw new Error(`Failed to download plugin: ${res.statusText}`);
    }
    const blob = await res.blob();
    const buffer = new Uint8Array(await blob.arrayBuffer());

    // 2. Verify checksum (TODO)
    if (checksum) {
        // const hash = await crypto.subtle.digest("SHA-256", buffer);
        // verify...
    }

    // 3. Prepare target dir
    const targetDir = join(Deno.cwd(), "plugins", id);
    await ensureDir(targetDir);

    // 4. Extract
    // We assume the zip contains the files directly or a single folder.
    // For simplicity, we extract to targetDir.
    // compress.decompress auto-detects format (zip/tar)
    await decompress(buffer, targetDir);

    console.log(`[installer] Plugin ${id} installed to ${targetDir}`);
    return true;
}
