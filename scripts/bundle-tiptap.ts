/**
 * TipTap Editor Bundle Script
 * Bundles TipTap and extensions for browser use
 */
import * as esbuild from "npm:esbuild@0.25.12";

const entryPoint = "./src/admin/assets/js/tiptap-entry.ts";
const outFile = "./src/admin/assets/js/tiptap-bundle.js";

console.log("🔧 Bundling TipTap editor...");

try {
    await esbuild.build({
        entryPoints: [entryPoint],
        bundle: true,
        format: "esm",
        platform: "browser",
        target: "es2020",
        outfile: outFile,
        minify: Deno.args.includes("--minify"),
        sourcemap: !Deno.args.includes("--minify"),
        external: [], // Bundle everything
        define: {
            "process.env.NODE_ENV": '"production"',
        },
    });

    console.log(`✅ TipTap bundle created: ${outFile}`);
} catch (error) {
    console.error("❌ Error bundling TipTap:", error);
    Deno.exit(1);
}
