import type { Context } from "hono";
import * as mediaService from "@/services/content/mediaService.ts";
import { z } from "zod";
import { isAbsolute, join, normalize, relative, resolve } from "@std/path";
import { getErrorMessage } from "@/utils/errors.ts";
import { AppError } from "@/platform/errors.ts";

const mediaSeoSchema = z.object({
  alt: z.string().optional(),
  title: z.string().optional(),
  caption: z.string().optional(),
  description: z.string().optional(),
  focusKeyword: z.string().optional(),
  credits: z.string().optional(),
  copyright: z.string().optional(),
});

const UPLOADS_ROOT = resolve("uploads");

const makeEmptyResponse = (status: number) =>
  new Response(
    new ReadableStream({
      start(controller) {
        controller.close();
      },
    }),
    { status },
  );

/**
 * Sube un archivo de media
 */
export async function uploadMedia(c: Context) {
  try {
    const user = c.get("user");
    const formData = await c.req.formData();

    // Obtener archivo
    const file = formData.get("file");

    if (!file || !(file instanceof File)) {
      throw new AppError("file_required", "No se proporcionó ningún archivo", 400);
    }

    // Leer datos del archivo
    const arrayBuffer = await file.arrayBuffer();
    const data = new Uint8Array(arrayBuffer);

    // Obtener SEO si se proporcionó
    const seoJson = formData.get("seo");
    let seo;

    if (seoJson) {
      try {
        const parsed = JSON.parse(seoJson as string);
        seo = mediaSeoSchema.parse(parsed);
      } catch (error) {
        if (error instanceof z.ZodError) {
          throw AppError.fromCatalog("validation_error", { details: { issues: error.errors }, message: "Datos SEO inválidos" });
        }
        throw AppError.fromCatalog("validation_error", { message: "Datos SEO inválidos" });
      }
    }

    // Subir media
    const media = await mediaService.uploadMedia({
      data,
      filename: file.name,
      mimeType: file.type,
      uploadedBy: user.userId,
      seo,
    });

    // Obtener media completo con tamaños
    const fullMedia = await mediaService.getMediaById(media.id);

    return c.json({ media: fullMedia }, 201);
  } catch (error) {
    console.error("Error uploading media:", error);

    if (
      error instanceof Error &&
      (error.message.includes("no soportado") ||
        error.message.includes("demasiado grande"))
    ) {
      throw new AppError("upload_failed", error.message, 400);
    }

    throw error instanceof AppError ? error : new AppError("upload_failed", getErrorMessage(error), 500);
  }
}

/**
 * Lista medios
 */
export async function listMedia(c: Context) {
  try {
    const limit = Number(c.req.query("limit")) || 20;
    const offset = Number(c.req.query("offset")) || 0;
    const type = c.req.query("type");

    const media = await mediaService.listMedia(limit, offset, type);

    return c.json({ media, limit, offset });
  } catch (error) {
    throw error instanceof AppError ? error : new AppError("media_list_failed", getErrorMessage(error), 500);
  }
}

/**
 * Obtiene un medio por ID
 */
export async function getMediaById(c: Context) {
  try {
    const id = Number(c.req.param("id"));

    if (isNaN(id)) {
      throw AppError.fromCatalog("invalid_id");
    }

    const media = await mediaService.getMediaById(id);

    if (!media) {
      throw AppError.fromCatalog("not_found", { message: "Media no encontrado" });
    }

    return c.json({ media });
  } catch (error) {
    throw error instanceof AppError ? error : new AppError("media_get_failed", getErrorMessage(error), 500);
  }
}

/**
 * Actualiza SEO de un medio
 */
export async function updateMediaSeo(c: Context) {
  try {
    const id = Number(c.req.param("id"));

    if (isNaN(id)) {
      throw AppError.fromCatalog("invalid_id");
    }

    const body = await c.req.json();
    const seo = mediaSeoSchema.parse(body);

    await mediaService.updateMediaSeo(id, seo);

    const media = await mediaService.getMediaById(id);

    return c.json({ media });
  } catch (error) {
    if (error instanceof z.ZodError) {
      throw AppError.fromCatalog("validation_error", { details: { issues: error.errors } });
    }
    throw error instanceof AppError ? error : new AppError("media_seo_failed", getErrorMessage(error), 400);
  }
}

/**
 * Elimina un medio
 */
