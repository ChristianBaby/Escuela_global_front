"use client";

import { useState, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { docentesService, type CreateStaffMemberDto } from "@/lib/services/marketing";
import { toast } from "sonner";
import { ImageIcon, Loader2 } from "lucide-react";
import type { StaffMember } from "@/types";

const empty: CreateStaffMemberDto = {
  full_name: "",
  title: "",
  description: "",
  image: undefined,
  status: "active",
};

export default function DocentesMarketingPage() {
  const queryClient = useQueryClient();
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<StaffMember | null>(null);
  const [form, setForm] = useState<CreateStaffMemberDto>(empty);
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string>("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { data: docentes, isLoading, isError } = useQuery({
    queryKey: ["docentes"],
    queryFn: () => docentesService.list(),
  });

  const createMutation = useMutation({
    mutationFn: (data: CreateStaffMemberDto) => docentesService.create(data),
    onSuccess: () => {
      toast.success("Docente agregado correctamente");
      queryClient.invalidateQueries({ queryKey: ["docentes"] });
      closeModal();
    },
    onError: (err: unknown) => {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      toast.error(msg ?? "Error al crear docente");
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<CreateStaffMemberDto> }) =>
      docentesService.update(id, data),
    onSuccess: () => {
      toast.success("Docente actualizado correctamente");
      queryClient.invalidateQueries({ queryKey: ["docentes"] });
      closeModal();
    },
    onError: (err: unknown) => {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      toast.error(msg ?? "Error al actualizar docente");
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => docentesService.delete(id),
    onSuccess: () => {
      toast.success("Docente eliminado exitosamente");
      queryClient.invalidateQueries({ queryKey: ["docentes"] });
      setConfirmDelete(null);
    },
    onError: (err: unknown) => {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      toast.error(msg ?? "Error al eliminar docente");
      setConfirmDelete(null);
    },
  });

  const openCreate = () => {
    setEditing(null);
    setForm(empty);
    setPreviewUrl("");
    if (fileInputRef.current) fileInputRef.current.value = "";
    setShowModal(true);
  };

  const openEdit = (d: any) => {
    setEditing(d);
    setForm({
      full_name: d.full_name || "",
      title: d.title || "",
      description: d.description || "",
      image: undefined,
      status: d.status,
    });
    setPreviewUrl(d.image_url);
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
      toast.error("Selecciona un archivo de imagen válido");
      return;
    }
    setForm((prev) => ({ ...prev, image: file }));
    setPreviewUrl(URL.createObjectURL(file));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editing) {
      updateMutation.mutate({ id: editing.id, data: form });
    } else {
      createMutation.mutate(form);
    }
  };

  const isPending = createMutation.isPending || updateMutation.isPending;

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-brand-primary">Plana Docente (Marketing)</h1>
          <p className="text-gray-500 text-sm">
            Registra los datos completos de los instructores para vincularlos automáticamente a los cursos.
          </p>
        </div>
        <button
          onClick={openCreate}
          className="bg-[#084D95] text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-[#084D95]/90 transition-colors"
        >
          + Nuevo docente
        </button>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 p-5">
        {isLoading ? (
          <div className="p-8 text-center text-gray-400 text-sm">Cargando docentes...</div>
        ) : isError ? (
          <div className="p-8 text-center text-red-500 text-sm">Error al cargar docentes</div>
        ) : docentes?.length === 0 ? (
          <div className="text-center py-8 text-gray-400 text-sm">Sin docentes registrados</div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {docentes?.map((d: any) => (
              <div
                key={d.id}
                className="rounded-xl overflow-hidden border border-gray-200 bg-white flex flex-col justify-between group hover:shadow-xs transition-shadow"
              >
                <div className="relative h-44 bg-gray-100 overflow-hidden">
                  {d.image_url ? (
                    <img src={d.image_url} alt={d.full_name} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <ImageIcon size={28} className="text-gray-300" />
                    </div>
                  )}
                  <span
                    className={`absolute top-2 left-2 text-[10px] px-2 py-0.5 rounded-full font-medium ${
                      d.status === "active" ? "bg-green-500 text-white" : "bg-gray-500 text-white"
                    }`}
                  >
                    {d.status === "active" ? "Activo" : "Inactivo"}
                  </span>
                </div>

                <div className="p-3.5 space-y-1">
                  <h3 className="font-bold text-gray-900 text-sm truncate">
                    {d.full_name || "Sin nombre"}
                  </h3>
                  <p className="text-xs text-[#084D95] font-medium truncate">
                    {d.title || "Sin cargo"}
                  </p>
                  {d.description && (
                    <p className="text-xs text-gray-500 line-clamp-2 mt-1">{d.description}</p>
                  )}
                </div>

                <div className="p-3 bg-gray-50 border-t border-gray-100 flex justify-end gap-3 text-xs">
                  <button
                    type="button"
                    onClick={() => openEdit(d)}
                    className="text-[#084D95] hover:underline font-medium"
                  >
                    Editar
                  </button>
                  <button
                    type="button"
                    onClick={() => setConfirmDelete(d.id)}
                    className="text-red-500 hover:underline font-medium"
                  >
                    Eliminar
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Modal: Crear / Editar Docente */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl w-full max-w-md shadow-xl overflow-hidden max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
              <h2 className="font-semibold text-brand-primary">
                {editing ? "Editar Docente" : "Nuevo Docente"}
              </h2>
              <button onClick={closeModal} className="text-gray-400 hover:text-gray-600 text-lg">
                &times;
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4 overflow-y-auto">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-gray-700">Nombre completo *</label>
                <input
                  type="text"
                  required
                  value={form.full_name}
                  onChange={(e) => setForm({ ...form, full_name: e.target.value })}
                  placeholder="Ej: Ing. Jean Pierre Chayña"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-[#084D95]/30"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-gray-700">Profesión / Grado Académico *</label>
                <input
                  type="text"
                  required
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                  placeholder="Ej: Economista Titulado · UNSAAC"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-[#084D95]/30"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-gray-700">Descripción / Biografía</label>
                <textarea
                  rows={3}
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  placeholder="Breve trayectoria o especialidades..."
                  className="w-full border border-gray-300 rounded-lg p-2.5 text-xs focus:outline-none focus:ring-2 focus:ring-[#084D95]/30"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-gray-700">
                  Foto del Docente {editing ? "(Opcional si no cambia)" : "*"}
                </label>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  required={!editing}
                  onChange={handleFileChange}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-xs file:mr-2 file:py-1 file:px-2 file:rounded file:border-0 file:text-xs file:bg-[#084D95] file:text-white file:cursor-pointer"
                />
              </div>

              {previewUrl && (
                <div className="w-20 h-20 rounded-lg overflow-hidden border border-gray-200">
                  <img src={previewUrl} alt="Preview" className="w-full h-full object-cover" />
                </div>
              )}

              <div className="flex justify-end gap-2 pt-3 border-t border-gray-100">
                <button
                  type="button"
                  onClick={closeModal}
                  className="px-3 py-1.5 text-xs border rounded-lg hover:bg-gray-50"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isPending}
                  className="px-4 py-1.5 text-xs bg-[#084D95] text-white rounded-lg hover:bg-[#084D95]/90 disabled:opacity-50 flex items-center gap-1"
                >
                  {isPending && <Loader2 size={12} className="animate-spin" />}
                  Guardar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Confirmación de Eliminación */}
      {confirmDelete && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl p-6 w-full max-w-sm shadow-xl">
            <h2 className="font-semibold text-brand-primary mb-1">¿Eliminar este docente?</h2>
            <p className="text-xs text-gray-500 mb-4">Esta acción no se puede deshacer.</p>
            <div className="flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setConfirmDelete(null)}
                className="px-4 py-2 text-xs border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={() => deleteMutation.mutate(confirmDelete)}
                disabled={deleteMutation.isPending}
                className="px-4 py-2 text-xs bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 flex items-center gap-1"
              >
                {deleteMutation.isPending && <Loader2 size={12} className="animate-spin" />}
                Eliminar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}