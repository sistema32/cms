// Helper function to convert ArrayBuffer to hex string
function bufferToHex(buffer: ArrayBuffer): string {
  return Array.from(new Uint8Array(buffer))
    .map(b => b.toString(16).padStart(2, "0"))
    .join("");
}

import { MEDIA_TYPES } from "../../config/constants.ts";

// Tipos MIME permitidos
export const ALLOWED_IMAGE_TYPES = [
  "image/jpeg",
  "image/jpg",
  "image/png",
  "image/gif",
  "image/webp",
  "image/svg+xml",
  "image/bmp",
  "image/tiff",
];

export const ALLOWED_VIDEO_TYPES = [
  "video/mp4",
  "video/mpeg",
  "video/quicktime",
  "video/x-msvideo",
  "video/x-matroska",
  "video/webm",
];

export const ALLOWED_AUDIO_TYPES = [
  "audio/mpeg",
  "audio/mp3",
  "audio/wav",
  "audio/ogg",
  "audio/webm",
  "audio/aac",
  "audio/flac",
];

export const ALLOWED_DOCUMENT_TYPES = [
  "application/pdf",
  "text/plain",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/vnd.ms-excel",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
];

// Límites de tamaño (en bytes)
export const MAX_IMAGE_SIZE = 10 * 1024 * 1024; // 10MB
export const MAX_VIDEO_SIZE = 100 * 1024 * 1024; // 100MB
export const MAX_AUDIO_SIZE = 50 * 1024 * 1024; // 50MB
export const MAX_DOCUMENT_SIZE = 20 * 1024 * 1024; // 20MB

/**
 * Calcula el hash SHA-256 de un archivo
 */
export async function calculateFileHash(data: Uint8Array): Promise<string> {
  const hashBuffer = await crypto.subtle.digest("SHA-256", data as BufferSource);
  return bufferToHex(hashBuffer);
}

/**
 * Sanitiza el nombre de archivo removiendo caracteres peligrosos
 */
export function sanitizeFilename(filename: string): string {
  // Buscar extensión válida (solo alfanumérica después del último punto)
  const lastDot = filename.lastIndexOf(".");
  let name = filename;
  let ext = "";

  if (lastDot !== -1) {
    const potentialExt = filename.substring(lastDot);
    // Solo considerar como extensión si tiene caracteres alfanuméricos después del punto
    if (/^\.[a-zA-Z0-9]+$/.test(potentialExt)) {
      name = filename.substring(0, lastDot);
      ext = potentialExt.toLowerCase();
    }
  }

  // Sanitizar nombre
  const sanitized = name
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "") // Quitar acentos
    .replace(/[^a-z0-9-_]/g, "-") // Solo alfanuméricos, guiones y guiones bajos
    .replace(/-+/g, "-") // Múltiples guiones a uno
    .replace(/^-|-$/g, "") // Quitar guiones al inicio/final
    .substring(0, 50); // Limitar longitud

  return sanitized + ext;
}

/**
 * Genera un nombre de archivo único usando hash y timestamp
 */
export function generateUniqueFilename(hash: string, extension: string): string {
  const timestamp = Date.now();
  const shortHash = hash.substring(0, 16); // Primeros 16 caracteres del hash
  return `${shortHash}_${timestamp}${extension}`;
}

/**
 * Obtiene la extensión para el tipo de archivo procesado
 */
export function getProcessedExtension(mimeType: string): string {
  if (ALLOWED_IMAGE_TYPES.includes(mimeType)) {
    return ".webp";
  } else if (ALLOWED_VIDEO_TYPES.includes(mimeType)) {
    return ".webm";
  } else if (ALLOWED_AUDIO_TYPES.includes(mimeType)) {
    return ".webm";
  } else if (ALLOWED_DOCUMENT_TYPES.includes(mimeType)) {
    return ".pdf";
  }
  return ".bin";
}

/**
 * Determina el tipo de media basado en MIME type
 */
export function getMediaType(mimeType: string): "image" | "video" | "audio" | "document" {
  if (ALLOWED_IMAGE_TYPES.includes(mimeType)) {
    return MEDIA_TYPES.IMAGE;
  } else if (ALLOWED_VIDEO_TYPES.includes(mimeType)) {
    return MEDIA_TYPES.VIDEO;
  } else if (ALLOWED_AUDIO_TYPES.includes(mimeType)) {
    return MEDIA_TYPES.AUDIO;
  } else if (ALLOWED_DOCUMENT_TYPES.includes(mimeType)) {
    return MEDIA_TYPES.DOCUMENT;
  }
  throw new Error(`Tipo MIME no soportado: ${mimeType}`);
}

/**
 * Valida el tamaño del archivo
 */
export function validateFileSize(size: number, mimeType: string): void {
  const type = getMediaType(mimeType);

  let maxSize: number;
  switch (type) {
    case MEDIA_TYPES.IMAGE:
      maxSize = MAX_IMAGE_SIZE;
      break;
    case MEDIA_TYPES.VIDEO:
      maxSize = MAX_VIDEO_SIZE;
      break;
    case MEDIA_TYPES.AUDIO:
      maxSize = MAX_AUDIO_SIZE;
      break;
    case MEDIA_TYPES.DOCUMENT:
      maxSize = MAX_DOCUMENT_SIZE;
      break;
  }

  if (size > maxSize) {
    throw new Error(
      `Archivo demasiado grande. Máximo permitido: ${maxSize / 1024 / 1024}MB`
    );
  }
}

/**
 * Crea la estructura de directorios para el año/mes actual
 */
export function getUploadPath(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  return `uploads/${year}/${month}`;
}

/**
 * Asegura que un directorio existe
 */
export async function ensureDir(path: string): Promise<void> {
  try {
    await Deno.stat(path);
  } catch (error) {
    if (error instanceof Deno.errors.NotFound) {
      await Deno.mkdir(path, { recursive: true });
    } else {
      throw error;
    }
  }
}

/**
 * Guarda un archivo en el sistema de archivos
 */
export async function saveFile(data: Uint8Array, path: string): Promise<void> {
  // Asegurar que el directorio existe
  const dir = path.substring(0, path.lastIndexOf("/"));
  await ensureDir(dir);

  // Guardar archivo
  await Deno.writeFile(path, data);
}

/**
 * Lee un archivo del sistema de archivos
 */
export async function readFile(path: string): Promise<Uint8Array> {
  return await Deno.readFile(path);
}

/**
 * Elimina un archivo del sistema de archivos
 */
export async function deleteFile(path: string): Promise<void> {
  try {
    await Deno.remove(path);
  } catch (error) {
    if (!(error instanceof Deno.errors.NotFound)) {
      throw error;
    }
  }
}
