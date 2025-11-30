
import { db } from "./src/config/db.ts";
import { plugins } from "./src/db/schema.ts";

async function main() {
    const all = await db.select().from(plugins).all();
    console.log(JSON.stringify(all, null, 2));
}

main();
