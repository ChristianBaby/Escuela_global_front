"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { slidersService, eventTypesService, type CreateSliderDto } from "@/lib/services/marketing";
import { toast } from "sonner";
import { X, ImageIcon, Plus, Check, GripVertical } from "lucide-react";
import { ImageUploader } from "@/components/molecules";
import {
  DndContext,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import { SortableContext, verticalListSortingStrategy, arrayMove, useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import type { Slider } from "@/types";

// ── Fila de tabla arrastrable — el drag solo se activa desde el ícono de agarre ──
function SortableRow({
  id,
  children,
}: {
  id: string;
  children: (drag: { attributes: ReturnType<typeof useSortable>["attributes"]; listeners: ReturnType<typeof useSortable>["listeners"] }) => React.ReactNode;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id });
  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.6 : 1,
    position: "relative",
    zIndex: isDragging ? 10 : undefined,
    background: isDragging ? "white" : undefined,
  };
  return (
    <tr ref={setNodeRef} style={style} className="hover:bg-gray-50">
      {children({ attributes, listeners })}
    </tr>
  );
}

const empty: CreateSliderDto = {
  title: "",
  subtitle: "",
  type: "banner",
  event_type_id: null,
  image_url: "",
  destination_url: "",
  contact_url: "",
  position_on_page: "top",
  status: "inactive",
  show_content: true,
};

