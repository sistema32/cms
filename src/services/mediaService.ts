import { db } from "../config/db.ts";
import {
  type Media,
  media,
  mediaSeo,
  mediaSizes,
  type NewMedia,
} from "../db/schema.ts";
import { eq } from "drizzle-orm";
import * as fileUtils from "../utils/media/fileUtils.ts";
import * as imageProcessor from "../utils/media/imageProcessor.ts";
import type { ProcessedImage } from "../utils/media/imageProcessor.ts";
import * as videoProcessor from "../utils/media/videoProcessor.ts";
import * as documentProcessor from "../utils/media/documentProcessor.ts";
import { env } from "../config/env.ts";

export interface UploadFileInput {
  data: Uint8Array;
  filename: string;
  mimeType: string;
  uploadedBy: number;
  seo?: {
    alt?: string;
    title?: string;
    caption?: string;
    description?: string;
    focusKeyword?: string;
    credits?: string;
    copyright?: string;
  };
}

export interface MediaWithSizes {
  media: Media;
  sizes: Array<{
    size: string;
    width: number;
    height: number;
    url: string;
    fileSize: number;
  }>;
  seo?: {
    alt?: string;
    title?: string;
    caption?: string;
    description?: string;
  };
}

const BASE_URL = env.BASE_URL || "http://localhost:8000";

/**
 * Sube y procesa un archivo
 */
export async function uploadMedia(input: UploadFileInput): Promise<Media> {
  // 1. Validar tipo MIME
  const mediaType = fileUtils.getMediaType(input.mimeType);

  let generatedImageSizes: Map<string, ProcessedImage> | undefined;

  // 2. Validar tamaño
  fileUtils.validateFileSize(input.data.length, input.mimeType);

  // 3. Calcular hash para evitar duplicados
  const hash = await fileUtils.calculateFileHash(input.data);

  // 4. Verificar si ya existe
  const existing = await db.query.media.findFirst({
    where: eq(media.hash, hash),
  });

  if (existing) {
    return existing;
  }

  // 5. Generar nombres y rutas
  const uploadPath = fileUtils.getUploadPath();
  const processedExtension = fileUtils.getProcessedExtension(input.mimeType);
  const sanitizedName = fileUtils.sanitizeFilename(input.filename);
  const uniqueFilename = fileUtils.generateUniqueFilename(
    hash,
    processedExtension,
  );
  const relativePath = `${uploadPath}/${uniqueFilename}`;
  const fullPath = relativePath;
  const url = `/${relativePath}`;

  // 6. Procesar según tipo
  let processedData: Uint8Array;
  let width: number | null = null;
  let height: number | null = null;
  let duration: number | null = null;
  let finalMimeType: string;

  switch (mediaType) {
    case "image": {
      const processed = await imageProcessor.processImage(input.data);
      processedData = processed.data;
      width = processed.width;
      height = processed.height;
      finalMimeType = "image/webp";

      // Guardar archivo original procesado
      await fileUtils.saveFile(processedData, fullPath);

      // Generar múltiples tamaños
      const sizes = await imageProcessor.generateImageSizes(input.data);
      generatedImageSizes = sizes;

      // Guardar cada tamaño
      for (const [sizeName, sizeData] of sizes.entries()) {
        if (sizeName === "original") continue; // Ya guardamos el original

        const sizeFilename = uniqueFilename.replace(
          processedExtension,
          `-${sizeName}${processedExtension}`,
        );
        const sizePath = `${uploadPath}/${sizeFilename}`;
        await fileUtils.saveFile(sizeData.data, sizePath);
      }

      break;
    }

    case "video": {
      // Guardar archivo temporal
      const tempDir = "temp";
      await fileUtils.ensureDir(tempDir);
      const tempInput = `${tempDir}/input_${Date.now()}`;
      const tempOutput = `${tempDir}/output_${Date.now()}.webm`;

      await fileUtils.saveFile(input.data, tempInput);

      // Convertir a WebM
      const videoInfo = await videoProcessor.convertVideoToWebM(
        tempInput,
        tempOutput,
      );

      // Leer archivo convertido
      processedData = await fileUtils.readFile(tempOutput);
      width = videoInfo.width;
      height = videoInfo.height;
      duration = videoInfo.duration;
      finalMimeType = "video/webm";

      // Guardar archivo final
      await fileUtils.saveFile(processedData, fullPath);

      // Limpiar temporales
      await fileUtils.deleteFile(tempInput);
      await fileUtils.deleteFile(tempOutput);

      break;
    }

    case "audio": {
      // Similar a video pero sin dimensiones
      const tempDir = "temp";
      await fileUtils.ensureDir(tempDir);
      const tempInput = `${tempDir}/input_${Date.now()}`;
      const tempOutput = `${tempDir}/output_${Date.now()}.webm`;

      await fileUtils.saveFile(input.data, tempInput);

      const audioInfo = await videoProcessor.convertAudioToWebM(
        tempInput,
        tempOutput,
      );

      processedData = await fileUtils.readFile(tempOutput);
      duration = audioInfo.duration;
      finalMimeType = "audio/webm";

      await fileUtils.saveFile(processedData, fullPath);

      await fileUtils.deleteFile(tempInput);
      await fileUtils.deleteFile(tempOutput);

      break;
    }

    case "document": {
      const tempDir = "temp";
      await fileUtils.ensureDir(tempDir);
      const tempInput = `${tempDir}/input_${Date.now()}`;

      const processed = await documentProcessor.processDocument(
        input.data,
        input.mimeType,
        tempInput,
        tempDir,
      );

      processedData = processed.data;
      finalMimeType = "application/pdf";

      await fileUtils.saveFile(processedData, fullPath);

      break;
    }
  }

  // 7. Guardar en base de datos
  const [newMedia] = await db.insert(media).values({
    filename: uniqueFilename,
    originalFilename: sanitizedName,
    mimeType: finalMimeType,
    size: processedData.length,
    hash,
    path: relativePath,
    url,
    storageProvider: "local",
    type: mediaType,
    width,
    height,
    duration,
    uploadedBy: input.uploadedBy,
  }).returning();

  // 8. Guardar tamaños de imagen si corresponde
  if (mediaType === "image") {
    const sizes = generatedImageSizes ??
      await imageProcessor.generateImageSizes(input.data);

    for (const [sizeName, sizeData] of sizes.entries()) {
      const sizeFilename = uniqueFilename.replace(
        processedExtension,
        `-${sizeName}${processedExtension}`,
      );
      const sizePath = `${uploadPath}/${sizeFilename}`;
      const sizeUrl = `/${sizePath}`;

      await db.insert(mediaSizes).values({
        mediaId: newMedia.id,
        size: sizeName,
        width: sizeData.width,
        height: sizeData.height,
        path: sizePath,
        url: sizeUrl,
        fileSize: sizeData.size,
      });
    }
  }

  // 9. Guardar SEO si se proporcionó
  if (input.seo) {
    await db.insert(mediaSeo).values({
      mediaId: newMedia.id,
      ...input.seo,
    });
  }

  return newMedia;
}

