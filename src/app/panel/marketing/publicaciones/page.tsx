"use client";

import { useState, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { promocionesService, type CreatePromocionDto } from "@/lib/services/marketing";
import { toast } from "sonner";
import { Upload, X, ImageIcon } from "lucide-react";
import type { Promotion } from "@/types";

const empty: CreatePromocionDto = {
  title: "",
  image_url: "",
  destination_url: "",
  status: "inactive",
  starts_at: "",
  ends_at: "",
};

// ── Image uploader ─────────────────────────────────────────────────────────────
function ImageUploader({ value, onChange }: { value: string; onChange: (url: string) => void }) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);

  const handleFile = (file: File) => {
    if (!file.type.startsWith("image/")) { toast.error("Selecciona un archivo de imagen"); return; }
    if (file.size > 5 * 1024 * 1024) { toast.error("La imagen no debe superar 5 MB"); return; }
    const reader = new FileReader();
    reader.onload = (e) => onChange((e.target?.result as string) ?? "");
    reader.readAsDataURL(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  };

  return (
    <div className="space-y-2">
      <label className="text-sm font-medium text-gray-700">Imagen de la publicación *</label>

      {value ? (
        <div className="relative rounded-xl overflow-hidden border border-gray-200 group">
          <img src={value} alt="Vista previa" className="w-full object-cover" style={{ aspectRatio: "3/1" }} />
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
              onClick={() => onChange("")}
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
          className={`relative border-2 border-dashed rounded-xl cursor-pointer transition-all flex flex-col items-center justify-center gap-3 text-sm py-8
            ${dragging ? "border-[#2B55A3] bg-[#2B55A3]/5" : "border-gray-300 hover:border-[#2B55A3]/50 hover:bg-gray-50"}`}
        >
          <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center">
            <ImageIcon size={18} className="text-gray-400" />
          </div>
          <div className="text-center">
            <p className="font-medium text-gray-600">Arrastra aquí o haz clic para subir</p>
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

      {/* URL alternativa */}
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
        className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#2B55A3]/30"
      />
    </div>
  );
}

// ── Página principal ───────────────────────────────────────────────────────────
export default function PublicacionesPage() {
  const queryClient = useQueryClient();
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<Promotion | null>(null);
  const [form, setForm] = useState<CreatePromocionDto>(empty);
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);

  const { data: promociones, isLoading, isError } = useQuery({
    queryKey: ["promociones"],
    queryFn: promocionesService.list,
  });

  const createMutation = useMutation({
    mutationFn: promocionesService.create,
    onSuccess: () => { toast.success("Publicación creada"); queryClient.invalidateQueries({ queryKey: ["promociones"] }); closeModal(); },
    onError: (err: unknown) => toast.error((err as { response?: { data?: { message?: string } } })?.response?.data?.message ?? "Error al crear"),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<CreatePromocionDto> }) => promocionesService.update(id, data),
    onSuccess: () => { toast.success("Publicación actualizada"); queryClient.invalidateQueries({ queryKey: ["promociones"] }); closeModal(); },
    onError: (err: unknown) => toast.error((err as { response?: { data?: { message?: string } } })?.response?.data?.message ?? "Error al actualizar"),
  });

  const deleteMutation = useMutation({
    mutationFn: promocionesService.delete,
    onSuccess: () => { toast.success("Publicación eliminada"); queryClient.invalidateQueries({ queryKey: ["promociones"] }); setConfirmDelete(null); },
    onError: (err: unknown) => { toast.error((err as { response?: { data?: { message?: string } } })?.response?.data?.message ?? "Error"); setConfirmDelete(null); },
  });

  const toggleStatus = (p: Promotion) =>
    updateMutation.mutate({ id: p.id, data: { status: p.status === "active" ? "inactive" : "active" } });

  const openCreate = () => { setEditing(null); setForm(empty); setShowModal(true); };
  const openEdit = (p: Promotion) => {
    setEditing(p);
    setForm({ title: p.title, image_url: p.image_url, destination_url: p.destination_url, status: p.status, starts_at: p.starts_at, ends_at: p.ends_at });
    setShowModal(true);
  };
  const closeModal = () => { setShowModal(false); setEditing(null); setForm(empty); };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const payload = { ...form, starts_at: form.starts_at || undefined, ends_at: form.ends_at || undefined };
    if (editing) updateMutation.mutate({ id: editing.id, data: payload });
    else createMutation.mutate(payload);
  };

  const isPending = createMutation.isPending || updateMutation.isPending;

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Publicaciones</h1>
          <p className="text-gray-500 text-sm">Banners promocionales visibles en el homepage</p>
        </div>
        <button onClick={openCreate} className="bg-[#2B55A3] text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-[#2B55A3]/90">
          + Nueva publicación
        </button>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        {isLoading ? (
          <div className="p-8 text-center text-gray-400 text-sm">Cargando...</div>
        ) : isError ? (
          <div className="p-8 text-center text-red-500 text-sm">Error al cargar publicaciones</div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="text-left px-4 py-3 text-gray-600 font-medium">Publicación</th>
                <th className="text-left px-4 py-3 text-gray-600 font-medium">Destino</th>
                <th className="text-left px-4 py-3 text-gray-600 font-medium">Vigencia</th>
                <th className="text-left px-4 py-3 text-gray-600 font-medium">Estado</th>
                <th className="text-right px-4 py-3 text-gray-600 font-medium">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {promociones?.length === 0 ? (
                <tr><td colSpan={5} className="text-center py-8 text-gray-400">Sin publicaciones</td></tr>
              ) : (
                promociones?.map((p) => (
                  <tr key={p.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        {p.image_url ? (
                          <img src={p.image_url} alt="" className="w-20 h-12 rounded-lg object-cover bg-gray-100 flex-shrink-0" />
                        ) : (
                          <div className="w-20 h-12 rounded-lg bg-gray-100 flex items-center justify-center flex-shrink-0">
                            <ImageIcon size={16} className="text-gray-400" />
                          </div>
                        )}
                        <span className="font-medium text-gray-900">{p.title}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-gray-500 max-w-xs truncate text-xs">{p.destination_url ?? "—"}</td>
                    <td className="px-4 py-3 text-gray-500 text-xs whitespace-nowrap">
                      {p.starts_at ? new Date(p.starts_at).toLocaleDateString("es-PE") : "—"}
                      {" → "}
                      {p.ends_at ? new Date(p.ends_at).toLocaleDateString("es-PE") : "Sin límite"}
                    </td>
                    <td className="px-4 py-3">
                      <button
                        onClick={() => toggleStatus(p)}
                        className={`text-xs px-2 py-1 rounded-full transition-colors ${
                          p.status === "active" ? "bg-green-50 text-green-700 hover:bg-green-100" : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                        }`}
                      >
                        {p.status === "active" ? "Activa" : "Inactiva"}
                      </button>
                    </td>
                    <td className="px-4 py-3 text-right space-x-3">
                      <button onClick={() => openEdit(p)} className="text-[#2B55A3] hover:underline text-xs">Editar</button>
                      <button onClick={() => setConfirmDelete(p.id)} className="text-red-500 hover:underline text-xs">Eliminar</button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        )}
      </div>

      {/* Modal crear/editar */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl w-full max-w-md shadow-xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 sticky top-0 bg-white z-10">
              <h2 className="font-semibold text-gray-900">{editing ? "Editar publicación" : "Nueva publicación"}</h2>
              <button onClick={closeModal} className="text-gray-400 hover:text-gray-600 text-xl leading-none">&times;</button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              {/* Título */}
              <div className="space-y-1">
                <label className="text-sm font-medium text-gray-700">Título interno *</label>
                <input
                  required
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#2B55A3]/30"
                  placeholder="Ej: Banner Verano 2025"
                />
              </div>

              {/* Image uploader */}
              <ImageUploader
                value={form.image_url ?? ""}
                onChange={(url) => setForm({ ...form, image_url: url })}
              />

              {/* Link destino */}
              <div className="space-y-1">
                <label className="text-sm font-medium text-gray-700">Link de destino</label>
                <input
                  type="url"
                  value={form.destination_url ?? ""}
                  onChange={(e) => setForm({ ...form, destination_url: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none"
                  placeholder="https://..."
                />
              </div>

              {/* Fechas */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-sm font-medium text-gray-700">Inicio</label>
                  <input
                    type="datetime-local"
                    value={form.starts_at ?? ""}
                    onChange={(e) => setForm({ ...form, starts_at: e.target.value })}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-sm font-medium text-gray-700">Fin</label>
                  <input
                    type="datetime-local"
                    value={form.ends_at ?? ""}
                    onChange={(e) => setForm({ ...form, ends_at: e.target.value })}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none"
                  />
                </div>
              </div>

              {/* Estado */}
              <div className="space-y-1">
                <label className="text-sm font-medium text-gray-700">Estado</label>
                <select
                  value={form.status}
                  onChange={(e) => setForm({ ...form, status: e.target.value as "active" | "inactive" })}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none"
                >
                  <option value="inactive">Inactiva</option>
                  <option value="active">Activa</option>
                </select>
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button type="button" onClick={closeModal} className="px-4 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-50">
                  Cancelar
                </button>
                <button type="submit" disabled={isPending} className="px-4 py-2 text-sm bg-[#2B55A3] text-white rounded-lg hover:bg-[#2B55A3]/90 disabled:opacity-50">
                  {isPending ? "Guardando..." : editing ? "Guardar" : "Crear"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Confirm delete */}
      {confirmDelete && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-sm shadow-xl">
            <h2 className="font-semibold text-gray-900 mb-2">¿Eliminar esta publicación?</h2>
            <p className="text-sm text-gray-500 mb-4">Esta acción no se puede deshacer.</p>
            <div className="flex justify-end gap-3">
              <button onClick={() => setConfirmDelete(null)} className="px-4 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-50">Cancelar</button>
              <button onClick={() => deleteMutation.mutate(confirmDelete)} disabled={deleteMutation.isPending} className="px-4 py-2 text-sm bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50">
                {deleteMutation.isPending ? "Eliminando..." : "Eliminar"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
