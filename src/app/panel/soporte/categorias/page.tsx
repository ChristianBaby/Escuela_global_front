"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { categoriasService, type CreateCategoriaDto } from "@/lib/services/categories";
import { toast } from "sonner";
import type { Category } from "@/types";

const ICONS = ["📚", "💼", "🏗️", "💻", "📐", "🔬", "📊", "🎨", "⚙️", "🌍"];

const empty: CreateCategoriaDto = {
  name: "",
  slug: "",
  icon: "📚",
  color: "#2B55A3",
  description: "",
};

export default function CategoriasPage() {
  const queryClient = useQueryClient();
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<Category | null>(null);
  const [form, setForm] = useState<CreateCategoriaDto>(empty);
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);

  const { data: categorias, isLoading, isError } = useQuery({
    queryKey: ["categorias"],
    queryFn: categoriasService.list,
  });

  const createMutation = useMutation({
    mutationFn: categoriasService.create,
    onSuccess: () => {
      toast.success("Categoría creada");
      queryClient.invalidateQueries({ queryKey: ["categorias"] });
      closeModal();
    },
    onError: (err: unknown) => {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      toast.error(msg ?? "Error al crear categoría");
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<CreateCategoriaDto> }) =>
      categoriasService.update(id, data),
    onSuccess: () => {
      toast.success("Categoría actualizada");
      queryClient.invalidateQueries({ queryKey: ["categorias"] });
      closeModal();
    },
    onError: (err: unknown) => {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      toast.error(msg ?? "Error al actualizar");
    },
  });

  const deleteMutation = useMutation({
    mutationFn: categoriasService.delete,
    onSuccess: () => {
      toast.success("Categoría eliminada");
      queryClient.invalidateQueries({ queryKey: ["categorias"] });
      setConfirmDelete(null);
    },
    onError: (err: unknown) => {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      toast.error(msg ?? "No se puede eliminar (tiene cursos asignados)");
      setConfirmDelete(null);
    },
  });

  const openCreate = () => {
    setEditing(null);
    setForm(empty);
    setShowModal(true);
  };

  const openEdit = (cat: Category) => {
    setEditing(cat);
    setForm({ name: cat.name, slug: cat.slug, icon: cat.icon, color: cat.color, description: cat.description });
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setEditing(null);
    setForm(empty);
  };

  const handleNameChange = (name: string) => {
    setForm((f) => ({
      ...f,
      name,
      slug: f.slug === "" || !editing
        ? name.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "")
        : f.slug,
    }));
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
          <h1 className="text-2xl font-bold text-gray-900">Categorías</h1>
          <p className="text-gray-500 text-sm">Organiza los cursos por categoría</p>
        </div>
        <button
          onClick={openCreate}
          className="bg-[#2B55A3] text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-[#2B55A3]/90 transition-colors"
        >
          + Nueva categoría
        </button>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        {isLoading ? (
          <div className="p-8 text-center text-gray-400 text-sm">Cargando categorías...</div>
        ) : isError ? (
          <div className="p-8 text-center text-red-500 text-sm">Error al cargar categorías</div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="text-left px-4 py-3 text-gray-600 font-medium">Categoría</th>
                <th className="text-left px-4 py-3 text-gray-600 font-medium">Slug</th>
                <th className="text-left px-4 py-3 text-gray-600 font-medium">Color</th>
                <th className="text-left px-4 py-3 text-gray-600 font-medium">Descripción</th>
                <th className="text-right px-4 py-3 text-gray-600 font-medium">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {categorias?.length === 0 ? (
                <tr>
                  <td colSpan={5} className="text-center py-8 text-gray-400">Sin categorías aún</td>
                </tr>
              ) : (
                categorias?.map((cat) => (
                  <tr key={cat.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <span className="text-lg">{cat.icon}</span>
                        <span className="font-medium text-gray-900">{cat.name}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-gray-500 font-mono text-xs">{cat.slug}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <div className="w-4 h-4 rounded-full border border-gray-200" style={{ backgroundColor: cat.color }} />
                        <span className="text-gray-500 text-xs">{cat.color}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-gray-500 max-w-xs truncate">{cat.description ?? "—"}</td>
                    <td className="px-4 py-3 text-right space-x-3">
                      <button onClick={() => openEdit(cat)} className="text-[#2B55A3] hover:underline text-xs">Editar</button>
                      <button onClick={() => setConfirmDelete(cat.id)} className="text-red-500 hover:underline text-xs">Eliminar</button>
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
          <div className="bg-white rounded-xl w-full max-w-md shadow-xl">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
              <h2 className="font-semibold text-gray-900">{editing ? "Editar categoría" : "Nueva categoría"}</h2>
              <button onClick={closeModal} className="text-gray-400 hover:text-gray-600 text-xl leading-none">&times;</button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div className="space-y-1">
                <label className="text-sm font-medium text-gray-700">Nombre *</label>
                <input
                  required
                  value={form.name}
                  onChange={(e) => handleNameChange(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#2B55A3]/30"
                />
              </div>
              <div className="space-y-1">
                <label className="text-sm font-medium text-gray-700">Slug *</label>
                <input
                  required
                  value={form.slug}
                  onChange={(e) => setForm({ ...form, slug: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-[#2B55A3]/30"
                />
                <p className="text-xs text-gray-400">Debe ser único, sin espacios ni caracteres especiales</p>
              </div>
              <div className="space-y-1">
                <label className="text-sm font-medium text-gray-700">Ícono</label>
                <div className="flex flex-wrap gap-2">
                  {ICONS.map((icon) => (
                    <button
                      key={icon}
                      type="button"
                      onClick={() => setForm({ ...form, icon })}
                      className={`text-xl p-2 rounded-lg border transition-colors ${form.icon === icon ? "border-[#2B55A3] bg-blue-50" : "border-gray-200 hover:bg-gray-50"}`}
                    >
                      {icon}
                    </button>
                  ))}
                </div>
              </div>
              <div className="space-y-1">
                <label className="text-sm font-medium text-gray-700">Color</label>
                <div className="flex items-center gap-3">
                  <input
                    type="color"
                    value={form.color}
                    onChange={(e) => setForm({ ...form, color: e.target.value })}
                    className="w-10 h-10 rounded border border-gray-300 cursor-pointer"
                  />
                  <span className="text-sm text-gray-500 font-mono">{form.color}</span>
                </div>
              </div>
              <div className="space-y-1">
                <label className="text-sm font-medium text-gray-700">Descripción</label>
                <textarea
                  value={form.description ?? ""}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  rows={2}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#2B55A3]/30"
                />
              </div>
              <div className="flex justify-end gap-3 pt-2">
                <button type="button" onClick={closeModal} className="px-4 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-50">Cancelar</button>
                <button type="submit" disabled={isPending} className="px-4 py-2 text-sm bg-[#2B55A3] text-white rounded-lg hover:bg-[#2B55A3]/90 disabled:opacity-50">
                  {isPending ? "Guardando..." : editing ? "Guardar cambios" : "Crear categoría"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal confirmar eliminación */}
      {confirmDelete && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-sm shadow-xl">
            <h2 className="font-semibold text-gray-900 mb-2">¿Eliminar esta categoría?</h2>
            <p className="text-sm text-gray-500 mb-5">Solo se puede eliminar si no tiene cursos asignados.</p>
            <div className="flex justify-end gap-3">
              <button onClick={() => setConfirmDelete(null)} className="px-4 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-50">Cancelar</button>
              <button
                onClick={() => deleteMutation.mutate(confirmDelete)}
                disabled={deleteMutation.isPending}
                className="px-4 py-2 text-sm bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50"
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
