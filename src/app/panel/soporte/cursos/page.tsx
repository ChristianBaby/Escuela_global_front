"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { cursosService } from "@/lib/services/courses";
import { categoriasService } from "@/lib/services/categories";
import { useAuthStore } from "@/store/authStore";
import { toast } from "sonner";
import Link from "next/link";
import {
  Plus,
  Search,
  BookOpen,
  Pencil,
  Trash2,
  Users,
  FileText,
  Loader2,
  ChevronLeft,
  ChevronRight,
  Filter,
  Award,
} from "lucide-react";

// ── Constantes ─────────────────────────────────────────────────────────────────

const STATUS_LABELS: Record<string, string> = {
  draft: "Borrador",
  published: "Publicado",
  archived: "Archivado",
};

const STATUS_STYLES: Record<string, string> = {
  draft: "bg-gray-100 text-gray-600",
  published: "bg-green-50 text-green-700 ring-1 ring-green-200",
  archived: "bg-amber-50 text-amber-700 ring-1 ring-amber-200",
};

const LEVEL_LABELS: Record<string, string> = {
  principiante: "Principiante",
  intermedio: "Intermedio",
  avanzado: "Avanzado",
};

// ── Componente principal ───────────────────────────────────────────────────────

export default function SoporteCursosPage() {
  const queryClient = useQueryClient();
  const { user } = useAuthStore();
  const isAdmin = user?.role === "admin";

  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [categoriaFilter, setCategoriaFilter] = useState("");
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

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
      toast.success("Curso eliminado correctamente");
      queryClient.invalidateQueries({ queryKey: ["cursos"] });
      setConfirmDeleteId(null);
    },
    onError: (err: unknown) => {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      toast.error(msg ?? "No se pudo eliminar el curso");
      setConfirmDeleteId(null);
    },
  });

  const confirmDeleteCourse = data?.data.find((c) => c.id === confirmDeleteId);

  return (
    <div>
      {/* ── Encabezado ──────────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-brand-primary">Cursos</h1>
          <p className="text-gray-500 text-sm mt-0.5">Gestión del catálogo de cursos</p>
        </div>
        <Link
          href="/panel/soporte/cursos/nuevo"
          className="inline-flex items-center gap-2 bg-[#084D95] text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-[#084D95]/90 transition-colors"
        >
          <Plus size={16} />
          Crear curso
        </Link>
      </div>

      {/* ── Filtros ──────────────────────────────────────────────────────────── */}
      <div className="flex flex-wrap items-center gap-3 mb-5 p-4 bg-white rounded-xl border border-gray-200">
        <Filter size={15} className="text-gray-400 shrink-0" />
        <div className="relative flex-1 min-w-[200px]">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Buscar por título..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            className="w-full pl-9 pr-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#084D95]/20 focus:border-[#084D95]"
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
          className="border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-[#084D95]/20 focus:border-[#084D95] bg-white"
        >
          <option value="">Todos los estados</option>
          <option value="draft">Borrador</option>
          <option value="published">Publicado</option>
          <option value="archived">Archivado</option>
        </select>
        <select
          value={categoriaFilter}
          onChange={(e) => { setCategoriaFilter(e.target.value); setPage(1); }}
          className="border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-[#084D95]/20 focus:border-[#084D95] bg-white"
        >
          <option value="">Todas las categorías</option>
          {categorias?.map((c) => (
            <option key={c.id} value={c.id}>{c.name}</option>
          ))}
        </select>
        {(search || statusFilter || categoriaFilter) && (
          <button
            onClick={() => { setSearch(""); setStatusFilter(""); setCategoriaFilter(""); setPage(1); }}
            className="text-xs text-gray-500 hover:text-gray-700 underline"
          >
            Limpiar filtros
          </button>
        )}
      </div>

      {/* ── Tabla ────────────────────────────────────────────────────────────── */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        {isLoading ? (
          <div className="flex items-center justify-center gap-2 p-12 text-gray-400">
            <Loader2 size={20} className="animate-spin" />
            <span className="text-sm">Cargando cursos...</span>
          </div>
        ) : isError ? (
          <div className="p-12 text-center">
            <p className="text-red-500 text-sm font-medium">Error al cargar los cursos</p>
            <p className="text-gray-400 text-xs mt-1">Intenta recargar la página</p>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200">
                  <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Curso</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Categoría</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Precio</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Matriculados</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Estado</th>
                  <th className="text-right px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {data?.data.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="text-center py-12 text-gray-400">
                      <BookOpen size={32} className="mx-auto mb-2 opacity-30" />
                      <p className="text-sm">Sin cursos encontrados</p>
                    </td>
                  </tr>
                ) : (
                  data?.data.map((curso) => (
                    <tr key={curso.id} className="hover:bg-gray-50/60 transition-colors">
                      {/* Curso */}
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-3">
                          {curso.thumbnail_url ? (
                            <img
                              src={curso.thumbnail_url}
                              alt=""
                              className="w-11 h-11 rounded-lg object-cover bg-gray-100 shrink-0"
                            />
                          ) : (
                            <div className="w-11 h-11 rounded-lg bg-gray-100 flex items-center justify-center shrink-0">
                              <BookOpen size={18} className="text-gray-400" />
                            </div>
                          )}
                          <div className="min-w-0">
                            <p className="font-medium text-gray-900 truncate max-w-[220px]">{curso.title}</p>
                            <p className="text-xs text-gray-400 mt-0.5">
                              {LEVEL_LABELS[curso.level] ?? curso.level}
                            </p>
                          </div>
                        </div>
                      </td>

                      {/* Categoría */}
                      <td className="px-4 py-3.5">
                        <span className="text-sm text-gray-600">{curso.category?.name ?? "—"}</span>
                      </td>

                      {/* Precio */}
                      <td className="px-4 py-3.5">
                        <div className="flex flex-col">
                          <span className="font-semibold text-gray-900">
                            S/ {curso.discount_price_pen ?? curso.price_pen}
                            {curso.discount_price_pen && (
                              <span className="ml-1.5 text-xs text-gray-400 line-through font-normal">
                                {curso.price_pen}
                              </span>
                            )}
                          </span>
                          <span className="text-xs text-gray-400">
                            $ {curso.discount_price_usd ?? curso.price_usd}
                          </span>
                        </div>
                      </td>

                      {/* Matriculados */}
                      <td className="px-4 py-3.5">
                        <span className="flex items-center gap-1.5 text-gray-600">
                          <Users size={13} className="text-gray-400" />
                          {curso.enrolled_count ?? 0}
                        </span>
                      </td>

                      {/* Estado */}
                      <td className="px-4 py-3.5">
                        <span className={`inline-flex items-center text-xs font-medium px-2.5 py-1 rounded-full ${STATUS_STYLES[curso.status] ?? "bg-gray-100 text-gray-600"}`}>
                          {STATUS_LABELS[curso.status] ?? curso.status}
                        </span>
                      </td>

                      {/* Acciones */}
                      <td className="px-5 py-3.5">
                        <div className="flex items-center justify-end gap-1">
                          {isAdmin && (
                            <Link
                              href={`/panel/cursos/${curso.id}/matriculados`}
                              className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs text-purple-600 hover:bg-purple-50 rounded-lg transition-colors"
                              title="Ver matriculados"
                            >
                              <Users size={13} />
                              Matriculados
                            </Link>
                          )}
                          <Link
                            href={`/panel/soporte/cursos/${curso.id}/contenido`}
                            className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs text-[#084D95] hover:bg-blue-50 rounded-lg transition-colors"
                            title="Gestionar contenido"
                          >
                            <FileText size={13} />
                            Contenido
                          </Link>
                          <Link
                            href={`/panel/soporte/cursos/${curso.id}/certificaciones`}
                            className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors"
                            title="Certificaciones"
                          >
                            <Award size={13} />
                            Certificaciones
                          </Link>
                          <Link
                            href={`/panel/soporte/cursos/${curso.id}/editar`}
                            className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                            title="Editar curso"
                          >
                            <Pencil size={13} />
                            Editar
                          </Link>
                          <button
                            onClick={() => setConfirmDeleteId(curso.id)}
                            className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                            title="Eliminar curso"
                          >
                            <Trash2 size={13} />
                            Eliminar
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
            </div>

            {/* Paginación */}
            {data && data.total_pages > 1 && (
              <div className="flex items-center justify-between px-5 py-3 border-t border-gray-100">
                <span className="text-xs text-gray-500">
                  Página <span className="font-medium">{page}</span> de <span className="font-medium">{data.total_pages}</span>
                  {" "}— <span className="font-medium">{data.total}</span> cursos
                </span>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    disabled={page === 1}
                    className="p-1.5 rounded-lg border border-gray-200 text-gray-500 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                  >
                    <ChevronLeft size={15} />
                  </button>
                  <button
                    onClick={() => setPage((p) => Math.min(data.total_pages, p + 1))}
                    disabled={page === data.total_pages}
                    className="p-1.5 rounded-lg border border-gray-200 text-gray-500 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                  >
                    <ChevronRight size={15} />
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* ── Modal confirmar eliminación ──────────────────────────────────────── */}
      {confirmDeleteId && (
        <div
          className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4"
          onClick={() => setConfirmDeleteId(null)}
        >
          <div
            className="bg-white rounded-xl p-6 w-full max-w-sm shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="w-10 h-10 bg-red-50 rounded-full flex items-center justify-center mb-4">
              <Trash2 size={18} className="text-red-500" />
            </div>
            <h2 className="font-semibold text-brand-primary mb-1">¿Eliminar este curso?</h2>
            {confirmDeleteCourse && (
              <p className="text-sm text-[#084D95] font-medium mb-2 truncate">
                {confirmDeleteCourse.title}
              </p>
            )}
            <p className="text-sm text-gray-500 mb-5">
              Esta acción no se puede deshacer. Los estudiantes matriculados mantendrán acceso.
            </p>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setConfirmDeleteId(null)}
                className="px-4 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={() => deleteMutation.mutate(confirmDeleteId)}
                disabled={deleteMutation.isPending}
                className="px-4 py-2 text-sm bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 transition-colors flex items-center gap-2"
              >
                {deleteMutation.isPending && <Loader2 size={13} className="animate-spin" />}
                Eliminar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
