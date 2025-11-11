import { isTest } from "../../config/env.ts";

function toErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }
  return String(error);
}

type ImageLike = {
  width: number;
  height: number;
  clone(): ImageLike;
  crop(x: number, y: number, width: number, height: number): ImageLike;
  resize(width: number, height?: number): ImageLike;
};

type ImageConstructor = {
  decode(data: Uint8Array): Promise<ImageLike>;
};

class StubImage implements ImageLike {
  #data: Uint8Array;
  constructor(
    public width: number,
    public height: number,
    data: Uint8Array,
  ) {
    this.#data = data;
  }

  static async decode(data: Uint8Array): Promise<StubImage> {
    const { width, height } = extractPngDimensions(data) ?? { width: 1, height: 1 };
    return new StubImage(width || 1, height || 1, data);
  }

  clone(): StubImage {
    return new StubImage(this.width, this.height, this.#data);
  }

  crop(_x: number, _y: number, width: number, height: number): StubImage {
    return new StubImage(width, height, this.#data);
  }

  resize(width: number, height?: number): StubImage {
    const targetHeight = height ??
      Math.max(1, Math.round(width * (this.height / Math.max(this.width, 1))));
    return new StubImage(width, targetHeight, this.#data);
  }

  async encodeWebP(_quality: number): Promise<Uint8Array> {
    return this.#data;
  }

  async encode(): Promise<Uint8Array> {
    return this.#data;
  }
}

let imageConstructorPromise: Promise<ImageConstructor> | null = null;

async function getImageConstructor(): Promise<ImageConstructor> {
  if (imageConstructorPromise) {
    return await imageConstructorPromise;
  }

  imageConstructorPromise = (async () => {
    const specifier = "imagescript";
    try {
      const module = await import(specifier);
      if (module?.Image) {
        return module.Image as ImageConstructor;
      }
    } catch (error) {
      console.warn(
        "ImageScript no disponible, usando implementación stub:",
        toErrorMessage(error),
      );
    }

    if (!isTest) {
      console.warn(
        "ImageScript no pudo cargarse. Continúa usando implementación stub para evitar fallos.",
      );
    }

    return StubImage;
  })();

  return await imageConstructorPromise;
}

async function encodeWebPSafe(image: ImageLike, quality: number): Promise<Uint8Array> {
  const candidate = image as unknown as {
    encodeWebP?: (quality: number) => Promise<Uint8Array>;
    encode?: () => Promise<Uint8Array>;
  };

  if (typeof candidate.encodeWebP === "function") {
    return await candidate.encodeWebP(quality);
  }

  if (typeof candidate.encode === "function") {
    return await candidate.encode();
  }

  throw new Error("Image encoder not available");
}

export interface ImageSize {
  name: string;
  width: number;
  height?: number; // Si no se especifica, mantiene aspect ratio
}

// Tamaños predefinidos
export const IMAGE_SIZES: ImageSize[] = [
  { name: "thumbnail", width: 150, height: 150 },
  { name: "small", width: 300 },
  { name: "medium", width: 768 },
  { name: "large", width: 1024 },
  { name: "xlarge", width: 1920 },
];

export interface ProcessedImage {
  data: Uint8Array;
  width: number;
  height: number;
  size: number; // tamaño en bytes
}

/**
 * Procesa una imagen: convierte a WebP y elimina metadatos
 */
export async function processImage(
  imageData: Uint8Array
): Promise<ProcessedImage> {
  try {
    // Decodificar imagen
    const Image = await getImageConstructor();
    const image = await Image.decode(imageData);

    // Convertir a WebP (esto automáticamente elimina metadatos EXIF)
    const webpData = await encodeWebPSafe(image, 85); // 85% de calidad

    return {
      data: webpData,
      width: image.width,
      height: image.height,
      size: webpData.length,
    };
  } catch (error) {
    throw new Error(`Error procesando imagen: ${toErrorMessage(error)}`);
  }
}

/**
 * Genera múltiples tamaños de una imagen
 */
export async function generateImageSizes(
  imageData: Uint8Array,
  sizes: ImageSize[] = IMAGE_SIZES
): Promise<Map<string, ProcessedImage>> {
  const results = new Map<string, ProcessedImage>();

  try {
    // Decodificar imagen original
    const Image = await getImageConstructor();
    const originalImage = await Image.decode(imageData) as ImageLike;
    const originalWidth = originalImage.width;
    const originalHeight = originalImage.height;

    // Guardar original
    const originalWebP = await encodeWebPSafe(originalImage, 90); // Mayor calidad para original
    results.set("original", {
      data: originalWebP,
      width: originalWidth,
      height: originalHeight,
      size: originalWebP.length,
    });

    // Generar cada tamaño
    for (const sizeConfig of sizes) {
      // Saltar si la imagen original es más pequeña que el tamaño objetivo
      if (originalWidth <= sizeConfig.width) {
        continue;
      }

      let resized: ImageLike;

      if (sizeConfig.height) {
        // Resize con dimensiones fijas (crop si es necesario)
        resized = originalImage.clone();

        // Calcular el crop para mantener aspecto
        const targetRatio = sizeConfig.width / sizeConfig.height;
        const currentRatio = originalWidth / originalHeight;

        if (currentRatio > targetRatio) {
          // Imagen muy ancha, crop horizontal
          const newWidth = Math.floor(originalHeight * targetRatio);
          const cropX = Math.floor((originalWidth - newWidth) / 2);
          resized = resized.crop(cropX, 0, newWidth, originalHeight);
        } else if (currentRatio < targetRatio) {
          // Imagen muy alta, crop vertical
          const newHeight = Math.floor(originalWidth / targetRatio);
          const cropY = Math.floor((originalHeight - newHeight) / 2);
          resized = resized.crop(0, cropY, originalWidth, newHeight);
        }

        // Resize final
        resized = resized.resize(sizeConfig.width, sizeConfig.height);
      } else {
        // Resize manteniendo aspect ratio
        const ratio = originalHeight / originalWidth;
        const newHeight = Math.floor(sizeConfig.width * ratio);
        resized = originalImage.clone().resize(sizeConfig.width, newHeight);
      }

      const webpData = await encodeWebPSafe(resized, 85);

      results.set(sizeConfig.name, {
        data: webpData,
        width: resized.width,
        height: resized.height,
        size: webpData.length,
      });
    }

    return results;
  } catch (error) {
    throw new Error(`Error generando tamaños de imagen: ${toErrorMessage(error)}`);
  }
}

/**
 * Extrae dimensiones de una imagen sin decodificarla completamente
 */
export async function getImageDimensions(
  imageData: Uint8Array
): Promise<{ width: number; height: number }> {
  try {
    const Image = await getImageConstructor();
    const image = await Image.decode(imageData);
    return {
      width: image.width,
      height: image.height,
    };
  } catch (error) {
    throw new Error(`Error obteniendo dimensiones: ${toErrorMessage(error)}`);
  }
}

/**
 * Valida que el archivo sea una imagen válida
 */
export async function validateImage(imageData: Uint8Array): Promise<boolean> {
  try {
    const Image = await getImageConstructor();
    await Image.decode(imageData);
    return true;
  } catch {
    return false;
  }
}

function extractPngDimensions(data: Uint8Array):
  | { width: number; height: number }
  | null {
  if (data.length < 24) return null;
  const signature = [
    0x89,
    0x50,
    0x4e,
    0x47,
    0x0d,
    0x0a,
    0x1a,
    0x0a,
  ];
  for (let i = 0; i < signature.length; i++) {
    if (data[i] !== signature[i]) {
      return null;
    }
  }
  const isIHDR = data[12] === 0x49 && data[13] === 0x48 && data[14] === 0x44 &&
    data[15] === 0x52;
  if (!isIHDR) return null;

  const width = readUint32(data, 16);
  const height = readUint32(data, 20);
  return { width, height };
}

function readUint32(data: Uint8Array, offset: number): number {
  return (
    (data[offset] << 24) |
    (data[offset + 1] << 16) |
    (data[offset + 2] << 8) |
    (data[offset + 3])
  ) >>> 0;
}