/**
 * Obtiene un medio por ID con todos sus tamaños y SEO
 */
export async function getMediaById(id: number): Promise<MediaWithSizes | null> {
  const mediaData = await db.query.media.findFirst({
    where: eq(media.id, id),
    with: {
      sizes: true,
      seo: true,
      uploadedBy: {
        columns: {
          password: false,
        },
      },
    },
  });

  if (!mediaData) return null;

  const seo = mediaData.seo
    ? {
      alt: mediaData.seo.alt ?? undefined,
      title: mediaData.seo.title ?? undefined,
      caption: mediaData.seo.caption ?? undefined,
      description: mediaData.seo.description ?? undefined,
    }
    : undefined;

  return {
    media: mediaData,
    sizes: mediaData.sizes.map((s) => ({
      size: s.size,
      width: s.width,
      height: s.height,
      url: s.url,
      fileSize: s.fileSize,
    })),
    seo,
  };
}

/**
 * Lista medios con paginación
 */
export async function listMedia(
  limit: number = 20,
  offset: number = 0,
  type?: string,
) {
  let query = db.query.media.findMany({
    limit,
    offset,
    orderBy: (media, { desc }) => [desc(media.createdAt)],
    with: {
      uploadedBy: {
        columns: {
          password: false,
        },
      },
    },
  });

  // TODO: Filtrar por tipo si se especifica

  return await query;
}

/**
 * Elimina un medio
 */
export async function deleteMedia(id: number): Promise<void> {
  const mediaData = await getMediaById(id);

  if (!mediaData) {
    throw new Error("Media no encontrado");
  }

  // Eliminar archivos físicos
  try {
    await fileUtils.deleteFile(mediaData.media.path);

    // Eliminar tamaños de imagen
    for (const size of mediaData.sizes) {
      await fileUtils.deleteFile(size.url.replace(BASE_URL + "/", ""));
    }
  } catch (error) {
    console.error("Error eliminando archivos:", error);
  }

  // Eliminar de base de datos (cascade eliminará sizes y seo)
  await db.delete(media).where(eq(media.id, id));
}

/**
 * Actualiza SEO de un medio
 */
export async function updateMediaSeo(
  id: number,
  seoData: {
    alt?: string;
    title?: string;
    caption?: string;
    description?: string;
    focusKeyword?: string;
    credits?: string;
    copyright?: string;
  },
) {
  const existing = await db.query.mediaSeo.findFirst({
    where: eq(mediaSeo.mediaId, id),
  });

  if (existing) {
    await db
      .update(mediaSeo)
      .set({
        ...seoData,
        updatedAt: new Date(),
      })
      .where(eq(mediaSeo.mediaId, id));
  } else {
    await db.insert(mediaSeo).values({
      mediaId: id,
      ...seoData,
    });
  }
}
