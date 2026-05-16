"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { promocionesService, type CreatePromocionDto } from "@/lib/services/marketing";
import { toast } from "sonner";
import type { Promotion } from "@/types";

const empty: CreatePromocionDto = {
  title: "",
  image_url: "",
  destination_url: "",
  status: "inactive",
  starts_at: "",
  ends_at: "",
};

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

  const toggleStatus = (p: Promotion) => {
    updateMutation.mutate({ id: p.id, data: { status: p.status === "active" ? "inactive" : "active" } });
  };

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
          <p className="text-gray-500 text-sm">Imágenes promocionales del homepage (RF-030)</p>
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
                        {p.image_url && <img src={p.image_url} alt="" className="w-16 h-10 rounded object-cover bg-gray-100" />}
                        <span className="font-medium text-gray-900">{p.title}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-gray-500 max-w-xs truncate text-xs">{p.destination_url ?? "—"}</td>
                    <td className="px-4 py-3 text-gray-500 text-xs">
                      {p.starts_at ? new Date(p.starts_at).toLocaleDateString("es-PE") : "—"}
                      {" → "}
                      {p.ends_at ? new Date(p.ends_at).toLocaleDateString("es-PE") : "Sin límite"}
                    </td>
                    <td className="px-4 py-3">
                      <button onClick={() => toggleStatus(p)} className={`text-xs px-2 py-1 rounded-full transition-colors ${p.status === "active" ? "bg-green-50 text-green-700 hover:bg-green-100" : "bg-gray-100 text-gray-600 hover:bg-gray-200"}`}>
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

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl w-full max-w-md shadow-xl">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
              <h2 className="font-semibold text-gray-900">{editing ? "Editar publicación" : "Nueva publicación"}</h2>
              <button onClick={closeModal} className="text-gray-400 hover:text-gray-600 text-xl">&times;</button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              {[
                { label: "Título (interno) *", key: "title", type: "text", required: true },
                { label: "URL de imagen *", key: "image_url", type: "url", required: true, placeholder: "https://..." },
                { label: "Link de destino", key: "destination_url", type: "url", placeholder: "https://..." },
                { label: "Inicio vigencia", key: "starts_at", type: "datetime-local" },
                { label: "Fin vigencia", key: "ends_at", type: "datetime-local" },
              ].map(({ label, key, type, required, placeholder }) => (
                <div key={key} className="space-y-1">
                  <label className="text-sm font-medium text-gray-700">{label}</label>
                  <input
                    type={type}
                    required={required}
                    placeholder={placeholder}
                    value={(form as unknown as Record<string, string | undefined>)[key] ?? ""}
                    onChange={(e) => setForm({ ...form, [key]: e.target.value })}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#2B55A3]/30"
                  />
                </div>
              ))}
              <div className="space-y-1">
                <label className="text-sm font-medium text-gray-700">Estado</label>
                <select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value as "active" | "inactive" })} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none">
                  <option value="inactive">Inactiva</option>
                  <option value="active">Activa</option>
                </select>
              </div>
              {form.image_url && (
                <div className="rounded-lg overflow-hidden border border-gray-200">
                  <img src={form.image_url} alt="Vista previa" className="w-full h-24 object-cover" onError={(e) => (e.currentTarget.style.display = "none")} />
                </div>
              )}
              <div className="flex justify-end gap-3 pt-2">
                <button type="button" onClick={closeModal} className="px-4 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-50">Cancelar</button>
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
            <h2 className="font-semibold text-gray-900 mb-2">¿Eliminar esta publicación?</h2>
            <div className="flex justify-end gap-3 mt-4">
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
