#!/usr/bin/env -S deno run --allow-all

import { parse } from "https://deno.land/std@0.224.0/flags/mod.ts";
import { applyPending, rollbackLast, status } from "../src/services/pluginMigrations.ts";

function usage() {
  console.log("Usage: deno task plugin:migrate <name> <up|down|status> [--steps=N]");
}

async function main() {
  const args = parse(Deno.args);
  const [name, cmd] = args._.map(String);
  if (!name || !cmd) {
    usage();
    Deno.exit(1);
  }
  const steps = args.steps ? Number(args.steps) : undefined;
  try {
    if (cmd === "status") {
      const s = await status(name);
      console.log(JSON.stringify(s, null, 2));
      return;
    }
    if (cmd === "up") {
      const applied = await applyPending(name, steps);
      console.log(applied.length ? `Applied: ${applied.join(", ")}` : "No pending migrations");
      return;
    }
    if (cmd === "down") {
      const rolled = await rollbackLast(name, steps ?? 1);
      console.log(rolled.length ? `Rolled back: ${rolled.join(", ")}` : "No migrations to rollback");
      return;
    }
    usage();
    Deno.exit(1);
  } catch (err) {
    console.error("Error:", err instanceof Error ? err.message : String(err));
    Deno.exit(1);
  }
}

if (import.meta.main) {
  main();
}
