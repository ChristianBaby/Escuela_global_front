"use client";

import { useState, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { docentesService, type CreateStaffMemberDto } from "@/lib/services/marketing";
import { toast } from "sonner";
import { ImageIcon } from "lucide-react";
import type { StaffMember } from "@/types";

const empty: CreateStaffMemberDto = {
  image: undefined,
  status: "inactive",
};

export default function DocentesPage() {
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
    mutationFn: docentesService.create,
    onSuccess: () => { toast.success("Docente agregado"); queryClient.invalidateQueries({ queryKey: ["docentes"] }); closeModal(); },
    onError: (err: unknown) => toast.error((err as { response?: { data?: { message?: string } } })?.response?.data?.message ?? "Error al crear"),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<CreateStaffMemberDto> }) => docentesService.update(id, data),
    onSuccess: () => { toast.success("Docente actualizado"); queryClient.invalidateQueries({ queryKey: ["docentes"] }); closeModal(); },
    onError: (err: unknown) => toast.error((err as { response?: { data?: { message?: string } } })?.response?.data?.message ?? "Error al actualizar"),
  });

  const deleteMutation = useMutation({
    mutationFn: docentesService.delete,
    onSuccess: () => { toast.success("Docente eliminado"); queryClient.invalidateQueries({ queryKey: ["docentes"] }); setConfirmDelete(null); },
    onError: (err: unknown) => { toast.error((err as { response?: { data?: { message?: string } } })?.response?.data?.message ?? "Error"); setConfirmDelete(null); },
  });

  const toggleStatus = (d: StaffMember) =>
    updateMutation.mutate({ id: d.id, data: { status: d.status === "active" ? "inactive" : "active" } });

  const openCreate = () => {
    setEditing(null);
    setForm(empty);
    setPreviewUrl("");
    if (fileInputRef.current) fileInputRef.current.value = "";
    setShowModal(true);
  };

  const openEdit = (d: StaffMember) => {
    setEditing(d);
    setForm({ image: undefined, status: d.status });
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
          <h1 className="text-2xl font-bold text-gray-900">Nuestros Docentes</h1>
          <p className="text-gray-500 text-sm">
            Fotos del staff de docentes visibles en el homepage. Sube la imagen ya con nombre y cargo incluidos — no se agrega texto aparte.
          </p>
        </div>
        <button onClick={openCreate} className="bg-[#2B55A3] text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-[#2B55A3]/90">
          + Nuevo docente
        </button>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 p-5">
        {isLoading ? (
          <div className="p-8 text-center text-gray-400 text-sm">Cargando...</div>
        ) : isError ? (
          <div className="p-8 text-center text-red-500 text-sm">Error al cargar docentes</div>
        ) : docentes?.length === 0 ? (
          <div className="text-center py-8 text-gray-400 text-sm">Sin docentes</div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            {docentes?.map((d) => (
              <div key={d.id} className="relative group rounded-xl overflow-hidden border border-gray-200 bg-gray-50">
                {d.image_url ? (
                  <img src={d.image_url} alt="" className="w-full h-40 object-cover" />
                ) : (
                  <div className="w-full h-40 flex items-center justify-center">
                    <ImageIcon size={24} className="text-gray-300" />
                  </div>
                )}
                <button
                  onClick={() => toggleStatus(d)}
                  className={`absolute top-2 left-2 text-[10px] px-2 py-0.5 rounded-full font-medium ${
                    d.status === "active" ? "bg-green-500 text-white" : "bg-gray-500 text-white"
                  }`}
                >
                  {d.status === "active" ? "Activo" : "Inactivo"}
                </button>
                <div className="absolute inset-x-0 bottom-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex justify-center gap-3 py-2">
                  <button onClick={() => openEdit(d)} className="text-white text-xs hover:underline">Editar</button>
                  <button onClick={() => setConfirmDelete(d.id)} className="text-red-300 text-xs hover:underline">Eliminar</button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl w-full max-w-sm shadow-xl">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
              <h2 className="font-semibold text-gray-900">{editing ? "Editar docente" : "Nuevo docente"}</h2>
              <button onClick={closeModal} className="text-gray-400 hover:text-gray-600 text-xl leading-none">&times;</button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div className="space-y-1">
                <label className="text-sm font-medium text-gray-700">Imagen {editing ? "" : "*"}</label>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  required={!editing}
                  onChange={handleFileChange}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#2B55A3]/30 file:mr-3 file:py-1 file:px-3 file:rounded file:border-0 file:text-xs file:bg-[#2B55A3] file:text-white file:cursor-pointer"
                />
                <p className="text-xs text-gray-400">La imagen debe incluir ya el nombre y cargo del docente.</p>
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
                    className="w-full h-40 object-cover"
                    onError={(e) => (e.currentTarget.style.display = "none")}
                  />
                </div>
              )}

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

      {confirmDelete && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-sm shadow-xl">
            <h2 className="font-semibold text-gray-900 mb-2">¿Eliminar este docente?</h2>
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
