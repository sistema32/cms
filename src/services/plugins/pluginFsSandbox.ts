// @ts-nocheck
import { join } from "https://deno.land/std@0.224.0/path/mod.ts";

export class FsSandbox {
  constructor(private baseDir: string) {}

  private resolveSafe(path: string) {
    const target = join(this.baseDir, path);
    const normalized = join(target);
    if (!normalized.startsWith(this.baseDir)) {
      throw new Error("FS sandbox: path escape detected");
    }
    return normalized;
  }

  async readText(path: string) {
    const full = this.resolveSafe(path);
    return await Deno.readTextFile(full);
  }

  async readFile(path: string) {
    const full = this.resolveSafe(path);
    return await Deno.readFile(full);
  }

  // Explicitly forbid write operations
  async writeFile() {
    throw new Error("FS sandbox: write operations are not allowed");
  }

  async mkdir() {
    throw new Error("FS sandbox: write operations are not allowed");
  }
}
