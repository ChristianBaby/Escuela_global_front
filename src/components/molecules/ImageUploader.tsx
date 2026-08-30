"use client";

import { useRef, useState } from "react";
import { toast } from "sonner";
import { Upload, X, ImageIcon } from "lucide-react";

// ── Image uploader reutilizable — arrastrar/soltar, click, o pegar una URL ──────
export function ImageUploader({
  value,
  preview,
  onChange,
  onFileSelect,
  aspectRatio = "16/9",
  label = "Imagen",
  hint,
}: {
  value: string;
  preview?: string;
  onChange: (url: string) => void;
  onFileSelect?: (file: File) => void;
  aspectRatio?: string;
  label?: string;
  /** Texto de ayuda debajo del label — ej. el tamaño de imagen recomendado para esta zona */
  hint?: string;
}) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);

  const handleFile = (file: File) => {
    if (!file.type.startsWith("image/")) { toast.error("Selecciona un archivo de imagen"); return; }
    if (file.size > 5 * 1024 * 1024) { toast.error("La imagen no debe superar 5 MB"); return; }
    if (onFileSelect) {
      onFileSelect(file);
    } else {
      const reader = new FileReader();
      reader.onload = (e) => onChange((e.target?.result as string) ?? "");
      reader.readAsDataURL(file);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  };

  const displayPreview = preview || value;

  return (
    <div className="space-y-2">
      <div>
        <label className="text-sm font-medium text-gray-700">{label}</label>
        {hint && <p className="text-xs text-gray-400">{hint}</p>}
      </div>

      {displayPreview ? (
        <div className="relative rounded-xl overflow-hidden border border-gray-200 group">
          <img
            src={displayPreview}
            alt="Vista previa"
            className="w-full object-cover"
            style={{ aspectRatio }}
          />
          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-colors flex items-center justify-center gap-3 opacity-0 group-hover:opacity-100">
            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              className="bg-white text-gray-800 rounded-lg px-3 py-1.5 text-xs font-medium flex items-center gap-1.5 hover:bg-gray-100"
            >
              <Upload size={12} /> Cambiar
            </button>
            <button
              type="button"
              onClick={() => { onChange(""); onFileSelect?.(null as unknown as File); }}
              className="bg-red-500 text-white rounded-lg px-3 py-1.5 text-xs font-medium flex items-center gap-1.5 hover:bg-red-600"
            >
              <X size={12} /> Quitar
            </button>
          </div>
        </div>
      ) : (
        <div
          onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
          onDragLeave={() => setDragging(false)}
          onDrop={handleDrop}
          onClick={() => fileRef.current?.click()}
          className={`relative border-2 border-dashed rounded-xl cursor-pointer transition-all flex flex-col items-center justify-center gap-3 text-sm
            ${dragging ? "border-[#084D95] bg-[#084D95]/5" : "border-gray-300 hover:border-[#084D95]/50 hover:bg-gray-50"}`}
          style={{ aspectRatio, minHeight: "120px" }}
        >
          <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center">
            <ImageIcon size={18} className="text-gray-400" />
          </div>
          <div className="text-center">
            <p className="font-medium text-gray-600">Arrastra aquí o haz clic</p>
            <p className="text-xs text-gray-400 mt-0.5">PNG, JPG, WEBP · máx. 5 MB</p>
          </div>
        </div>
      )}

      <input
        ref={fileRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f); e.target.value = ""; }}
      />

      {!onFileSelect && (
        <>
          <div className="flex items-center gap-2">
            <div className="h-px flex-1 bg-gray-200" />
            <span className="text-xs text-gray-400">o pega una URL</span>
            <div className="h-px flex-1 bg-gray-200" />
          </div>
          <input
            type="url"
            placeholder="https://..."
            value={value.startsWith("data:") ? "" : value}
            onChange={(e) => onChange(e.target.value)}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#084D95]/30"
          />
        </>
      )}
    </div>
  );
}
