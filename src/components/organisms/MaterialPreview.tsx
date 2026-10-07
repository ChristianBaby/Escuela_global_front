"use client";

import { useQuery } from "@tanstack/react-query";
import { AlertTriangle, ExternalLink, Loader2 } from "lucide-react";
import { cursosService } from "@/lib/services/courses";
import type { DriveLinkInspection } from "@/lib/services/courses/courses.service";

type PreviewSource =
  | { kind: "iframe"; src: string; video: boolean; google: boolean }
  | { kind: "image"; src: string }
  | { kind: "unsupported" };

const IMAGE_FILE = /\.(png|jpe?g|gif|webp|svg)$/i;
const DOCUMENT_FILE = /\.(pdf|docx?|xlsx?|pptx?)$/i;

function youtubeVideoId(url: URL, host: string): string | null {
  if (host === "youtu.be") return url.pathname.slice(1).split("/")[0] || null;
  if (host === "youtube.com" || host === "m.youtube.com") {
    const fromQuery = url.searchParams.get("v");
    if (fromQuery) return fromQuery;
    const fromPath = url.pathname.match(/^\/(?:embed|shorts|live)\/([\w-]+)/);
    return fromPath?.[1] ?? null;
  }
  return null;
}

/**
 * Traduce el enlace guardado en el material a una URL que se pueda incrustar.
 * Drive, Docs, Sheets y Slides exponen un visor "/preview"; un PDF u Office
 * alojado en cualquier otra web se muestra con el visor público de Google.
 * Cualquier otra página web casi siempre bloquea ser incrustada, así que se
 * marca como no previsualizable en vez de mostrar un iframe en blanco.
 */
export function resolvePreview(rawUrl: string, isVideo: boolean): PreviewSource {
  let url: URL;
  try {
    url = new URL(rawUrl.trim());
  } catch {
    return { kind: "unsupported" };
  }

  const host = url.hostname.replace(/^www\./, "");
  const path = url.pathname;

  if (host === "drive.google.com") {
    const folder = path.match(/\/drive\/(?:u\/\d+\/)?folders\/([\w-]+)/);
    if (folder) {
      return {
        kind: "iframe",
        src: `https://drive.google.com/embeddedfolderview?id=${folder[1]}#list`,
        video: false,
        google: true,
      };
    }
    const fileId = path.match(/\/file\/(?:u\/\d+\/)?d\/([\w-]+)/)?.[1] ?? url.searchParams.get("id");
    if (fileId) {
      return {
        kind: "iframe",
        src: `https://drive.google.com/file/d/${fileId}/preview`,
        video: isVideo,
        google: true,
      };
    }
  }

  if (host === "docs.google.com") {
    const doc = path.match(/^\/(document|spreadsheets|presentation)\/(?:u\/\d+\/)?d\/([\w-]+)/);
    if (doc) {
      return {
        kind: "iframe",
        src: `https://docs.google.com/${doc[1]}/d/${doc[2]}/preview`,
        video: false,
        google: true,
      };
    }
  }

  const youtubeId = youtubeVideoId(url, host);
  if (youtubeId) {
    return { kind: "iframe", src: `https://www.youtube.com/embed/${youtubeId}`, video: true, google: false };
  }

  if (IMAGE_FILE.test(path)) return { kind: "image", src: url.toString() };

  if (DOCUMENT_FILE.test(path)) {
    return {
      kind: "iframe",
      src: `https://docs.google.com/viewer?url=${encodeURIComponent(url.toString())}&embedded=true`,
      video: false,
      google: false,
    };
  }

  return { kind: "unsupported" };
}

/**
 * Mensaje para un enlace de Drive que no se va a ver bien dentro de la
 * plataforma, o null si no hay problema. Lo reutiliza el panel de soporte
 * para avisar antes de guardar el material.
 */
