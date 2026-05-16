"use client";

import { useState, useCallback } from "react";
import { useQuery } from "@tanstack/react-query";
import { useParams } from "next/navigation";
import Link from "next/link";
import { cursosService } from "@/lib/services/courses";
import { dashboardService, type MatriculadoCurso } from "@/lib/services/dashboard";
import { Download, ArrowLeft, Users, TrendingUp, Clock, Trophy } from "lucide-react";

const STATUS_LABELS: Record<string, string> = {
  activo: "Activo",
  completado: "Completado",
  inactivo: "Inactivo",
};

const STATUS_STYLES: Record<string, string> = {
  activo: "bg-blue-50 text-blue-700",
  completado: "bg-green-50 text-green-700",
  inactivo: "bg-gray-100 text-gray-500",
};

function StatCard({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5">
      <div className="flex items-center gap-2 mb-2">
        <span className="text-[#2B55A3]">{icon}</span>
        <p className="text-xs text-gray-500">{label}</p>
      </div>
      <p className="text-2xl font-bold text-gray-900">{value}</p>
    </div>
  );
}

export default function MatriculadosCursoPage() {
  const params = useParams();
  const courseId = params.id as string;

  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [typeFilter, setTypeFilter] = useState("");

  const { data: curso } = useQuery({
    queryKey: ["curso", courseId],
    queryFn: () => cursosService.get(courseId),
  });

  const { data, isLoading, isError } = useQuery({
    queryKey: ["admin-matriculados", courseId, page, search, statusFilter, typeFilter],
    queryFn: () =>
      dashboardService.getMatriculadosCurso(courseId, {
        page,
        limit: 15,
        search: search || undefined,
        status: statusFilter || undefined,
        enrollment_type: typeFilter || undefined,
      }),
  });

  const exportCsv = useCallback(() => {
    if (!data?.data?.length) return;
    const rows: string[][] = [
      [
        "Nombre",
        "Email",
        "Matriculado",
        "Progreso (%)",
        "Última actividad",
        "Estado",
        "Método de pago",
      ],
      ...data.data.map((m: MatriculadoCurso) => [
        `${m.user.first_name} ${m.user.last_name}`,
        m.user.email,
        new Date(m.enrolled_at).toLocaleDateString("es-PE"),
        String(m.progress_percent),
        m.last_accessed_at
          ? new Date(m.last_accessed_at).toLocaleDateString("es-PE")
          : "",
        STATUS_LABELS[m.status] ?? m.status,
        m.enrollment_type === "online"
          ? "Online"
          : `Manual${m.offline_payment_method ? ` (${m.offline_payment_method})` : ""}`,
      ]),
    ];
    const csv = rows.map((r) => r.map((c) => `"${c}"`).join(",")).join("\n");
    const blob = new Blob(["﻿" + csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `matriculados-${courseId}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }, [data, courseId]);

  const stats = data?.stats;

  return (
    <div>
      {/* Header */}
      <div className="mb-6">
        <Link
          href="/panel/soporte/cursos"
          className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700 mb-3"
        >
          <ArrowLeft size={14} /> Volver a cursos
        </Link>
        <h1 className="text-2xl font-bold text-gray-900">
          Matriculados{curso ? ` — ${curso.title}` : ""}
        </h1>
        <p className="text-gray-500 text-sm">Reporte detallado de estudiantes matriculados</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatCard
          icon={<Users size={18} />}
          label="Total matriculados"
          value={stats ? stats.total.toLocaleString() : "—"}
        />
        <StatCard
          icon={<TrendingUp size={18} />}
          label="Progreso promedio"
          value={stats ? `${stats.avg_progress}%` : "—"}
        />
        <StatCard
          icon={<Clock size={18} />}
          label="Activos (7 días)"
          value={stats ? stats.activos_7_dias.toLocaleString() : "—"}
        />
        <StatCard
          icon={<Trophy size={18} />}
          label="Tasa de finalización"
          value={stats ? `${stats.tasa_finalizacion}%` : "—"}
        />
      </div>

      {/* Filtros + Export */}
      <div className="flex flex-wrap gap-3 mb-5">
        <input
          type="text"
          placeholder="Buscar por nombre o email..."
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setPage(1);
          }}
          className="border border-gray-300 rounded-lg px-3 py-2 text-sm w-64 focus:outline-none focus:ring-2 focus:ring-[#2B55A3]/30"
        />
        <select
          value={statusFilter}
          onChange={(e) => {
            setStatusFilter(e.target.value);
            setPage(1);
          }}
          className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none"
        >
          <option value="">Todos los estados</option>
          <option value="activo">Activo</option>
          <option value="completado">Completado</option>
          <option value="inactivo">Inactivo</option>
        </select>
        <select
          value={typeFilter}
          onChange={(e) => {
            setTypeFilter(e.target.value);
            setPage(1);
          }}
          className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none"
        >
          <option value="">Todos los métodos</option>
          <option value="online">Online</option>
          <option value="manual">Manual</option>
        </select>
        <button
          onClick={exportCsv}
          disabled={!data?.data?.length}
          className="ml-auto flex items-center gap-2 px-4 py-2 text-sm bg-[#2B55A3] text-white rounded-lg hover:bg-[#2B55A3]/90 disabled:opacity-40 transition-colors"
        >
          <Download size={15} />
          Exportar CSV
        </button>
      </div>

      {/* Tabla */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        {isLoading ? (
          <div className="p-8 text-center text-gray-400 text-sm">Cargando matriculados...</div>
        ) : isError ? (
          <div className="p-8 text-center text-red-500 text-sm">Error al cargar datos</div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="text-left px-4 py-3 text-gray-600 font-medium">Estudiante</th>
                <th className="text-left px-4 py-3 text-gray-600 font-medium">Matriculado</th>
                <th className="text-left px-4 py-3 text-gray-600 font-medium">Progreso</th>
                <th className="text-left px-4 py-3 text-gray-600 font-medium">Última actividad</th>
                <th className="text-left px-4 py-3 text-gray-600 font-medium">Estado</th>
                <th className="text-left px-4 py-3 text-gray-600 font-medium">Método</th>
                <th className="text-right px-4 py-3 text-gray-600 font-medium">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {data?.data.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-10 text-gray-400">
                    Sin matriculados encontrados
                  </td>
                </tr>
              ) : (
                data?.data.map((m: MatriculadoCurso) => (
                  <tr key={m.enrollment_id} className="hover:bg-gray-50">
                    <td className="px-4 py-3">
                      <p className="font-medium text-gray-900">
                        {m.user.first_name} {m.user.last_name}
                      </p>
                      <p className="text-xs text-gray-400">{m.user.email}</p>
                    </td>
                    <td className="px-4 py-3 text-gray-600">
                      {new Date(m.enrolled_at).toLocaleDateString("es-PE")}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <div className="w-20 h-1.5 bg-gray-200 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-[#2B55A3] rounded-full"
                            style={{ width: `${m.progress_percent}%` }}
                          />
                        </div>
                        <span className="text-xs text-gray-600">{m.progress_percent}%</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-gray-500 text-sm">
                      {m.last_accessed_at
                        ? new Date(m.last_accessed_at).toLocaleDateString("es-PE")
                        : "—"}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`text-xs px-2 py-1 rounded-full ${STATUS_STYLES[m.status] ?? "bg-gray-100 text-gray-500"}`}
                      >
                        {STATUS_LABELS[m.status] ?? m.status}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      {m.enrollment_type === "online" ? (
                        <span className="bg-blue-50 text-blue-700 text-xs px-2 py-1 rounded-full">
                          Online
                        </span>
                      ) : (
                        <span className="bg-amber-50 text-amber-700 text-xs px-2 py-1 rounded-full">
                          Manual{m.offline_payment_method ? ` · ${m.offline_payment_method}` : ""}
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <Link
                        href={`/panel/estudiantes/${m.user.id}/cursos/${courseId}`}
                        className="text-[#2B55A3] hover:underline text-xs"
                      >
                        Ver actividad
                      </Link>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        )}

        {data && data.total_pages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-gray-100 text-sm text-gray-500">
            <span>
              Página {page} de {data.total_pages} — {data.total} matriculados
            </span>
            <div className="flex gap-2">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="px-3 py-1 border rounded-lg disabled:opacity-40 hover:bg-gray-50"
              >
                Anterior
              </button>
              <button
                onClick={() => setPage((p) => Math.min(data.total_pages, p + 1))}
                disabled={page === data.total_pages}
                className="px-3 py-1 border rounded-lg disabled:opacity-40 hover:bg-gray-50"
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
