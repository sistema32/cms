/**
 * Procesamiento de video y audio usando FFmpeg
 * NOTA: Requiere FFmpeg instalado en el sistema
 */

export interface VideoInfo {
  width: number;
  height: number;
  duration: number; // en segundos
  bitrate: number;
}

export interface ProcessedVideo {
  data: Uint8Array;
  width: number;
  height: number;
  duration: number;
  size: number;
}

/**
 * Verifica si FFmpeg está instalado
 */
export async function checkFFmpeg(): Promise<boolean> {
  try {
    const command = new Deno.Command("ffmpeg", {
      args: ["-version"],
      stdout: "piped",
      stderr: "piped",
    });
    const { success } = await command.output();
    return success;
  } catch {
    return false;
  }
}

/**
 * Convierte video a WebM con optimización
 * Elimina metadatos automáticamente
 */
export async function convertVideoToWebM(
  inputPath: string,
  outputPath: string
): Promise<VideoInfo> {
  const hasFFmpeg = await checkFFmpeg();
  if (!hasFFmpeg) {
    throw new Error(
      "FFmpeg no está instalado. Instálalo con: sudo apt install ffmpeg"
    );
  }

  // Comando FFmpeg para convertir a WebM VP9
  // -map_metadata -1: Elimina todos los metadatos
  // -c:v libvpx-vp9: Codec VP9
  // -crf 30: Calidad (0-63, menor = mejor calidad)
  // -b:v 0: Bitrate variable
  // -c:a libopus: Codec audio Opus
  const command = new Deno.Command("ffmpeg", {
    args: [
      "-i", inputPath,
      "-map_metadata", "-1", // Eliminar metadatos
      "-c:v", "libvpx-vp9",
      "-crf", "30",
      "-b:v", "0",
      "-c:a", "libopus",
      "-b:a", "128k",
      "-vf", "scale='min(1920,iw)':'min(1080,ih)':force_original_aspect_ratio=decrease", // Max 1080p
      "-y", // Sobrescribir si existe
      outputPath,
    ],
    stdout: "piped",
    stderr: "piped",
  });

  const { success, stderr } = await command.output();

  if (!success) {
    const errorText = new TextDecoder().decode(stderr);
    throw new Error(`Error convirtiendo video: ${errorText}`);
  }

  // Obtener información del video convertido
  return await getVideoInfo(outputPath);
}

/**
 * Convierte audio a WebM Opus
 * Elimina metadatos automáticamente
 */
export async function convertAudioToWebM(
  inputPath: string,
  outputPath: string
): Promise<{ duration: number; size: number }> {
  const hasFFmpeg = await checkFFmpeg();
  if (!hasFFmpeg) {
    throw new Error(
      "FFmpeg no está instalado. Instálalo con: sudo apt install ffmpeg"
    );
  }

  // Comando FFmpeg para convertir a WebM Opus
  const command = new Deno.Command("ffmpeg", {
    args: [
      "-i", inputPath,
      "-map_metadata", "-1", // Eliminar metadatos
      "-c:a", "libopus",
      "-b:a", "128k",
      "-vn", // Sin video
      "-y",
      outputPath,
    ],
    stdout: "piped",
    stderr: "piped",
  });

  const { success, stderr } = await command.output();

  if (!success) {
    const errorText = new TextDecoder().decode(stderr);
    throw new Error(`Error convirtiendo audio: ${errorText}`);
  }

  const info = await getVideoInfo(outputPath);
  const stats = await Deno.stat(outputPath);

  return {
    duration: info.duration,
    size: stats.size,
  };
}

/**
 * Obtiene información de un archivo de video/audio
 */
export async function getVideoInfo(filePath: string): Promise<VideoInfo> {
  const command = new Deno.Command("ffprobe", {
    args: [
      "-v", "quiet",
      "-print_format", "json",
      "-show_format",
      "-show_streams",
      filePath,
    ],
    stdout: "piped",
    stderr: "piped",
  });

  const { success, stdout, stderr } = await command.output();

  if (!success) {
    const errorText = new TextDecoder().decode(stderr);
    throw new Error(`Error obteniendo info del video: ${errorText}`);
  }

  const output = new TextDecoder().decode(stdout);
  const data = JSON.parse(output);

  // Buscar stream de video
  const videoStream = data.streams?.find((s: any) => s.codec_type === "video");

  const width = videoStream?.width || 0;
  const height = videoStream?.height || 0;
  const duration = parseFloat(data.format?.duration || "0");
  const bitrate = parseInt(data.format?.bit_rate || "0");

  return {
    width,
    height,
    duration,
    bitrate,
  };
}

/**
 * Genera thumbnail de un video
 */
export async function generateVideoThumbnail(
  videoPath: string,
  outputPath: string,
  timeSeconds: number = 1
): Promise<void> {
  const hasFFmpeg = await checkFFmpeg();
  if (!hasFFmpeg) {
    throw new Error("FFmpeg no está instalado");
  }

  const command = new Deno.Command("ffmpeg", {
    args: [
      "-i", videoPath,
      "-ss", timeSeconds.toString(),
      "-vframes", "1",
      "-vf", "scale=640:-1",
      "-y",
      outputPath,
    ],
    stdout: "piped",
    stderr: "piped",
  });

  const { success, stderr } = await command.output();

  if (!success) {
    const errorText = new TextDecoder().decode(stderr);
    throw new Error(`Error generando thumbnail: ${errorText}`);
  }
}
