import { Hono, Context, Next } from "hono";
import { deleteCookie, getCookie, setCookie } from "hono/cookie";
import { eq } from "drizzle-orm";
import { env } from "../../config/env.ts";
import { db } from "../../config/db.ts";
import { users } from "../../db/schema.ts";
import { generateToken, verifyToken } from "../../utils/jwt.ts";
import { comparePassword } from "../../utils/password.ts";
import { verifyTOTP } from "../../services/twoFactorService.ts";
import LoginNexusPage from "../../admin/pages/LoginNexus.tsx";

export const authRouter = new Hono();

/**
 * Admin authentication middleware
 * Checks for JWT token in cookies and redirects to login if not authenticated
 */
export async function adminAuth(c: Context, next: Next) {
    // Skip auth for static assets
    const path = c.req.path;
    if (path.startsWith(`${env.ADMIN_PATH}/assets/`)) {
        return await next();
    }

    const token = getCookie(c, "auth_token");

    if (!token) {
        return c.redirect(`${env.ADMIN_PATH}/login`);
    }

    try {
        const payload = await verifyToken(token);

        // Verify user still exists in database
        const user = await db.query.users.findFirst({
            where: eq(users.id, payload.userId),
        });

        if (!user) {
            deleteCookie(c, "auth_token");
            return c.redirect(`${env.ADMIN_PATH}/login?error=user_not_found`);
        }

        c.set("user", payload);
        await next();
    } catch (error) {
        console.error("Admin auth failed:", error);
        deleteCookie(c, "auth_token");
        return c.redirect(`${env.ADMIN_PATH}/login?error=session_expired`);
    }
}

/**
 * GET /login - Show login form
 */
authRouter.get("/login", async (c) => {
    // If already authenticated, redirect to dashboard
    const token = getCookie(c, "auth_token");
    if (token) {
        try {
            await verifyToken(token);
            return c.redirect(env.ADMIN_PATH);
        } catch {
            // Token invalid, continue to login
        }
    }

    const error = c.req.query("error");
    const errorMessages: Record<string, string> = {
        invalid_credentials: "Email o contraseña incorrectos",
        user_not_found: "Usuario no encontrado",
        session_expired:
            "Tu sesión ha expirado. Por favor, inicia sesión nuevamente",
        invalid_2fa: "Código 2FA inválido",
        requires_2fa: "Se requiere autenticación de dos factores",
    };

    return c.html(
        LoginNexusPage({
            error: error ? errorMessages[error] : undefined,
        }),
    );
});

/**
 * POST /login - Process login
 */
authRouter.post("/login", async (c) => {
    try {
        const body = await c.req.parseBody();
        const email = body.email as string;
        const password = body.password as string;

        if (!email || !password) {
            return c.html(
                LoginNexusPage({
                    error: "Email y contraseña son requeridos",
                    email,
                }),
            );
        }

        // Find user
        const user = await db.query.users.findFirst({
            where: eq(users.email, email),
        });

        if (!user) {
            return c.html(
                LoginNexusPage({
                    error: "Email o contraseña incorrectos",
                    email,
                }),
            );
        }

        // Verify password
        const isValidPassword = await comparePassword(password, user.password);
        if (!isValidPassword) {
            return c.html(
                LoginNexusPage({
                    error: "Email o contraseña incorrectos",
                    email,
                }),
            );
        }

        // Check if 2FA is enabled
        if (user.twoFactorEnabled && user.twoFactorSecret) {
            // Store userId temporarily in a short-lived cookie for 2FA verification
            setCookie(c, "2fa_user_id", user.id.toString(), {
                httpOnly: true,
                secure: env.DENO_ENV === "production",
                sameSite: "Lax",
                maxAge: 300, // 5 minutes
                path: env.ADMIN_PATH,
            });

            return c.html(
                LoginNexusPage({
                    email,
                    requires2FA: true,
                }),
            );
        }

        const token = await generateToken({
            userId: user.id,
            email: user.email,
            name: user.name,
        });

        setCookie(c, "auth_token", token, {
            httpOnly: true,
            secure: env.DENO_ENV === "production",
            sameSite: "Lax",
            maxAge: 60 * 60 * 24 * 7, // 7 days
            path: "/",
        });

        return c.redirect(env.ADMIN_PATH);
    } catch (error) {
        console.error("Login error:", error);
        return c.html(
            LoginNexusPage({
                error: "Error al iniciar sesión. Por favor, intenta de nuevo",
            }),
        );
    }
});

/**
 * POST /login/verify-2fa - Verify 2FA code
 */
authRouter.post("/login/verify-2fa", async (c) => {
    try {
        const body = await c.req.parseBody();
        const email = body.email as string;
        const code = body.code as string;
        const userIdCookie = getCookie(c, "2fa_user_id");

        if (!userIdCookie || !code) {
            return c.redirect(`${env.ADMIN_PATH}/login?error=invalid_2fa`);
        }

        // Get user
        const user = await db.query.users.findFirst({
            where: eq(users.id, parseInt(userIdCookie)),
        });

        if (!user || !user.twoFactorEnabled || !user.twoFactorSecret) {
            deleteCookie(c, "2fa_user_id");
            return c.redirect(`${env.ADMIN_PATH}/login?error=invalid_2fa`);
        }

        // Verify 2FA code
        const isValid = verifyTOTP(user.twoFactorSecret, code);

        if (!isValid) {
            return c.html(
                LoginNexusPage({
                    email,
                    requires2FA: true,
                    error: "Código 2FA inválido",
                }),
            );
        }

        // Delete temporary cookie
        deleteCookie(c, "2fa_user_id");

        // Generate token and set cookie
        const token = await generateToken({
            userId: user.id,
            email: user.email,
            name: user.name,
        });

        setCookie(c, "auth_token", token, {
            httpOnly: true,
            secure: env.DENO_ENV === "production",
            sameSite: "Lax",
            maxAge: 60 * 60 * 24 * 7, // 7 days
            path: "/",
        });

        return c.redirect(env.ADMIN_PATH);
    } catch (error) {
        console.error("2FA verification error:", error);
        return c.redirect(`${env.ADMIN_PATH}/login?error=invalid_2fa`);
    }
});

/**
 * POST /logout - Logout
 */
authRouter.post("/logout", (c) => {
    deleteCookie(c, "auth_token");
    return c.redirect(`${env.ADMIN_PATH}/login`);
});
