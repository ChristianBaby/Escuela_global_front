"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { cursosService } from "@/lib/services/courses";
import { categoriasService } from "@/lib/services/categories";
import Link from "next/link";
import {
  Search,
  BookOpen,
  Users,
  Loader2,
  ChevronLeft,
  ChevronRight,
  Filter,
} from "lucide-react";

const LEVEL_LABELS: Record<string, string> = {
  principiante: "Principiante",
  intermedio: "Intermedio",
  avanzado: "Avanzado",
};

export default function CoordinadorCursosPage() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [categoriaFilter, setCategoriaFilter] = useState("");

  const { data, isLoading, isError } = useQuery({
    queryKey: ["coordinador-cursos", page, search, categoriaFilter],
    queryFn: () =>
      cursosService.listCatalog({
        page,
        limit: 12,
        search: search || undefined,
        categoria_id: categoriaFilter || undefined,
      }),
  });

  const { data: categorias } = useQuery({
    queryKey: ["categorias"],
    queryFn: categoriasService.list,
  });

  return (
    <div>
      {/* ── Encabezado ──────────────────────────────────────────────────────── */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-brand-primary">Cursos</h1>
        <p className="text-gray-500 text-sm mt-0.5">Catálogo de cursos publicados</p>
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
          value={categoriaFilter}
          onChange={(e) => { setCategoriaFilter(e.target.value); setPage(1); }}
          className="border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-[#084D95]/20 focus:border-[#084D95] bg-white"
        >
          <option value="">Todas las categorías</option>
          {categorias?.map((c) => (
            <option key={c.id} value={c.id}>{c.name}</option>
          ))}
        </select>
        {(search || categoriaFilter) && (
          <button
            onClick={() => { setSearch(""); setCategoriaFilter(""); setPage(1); }}
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
                  <th className="text-right px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {data?.data.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="text-center py-12 text-gray-400">
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
                        <span className="font-semibold text-gray-900">{curso.currency} {curso.price}</span>
                        {curso.discount_price && (
                          <span className="ml-1.5 text-xs text-gray-400 line-through">{curso.discount_price}</span>
                        )}
                      </td>

                      {/* Matriculados */}
                      <td className="px-4 py-3.5">
                        <span className="flex items-center gap-1.5 text-gray-600">
                          <Users size={13} className="text-gray-400" />
                          {curso.enrolled_count ?? 0}
                        </span>
                      </td>

                      {/* Acciones */}
                      <td className="px-5 py-3.5">
                        <div className="flex items-center justify-end gap-1">
                          <Link
                            href={`/panel/cursos/${curso.id}/matriculados`}
                            className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs text-purple-600 hover:bg-purple-50 rounded-lg transition-colors"
                            title="Ver matriculados"
                          >
                            <Users size={13} />
                            Matriculados
                          </Link>
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
    </div>
  );
}
