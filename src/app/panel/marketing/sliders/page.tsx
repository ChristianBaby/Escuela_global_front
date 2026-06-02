"use client";

import { useState, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { slidersService, type CreateSliderDto } from "@/lib/services/marketing";
import { cursosService } from "@/lib/services/courses";
import { toast } from "sonner";
import { Upload, X, ImageIcon } from "lucide-react";
import type { Slider } from "@/types";

const POSICIONES = [
  { value: "top", label: "Superior" },
  { value: "middle", label: "Medio" },
  { value: "bottom", label: "Inferior" },
];

const empty: CreateSliderDto = {
  title: "",
  subtitle: "",
  type: "banner",
  image_url: "",
  destination_url: "",
  contact_url: "",
  position_on_page: "top",
  status: "inactive",
  course_ids: [],
};

// ── Image uploader reutilizable ────────────────────────────────────────────────
function ImageUploader({
  value,
  preview,
  onChange,
  onFileSelect,
  aspectRatio = "16/9",
  label = "Imagen del slider",
}: {
  value: string;
  preview?: string;
  onChange: (url: string) => void;
  onFileSelect?: (file: File) => void;
  aspectRatio?: string;
  label?: string;
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
      <label className="text-sm font-medium text-gray-700">{label}</label>

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
            ${dragging ? "border-[#2B55A3] bg-[#2B55A3]/5" : "border-gray-300 hover:border-[#2B55A3]/50 hover:bg-gray-50"}`}
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
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#2B55A3]/30"
          />
        </>
      )}
    </div>
  );
}

// ── Página principal ───────────────────────────────────────────────────────────
export default function SlidersPage() {
  const queryClient = useQueryClient();
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<Slider | null>(null);
  const [form, setForm] = useState<CreateSliderDto>(empty);
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string>("");

  const { data: sliders, isLoading, isError } = useQuery({
    queryKey: ["sliders"],
    queryFn: slidersService.list,
  });

  const { data: cursosData } = useQuery({
    queryKey: ["cursos-activos"],
    queryFn: () => cursosService.list({ status: "published", limit: 100 }),
  });

  const createMutation = useMutation({
    mutationFn: slidersService.create,
    onSuccess: () => { toast.success("Slider creado"); queryClient.invalidateQueries({ queryKey: ["sliders"] }); closeModal(); },
    onError: (err: unknown) => toast.error((err as { response?: { data?: { message?: string } } })?.response?.data?.message ?? "Error"),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<CreateSliderDto> }) => slidersService.update(id, data),
    onSuccess: () => { toast.success("Slider actualizado"); queryClient.invalidateQueries({ queryKey: ["sliders"] }); closeModal(); },
    onError: (err: unknown) => toast.error((err as { response?: { data?: { message?: string } } })?.response?.data?.message ?? "Error"),
  });

  const deleteMutation = useMutation({
    mutationFn: slidersService.delete,
    onSuccess: () => { toast.success("Slider eliminado"); queryClient.invalidateQueries({ queryKey: ["sliders"] }); setConfirmDelete(null); },
    onError: (err: unknown) => { toast.error((err as { response?: { data?: { message?: string } } })?.response?.data?.message ?? "Error"); setConfirmDelete(null); },
  });

  const uploadMutation = useMutation({
    mutationFn: ({ id, file }: { id: string; file: File }) => slidersService.uploadImage(id, file),
    onError: (err: unknown) => toast.error((err as { response?: { data?: { message?: string } } })?.response?.data?.message ?? "Error subiendo imagen"),
  });

  const toggleStatus = (s: Slider) =>
    updateMutation.mutate({ id: s.id, data: { status: s.status === "active" ? "inactive" : "active" } });

  const toggleCurso = (id: string) => {
    const current = form.course_ids ?? [];
    if (current.length >= 10 && !current.includes(id)) { toast.warning("Máximo 10 cursos por slider"); return; }
    setForm({ ...form, course_ids: current.includes(id) ? current.filter((c) => c !== id) : [...current, id] });
  };

  const openCreate = () => { setEditing(null); setForm(empty); setShowModal(true); };
  const openEdit = (s: Slider) => {
    setEditing(s);
    setForm({
      title: s.title,
      subtitle: s.subtitle ?? "",
      type: s.type,
      image_url: s.image_url ?? "",
      destination_url: s.destination_url ?? "",
      contact_url: s.contact_url ?? "",
      position_on_page: s.position_on_page,
      status: s.status,
      course_ids: s.courses?.map((c) => c.id) ?? [],
    });
    setImageFile(null);
    setImagePreview(s.image_url ?? "");
    setShowModal(true);
  };
  const closeModal = () => {
    setShowModal(false);
    setEditing(null);
    setForm(empty);
    setImageFile(null);
    setImagePreview("");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      if (editing) {
        const finalData = { ...form };
        if (imageFile) {
          const result = await uploadMutation.mutateAsync({ id: editing.id, file: imageFile });
          finalData.image_url = result.image_url;
        }
        updateMutation.mutate({ id: editing.id, data: finalData });
      } else {
        const result = await createMutation.mutateAsync(form);
        if (imageFile) {
          const uploaded = await uploadMutation.mutateAsync({ id: result.id, file: imageFile });
          updateMutation.mutate({ id: result.id, data: { image_url: uploaded.image_url } });
        }
      }
    } catch {
    }
  };

  const isPending = createMutation.isPending || updateMutation.isPending || uploadMutation.isPending;

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Sliders</h1>
          <p className="text-gray-500 text-sm">Carruseles del homepage — hero y secciones</p>
        </div>
        <button onClick={openCreate} className="bg-[#2B55A3] text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-[#2B55A3]/90">
          + Nuevo slider
        </button>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        {isLoading ? (
          <div className="p-8 text-center text-gray-400 text-sm">Cargando...</div>
        ) : isError ? (
          <div className="p-8 text-center text-red-500 text-sm">Error al cargar sliders</div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="text-left px-4 py-3 text-gray-600 font-medium w-16">Vista</th>
                <th className="text-left px-4 py-3 text-gray-600 font-medium">Título</th>
                <th className="text-left px-4 py-3 text-gray-600 font-medium">Tipo</th>
                <th className="text-left px-4 py-3 text-gray-600 font-medium">Posición</th>
                <th className="text-left px-4 py-3 text-gray-600 font-medium">Estado</th>
                <th className="text-right px-4 py-3 text-gray-600 font-medium">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {sliders?.length === 0 ? (
                <tr><td colSpan={6} className="text-center py-8 text-gray-400">Sin sliders</td></tr>
              ) : (
                sliders?.map((s) => (
                  <tr key={s.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3">
                      {s.image_url ? (
                        <img src={s.image_url} alt="" className="w-16 h-10 object-cover rounded-lg bg-gray-100" />
                      ) : (
                        <div className="w-16 h-10 rounded-lg bg-gradient-to-br from-[#2B55A3]/20 to-[#3FB1E5]/20 flex items-center justify-center">
                          <ImageIcon size={14} className="text-[#2B55A3]/50" />
                        </div>
                      )}
                    </td>
                    <td className="px-4 py-3 font-medium text-gray-900">{s.title}</td>
                    <td className="px-4 py-3">
                      <span className="text-xs bg-purple-50 text-purple-700 px-2 py-1 rounded-full">
                        {s.type === "courses" ? "Cursos" : "Banner"}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-gray-500 capitalize">{POSICIONES.find((p) => p.value === s.position_on_page)?.label}</td>
                    <td className="px-4 py-3">
                      <button
                        onClick={() => toggleStatus(s)}
                        className={`text-xs px-2 py-1 rounded-full transition-colors ${
                          s.status === "active" ? "bg-green-50 text-green-700 hover:bg-green-100" : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                        }`}
                      >
                        {s.status === "active" ? "Activo" : "Inactivo"}
                      </button>
                    </td>
                    <td className="px-4 py-3 text-right space-x-3">
                      <button onClick={() => openEdit(s)} className="text-[#2B55A3] hover:underline text-xs">Editar</button>
                      <button onClick={() => setConfirmDelete(s.id)} className="text-red-500 hover:underline text-xs">Eliminar</button>
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
          <div className="bg-white rounded-xl w-full max-w-lg shadow-xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 sticky top-0 bg-white z-10">
              <h2 className="font-semibold text-gray-900">{editing ? "Editar slider" : "Nuevo slider"}</h2>
              <button onClick={closeModal} className="text-gray-400 hover:text-gray-600 text-xl leading-none">&times;</button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-5">
              {/* Título */}
              <div className="space-y-1">
                <label className="text-sm font-medium text-gray-700">Título del programa *</label>
                <input
                  required
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#2B55A3]/30"
                  placeholder="Ej: Derecho Laboral Avanzado"
                />
              </div>

              {/* Subtítulo */}
              <div className="space-y-1">
                <label className="text-sm font-medium text-gray-700">Subtítulo / descripción breve</label>
                <textarea
                  rows={2}
                  value={form.subtitle ?? ""}
                  onChange={(e) => setForm({ ...form, subtitle: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#2B55A3]/30 resize-none"
                  placeholder="Ej: Domina la legislación laboral con casos reales del sector."
                />
              </div>

              {/* Tipo + Posición */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-sm font-medium text-gray-700">Tipo *</label>
                  <select
                    value={form.type}
                    onChange={(e) => setForm({ ...form, type: e.target.value as "courses" | "banner", course_ids: [] })}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none"
                  >
                    <option value="courses">Cursos</option>
                    <option value="banner">Banner</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-sm font-medium text-gray-700">Posición *</label>
                  <select
                    value={form.position_on_page}
                    onChange={(e) => setForm({ ...form, position_on_page: e.target.value as "top" | "middle" | "bottom" })}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none"
                  >
                    {POSICIONES.map((p) => <option key={p.value} value={p.value}>{p.label}</option>)}
                  </select>
                </div>
              </div>

              {/* Campos según tipo */}
              {form.type === "banner" && (
                <>
                  <ImageUploader
                    label="Imagen del banner (fondo del slide)"
                    value={form.image_url ?? ""}
                    preview={imagePreview}
                    onChange={(url) => setForm({ ...form, image_url: url })}
                    onFileSelect={(file) => {
                      setImageFile(file);
                      setImagePreview(URL.createObjectURL(file));
                    }}
                    aspectRatio="16/5"
                  />

                  {/* Link asesor comercial (WhatsApp) */}
                  <div className="space-y-1">
                    <label className="text-sm font-medium text-gray-700">
                      Link al asesor comercial{" "}
                      <span className="text-xs text-gray-400 font-normal">(botón "Más Información")</span>
                    </label>
                    <input
                      type="url"
                      value={form.contact_url ?? ""}
                      onChange={(e) => setForm({ ...form, contact_url: e.target.value })}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#2B55A3]/30"
                      placeholder="https://wa.me/51999000111?text=Hola, me interesa..."
                    />
                    <p className="text-xs text-gray-400">Pega el link de WhatsApp del asesor asignado a este programa.</p>
                  </div>

                  {/* Link de destino (página del curso) */}
                  <div className="space-y-1">
                    <label className="text-sm font-medium text-gray-700">
                      Link de la página del curso{" "}
                      <span className="text-xs text-gray-400 font-normal">(opcional)</span>
                    </label>
                    <input
                      type="url"
                      value={form.destination_url ?? ""}
                      onChange={(e) => setForm({ ...form, destination_url: e.target.value })}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none"
                      placeholder="/cursos/nombre-del-curso"
                    />
                  </div>
                </>
              )}

              {form.type === "courses" && (
                <>
                  <div className="space-y-1">
                    <label className="text-sm font-medium text-gray-700">Link de destino</label>
                    <input
                      type="url"
                      value={form.destination_url ?? ""}
                      onChange={(e) => setForm({ ...form, destination_url: e.target.value })}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none"
                      placeholder="/cursos"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700">Cursos (máx. 10)</label>
                    <div className="border border-gray-200 rounded-lg max-h-48 overflow-y-auto">
                      {cursosData?.data.map((c) => (
                        <label key={c.id} className="flex items-center gap-3 px-4 py-2.5 hover:bg-gray-50 cursor-pointer border-b border-gray-100 last:border-0">
                          <input
                            type="checkbox"
                            checked={form.course_ids?.includes(c.id)}
                            onChange={() => toggleCurso(c.id)}
                            className="rounded"
                          />
                          <span className="text-sm text-gray-900 truncate">{c.title}</span>
                        </label>
                      ))}
                    </div>
                    <p className="text-xs text-gray-400">{form.course_ids?.length ?? 0} / 10 cursos seleccionados</p>
                  </div>
                </>
              )}

              {/* Estado */}
              <div className="space-y-1">
                <label className="text-sm font-medium text-gray-700">Estado</label>
                <select
                  value={form.status}
                  onChange={(e) => setForm({ ...form, status: e.target.value as "active" | "inactive" })}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none"
                >
                  <option value="inactive">Inactivo</option>
                  <option value="active">Activo</option>
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
            <h2 className="font-semibold text-gray-900 mb-2">¿Eliminar este slider?</h2>
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
