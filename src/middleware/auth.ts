import { Context, Next } from "hono";
import { getCookie } from "hono/cookie";
import { verifyToken } from "../utils/jwt.ts";
import type { JWTPayload } from "../utils/jwt.ts";

// Extender el contexto de Hono con el payload del usuario
declare module "hono" {
  interface ContextVariableMap {
    user: JWTPayload;
  }
}

export async function authMiddleware(c: Context, next: Next) {
  let token: string | undefined;
  const authHeader = c.req.header("Authorization");

  if (authHeader?.startsWith("Bearer ")) {
    token = authHeader.substring(7);
  } else {
    token = getCookie(c, "auth_token") ?? c.req.query("token") ?? undefined;
  }

  if (!token) {
    return c.json({ error: "No autorizado" }, 401);
  }

  try {
    const payload = await verifyToken(token);
    c.set("user", payload);
    await next();
  } catch (error) {
    console.error("Token verification failed:", error);
    return c.json({ error: "Token inválido o expirado" }, 401);
  }
}
