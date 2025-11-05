import * as bcrypt from "bcrypt";

/**
 * Hashea una contraseña usando bcrypt
 * @param password - Contraseña en texto plano
 * @returns Hash de la contraseña
 */
export async function hashPassword(password: string): Promise<string> {
  return await bcrypt.hash(password);
}

/**
 * Compara una contraseña con un hash
 * @param password - Contraseña en texto plano
 * @param hash - Hash almacenado
 * @returns true si coinciden, false si no
 */
export async function comparePassword(
  password: string,
  hash: string
): Promise<boolean> {
  return await bcrypt.compare(password, hash);
}
