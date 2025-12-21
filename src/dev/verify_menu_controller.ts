
import { adminMenuController } from "@/controllers/admin/menuController.ts";
import { createMenu, deleteMenu } from "@/services/content/menuService.ts";
import { db } from "@/config/db.ts";
import { menuItems } from "@/db/schema.ts";
import { eq } from "drizzle-orm";

async function verifyMenuController() {
    console.log("🚀 Verifying Admin Menu Controller...");

    // 1. Create a temporary menu for testing
    const menu = await createMenu({
        name: "Controller Test Menu",
        slug: "controller-test-menu",
        location: null,
        isActive: true
    });
    console.log(`✅ Created test menu with ID: ${menu.id}`);

    try {
        // 2. Mock Context for saveItems
        // Structure: 
        // - Parent (temp1)
        //   - Child 1 (temp2, parent=temp1)
        //     - Grandchild (temp3, parent=temp2)
        // - Sibling (temp4)

        const itemsPayload = [
            { tempId: "temp1", parentId: null, label: "Parent", order: 0, type: "custom", url: "#" },
            { tempId: "temp2", parentId: "temp1", label: "Child 1", order: 0, type: "custom", url: "#" },
            { tempId: "temp3", parentId: "temp2", label: "Grandchild", order: 0, type: "custom", url: "#" },
            { tempId: "temp4", parentId: null, label: "Sibling", order: 1, type: "custom", url: "#" }
        ];

        const mockContext = {
            req: {
                param: (name: string) => {
                    if (name === "id") return menu.id.toString();
                    return "";
                },
                json: () => Promise.resolve({ items: itemsPayload })
            },
            json: (data: any, status?: number) => {
                if (status && status !== 200) {
                    console.error("❌ Controller returned error:", data);
                    throw new Error(data.error || "Unknown error");
                }
                return data;
            },
            get: (key: string) => {
                // Mock user if needed
                if (key === "user") return { id: 1, role: "admin" };
                return null;
            }
        };

        // 3. Execute saveItems
        console.log("🔄 Executing saveItems...");
        await adminMenuController.saveItems(mockContext as any);

        // 4. Verify Database State
        const savedItems = await db.query.menuItems.findMany({
            where: eq(menuItems.menuId, menu.id),
            orderBy: (menuItems, { asc }) => [asc(menuItems.id)], // Check by ID creation order mostly
        });

        console.log(`✅ Retrieved ${savedItems.length} items from DB`);

        if (savedItems.length !== 4) throw new Error("Expected 4 items saved");

        // Helper to find item by label
        const find = (label: string) => savedItems.find(i => i.label === label);

        const parent = find("Parent");
        const child1 = find("Child 1");
        const grandchild = find("Grandchild");
        const sibling = find("Sibling");

        if (!parent || !child1 || !grandchild || !sibling) throw new Error("Missing items");

        // Check Hierarchy
        if (child1.parentId !== parent.id) throw new Error(`Child 1 parent mismatch: expected ${parent.id}, got ${child1.parentId}`);
        if (grandchild.parentId !== child1.id) throw new Error(`Grandchild parent mismatch: expected ${child1.id}, got ${grandchild.parentId}`);
        if (sibling.parentId !== null) throw new Error("Sibling should verify parentId is null");

        console.log("✅ Hierarchy verification passed!");

    } catch (error) {
        console.error("❌ Verification failed:", error);
    } finally {
        // Cleanup
        await deleteMenu(menu.id);
        console.log("🧹 Cleanup done.");
    }
}

if (import.meta.main) {
    verifyMenuController();
}
