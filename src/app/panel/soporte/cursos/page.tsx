"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { cursosService } from "@/lib/services/cursos";
import { categoriasService } from "@/lib/services/categorias";
import { toast } from "sonner";
import Link from "next/link";

const STATUS_LABELS = {
  draft: "Borrador",
  published: "Publicado",
  archived: "Archivado",
};

const STATUS_STYLES = {
  draft: "bg-gray-100 text-gray-700",
  published: "bg-green-50 text-green-700",
  archived: "bg-yellow-50 text-yellow-700",
};

export default function SoporteCursosPage() {
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [categoriaFilter, setCategoriaFilter] = useState("");
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);

  const { data, isLoading, isError } = useQuery({
    queryKey: ["cursos", page, search, statusFilter, categoriaFilter],
    queryFn: () =>
      cursosService.list({
        page,
        limit: 12,
        search: search || undefined,
        status: statusFilter || undefined,
        categoria_id: categoriaFilter || undefined,
      }),
  });

  const { data: categorias } = useQuery({
    queryKey: ["categorias"],
    queryFn: categoriasService.list,
  });

  const deleteMutation = useMutation({
    mutationFn: cursosService.delete,
    onSuccess: () => {
      toast.success("Curso eliminado");
      queryClient.invalidateQueries({ queryKey: ["cursos"] });
      setConfirmDelete(null);
    },
    onError: (err: unknown) => {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      toast.error(msg ?? "No se pudo eliminar el curso");
      setConfirmDelete(null);
    },
  });

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Cursos</h1>
          <p className="text-gray-500 text-sm">Gestión del catálogo de cursos</p>
        </div>
        <Link
          href="/panel/soporte/cursos/nuevo"
          className="bg-[#2B55A3] text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-[#2B55A3]/90 transition-colors"
        >
          + Crear curso
        </Link>
      </div>

      {/* Filtros */}
      <div className="flex flex-wrap gap-3 mb-5">
        <input
          type="text"
          placeholder="Buscar por título..."
          value={search}
          onChange={(e) => { setSearch(e.target.value); setPage(1); }}
          className="border border-gray-300 rounded-lg px-3 py-2 text-sm w-56 focus:outline-none focus:ring-2 focus:ring-[#2B55A3]/30"
        />
        <select
          value={statusFilter}
          onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
          className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none"
        >
          <option value="">Todos los estados</option>
          <option value="draft">Borrador</option>
          <option value="published">Publicado</option>
          <option value="archived">Archivado</option>
        </select>
        <select
          value={categoriaFilter}
          onChange={(e) => { setCategoriaFilter(e.target.value); setPage(1); }}
          className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none"
        >
          <option value="">Todas las categorías</option>
          {categorias?.map((c) => (
            <option key={c.id} value={c.id}>{c.name}</option>
          ))}
        </select>
      </div>

      {/* Tabla */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        {isLoading ? (
          <div className="p-8 text-center text-gray-400 text-sm">Cargando cursos...</div>
        ) : isError ? (
          <div className="p-8 text-center text-red-500 text-sm">Error al cargar cursos</div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="text-left px-4 py-3 text-gray-600 font-medium">Curso</th>
                <th className="text-left px-4 py-3 text-gray-600 font-medium">Categoría</th>
                <th className="text-left px-4 py-3 text-gray-600 font-medium">Precio</th>
                <th className="text-left px-4 py-3 text-gray-600 font-medium">Matriculados</th>
                <th className="text-left px-4 py-3 text-gray-600 font-medium">Estado</th>
                <th className="text-right px-4 py-3 text-gray-600 font-medium">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {data?.data.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center py-8 text-gray-400">Sin cursos encontrados</td>
                </tr>
              ) : (
                data?.data.map((curso) => (
                  <tr key={curso.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        {curso.thumbnail_url && (
                          <img src={curso.thumbnail_url} alt="" className="w-10 h-10 rounded object-cover bg-gray-100" />
                        )}
                        <div>
                          <p className="font-medium text-gray-900">{curso.title}</p>
                          <p className="text-xs text-gray-400">{curso.level}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-gray-600">{curso.category?.name ?? "—"}</td>
                    <td className="px-4 py-3 text-gray-900 font-medium">
                      {curso.currency} {curso.price}
                      {curso.discount_price && (
                        <span className="ml-1 text-xs text-gray-400 line-through">{curso.discount_price}</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-gray-600">{curso.enrolled_count}</td>
                    <td className="px-4 py-3">
                      <span className={`text-xs px-2 py-1 rounded-full ${STATUS_STYLES[curso.status]}`}>
                        {STATUS_LABELS[curso.status]}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right space-x-2 whitespace-nowrap">
                      <Link
                        href={`/panel/soporte/cursos/${curso.id}/contenido`}
                        className="text-[#2B55A3] hover:underline text-xs"
                      >
                        Contenido
                      </Link>
                      <Link
                        href={`/panel/soporte/cursos/${curso.id}/editar`}
                        className="text-gray-600 hover:underline text-xs"
                      >
                        Editar
                      </Link>
                      <button
                        onClick={() => setConfirmDelete(curso.id)}
                        className="text-red-500 hover:underline text-xs"
                      >
                        Eliminar
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        )}

        {data && data.total_pages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-gray-100 text-sm text-gray-500">
            <span>Página {page} de {data.total_pages} — {data.total} cursos</span>
            <div className="flex gap-2">
              <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1} className="px-3 py-1 border rounded-lg disabled:opacity-40 hover:bg-gray-50">
                Anterior
              </button>
              <button onClick={() => setPage((p) => Math.min(data.total_pages, p + 1))} disabled={page === data.total_pages} className="px-3 py-1 border rounded-lg disabled:opacity-40 hover:bg-gray-50">
                Siguiente
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Modal confirmar eliminación */}
      {confirmDelete && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-sm shadow-xl">
            <h2 className="font-semibold text-gray-900 mb-2">¿Eliminar este curso?</h2>
            <p className="text-sm text-gray-500 mb-5">Esta acción no se puede deshacer. Los estudiantes matriculados mantendrán acceso.</p>
            <div className="flex justify-end gap-3">
              <button onClick={() => setConfirmDelete(null)} className="px-4 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-50">
                Cancelar
              </button>
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
