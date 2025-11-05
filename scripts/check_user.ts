import { db } from "../src/config/db.ts";
import { users } from "../src/db/schema.ts";
import { eq } from "drizzle-orm";

async function checkUser() {
  try {
    const user = await db.query.users.findFirst({
      where: eq(users.email, "admin@cms.com"),
    });
    
    if (user) {
      console.log("User found:", {
        id: user.id,
        email: user.email,
        roleId: user.roleId,
        createdAt: user.createdAt
      });
    } else {
      console.log("User not found");
    }
  } catch (error) {
    console.error("Error checking user:", error);
  }
}

// Run the function
await checkUser();