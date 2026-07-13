"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { eventTypesService, type CreateEventTypeDto } from "@/lib/services/marketing";
import { toast } from "sonner";
import { GripVertical, Pencil, Trash2, Tag } from "lucide-react";
import type { EventType } from "@/types";

const empty: CreateEventTypeDto = { name: "", display_order: undefined };

export default function EventTypesPage() {
  const queryClient = useQueryClient();
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<EventType | null>(null);
  const [form, setForm] = useState<CreateEventTypeDto>(empty);
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);

  const { data: eventTypes, isLoading, isError } = useQuery({
    queryKey: ["event-types"],
    queryFn: eventTypesService.list,
  });

  const createMutation = useMutation({
    mutationFn: eventTypesService.create,
    onSuccess: () => {
      toast.success("Tipo de evento creado");
      queryClient.invalidateQueries({ queryKey: ["event-types"] });
      closeModal();
    },
    onError: (err: unknown) =>
      toast.error(
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ?? "Error"
      ),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<CreateEventTypeDto> }) =>
      eventTypesService.update(id, data),
    onSuccess: () => {
      toast.success("Tipo de evento actualizado");
      queryClient.invalidateQueries({ queryKey: ["event-types"] });
      closeModal();
    },
    onError: (err: unknown) =>
      toast.error(
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ?? "Error"
      ),
  });

  const deleteMutation = useMutation({
    mutationFn: eventTypesService.delete,
    onSuccess: () => {
      toast.success("Tipo de evento eliminado");
      queryClient.invalidateQueries({ queryKey: ["event-types"] });
      setConfirmDelete(null);
    },
    onError: (err: unknown) => {
      toast.error(
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ?? "Error"
      );
      setConfirmDelete(null);
    },
  });

  const openCreate = () => {
    setEditing(null);
    setForm(empty);
    setShowModal(true);
  };

  const openEdit = (et: EventType) => {
    setEditing(et);
    setForm({ name: et.name, display_order: et.display_order });
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setEditing(null);
    setForm(empty);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim()) { toast.error("El nombre es requerido"); return; }
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
          <h1 className="text-2xl font-bold text-brand-primary">Tipos de Evento</h1>
          <p className="text-gray-500 text-sm">
            Etiquetas que aparecen en los sliders del hero (Foro, Taller, Ponencia, etc.)
          </p>
        </div>
        <button
          onClick={openCreate}
          className="bg-[#084D95] text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-[#084D95]/90"
        >
          + Nuevo tipo
        </button>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        {isLoading ? (
          <div className="p-8 text-center text-gray-400 text-sm">Cargando...</div>
        ) : isError ? (
          <div className="p-8 text-center text-red-500 text-sm">Error al cargar tipos de evento</div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="text-left px-4 py-3 text-gray-600 font-medium w-8"></th>
                <th className="text-left px-4 py-3 text-gray-600 font-medium">Nombre</th>
                <th className="text-left px-4 py-3 text-gray-600 font-medium w-24">Orden</th>
                <th className="text-right px-4 py-3 text-gray-600 font-medium">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {!eventTypes?.length ? (
                <tr>
                  <td colSpan={4} className="text-center py-10 text-gray-400">
                    <div className="flex flex-col items-center gap-2">
                      <Tag size={28} className="text-gray-300" />
                      <span>Sin tipos de evento. Crea el primero.</span>
                    </div>
                  </td>
                </tr>
              ) : (
                eventTypes.map((et) => (
                  <tr key={et.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3">
                      <GripVertical size={14} className="text-gray-300" />
                    </td>
                    <td className="px-4 py-3 font-medium text-gray-900 flex items-center gap-2">
                      <span className="inline-flex items-center text-xs font-bold uppercase tracking-widest text-[#23AFE5] border border-[#23AFE5]/40 rounded-full px-3 py-1">
                        {et.name}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-gray-500">{et.display_order}</td>
                    <td className="px-4 py-3 text-right space-x-3">
                      <button
                        onClick={() => openEdit(et)}
                        className="text-[#084D95] hover:text-[#084D95]/70 inline-flex items-center gap-1 text-xs"
                      >
                        <Pencil size={12} /> Editar
                      </button>
                      <button
                        onClick={() => setConfirmDelete(et.id)}
                        className="text-red-500 hover:text-red-400 inline-flex items-center gap-1 text-xs"
                      >
                        <Trash2 size={12} /> Eliminar
                      </button>
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
          <div className="bg-white rounded-xl w-full max-w-sm shadow-xl">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
              <h2 className="font-semibold text-brand-primary">
                {editing ? "Editar tipo de evento" : "Nuevo tipo de evento"}
              </h2>
              <button onClick={closeModal} className="text-gray-400 hover:text-gray-600 text-xl leading-none">
                &times;
              </button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div className="space-y-1">
                <label className="text-sm font-medium text-gray-700">Nombre *</label>
                <input
                  required
                  autoFocus
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#084D95]/30"
                  placeholder="Ej: Foro, Taller, Ponencia..."
                />
                <p className="text-xs text-gray-400">
                  Se mostrará en mayúsculas en el slider del hero.
                </p>
              </div>

              <div className="space-y-1">
                <label className="text-sm font-medium text-gray-700">Orden de visualización</label>
                <input
                  type="number"
                  min={0}
                  value={form.display_order ?? ""}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      display_order: e.target.value ? parseInt(e.target.value) : undefined,
                    })
                  }
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#084D95]/30"
                  placeholder="0"
                />
              </div>

              {form.name && (
                <div className="pt-1">
                  <p className="text-xs text-gray-500 mb-1.5">Vista previa:</p>
                  <span className="inline-flex items-center text-xs font-bold uppercase tracking-widest text-[#23AFE5] border border-[#23AFE5]/40 rounded-full px-4 py-1.5">
                    {form.name}
                  </span>
                </div>
              )}

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={closeModal}
                  className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isPending}
                  className="bg-[#084D95] text-white px-5 py-2 rounded-lg text-sm font-medium hover:bg-[#084D95]/90 disabled:opacity-60"
                >
                  {isPending ? "Guardando..." : editing ? "Guardar cambios" : "Crear tipo"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Confirmar eliminación */}
      {confirmDelete && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl w-full max-w-sm shadow-xl p-6">
            <h3 className="font-semibold text-brand-primary mb-2">¿Eliminar tipo de evento?</h3>
            <p className="text-sm text-gray-500 mb-5">
              Los sliders que usen este tipo quedarán sin etiqueta. Esta acción no se puede deshacer.
            </p>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setConfirmDelete(null)}
                className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800"
              >
                Cancelar
              </button>
              <button
                onClick={() => deleteMutation.mutate(confirmDelete)}
                disabled={deleteMutation.isPending}
                className="bg-red-500 text-white px-5 py-2 rounded-lg text-sm font-medium hover:bg-red-600 disabled:opacity-60"
              >
                {deleteMutation.isPending ? "Eliminando..." : "Eliminar"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
