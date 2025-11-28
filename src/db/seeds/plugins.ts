import { db } from "../index.ts";
import { plugins } from "../schema.ts";
import { eq } from "drizzle-orm";

const seeds = [
  {
    name: "core-system",
    displayName: "Core System",
    version: "1.0.0",
    description: "System plugin placeholder (non-removable)",
    author: "LexCMS",
    status: "active",
    isSystem: true,
    settings: "{}",
    permissions: "{}",
  },
];

export async function seedPlugins() {
  for (const seed of seeds) {
    const existing = await db.select().from(plugins).where(eq(plugins.name, seed.name)).get();
    if (existing) continue;
    await db.insert(plugins).values(seed);
    console.log(`[seed] inserted plugin ${seed.name}`);
  }
}