// ── Página principal ───────────────────────────────────────────────────────────
export default function SlidersPage() {
  const queryClient = useQueryClient();
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<Slider | null>(null);
  const [form, setForm] = useState<CreateSliderDto>(empty);
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string>("");
  const [newTypeName, setNewTypeName] = useState("");
  const [showNewTypeInput, setShowNewTypeInput] = useState(false);

  const { data: sliders, isLoading, isError } = useQuery({
    queryKey: ["sliders"],
    queryFn: slidersService.list,
  });

  // Excluimos type "catalog" — esos se administran en Banner Catálogo, no acá
  const homeSliders = (sliders ?? [])
    .filter((s) => s.type !== "catalog")
    .sort((a, b) => a.display_order - b.display_order);

  const { data: eventTypes = [] } = useQuery({
    queryKey: ["event-types"],
    queryFn: eventTypesService.list,
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

  // Mutación silenciosa para el reorden por drag & drop — sin toast ni cerrar el modal en cada fila movida
  const reorderMutation = useMutation({
    mutationFn: ({ id, display_order }: { id: string; display_order: number }) =>
      slidersService.update(id, { display_order }),
    onError: () => toast.error("No se pudo guardar el nuevo orden"),
  });

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }));

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const oldIndex = homeSliders.findIndex((s) => s.id === active.id);
    const newIndex = homeSliders.findIndex((s) => s.id === over.id);
    if (oldIndex === -1 || newIndex === -1) return;

    const reordered = arrayMove(homeSliders, oldIndex, newIndex);

    queryClient.setQueryData<Slider[]>(["sliders"], (old) => {
      if (!old) return old;
      const newOrder = new Map(reordered.map((s, idx) => [s.id, idx]));
      return old.map((s) => (newOrder.has(s.id) ? { ...s, display_order: newOrder.get(s.id)! } : s));
    });

    reordered.forEach((s, idx) => {
      if (s.display_order !== idx) {
        reorderMutation.mutate({ id: s.id, display_order: idx });
      }
    });
  };

  const createEventTypeMutation = useMutation({
    mutationFn: eventTypesService.create,
    onSuccess: (created) => {
      queryClient.invalidateQueries({ queryKey: ["event-types"] });
      setForm((prev) => ({ ...prev, event_type_id: created.id }));
      setNewTypeName("");
      setShowNewTypeInput(false);
      toast.success(`Tipo "${created.name}" creado`);
    },
    onError: (err: unknown) =>
      toast.error((err as { response?: { data?: { message?: string } } })?.response?.data?.message ?? "Error creando tipo"),
  });

  const handleCreateEventType = (e: React.FormEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!newTypeName.trim()) return;
    createEventTypeMutation.mutate({ name: newTypeName.trim() });
  };

  const toggleStatus = (s: Slider) =>
    updateMutation.mutate({ id: s.id, data: { status: s.status === "active" ? "inactive" : "active" } });

  const openCreate = () => { setEditing(null); setForm(empty); setShowModal(true); };
  const openEdit = (s: Slider) => {
    setEditing(s);
    setForm({
      title: s.title,
      subtitle: s.subtitle ?? "",
      type: "banner",
      event_type_id: s.event_type_id ?? null,
      image_url: s.image_url ?? "",
      destination_url: s.destination_url ?? "",
      contact_url: s.contact_url ?? "",
      position_on_page: "top",
      status: s.status,
      show_content: s.show_content,
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
    setNewTypeName("");
    setShowNewTypeInput(false);
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
          <h1 className="text-2xl font-bold text-brand-primary">Sliders</h1>
          <p className="text-gray-500 text-sm">Carruseles del homepage — hero y secciones</p>
        </div>
        <button onClick={openCreate} className="bg-[#084D95] text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-[#084D95]/90">
          + Nuevo slider
        </button>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        {isLoading ? (
          <div className="p-8 text-center text-gray-400 text-sm">Cargando...</div>
        ) : isError ? (
          <div className="p-8 text-center text-red-500 text-sm">Error al cargar sliders</div>
        ) : (
          <div className="overflow-x-auto">
          <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="w-8"></th>
                <th className="text-left px-4 py-3 text-gray-600 font-medium w-16">Vista</th>
                <th className="text-left px-4 py-3 text-gray-600 font-medium">Título</th>
                <th className="text-left px-4 py-3 text-gray-600 font-medium">Estado</th>
                <th className="text-right px-4 py-3 text-gray-600 font-medium">Acciones</th>
              </tr>
            </thead>
            {homeSliders.length === 0 ? (
              <tbody className="divide-y divide-gray-100">
                <tr><td colSpan={5} className="text-center py-8 text-gray-400">Sin sliders</td></tr>
              </tbody>
            ) : (
                <SortableContext items={homeSliders.map((s) => s.id)} strategy={verticalListSortingStrategy}>
                  <tbody className="divide-y divide-gray-100">
                    {homeSliders.map((s) => (
                      <SortableRow key={s.id} id={s.id}>
                        {({ attributes, listeners }) => (
                          <>
                            <td className="pl-3">
                              <button
                                {...attributes}
                                {...listeners}
                                className="cursor-grab active:cursor-grabbing text-gray-300 hover:text-gray-500 touch-none"
                                aria-label="Arrastrar para reordenar"
                              >
                                <GripVertical size={16} />
                              </button>
                            </td>
                            <td className="px-4 py-3">
                              {s.image_url ? (
                                <img src={s.image_url} alt="" className="w-16 h-10 object-cover rounded-lg bg-gray-100" />
                              ) : (
                                <div className="w-16 h-10 rounded-lg bg-gradient-to-br from-[#084D95]/20 to-[#23AFE5]/20 flex items-center justify-center">
                                  <ImageIcon size={14} className="text-[#084D95]/50" />
                                </div>
                              )}
                            </td>
                            <td className="px-4 py-3 font-medium text-gray-900">{s.title}</td>
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
                              <button onClick={() => openEdit(s)} className="text-[#084D95] hover:underline text-xs">Editar</button>
                              <button onClick={() => setConfirmDelete(s.id)} className="text-red-500 hover:underline text-xs">Eliminar</button>
                            </td>
                          </>
                        )}
                      </SortableRow>
                    ))}
                  </tbody>
                </SortableContext>
            )}
          </table>
          </DndContext>
          </div>
        )}
      </div>

      {/* Modal crear/editar */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl w-full max-w-lg shadow-xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 sticky top-0 bg-white z-10">
              <h2 className="font-semibold text-brand-primary">{editing ? "Editar slider" : "Nuevo slider"}</h2>
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
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#084D95]/30"
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
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#084D95]/30 resize-none"
                  placeholder="Ej: Domina la legislación laboral con casos reales del sector."
                />
              </div>

              {/* Tipo de evento — chips + creación inline */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">
                  Tipo de evento{" "}
                  <span className="text-xs text-gray-400 font-normal">(etiqueta del hero)</span>
                </label>

                <div className="flex flex-wrap gap-2">
                  {/* Chip "Sin etiqueta" */}
                  <button
                    type="button"
                    onClick={() => setForm({ ...form, event_type_id: null })}
                    className={`text-xs px-3 py-1.5 rounded-full border transition-all ${
                      !form.event_type_id
                        ? "bg-gray-700 text-white border-gray-700"
                        : "border-gray-300 text-gray-500 hover:border-gray-400"
                    }`}
                  >
                    Sin etiqueta
                  </button>

                  {/* Chips de tipos existentes */}
                  {eventTypes.map((et) => (
                    <button
                      key={et.id}
                      type="button"
                      onClick={() => setForm({ ...form, event_type_id: et.id })}
                      className={`text-xs font-bold uppercase tracking-wide px-3 py-1.5 rounded-full border transition-all flex items-center gap-1.5 ${
                        form.event_type_id === et.id
                          ? "bg-[#23AFE5] text-white border-[#23AFE5]"
                          : "border-[#23AFE5]/40 text-[#23AFE5] hover:bg-[#23AFE5]/10"
                      }`}
                    >
                      {form.event_type_id === et.id && <Check size={10} />}
                      {et.name}
                    </button>
                  ))}

                  {/* Botón agregar nuevo tipo */}
                  {!showNewTypeInput && (
                    <button
                      type="button"
                      onClick={() => setShowNewTypeInput(true)}
                      className="text-xs px-3 py-1.5 rounded-full border border-dashed border-gray-300 text-gray-400 hover:border-[#084D95] hover:text-[#084D95] transition-all flex items-center gap-1"
                    >
                      <Plus size={11} /> Nuevo tipo
                    </button>
                  )}
                </div>

                {/* Formulario inline para crear nuevo tipo */}
                {showNewTypeInput && (
                  <div className="flex items-center gap-2 mt-1">
                    <input
                      autoFocus
                      value={newTypeName}
                      onChange={(e) => setNewTypeName(e.target.value)}
                      onKeyDown={(e) => { if (e.key === "Escape") { setShowNewTypeInput(false); setNewTypeName(""); } }}
                      placeholder="Ej: Foro, Taller, Ponencia..."
                      className="flex-1 border border-[#084D95]/40 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#084D95]/30"
                    />
                    <button
                      type="button"
                      onClick={handleCreateEventType}
                      disabled={!newTypeName.trim() || createEventTypeMutation.isPending}
                      className="bg-[#084D95] text-white px-3 py-1.5 rounded-lg text-xs font-medium hover:bg-[#084D95]/90 disabled:opacity-50 shrink-0"
                    >
                      {createEventTypeMutation.isPending ? "..." : "Crear"}
                    </button>
                    <button
                      type="button"
                      onClick={() => { setShowNewTypeInput(false); setNewTypeName(""); }}
                      className="text-gray-400 hover:text-gray-600 shrink-0"
                    >
                      <X size={16} />
                    </button>
                  </div>
                )}
              </div>

              <ImageUploader
                label="Imagen del banner (fondo del slide en el home)"
                hint="Tamaño recomendado: 1600 × 900 px (o 1920 × 1080 — lo importante es la proporción 16:9, que es la que usa el Hero del home a pantalla casi completa)"
                value={form.image_url ?? ""}
                preview={imagePreview}
                onChange={(url) => setForm({ ...form, image_url: url })}
                onFileSelect={(file) => {
                  setImageFile(file);
                  setImagePreview(URL.createObjectURL(file));
                }}
                aspectRatio="16/9"
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
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#084D95]/30"
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
                  type="text"
                  value={form.destination_url ?? ""}
                  onChange={(e) => setForm({ ...form, destination_url: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none"
                  placeholder="/cursos/nombre-del-curso"
                />
              </div>

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

              {/* Mostrar u ocultar el texto sobre la imagen */}
              <label className="flex items-start gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={form.show_content ?? true}
                  onChange={(e) => setForm({ ...form, show_content: e.target.checked })}
                  className="mt-0.5 h-4 w-4 rounded border-gray-300 text-[#084D95] focus:ring-[#084D95]/30"
                />
                <span className="text-sm text-gray-700">
                  Mostrar título, subtítulo y botones sobre la imagen
                  <span className="block text-xs text-gray-400 font-normal">
                    Desactívalo para mostrar solo la imagen del banner, sin texto encima.
                  </span>
                </span>
              </label>

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

      {/* Confirm delete */}
      {confirmDelete && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-sm shadow-xl">
            <h2 className="font-semibold text-brand-primary mb-2">¿Eliminar este slider?</h2>
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