export async function deleteMedia(c: Context) {
  try {
    const id = Number(c.req.param("id"));

    if (isNaN(id)) {
      throw AppError.fromCatalog("invalid_id");
    }

    await mediaService.deleteMedia(id);

    return c.json({ message: "Media eliminado exitosamente" });
  } catch (error) {
    throw error instanceof AppError ? error : new AppError("media_delete_failed", getErrorMessage(error), 400);
  }
}

/**
 * Sirve un archivo de media
 */
export async function serveMedia(c: Context) {
  const extractRequestedPath = (): string | null => {
    const wildcard = c.req.param("*");
    if (wildcard) {
      return wildcard;
    }

    const directMatch = c.req.path.match(/\/api\/media\/serve\/(.+)/);
    if (directMatch?.[1]) {
      return directMatch[1];
    }

    const year = c.req.param("year");
    const month = c.req.param("month");
    const file = c.req.param("file");
    if (year && month && file) {
      return `uploads/${year}/${month}/${file}`;
    }

    return null;
  };

  try {
    const rawPath = extractRequestedPath();

    if (!rawPath) {
      return makeEmptyResponse(400);
    }

    // Bloquear traversal simples antes de normalizar
    try {
      const decoded = decodeURIComponent(rawPath);
      if (decoded.includes("..")) {
        return makeEmptyResponse(403);
      }
    } catch {
      // Si decode falla, continuar con sanitización estándar
    }

    const sanitizedPath = rawPath
      .replace(/\\/g, "/")
      .replace(/^\.+/, "")
      .replace(/^\/+/, "")
      .replace(/^serve\//, "")
      .trim();

    if (!sanitizedPath || sanitizedPath.includes("\0")) {
      console.warn("serveMedia sanitizedPath invalid", {
        rawPath,
        requestPath: c.req.path,
        sanitizedPath,
      });
      return makeEmptyResponse(400);
    }

    const withoutUploadsPrefix = sanitizedPath.replace(/^uploads\//, "");
    const normalizedRelative = normalize(withoutUploadsPrefix);

    if (
      !normalizedRelative ||
      normalizedRelative === "." ||
      normalizedRelative.startsWith("..") ||
      normalizedRelative.includes("../") ||
      normalizedRelative.includes("..\\") ||
      isAbsolute(normalizedRelative)
    ) {
      return makeEmptyResponse(403);
    }

    const fullPath = resolve(join(UPLOADS_ROOT, normalizedRelative));
    const relativeToBase = relative(UPLOADS_ROOT, fullPath);

    if (!relativeToBase || relativeToBase.startsWith("..")) {
      return makeEmptyResponse(403);
    }

    const fileInfo = await Deno.stat(fullPath);
    if (!fileInfo.isFile) {
      return makeEmptyResponse(404);
    }

    const extension = normalizedRelative.toLowerCase();
    let contentType = "application/octet-stream";
    if (extension.endsWith(".webp")) {
      contentType = "image/webp";
    } else if (extension.endsWith(".png")) {
      contentType = "image/png";
    } else if (extension.endsWith(".jpg") || extension.endsWith(".jpeg")) {
      contentType = "image/jpeg";
    } else if (extension.endsWith(".gif")) {
      contentType = "image/gif";
    } else if (extension.endsWith(".webm")) {
      contentType = extension.includes("/audio/") ? "audio/webm" : "video/webm";
    } else if (extension.endsWith(".mp3")) {
      contentType = "audio/mpeg";
    } else if (extension.endsWith(".pdf")) {
      contentType = "application/pdf";
    }

    const headers = new Headers({
      "Content-Type": contentType,
      "Cache-Control": "public, max-age=31536000, immutable",
      "Accept-Ranges": "bytes",
    });

    if (typeof fileInfo.size === "number") {
      headers.set("Content-Length", fileInfo.size.toString());
    }

    if (fileInfo.mtime instanceof Date) {
      headers.set("Last-Modified", fileInfo.mtime.toUTCString());
    }

    const content = await Deno.readFile(fullPath);

    // Hono 4: use Response directly instead of c.newResponse to avoid polyfill issues
    return new Response(content, { status: 200, headers });
  } catch (error) {
    if (error instanceof Deno.errors.NotFound) {
      return makeEmptyResponse(404);
    }
    return makeEmptyResponse(500);
  }
}
