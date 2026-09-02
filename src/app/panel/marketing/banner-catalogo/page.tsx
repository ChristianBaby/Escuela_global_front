"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { slidersService, type CreateSliderDto } from "@/lib/services/marketing";
import { toast } from "sonner";
import { ImageIcon, GripVertical } from "lucide-react";
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

// Este panel administra sliders de type: "catalog" — imágenes propias del banner de
// "Catálogo de Cursos" en /cursos, independientes de las imágenes del Hero del home.
const empty: CreateSliderDto = {
  title: "",
  subtitle: "",
  type: "catalog",
  image_url: "",
  destination_url: "",
  position_on_page: "top",
  status: "inactive",
  show_content: false,
};

export default function BannerCatalogoPage() {
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

  const catalogSliders = (sliders ?? [])
    .filter((s) => s.type === "catalog")
    .sort((a, b) => a.display_order - b.display_order);

  const createMutation = useMutation({
    mutationFn: slidersService.create,
    onSuccess: () => { toast.success("Imagen creada"); queryClient.invalidateQueries({ queryKey: ["sliders"] }); closeModal(); },
    onError: (err: unknown) => toast.error((err as { response?: { data?: { message?: string } } })?.response?.data?.message ?? "Error"),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<CreateSliderDto> }) => slidersService.update(id, data),
    onSuccess: () => { toast.success("Imagen actualizada"); queryClient.invalidateQueries({ queryKey: ["sliders"] }); closeModal(); },
    onError: (err: unknown) => toast.error((err as { response?: { data?: { message?: string } } })?.response?.data?.message ?? "Error"),
  });

  const deleteMutation = useMutation({
    mutationFn: slidersService.delete,
    onSuccess: () => { toast.success("Imagen eliminada"); queryClient.invalidateQueries({ queryKey: ["sliders"] }); setConfirmDelete(null); },
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

    const oldIndex = catalogSliders.findIndex((s) => s.id === active.id);
    const newIndex = catalogSliders.findIndex((s) => s.id === over.id);
    if (oldIndex === -1 || newIndex === -1) return;

    const reordered = arrayMove(catalogSliders, oldIndex, newIndex);

    // Optimista: reflejamos el nuevo orden de una vez en cache, sin esperar la respuesta del servidor
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

  const toggleStatus = (s: Slider) =>
    updateMutation.mutate({ id: s.id, data: { status: s.status === "active" ? "inactive" : "active" } });

  const openCreate = () => { setEditing(null); setForm(empty); setShowModal(true); };
  const openEdit = (s: Slider) => {
    setEditing(s);
    setForm({
      title: s.title,
      subtitle: s.subtitle ?? "",
      type: "catalog",
      image_url: s.image_url ?? "",
      destination_url: s.destination_url ?? "",
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
          <h1 className="text-2xl font-bold text-brand-primary">Banner Catálogo</h1>
          <p className="text-gray-500 text-sm">
            Imágenes del carrusel en la parte de arriba de /cursos — independientes del slider del home.
          </p>
        </div>
        <button onClick={openCreate} className="bg-[#084D95] text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-[#084D95]/90">
          + Nueva imagen
        </button>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        {isLoading ? (
          <div className="p-8 text-center text-gray-400 text-sm">Cargando...</div>
        ) : isError ? (
          <div className="p-8 text-center text-red-500 text-sm">Error al cargar</div>
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
            {catalogSliders.length === 0 ? (
              <tbody className="divide-y divide-gray-100">
                <tr><td colSpan={5} className="text-center py-8 text-gray-400">Sin imágenes todavía</td></tr>
              </tbody>
            ) : (
                <SortableContext items={catalogSliders.map((s) => s.id)} strategy={verticalListSortingStrategy}>
                  <tbody className="divide-y divide-gray-100">
                    {catalogSliders.map((s) => (
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
              <h2 className="font-semibold text-brand-primary">{editing ? "Editar imagen" : "Nueva imagen"}</h2>
              <button onClick={closeModal} className="text-gray-400 hover:text-gray-600 text-xl leading-none">&times;</button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-5">
              {/* Título — identifica la imagen en esta lista, Y es el texto que se muestra sobre ella si activas "Mostrar sobre esta imagen" más abajo */}
              <div className="space-y-1">
                <label className="text-sm font-medium text-gray-700">Título *</label>
                <input
                  required
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#084D95]/30"
                  placeholder="Ej: Catálogo de Cursos"
                />
                <p className="text-xs text-gray-400">
                  Identifica la imagen en esta lista, y es el texto que aparece sobre ella si activas &quot;Mostrar sobre esta imagen&quot; abajo.
                </p>
              </div>

              {/* Subtítulo — línea más chica debajo del título, opcional */}
              <div className="space-y-1">
                <label className="text-sm font-medium text-gray-700">Subtítulo / descripción breve</label>
                <textarea
                  rows={2}
                  value={form.subtitle ?? ""}
                  onChange={(e) => setForm({ ...form, subtitle: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#084D95]/30 resize-none"
                  placeholder="Ej: Programas de alta especialización online."
                />
              </div>

              <ImageUploader
                label="Imagen (opcional)"
                hint="Tamaño recomendado: 1920 × 480 px (proporción panorámica ~4:1). Puedes dejarla sin imagen — se ve el fondo azul de marca."
                value={form.image_url ?? ""}
                preview={imagePreview}
                onChange={(url) => setForm({ ...form, image_url: url })}
                onFileSelect={(file) => {
                  setImageFile(file);
                  setImagePreview(URL.createObjectURL(file));
                }}
                aspectRatio="4/1"
              />

              {/* Mostrar u ocultar el título "Catálogo de Cursos" sobre esta imagen en particular */}
              <label className="flex items-start gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={form.show_content ?? false}
                  onChange={(e) => setForm({ ...form, show_content: e.target.checked })}
                  className="mt-0.5 h-4 w-4 rounded border-gray-300 text-[#084D95] focus:ring-[#084D95]/30"
                />
                <span className="text-sm text-gray-700">
                  Mostrar el título sobre esta imagen
                  <span className="block text-xs text-gray-400 font-normal">
                    Actívalo para que este banner muestre el texto de arriba encima de la imagen — las demás imágenes se ven solas, sin texto.
                  </span>
                </span>
              </label>

              {/* Link de destino — si lo configuras, esta imagen se puede hacer click y lleva ahí (ej. un curso específico) */}
              <div className="space-y-1">
                <label className="text-sm font-medium text-gray-700">
                  Link de destino{" "}
                  <span className="text-xs text-gray-400 font-normal">(opcional)</span>
                </label>
                <input
                  type="text"
                  value={form.destination_url ?? ""}
                  onChange={(e) => setForm({ ...form, destination_url: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#084D95]/30"
                  placeholder="/cursos/nombre-del-curso"
                />
                <p className="text-xs text-gray-400">
                  Si lo configuras, la imagen completa se vuelve clickeable y lleva a esa página (ej. un curso específico). Si lo dejas vacío, la imagen es solo decorativa.
                </p>
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
            <h2 className="font-semibold text-brand-primary mb-2">¿Eliminar esta imagen?</h2>
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