export function driveLinkWarning(inspection: DriveLinkInspection): string | null {
  if (inspection.provider !== "google") return null;
  if (inspection.access === "private") {
    return 'Este archivo es privado en Google Drive, por eso no se puede mostrar aquí. Debe compartirse como "Cualquier persona con el enlace" (Lector).';
  }
  if (inspection.access === "not_found") {
    return "No se encontró el archivo en Google Drive. Revisa que el enlace sea correcto y que el archivo no se haya eliminado.";
  }
  if (inspection.kind === "folder") {
    return "El enlace es una carpeta, no un archivo: se verá la lista de archivos y, al abrir uno, Drive lo abrirá en otra pestaña. Usa el enlace del archivo para verlo dentro de la plataforma.";
  }
  return null;
}

export const driveCheckQueryKey = (url: string) => ["drive-check", url] as const;

interface MaterialPreviewProps {
  url: string;
  title?: string;
  /** Para un archivo de Drive sin forma de saber si es video: fuerza proporción 16:9. */
  isVideo?: boolean;
}

function OpenInNewTab({ url, label }: { url: string; label: string }) {
  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      className="inline-flex items-center gap-1 text-[#084D95] hover:underline"
    >
      {label}
      <ExternalLink size={12} />
    </a>
  );
}

function PreviewNotice({ url, message }: { url: string; message: string }) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
      <span className="flex items-start gap-2">
        <AlertTriangle size={16} className="shrink-0 mt-0.5" />
        {message}
      </span>
      <span className="shrink-0">
        <OpenInNewTab url={url} label="Abrir en una pestaña nueva" />
      </span>
    </div>
  );
}

/**
 * Vista previa incrustada de un material. Drive no expone eventos desde su
 * iframe, así que este componente no reporta progreso de visualización.
 */
export function MaterialPreview({ url, title, isVideo = false }: MaterialPreviewProps) {
  const source = resolvePreview(url, isVideo);
  const isGoogle = source.kind === "iframe" && source.google;

  // Un archivo privado de Drive hace que Google muestre su pantalla de login
  // dentro del iframe (y la abra en otra ventana): se consulta antes para
  // mostrar un aviso claro en su lugar.
  const { data: inspection, isLoading } = useQuery({
    queryKey: driveCheckQueryKey(url),
    queryFn: () => cursosService.checkDriveLink(url),
    enabled: isGoogle,
    staleTime: 5 * 60 * 1000,
    retry: false,
  });

  if (source.kind === "unsupported") {
    return (
      <PreviewNotice url={url} message="Este enlace no admite vista previa dentro de la plataforma." />
    );
  }

  if (isGoogle && isLoading) {
    return (
      <div className="flex items-center justify-center gap-2 h-40 rounded-lg border border-gray-200 bg-gray-50 text-sm text-gray-400">
        <Loader2 size={16} className="animate-spin" />
        Cargando vista previa...
      </div>
    );
  }

  const warning = inspection ? driveLinkWarning(inspection) : null;
  if (inspection && (inspection.access === "private" || inspection.access === "not_found")) {
    return <PreviewNotice url={url} message={warning!} />;
  }

  return (
    <div className="space-y-2">
      {source.kind === "image" ? (
        // eslint-disable-next-line @next/next/no-img-element -- origen arbitrario, no pasa por next/image
        <img
          src={source.src}
          alt={title ?? "Vista previa"}
          className="max-h-[70vh] w-auto mx-auto rounded-lg border border-gray-200"
        />
      ) : (
        <div
          className={`w-full rounded-lg overflow-hidden border border-gray-200 ${
            source.video ? "aspect-video bg-black" : "h-[70vh] bg-gray-100"
          }`}
        >
          <iframe
            src={source.src}
            title={title ?? "Vista previa"}
            className="w-full h-full"
            allow="autoplay; fullscreen; encrypted-media; picture-in-picture"
            allowFullScreen
            loading="lazy"
          />
        </div>
      )}
      {warning ? (
        <p className="flex items-start gap-1.5 text-xs text-amber-700">
          <AlertTriangle size={13} className="shrink-0 mt-0.5" />
          {warning}
        </p>
      ) : (
        <p className="text-xs text-gray-400">
          ¿No se ve el archivo? <OpenInNewTab url={url} label="Abrir en una pestaña nueva" />
        </p>
      )}
    </div>
  );
}
