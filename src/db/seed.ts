import { db } from "../config/db.ts";
import { users } from "./schema.ts";
import { hash } from "bcrypt";

console.log("🌱 Seeding database...");

// Crear usuario de prueba
const hashedPassword = await hash("password123");

await db.insert(users).values({
  email: "admin@example.com",
  password: hashedPassword,
  name: "Admin User",
});

console.log("✅ Database seeded successfully!");
console.log("   Email: admin@example.com");
console.log("   Password: password123");

Deno.exit(0);
