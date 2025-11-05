/**
 * Build Admin CSS with Tailwind
 * Uses Tailwind standalone CLI
 */

import { join } from "@std/path";

const projectRoot = Deno.cwd();
const inputFile = join(projectRoot, "src/admin/assets/css/admin.css");
const outputFile = join(projectRoot, "src/admin/assets/css/admin-compiled.css");
const configFile = join(projectRoot, "tailwind.config.js");

const minify = Deno.args.includes("--minify");
const watch = Deno.args.includes("--watch");

console.log("🎨 Building Admin CSS...");
console.log(`   Input:  ${inputFile}`);
console.log(`   Output: ${outputFile}`);
console.log(`   Minify: ${minify}`);
console.log(`   Watch:  ${watch}`);

const tailwindBin = join(projectRoot, ".bin/tailwindcss");

// Build CSS
const args = [
  "-i",
  inputFile,
  "-o",
  outputFile,
  "-c",
  configFile,
];

if (minify) {
  args.push("--minify");
}

if (watch) {
  args.push("--watch");
}

const command = new Deno.Command(tailwindBin, {
  args,
  stdin: "inherit",
  stdout: "inherit",
  stderr: "inherit",
});

const { code } = await command.output();

if (code !== 0) {
  console.error("❌ Failed to build Admin CSS");
  Deno.exit(code);
}

if (!watch) {
  console.log("✅ Admin CSS built successfully!");
}
