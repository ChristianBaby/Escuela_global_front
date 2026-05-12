"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { slidersService, type CreateSliderDto } from "@/lib/services/marketing";
import { cursosService } from "@/lib/services/cursos";
import { toast } from "sonner";
import type { Slider } from "@/types";

const POSICIONES = [
  { value: "top", label: "Superior" },
  { value: "middle", label: "Medio" },
  { value: "bottom", label: "Inferior" },
];

const empty: CreateSliderDto = {
  title: "",
  type: "courses",
  image_url: "",
  destination_url: "",
  position_on_page: "top",
  status: "inactive",
  course_ids: [],
};

export default function SlidersPage() {
  const queryClient = useQueryClient();
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<Slider | null>(null);
  const [form, setForm] = useState<CreateSliderDto>(empty);
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);

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

  const toggleStatus = (s: Slider) => {
    updateMutation.mutate({ id: s.id, data: { status: s.status === "active" ? "inactive" : "active" } });
  };

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
      type: s.type,
      image_url: s.image_url,
      destination_url: s.destination_url,
      position_on_page: s.position_on_page,
      status: s.status,
      course_ids: s.courses?.map((c) => c.id) ?? [],
    });
    setShowModal(true);
  };
  const closeModal = () => { setShowModal(false); setEditing(null); setForm(empty); };

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
          <h1 className="text-2xl font-bold text-gray-900">Sliders</h1>
          <p className="text-gray-500 text-sm">Carruseles del homepage (RF-031)</p>
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
                <th className="text-left px-4 py-3 text-gray-600 font-medium">Título</th>
                <th className="text-left px-4 py-3 text-gray-600 font-medium">Tipo</th>
                <th className="text-left px-4 py-3 text-gray-600 font-medium">Posición</th>
                <th className="text-left px-4 py-3 text-gray-600 font-medium">Estado</th>
                <th className="text-right px-4 py-3 text-gray-600 font-medium">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {sliders?.length === 0 ? (
                <tr><td colSpan={5} className="text-center py-8 text-gray-400">Sin sliders</td></tr>
              ) : (
                sliders?.map((s) => (
                  <tr key={s.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 font-medium text-gray-900">{s.title}</td>
                    <td className="px-4 py-3">
                      <span className="text-xs bg-purple-50 text-purple-700 px-2 py-1 rounded-full">
                        {s.type === "courses" ? "Cursos" : "Banner"}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-gray-500 capitalize">{POSICIONES.find((p) => p.value === s.position_on_page)?.label}</td>
                    <td className="px-4 py-3">
                      <button onClick={() => toggleStatus(s)} className={`text-xs px-2 py-1 rounded-full transition-colors ${s.status === "active" ? "bg-green-50 text-green-700 hover:bg-green-100" : "bg-gray-100 text-gray-600 hover:bg-gray-200"}`}>
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

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl w-full max-w-lg shadow-xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 sticky top-0 bg-white">
              <h2 className="font-semibold text-gray-900">{editing ? "Editar slider" : "Nuevo slider"}</h2>
              <button onClick={closeModal} className="text-gray-400 hover:text-gray-600 text-xl">&times;</button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div className="space-y-1">
                <label className="text-sm font-medium text-gray-700">Título *</label>
                <input required value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#2B55A3]/30" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-sm font-medium text-gray-700">Tipo *</label>
                  <select value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value as "courses" | "banner", course_ids: [] })} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none">
                    <option value="courses">Cursos</option>
                    <option value="banner">Banner</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-sm font-medium text-gray-700">Posición *</label>
                  <select value={form.position_on_page} onChange={(e) => setForm({ ...form, position_on_page: e.target.value as "top" | "middle" | "bottom" })} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none">
                    {POSICIONES.map((p) => <option key={p.value} value={p.value}>{p.label}</option>)}
                  </select>
                </div>
              </div>

              {form.type === "banner" && (
                <>
                  <div className="space-y-1">
                    <label className="text-sm font-medium text-gray-700">URL de imagen</label>
                    <input type="url" value={form.image_url ?? ""} onChange={(e) => setForm({ ...form, image_url: e.target.value })} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none" placeholder="https://..." />
                  </div>
                  <div className="space-y-1">
                    <label className="text-sm font-medium text-gray-700">Link de destino</label>
                    <input type="url" value={form.destination_url ?? ""} onChange={(e) => setForm({ ...form, destination_url: e.target.value })} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none" placeholder="https://..." />
                  </div>
                </>
              )}

              {form.type === "courses" && (
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">Cursos (máx. 10)</label>
                  <div className="border border-gray-200 rounded-lg max-h-48 overflow-y-auto">
                    {cursosData?.data.map((c) => (
                      <label key={c.id} className="flex items-center gap-3 px-4 py-2.5 hover:bg-gray-50 cursor-pointer border-b border-gray-100 last:border-0">
                        <input type="checkbox" checked={form.course_ids?.includes(c.id)} onChange={() => toggleCurso(c.id)} className="rounded" />
                        <span className="text-sm text-gray-900 truncate">{c.title}</span>
                      </label>
                    ))}
                  </div>
                  <p className="text-xs text-gray-400">{form.course_ids?.length ?? 0} / 10 cursos seleccionados</p>
                </div>
              )}

              <div className="space-y-1">
                <label className="text-sm font-medium text-gray-700">Estado</label>
                <select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value as "active" | "inactive" })} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none">
                  <option value="inactive">Inactivo</option>
                  <option value="active">Activo</option>
                </select>
              </div>

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
            <h2 className="font-semibold text-gray-900 mb-2">¿Eliminar este slider?</h2>
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
