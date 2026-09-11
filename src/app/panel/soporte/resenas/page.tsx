"use client";

import { Suspense, useState } from "react";
import { useSearchParams } from "next/navigation";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Star, Eye, EyeOff, MessageSquareText, X } from "lucide-react";
import { reviewsService } from "@/lib/services/reviews";
import { cursosService } from "@/lib/services/courses";
import type { ReviewStatus } from "@/types";

type EstadoFiltro = "todas" | ReviewStatus;

const ESTADO_TABS: { value: EstadoFiltro; label: string }[] = [
  { value: "todas", label: "Todas" },
  { value: "approved", label: "Mostradas" },
  { value: "hidden", label: "Ocultas" },
];

const PAGE_SIZE = 20;

function Stars({ rating }: { rating: number }) {
  return (
    <div className="flex items-center gap-0.5">
      {Array.from({ length: 5 }).map((_, i) => (
        <Star
          key={i}
          size={13}
          className={i < rating ? "text-amber-400 fill-amber-400" : "text-gray-200 fill-gray-200"}
        />
      ))}
    </div>
  );
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("es", { year: "numeric", month: "short", day: "numeric" });
}

function ResenasContent() {
  const searchParams = useSearchParams();
  const queryClient = useQueryClient();
  const [cursoId, setCursoId] = useState(searchParams.get("curso_id") ?? "");
  const [estado, setEstado] = useState<EstadoFiltro>("todas");
  const [page, setPage] = useState(1);

  const { data: cursosData } = useQuery({
    queryKey: ["cursos-para-filtro-resenas"],
    queryFn: () => cursosService.list({ limit: 200 }),
  });

  const { data, isLoading } = useQuery({
    queryKey: ["admin-resenas", cursoId, estado, page],
    queryFn: () =>
      reviewsService.list({
        page,
        limit: PAGE_SIZE,
        course_id: cursoId || undefined,
        status: estado === "todas" ? undefined : estado,
      }),
  });

  const toggleMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: ReviewStatus }) =>
      reviewsService.updateStatus(id, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-resenas"] });
      toast.success("Reseña actualizada");
    },
    onError: () => toast.error("No se pudo actualizar la reseña"),
  });

  const reviews = data?.data ?? [];
  const totalPages = data?.total_pages ?? 1;
  const cursoActivo = (cursosData?.data ?? []).find((c) => c.id === cursoId);

  function handleFilterChange(fn: () => void) {
    fn();
    setPage(1);
  }

  return (
    <div className="space-y-5 max-w-6xl mx-auto">
      <div>
        {cursoId ? (
          <>
            <h1 className="text-2xl font-bold text-brand-primary">
              Reseñas de {cursoActivo?.title ?? "este curso"}
            </h1>
            <button
              onClick={() => handleFilterChange(() => setCursoId(""))}
              className="flex items-center gap-1 text-xs font-medium text-brand-primary hover:underline mt-1"
            >
              <X size={12} />
              Ver reseñas de todos los cursos
            </button>
          </>
        ) : (
          <>
            <h1 className="text-2xl font-bold text-brand-primary">Reseñas</h1>
            <p className="text-sm text-gray-500 mt-0.5">
              Modera las reseñas que dejan los estudiantes — las ocultas no se muestran en la página del curso.
            </p>
          </>
        )}
      </div>

      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        {/* Filtros */}
        <div className="px-5 py-4 border-b border-gray-100 flex flex-col sm:flex-row sm:items-center gap-3">
          <div className="flex items-center gap-1 flex-1">
            {ESTADO_TABS.map((tab) => (
              <button
                key={tab.value}
                onClick={() => handleFilterChange(() => setEstado(tab.value))}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                  estado === tab.value
                    ? "bg-brand-primary text-white"
                    : "text-gray-500 hover:bg-gray-100"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <select
            value={cursoId}
            onChange={(e) => handleFilterChange(() => setCursoId(e.target.value))}
            className="border border-gray-300 rounded-lg px-3 h-9 text-sm outline-none focus:ring-2 focus:ring-brand-primary/30 bg-white sm:w-64"
          >
            <option value="">Todos los cursos</option>
            {(cursosData?.data ?? []).map((c) => (
              <option key={c.id} value={c.id}>
                {c.title}
              </option>
            ))}
          </select>
        </div>

        {/* Tabla */}
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                {!cursoId && (
                  <th className="text-left px-4 py-3 text-gray-500 font-medium text-xs uppercase tracking-wide">Curso</th>
                )}
                <th className="text-left px-4 py-3 text-gray-500 font-medium text-xs uppercase tracking-wide">Estudiante</th>
                <th className="text-left px-4 py-3 text-gray-500 font-medium text-xs uppercase tracking-wide">Calificación</th>
                <th className="text-left px-4 py-3 text-gray-500 font-medium text-xs uppercase tracking-wide">Comentario</th>
                <th className="text-left px-4 py-3 text-gray-500 font-medium text-xs uppercase tracking-wide">Fecha</th>
                <th className="text-left px-4 py-3 text-gray-500 font-medium text-xs uppercase tracking-wide">Estado</th>
                <th className="text-right px-4 py-3 text-gray-500 font-medium text-xs uppercase tracking-wide">Acción</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {isLoading && (
                <tr>
                  <td colSpan={cursoId ? 6 : 7} className="text-center py-10 text-gray-400 text-sm">
                    Cargando reseñas...
                  </td>
                </tr>
              )}

              {!isLoading && reviews.length === 0 && (
                <tr>
                  <td colSpan={cursoId ? 6 : 7} className="text-center py-10 text-gray-400 text-sm">
                    <MessageSquareText size={28} className="mx-auto mb-2 text-gray-300" />
                    No hay reseñas con estos filtros.
                  </td>
                </tr>
              )}

              {reviews.map((review) => {
                const isHidden = review.status === "hidden";
                const isPending =
                  toggleMutation.isPending && toggleMutation.variables?.id === review.id;
                return (
                  <tr key={review.id} className={isHidden ? "bg-gray-50/60" : undefined}>
                    {!cursoId && (
                      <td className="px-4 py-3 text-gray-900 max-w-[180px] truncate">
                        {review.course?.title ?? "—"}
                      </td>
                    )}
                    <td className="px-4 py-3 text-gray-700">
                      {review.user ? `${review.user.first_name} ${review.user.last_name}` : "—"}
                    </td>
                    <td className="px-4 py-3">
                      <Stars rating={review.rating} />
                    </td>
                    <td className="px-4 py-3 text-gray-600 max-w-sm">
                      <p className="whitespace-pre-line leading-relaxed">{review.comment}</p>
                    </td>
                    <td className="px-4 py-3 text-gray-400 whitespace-nowrap">
                      {formatDate(review.created_at)}
                    </td>
                    <td className="px-4 py-3">
                      {isHidden ? (
                        <span className="inline-flex items-center gap-1 text-xs bg-gray-100 text-gray-500 px-2.5 py-1 rounded-full font-medium">
                          <EyeOff size={11} /> Oculta
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-xs bg-emerald-50 text-emerald-700 px-2.5 py-1 rounded-full font-medium">
                          <Eye size={11} /> Visible
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <button
                        onClick={() =>
                          toggleMutation.mutate({
                            id: review.id,
                            status: isHidden ? "approved" : "hidden",
                          })
                        }
                        disabled={isPending}
                        className={`inline-flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-lg transition-colors disabled:opacity-50 ${
                          isHidden
                            ? "bg-brand-primary/10 text-brand-primary hover:bg-brand-primary hover:text-white"
                            : "border border-gray-300 text-gray-600 hover:bg-gray-100"
                        }`}
                      >
                        {isHidden ? <Eye size={13} /> : <EyeOff size={13} />}
                        {isHidden ? "Mostrar" : "Ocultar"}
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Paginación */}
        {!isLoading && (data?.total ?? 0) > 0 && (
          <div className="flex items-center justify-between px-5 py-3 border-t border-gray-100 text-xs text-gray-500">
            <span>
              Página {page} de {totalPages} — {data?.total} reseña(s)
            </span>
            <div className="flex gap-2">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="px-3 py-1 border rounded-lg disabled:opacity-40 hover:bg-gray-50 text-xs"
              >
                Anterior
              </button>
              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="px-3 py-1 border rounded-lg disabled:opacity-40 hover:bg-gray-50 text-xs"
              >
                Siguiente
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default function ResenasPage() {
  return (
    <Suspense fallback={<div className="max-w-6xl mx-auto py-10 text-center text-gray-400">Cargando...</div>}>
      <ResenasContent />
    </Suspense>
  );
}
