import { create, verify, getNumericDate } from "djwt";
import type { Payload } from "djwt";
import { env } from "../config/env.ts";

// Interface del payload JWT
export interface JWTPayload extends Payload {
  userId: number;
  email: string;
}

// Función helper para crear la clave
async function getKey() {
  const encoder = new TextEncoder();
  const keyBuf = encoder.encode(env.JWT_SECRET);

  return await crypto.subtle.importKey(
    "raw",
    keyBuf,
    { name: "HMAC", hash: "SHA-256" },
    true,
    ["sign", "verify"]
  );
}

/**
 * Genera un token JWT
 * @param payload - Datos del usuario sin exp/iat
 * @returns Token JWT firmado
 */
export async function generateToken(
  payload: Omit<JWTPayload, "exp" | "iat">
): Promise<string> {
  const key = await getKey();
  return await create(
    { alg: "HS256", typ: "JWT" },
    {
      ...payload,
      exp: getNumericDate(60 * 60 * 24 * 7), // Expira en 7 días
    },
    key
  );
}

/**
 * Verifica y decodifica un token JWT
 * @param token - Token JWT a verificar
 * @returns Payload decodificado
 */
export async function verifyToken(token: string): Promise<JWTPayload> {
  const key = await getKey();
  const payload = await verify(token, key);
  return payload as JWTPayload;
}
