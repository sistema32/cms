import { db } from "../src/config/db.ts";
import { users } from "../src/db/schema.ts";
import { hashPassword } from "../src/utils/password.ts";
import { eq } from "drizzle-orm";

async function createAdminUser() {
  try {
    // Hash the password
    const hashedPassword = await hashPassword("123456");
    
    // Check if the user already exists
    const existingUser = await db.query.users.findFirst({
      where: eq(users.email, "admin@cms.com"),
    });
    
    if (existingUser) {
      console.log("User admin@cms.com already exists");
      return;
    }
    
    // Insert the new user
    const [newUser] = await db
      .insert(users)
      .values({
        email: "admin@cms.com",
        password: hashedPassword,
        name: "Admin User",
        roleId: 6,
      })
      .returning();
    
    console.log("User created successfully:", newUser);
  } catch (error) {
    console.error("Error creating user:", error);
  }
}

// Run the function
await createAdminUser();