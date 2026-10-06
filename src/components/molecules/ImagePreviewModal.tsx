"use client";

import { useEffect, useState, type ReactNode } from "react";
import { BookOpen, X } from "lucide-react";

interface ImagePreviewModalProps {
  title: string;
  thumbnailUrl?: string | null;
  /** Info extra bajo el título (categoría, precio, estado...) */
  details?: ReactNode;
  /** Aumento sobre el tamaño real de la imagen (1 = tal cual). Ej. 1.5 en el listado de cursos */
  scale?: number;
  onClose: () => void;
}

// Vista ampliada de un ítem de un listado (curso, lanzamiento...): imagen +
// nombre completo. En las tablas el nombre se corta y la miniatura es chica, así
// que se abre al hacer clic en el nombre o en la miniatura.
// La imagen se muestra tal cual, en su tamaño real (o con `scale` si se pide un
// poco más grande, sin estirarla tanto que se vea borrosa). Nunca se recorta; si
// no entra en la pantalla se achica.
export function ImagePreviewModal({ title, thumbnailUrl, details, scale = 1, onClose }: ImagePreviewModalProps) {
  const [naturalWidth, setNaturalWidth] = useState<number | null>(null);

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4"
      onClick={(e) => {
        e.stopPropagation();
        onClose();
      }}
    >
      <div
        className="relative bg-white rounded-xl w-fit min-w-72 max-w-[min(90vw,56rem)] shadow-xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          className="absolute top-2 right-2 p-1.5 rounded-full bg-white/90 text-gray-500 hover:text-gray-700 hover:bg-white shadow-sm transition-colors"
          title="Cerrar"
        >
          <X size={16} />
        </button>
        {thumbnailUrl ? (
          <img
            src={thumbnailUrl}
            alt={title}
            onLoad={(e) => setNaturalWidth(e.currentTarget.naturalWidth)}
            className="block mx-auto max-w-full max-h-[75vh] h-auto object-contain bg-gray-50"
            style={naturalWidth && scale !== 1 ? { width: naturalWidth * scale } : undefined}
          />
        ) : (
          <div className="w-full aspect-video bg-gray-100 flex items-center justify-center">
            <BookOpen size={40} className="text-gray-300" />
          </div>
        )}
        <div className="p-5">
          <h2 className="font-semibold text-brand-primary leading-snug break-words">{title}</h2>
          {details && <div className="text-sm text-gray-500 mt-2">{details}</div>}
        </div>
      </div>
    </div>
  );
}
