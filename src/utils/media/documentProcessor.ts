/**
 * Procesamiento de documentos
 * Convierte documentos de texto a PDF y elimina metadatos
 */

export interface ProcessedDocument {
  data: Uint8Array;
  size: number;
  pages?: number;
}

/**
 * Verifica si LibreOffice está instalado (para conversión de documentos)
 */
export async function checkLibreOffice(): Promise<boolean> {
  try {
    const command = new Deno.Command("libreoffice", {
      args: ["--version"],
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
 * Convierte un documento de Office a PDF
 * Soporta: .doc, .docx, .txt, .odt, .xls, .xlsx, .ods
 */
export async function convertToPDF(
  inputPath: string,
  outputDir: string
): Promise<string> {
  const hasLibreOffice = await checkLibreOffice();
  if (!hasLibreOffice) {
    throw new Error(
      "LibreOffice no está instalado. Instálalo con: sudo apt install libreoffice"
    );
  }

  // Usar LibreOffice en modo headless para convertir a PDF
  const command = new Deno.Command("libreoffice", {
    args: [
      "--headless",
      "--convert-to",
      "pdf",
      "--outdir",
      outputDir,
      inputPath,
    ],
    stdout: "piped",
    stderr: "piped",
  });

  const { success, stderr } = await command.output();

  if (!success) {
    const errorText = new TextDecoder().decode(stderr);
    throw new Error(`Error convirtiendo documento: ${errorText}`);
  }

  // El archivo de salida tendrá el mismo nombre pero con extensión .pdf
  const inputFilename = inputPath.substring(inputPath.lastIndexOf("/") + 1);
  const outputFilename = inputFilename.replace(/\.[^.]+$/, ".pdf");
  return `${outputDir}/${outputFilename}`;
}

/**
 * Elimina metadatos de un PDF usando exiftool
 */
export async function stripPDFMetadata(pdfPath: string): Promise<void> {
  // Verificar si exiftool está instalado
  const hasExifTool = await checkExifTool();

  if (hasExifTool) {
    // Usar exiftool para eliminar metadatos
    const command = new Deno.Command("exiftool", {
      args: [
        "-all=", // Eliminar todos los metadatos
        "-overwrite_original",
        pdfPath,
      ],
      stdout: "piped",
      stderr: "piped",
    });

    await command.output();
  }

  // Si no está disponible exiftool, el PDF se mantendrá sin procesar metadatos
  // En producción, considera usar una librería de Deno para manipular PDFs
}

/**
 * Verifica si exiftool está instalado
 */
async function checkExifTool(): Promise<boolean> {
  try {
    const command = new Deno.Command("exiftool", {
      args: ["-ver"],
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
 * Procesa un documento: convierte a PDF si es necesario y limpia metadatos
 */
export async function processDocument(
  data: Uint8Array,
  mimeType: string,
  tempInputPath: string,
  tempOutputDir: string
): Promise<ProcessedDocument> {
  // Guardar archivo temporal
  await Deno.writeFile(tempInputPath, data);

  let pdfPath: string;

  if (mimeType === "application/pdf") {
    // Ya es PDF, solo limpiar metadatos
    pdfPath = tempInputPath;
  } else {
    // Convertir a PDF
    pdfPath = await convertToPDF(tempInputPath, tempOutputDir);
  }

  // Limpiar metadatos
  await stripPDFMetadata(pdfPath);

  // Leer PDF procesado
  const processedData = await Deno.readFile(pdfPath);

  // Obtener info del PDF
  const pages = await getPDFPageCount(pdfPath);

  // Limpiar archivos temporales
  try {
    if (tempInputPath !== pdfPath) {
      await Deno.remove(tempInputPath);
    }
  } catch {
    // Ignorar errores de limpieza
  }

  return {
    data: processedData,
    size: processedData.length,
    pages,
  };
}

/**
 * Obtiene el número de páginas de un PDF
 */
export async function getPDFPageCount(pdfPath: string): Promise<number> {
  try {
    // Usar pdfinfo si está disponible
    const command = new Deno.Command("pdfinfo", {
      args: [pdfPath],
      stdout: "piped",
      stderr: "piped",
    });

    const { success, stdout } = await command.output();

    if (success) {
      const output = new TextDecoder().decode(stdout);
      const match = output.match(/Pages:\s+(\d+)/);
      if (match) {
        return parseInt(match[1]);
      }
    }
  } catch {
    // pdfinfo no disponible
  }

  // Si no se puede determinar, retornar 0
  return 0;
}

/**
 * Valida que un archivo sea un PDF válido
 */
export async function validatePDF(data: Uint8Array): Promise<boolean> {
  // Un PDF válido debe comenzar con %PDF-
  const header = new TextDecoder().decode(data.slice(0, 5));
  return header === "%PDF-";
}
