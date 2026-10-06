"use client";

import { useRef, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { cursosService, type ImportCoursesResult } from "@/lib/services/courses";
import { categoriasService } from "@/lib/services/categories";
import { useAuthStore } from "@/store/authStore";
import { toast } from "sonner";
import Link from "next/link";
import { ImagePreviewModal } from "@/components/molecules";
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
  Star,
  Download,
  Upload,
  CheckCircle2,
  XCircle,
} from "lucide-react";

function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

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
  const [previewCursoId, setPreviewCursoId] = useState<string | null>(null);
  const [exportMenuOpen, setExportMenuOpen] = useState(false);
  const [exporting, setExporting] = useState<"excel" | "json" | null>(null);
  const [importResult, setImportResult] = useState<ImportCoursesResult | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

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
  const previewCurso = data?.data.find((c) => c.id === previewCursoId);

  const importMutation = useMutation({
    mutationFn: cursosService.importCoursesExcel,
    onSuccess: (result) => {
      setImportResult(result);
      if (result.imported.length > 0) {
        queryClient.invalidateQueries({ queryKey: ["cursos"] });
      }
    },
    onError: (err: unknown) => {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      toast.error(msg ?? "No se pudo importar el archivo");
    },
  });

  async function handleExport(format: "excel" | "json") {
    setExportMenuOpen(false);
    setExporting(format);
    try {
      if (format === "excel") {
        const blob = await cursosService.exportCoursesExcel();
        downloadBlob(blob, "cursos-export.xlsx");
      } else {
        const data = await cursosService.exportCoursesJson();
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
        downloadBlob(blob, "cursos-export.json");
      }
    } catch {
      toast.error("No se pudo exportar el catálogo");
    } finally {
      setExporting(null);
    }
  }

  function handleImportFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) importMutation.mutate(file);
    e.target.value = "";
  }

  return (
    <div>
      {/* ── Encabezado ──────────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-brand-primary">Cursos</h1>
          <p className="text-gray-500 text-sm mt-0.5">Gestión del catálogo de cursos</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="relative">
            <button
              type="button"
              onClick={() => setExportMenuOpen((v) => !v)}
              disabled={exporting !== null}
              className="inline-flex items-center gap-2 border border-gray-300 text-gray-700 px-3.5 py-2 rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors disabled:opacity-50"
            >
              {exporting ? <Loader2 size={15} className="animate-spin" /> : <Download size={15} />}
              Exportar
            </button>
            {exportMenuOpen && (
              <div
                className="absolute right-0 mt-1 w-36 bg-white border border-gray-200 rounded-lg shadow-lg z-10 overflow-hidden"
                onMouseLeave={() => setExportMenuOpen(false)}
              >
                <button
                  onClick={() => handleExport("excel")}
                  className="w-full text-left px-3.5 py-2 text-sm text-gray-700 hover:bg-gray-50"
                >
                  Excel (.xlsx)
                </button>
                <button
                  onClick={() => handleExport("json")}
                  className="w-full text-left px-3.5 py-2 text-sm text-gray-700 hover:bg-gray-50"
                >
                  JSON
                </button>
              </div>
            )}
          </div>

          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={importMutation.isPending}
            className="inline-flex items-center gap-2 border border-gray-300 text-gray-700 px-3.5 py-2 rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors disabled:opacity-50"
          >
            {importMutation.isPending ? <Loader2 size={15} className="animate-spin" /> : <Upload size={15} />}
            Importar
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept=".xlsx"
            className="hidden"
            onChange={handleImportFileChange}
          />

          <Link
            href="/panel/soporte/cursos/nuevo"
            className="inline-flex items-center gap-2 bg-[#084D95] text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-[#084D95]/90 transition-colors"
          >
            <Plus size={16} />
            Crear curso
          </Link>
        </div>
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
                        <button
                          onClick={() => setPreviewCursoId(curso.id)}
                          className="flex items-center gap-3 text-left group"
                          title={curso.title}
                        >
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
                            <p className="font-medium text-gray-900 line-clamp-2 max-w-[260px] group-hover:text-[#084D95] transition-colors">{curso.title}</p>
                            <p className="text-xs text-gray-400 mt-0.5">
                              {LEVEL_LABELS[curso.level] ?? curso.level}
                            </p>
                          </div>
                        </button>
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
                            href={`/panel/soporte/resenas?curso_id=${curso.id}`}
                            className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs text-amber-600 hover:bg-amber-50 rounded-lg transition-colors w-[132px] shrink-0"
                            title="Reseñas del curso"
                          >
                            <Star size={13} className="fill-amber-500 text-amber-500 shrink-0" />
                            Reseñas
                            {curso.review_count > 0 && (
                              <span className="text-gray-400 font-normal tabular-nums">
                                {curso.avg_rating.toFixed(1)} ({curso.review_count})
                              </span>
                            )}
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

      {/* ── Modal vista ampliada del curso ───────────────────────────────────── */}
      {previewCurso && (
        <ImagePreviewModal
          title={previewCurso.title}
          thumbnailUrl={previewCurso.thumbnail_url}
          onClose={() => setPreviewCursoId(null)}
          details={
            <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
              <span>{previewCurso.category?.name ?? "Sin categoría"}</span>
              <span>·</span>
              <span>{LEVEL_LABELS[previewCurso.level] ?? previewCurso.level}</span>
              <span>·</span>
              <span>{previewCurso.enrolled_count ?? 0} matriculados</span>
              <span className={`inline-flex items-center text-xs font-medium px-2.5 py-0.5 rounded-full ${STATUS_STYLES[previewCurso.status] ?? "bg-gray-100 text-gray-600"}`}>
                {STATUS_LABELS[previewCurso.status] ?? previewCurso.status}
              </span>
            </div>
          }
        />
      )}

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
              <p className="text-sm text-[#084D95] font-medium mb-2 break-words">
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

      {/* ── Modal resultado de import ─────────────────────────────────────────── */}
      {importResult && (
        <div
          className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4"
          onClick={() => setImportResult(null)}
        >
          <div
            className="bg-white rounded-xl p-6 w-full max-w-lg shadow-xl max-h-[85vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="font-semibold text-brand-primary mb-4">Resultado de la importación</h2>

            {importResult.imported.length > 0 && (
              <div className="mb-4">
                <p className="text-sm font-medium text-emerald-700 flex items-center gap-1.5 mb-2">
                  <CheckCircle2 size={15} />
                  {importResult.imported.length} curso(s) importado(s)
                </p>
                <ul className="space-y-1">
                  {importResult.imported.map((c) => (
                    <li key={c.id} className="text-xs text-gray-600 bg-emerald-50 rounded-lg px-3 py-2">
                      <span className="font-medium text-gray-800">{c.title}</span> — {c.modules_count} módulos, {c.sessions_count} sesiones, {c.materials_count} materiales
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {importResult.failed.length > 0 && (
              <div>
                <p className="text-sm font-medium text-red-600 flex items-center gap-1.5 mb-2">
                  <XCircle size={15} />
                  {importResult.failed.length} curso(s) con errores
                </p>
                <ul className="space-y-2">
                  {importResult.failed.map((f, i) => (
                    <li key={i} className="text-xs bg-red-50 rounded-lg px-3 py-2">
                      <p className="font-medium text-gray-800 mb-1">{f.title}</p>
                      <ul className="list-disc list-inside text-red-600 space-y-0.5">
                        {f.errors.map((e, j) => (
                          <li key={j}>{e}</li>
                        ))}
                      </ul>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            <div className="flex justify-end mt-5">
              <button
                onClick={() => setImportResult(null)}
                className="px-4 py-2 text-sm bg-[#084D95] text-white rounded-lg hover:bg-[#084D95]/90 transition-colors"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
