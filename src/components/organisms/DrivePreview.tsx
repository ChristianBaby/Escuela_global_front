"use client";

import { ExternalLink } from "lucide-react";

// Formas comunes de URL de Google Drive:
//   https://drive.google.com/file/d/FILE_ID/view?usp=sharing
//   https://drive.google.com/open?id=FILE_ID
//   https://drive.google.com/uc?id=FILE_ID&export=download
function extractDriveFileId(url: string): string | null {
  const pathMatch = url.match(/\/file\/d\/([^/]+)/);
  if (pathMatch) return pathMatch[1];

  try {
    const parsed = new URL(url);
    const idParam = parsed.searchParams.get("id");
    if (idParam) return idParam;
  } catch {
    // URL inválida — cae al fallback de abajo
  }

  return null;
}

interface DrivePreviewProps {
  driveUrl: string;
  title?: string;
  /** "video" usa proporción 16:9; "document" usa un visor más alto, mejor para PDF/Word/Excel/imágenes. */
  aspect?: "video" | "document";
}

/**
 * Embebe un archivo de Google Drive con un iframe simple (vista previa de Drive) —
 * funciona para video, PDF, Word, Excel, imágenes y la mayoría de tipos que Drive
 * sabe previsualizar. A diferencia del reproductor de YouTube de las sesiones,
 * Drive no expone una API de eventos: no hay forma de detectar "video terminado"
 * ni watched_seconds desde este iframe, así que este componente no reporta progreso.
 */
export function DrivePreview({ driveUrl, title, aspect = "document" }: DrivePreviewProps) {
  const fileId = extractDriveFileId(driveUrl);

  if (!fileId) {
    return (
      <a
        href={driveUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="flex items-center gap-2 text-sm text-[#084D95] hover:underline"
      >
        {title ?? "Ver archivo"}
        <ExternalLink size={12} className="text-gray-400" />
      </a>
    );
  }

  return (
    <div className={`w-full bg-black rounded-lg overflow-hidden ${aspect === "video" ? "aspect-video" : "h-[70vh]"}`}>
      <iframe
        src={`https://drive.google.com/file/d/${fileId}/preview`}
        title={title ?? "Vista previa"}
        className="w-full h-full"
        allow="autoplay"
        allowFullScreen
      />
    </div>
  );
}
