/**
 * CMS Routes - Core CMS API endpoints
 * 
 * Provides:
 * - /api/cms/context - User context and permissions for SDK
 */

import { Hono } from "hono";
import { getCookie } from "hono/cookie";
import { verifyToken } from "@/utils/jwt.ts";
import { db } from "../config/db.ts";
import { users } from "../db/schema.ts";
import { eq } from "drizzle-orm";

const cmsRouter = new Hono();

/**
 * GET /api/cms/context
 * Returns current user info and permissions for client-side SDK
 * Does NOT require authentication - returns empty context for guests
 */
cmsRouter.get("/context", async (c) => {
    try {
        // Try to get token from cookie or header
        let token: string | undefined;
        const authHeader = c.req.header("Authorization");

        if (authHeader?.startsWith("Bearer ")) {
            token = authHeader.substring(7);
        } else {
            token = getCookie(c, "auth_token") ?? undefined;
        }

        // No token = guest user
        if (!token) {
            return c.json({
                user: null,
                permissions: [],
                isSuperAdmin: false
            });
        }

        // Verify token
        let payload;
        try {
            payload = await verifyToken(token);
        } catch {
            // Invalid token = guest user
            return c.json({
                user: null,
                permissions: [],
                isSuperAdmin: false
            });
        }

        // Get user with role and permissions
        const fullUser = await db.query.users.findFirst({
            where: eq(users.id, payload.userId),
            with: {
                role: {
                    with: {
                        rolePermissions: {
                            with: {
                                permission: true
                            }
                        }
                    }
                }
            }
        });

        if (!fullUser) {
            return c.json({
                user: null,
                permissions: [],
                isSuperAdmin: false
            });
        }

        // Check if superadmin
        const isSuperAdmin = fullUser.role?.name === "superadmin";

        // Get permissions as "module:action" strings
        const userPermissions = fullUser.role?.rolePermissions?.map(
            (rp: any) => `${rp.permission.module}:${rp.permission.action}`
        ) || [];

        return c.json({
            user: {
                id: fullUser.id,
                name: fullUser.name,
                email: fullUser.email,
                role: fullUser.role?.name || null
            },
            permissions: userPermissions,
            isSuperAdmin
        });
    } catch (error) {
        console.error("[CMS Context] Error:", error);
        return c.json({
            user: null,
            permissions: [],
            isSuperAdmin: false
        });
    }
});

export default cmsRouter;
