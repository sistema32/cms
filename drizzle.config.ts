import type { Config } from "drizzle-kit";

const env = Deno.env.get("DENO_ENV") || "development";
const dbUrl = Deno.env.get("DATABASE_URL") || "file:data/db.sqlite";

export default {
  schema: "./src/db/schema.ts",
  out: "./src/db/migrations",
  dialect: env === "production" ? "postgresql" : "turso",
  dbCredentials: {
    url: dbUrl,
  }
} satisfies Config;
