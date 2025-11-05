/**
 * Build CSS with Tailwind
 * Uses Tailwind standalone CLI for better Deno compatibility
 */

import { join } from "@std/path";

const projectRoot = Deno.cwd();
const inputFile = join(projectRoot, "src/themes/default/assets/css/tailwind.css");
const outputFile = join(projectRoot, "src/themes/default/assets/css/main.css");
const configFile = join(projectRoot, "tailwind.config.js");

const minify = Deno.args.includes("--minify");
const watch = Deno.args.includes("--watch");

console.log("🎨 Building Tailwind CSS...");
console.log(`   Input:  ${inputFile}`);
console.log(`   Output: ${outputFile}`);
console.log(`   Minify: ${minify}`);
console.log(`   Watch:  ${watch}`);

// Download Tailwind standalone CLI if not exists
const tailwindBin = join(projectRoot, ".bin/tailwindcss");
const binExists = await Deno.stat(tailwindBin).then(() => true).catch(() => false);

if (!binExists) {
  console.log("📥 Downloading Tailwind CSS standalone CLI...");
  await Deno.mkdir(join(projectRoot, ".bin"), { recursive: true });

  // Detect platform
  const platform = Deno.build.os;
  const arch = Deno.build.arch;

  let downloadUrl = "";
  if (platform === "linux" && arch === "x86_64") {
    downloadUrl = "https://github.com/tailwindlabs/tailwindcss/releases/download/v3.4.17/tailwindcss-linux-x64";
  } else if (platform === "darwin" && arch === "aarch64") {
    downloadUrl = "https://github.com/tailwindlabs/tailwindcss/releases/download/v3.4.17/tailwindcss-macos-arm64";
  } else if (platform === "darwin" && arch === "x86_64") {
    downloadUrl = "https://github.com/tailwindlabs/tailwindcss/releases/download/v3.4.17/tailwindcss-macos-x64";
  } else if (platform === "windows") {
    downloadUrl = "https://github.com/tailwindlabs/tailwindcss/releases/download/v3.4.17/tailwindcss-windows-x64.exe";
  } else {
    console.error(`❌ Unsupported platform: ${platform}-${arch}`);
    Deno.exit(1);
  }

  const response = await fetch(downloadUrl);
  if (!response.ok) {
    console.error(`❌ Failed to download Tailwind CSS: ${response.statusText}`);
    Deno.exit(1);
  }

  const buffer = await response.arrayBuffer();
  await Deno.writeFile(tailwindBin, new Uint8Array(buffer));
  await Deno.chmod(tailwindBin, 0o755);

  console.log("✅ Tailwind CSS CLI downloaded");
}

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
  console.error("❌ Failed to build CSS");
  Deno.exit(code);
}

if (!watch) {
  console.log("✅ CSS built successfully!");
}
