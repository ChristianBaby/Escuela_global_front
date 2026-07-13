"use client";

import { useState, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { lanzamientosService, type CreateUpcomingLaunchDto } from "@/lib/services/marketing";
import { toast } from "sonner";
import { ImageIcon } from "lucide-react";
import type { UpcomingLaunch } from "@/types";

const empty: CreateUpcomingLaunchDto = {
  category_label: "",
  title: "",
  start_date: "",
  image: undefined,
  link_url: "",
  status: "inactive",
};

export default function LanzamientosPage() {
  const queryClient = useQueryClient();
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<UpcomingLaunch | null>(null);
  const [form, setForm] = useState<CreateUpcomingLaunchDto>(empty);
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string>("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { data: lanzamientos, isLoading, isError } = useQuery({
    queryKey: ["lanzamientos"],
    queryFn: () => lanzamientosService.list(),
  });

  const createMutation = useMutation({
    mutationFn: lanzamientosService.create,
    onSuccess: () => { toast.success("Lanzamiento creado"); queryClient.invalidateQueries({ queryKey: ["lanzamientos"] }); closeModal(); },
    onError: (err: unknown) => toast.error((err as { response?: { data?: { message?: string } } })?.response?.data?.message ?? "Error al crear"),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<CreateUpcomingLaunchDto> }) => lanzamientosService.update(id, data),
    onSuccess: () => { toast.success("Lanzamiento actualizado"); queryClient.invalidateQueries({ queryKey: ["lanzamientos"] }); closeModal(); },
    onError: (err: unknown) => toast.error((err as { response?: { data?: { message?: string } } })?.response?.data?.message ?? "Error al actualizar"),
  });

  const deleteMutation = useMutation({
    mutationFn: lanzamientosService.delete,
    onSuccess: () => { toast.success("Lanzamiento eliminado"); queryClient.invalidateQueries({ queryKey: ["lanzamientos"] }); setConfirmDelete(null); },
    onError: (err: unknown) => { toast.error((err as { response?: { data?: { message?: string } } })?.response?.data?.message ?? "Error"); setConfirmDelete(null); },
  });

  const toggleStatus = (l: UpcomingLaunch) =>
    updateMutation.mutate({ id: l.id, data: { status: l.status === "active" ? "inactive" : "active" } });

  const openCreate = () => {
    setEditing(null);
    setForm(empty);
    setPreviewUrl("");
    if (fileInputRef.current) fileInputRef.current.value = "";
    setShowModal(true);
  };

  const openEdit = (l: UpcomingLaunch) => {
    setEditing(l);
    setForm({
      category_label: l.category_label,
      title: l.title,
      start_date: l.start_date?.slice(0, 10) ?? "",
      image: undefined,
      link_url: l.link_url ?? "",
      status: l.status,
    });
    setPreviewUrl(l.image_url ?? "");
    if (fileInputRef.current) fileInputRef.current.value = "";
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setEditing(null);
    setForm(empty);
    setPreviewUrl("");
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      toast.error("Selecciona un archivo de imagen");
      return;
    }
    setForm({ ...form, image: file });
    setPreviewUrl(URL.createObjectURL(file));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editing) updateMutation.mutate({ id: editing.id, data: form });
    else createMutation.mutate(form);
  };

  const isPending = createMutation.isPending || updateMutation.isPending;

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-brand-primary">Próximos Lanzamientos</h1>
          <p className="text-gray-500 text-sm">Tarjetas de nuevos programas, visibles en el homepage</p>
        </div>
        <button onClick={openCreate} className="bg-[#084D95] text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-[#084D95]/90">
          + Nuevo lanzamiento
        </button>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        {isLoading ? (
          <div className="p-8 text-center text-gray-400 text-sm">Cargando...</div>
        ) : isError ? (
          <div className="p-8 text-center text-red-500 text-sm">Error al cargar lanzamientos</div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="text-left px-4 py-3 text-gray-600 font-medium">Lanzamiento</th>
                <th className="text-left px-4 py-3 text-gray-600 font-medium">Categoría</th>
                <th className="text-left px-4 py-3 text-gray-600 font-medium">Fecha de inicio</th>
                <th className="text-left px-4 py-3 text-gray-600 font-medium">Estado</th>
                <th className="text-right px-4 py-3 text-gray-600 font-medium">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {lanzamientos?.length === 0 ? (
                <tr><td colSpan={5} className="text-center py-8 text-gray-400">Sin lanzamientos</td></tr>
              ) : (
                lanzamientos?.map((l) => (
                  <tr key={l.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        {l.image_url ? (
                          <img src={l.image_url} alt="" className="w-20 h-12 rounded-lg object-cover bg-gray-100 flex-shrink-0" />
                        ) : (
                          <div className="w-20 h-12 rounded-lg bg-gray-100 flex items-center justify-center flex-shrink-0">
                            <ImageIcon size={16} className="text-gray-400" />
                          </div>
                        )}
                        <span className="font-medium text-gray-900">{l.title}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-gray-500 text-xs">{l.category_label}</td>
                    <td className="px-4 py-3 text-gray-500 text-xs whitespace-nowrap">
                      {l.start_date ? new Date(l.start_date).toLocaleDateString("es-PE") : "—"}
                    </td>
                    <td className="px-4 py-3">
                      <button
                        onClick={() => toggleStatus(l)}
                        className={`text-xs px-2 py-1 rounded-full transition-colors ${
                          l.status === "active" ? "bg-green-50 text-green-700 hover:bg-green-100" : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                        }`}
                      >
                        {l.status === "active" ? "Activo" : "Inactivo"}
                      </button>
                    </td>
                    <td className="px-4 py-3 text-right space-x-3">
                      <button onClick={() => openEdit(l)} className="text-[#084D95] hover:underline text-xs">Editar</button>
                      <button onClick={() => setConfirmDelete(l.id)} className="text-red-500 hover:underline text-xs">Eliminar</button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        )}
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl w-full max-w-md shadow-xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
              <h2 className="font-semibold text-brand-primary">{editing ? "Editar lanzamiento" : "Nuevo lanzamiento"}</h2>
              <button onClick={closeModal} className="text-gray-400 hover:text-gray-600 text-xl leading-none">&times;</button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div className="space-y-1">
                <label className="text-sm font-medium text-gray-700">Categoría *</label>
                <input
                  type="text"
                  required
                  placeholder="Ej: Programa de Especialización Ejecutiva"
                  value={form.category_label}
                  onChange={(e) => setForm({ ...form, category_label: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#084D95]/30"
                />
              </div>

              <div className="space-y-1">
                <label className="text-sm font-medium text-gray-700">Título *</label>
                <input
                  type="text"
                  required
                  placeholder="Ej: Gestión de Costos y Presupuestos con IA"
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#084D95]/30"
                />
              </div>

              <div className="space-y-1">
                <label className="text-sm font-medium text-gray-700">Imagen (flyer) {editing ? "" : "*"}</label>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  required={!editing}
                  onChange={handleFileChange}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#084D95]/30 file:mr-3 file:py-1 file:px-3 file:rounded file:border-0 file:text-xs file:bg-[#084D95] file:text-white file:cursor-pointer"
                />
                <p className="text-xs text-gray-400">Sube la imagen del flyer ya diseñada — se muestra tal cual, sin efectos.</p>
              </div>

              <div className="space-y-1">
                <label className="text-sm font-medium text-gray-700">Fecha de inicio *</label>
                <input
                  type="date"
                  required
                  value={form.start_date}
                  onChange={(e) => setForm({ ...form, start_date: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#084D95]/30"
                />
              </div>

              <div className="space-y-1">
                <label className="text-sm font-medium text-gray-700">Link &quot;Más información&quot; (ej. wa.link)</label>
                <input
                  type="url"
                  placeholder="https://wa.link/..."
                  value={form.link_url}
                  onChange={(e) => setForm({ ...form, link_url: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#084D95]/30"
                />
              </div>

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

              {previewUrl && (
                <div className="rounded-lg overflow-hidden border border-gray-200">
                  <img
                    src={previewUrl}
                    alt="Vista previa"
                    className="w-full h-32 object-cover"
                    onError={(e) => (e.currentTarget.style.display = "none")}
                  />
                </div>
              )}

              <div className="flex justify-end gap-3 pt-2">
                <button type="button" onClick={closeModal} className="px-4 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-50">
                  Cancelar
                </button>
                <button type="submit" disabled={isPending} className="px-4 py-2 text-sm bg-[#084D95] text-white rounded-lg hover:bg-[#084D95]/90 disabled:opacity-50">
                  {isPending ? "Guardando..." : editing ? "Guardar" : "Crear"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {confirmDelete && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-sm shadow-xl">
            <h2 className="font-semibold text-brand-primary mb-2">¿Eliminar este lanzamiento?</h2>
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
