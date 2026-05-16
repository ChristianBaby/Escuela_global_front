"use client";

import { useQuery } from "@tanstack/react-query";
import { useParams, useRouter } from "next/navigation";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { dashboardService } from "@/lib/services/dashboard";
import { ArrowLeft, CheckCircle2, Clock, BookOpen, Calendar } from "lucide-react";

function secondsToHm(s: number): string {
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  if (h > 0) return `${h}h ${m}m`;
  return `${m}m`;
}

function InfoCard({
  icon,
  label,
  value,
  highlight,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  highlight?: boolean;
}) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5">
      <div className="flex items-center gap-2 mb-2">
        <span className={highlight ? "text-green-600" : "text-[#2B55A3]"}>{icon}</span>
        <p className="text-xs text-gray-500">{label}</p>
      </div>
      <p className={`text-xl font-bold ${highlight ? "text-green-700" : "text-gray-900"}`}>
        {value}
      </p>
    </div>
  );
}

export default function ActividadEstudiantePage() {
  const params = useParams();
  const router = useRouter();
  const userId = params.user_id as string;
  const courseId = params.course_id as string;

  const { data, isLoading, isError } = useQuery({
    queryKey: ["admin-actividad-estudiante", userId, courseId],
    queryFn: () => dashboardService.getActividadEstudiante(userId, courseId),
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64 text-gray-400 text-sm">
        Cargando actividad del estudiante...
      </div>
    );
  }

  if (isError || !data) {
    return (
      <div>
        <button
          onClick={() => router.back()}
          className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700 mb-4"
        >
          <ArrowLeft size={14} /> Volver
        </button>
        <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg px-4 py-3 text-sm">
          No se pudo cargar la actividad del estudiante.
        </div>
      </div>
    );
  }

  const { enrollment, user, course, sessions, activity_by_day } = data;
  const totalHours =
    Math.round((enrollment.total_watched_seconds / 3600) * 10) / 10;

  return (
    <div>
      {/* Header */}
      <div className="mb-6">
        <button
          onClick={() => router.back()}
          className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700 mb-3"
        >
          <ArrowLeft size={14} /> Volver a matriculados
        </button>
        <h1 className="text-2xl font-bold text-gray-900">
          {user.first_name} {user.last_name}
        </h1>
        <p className="text-gray-500 text-sm">
          {user.email} ·{" "}
          <span className="font-medium text-gray-700">{course.title}</span>
        </p>
      </div>

      {/* Info general */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <InfoCard
          icon={<Calendar size={16} />}
          label="Matriculado"
          value={new Date(enrollment.enrolled_at).toLocaleDateString("es-PE")}
        />
        <InfoCard
          icon={<BookOpen size={16} />}
          label="Progreso total"
          value={`${enrollment.progress_percent}%`}
        />
        <InfoCard
          icon={<Clock size={16} />}
          label="Tiempo total visto"
          value={secondsToHm(enrollment.total_watched_seconds)}
        />
        <InfoCard
          icon={<CheckCircle2 size={16} />}
          label="Estado"
          value={enrollment.completed_at ? "Completado" : "En progreso"}
          highlight={!!enrollment.completed_at}
        />
      </div>

      {/* Gráfico de actividad diaria */}
      {activity_by_day.length > 0 && (
        <div className="bg-white rounded-xl border border-gray-200 p-6 mb-6">
          <h3 className="text-sm font-semibold text-gray-700 mb-4">
            Actividad diaria — horas de estudio
          </h3>
          <ResponsiveContainer width="100%" height={180}>
            <BarChart data={activity_by_day}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis
                dataKey="date"
                tick={{ fontSize: 10 }}
                tickFormatter={(v: string) =>
                  new Date(v).toLocaleDateString("es-PE", {
                    month: "short",
                    day: "numeric",
                  })
                }
              />
              <YAxis
                tick={{ fontSize: 11 }}
                tickFormatter={(v: number) => `${v}h`}
              />
              <Tooltip
                formatter={(v) => [`${v}h`, "Horas"]}
                labelFormatter={(l) =>
                  new Date(String(l)).toLocaleDateString("es-PE", {
                    weekday: "short",
                    month: "short",
                    day: "numeric",
                  })
                }
              />
              <Bar dataKey="hours" fill="#2B55A3" radius={[3, 3, 0, 0]} name="Horas" />
            </BarChart>
          </ResponsiveContainer>
          <p className="text-xs text-gray-400 mt-2 text-right">
            Total acumulado: {totalHours}h
          </p>
        </div>
      )}

      {/* Tabla de sesiones */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100">
          <h3 className="text-sm font-semibold text-gray-700">Progreso por sesión</h3>
        </div>
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="text-left px-4 py-3 text-gray-600 font-medium">Módulo / Sesión</th>
              <th className="text-right px-4 py-3 text-gray-600 font-medium">Duración</th>
              <th className="text-right px-4 py-3 text-gray-600 font-medium">Tiempo visto</th>
              <th className="text-right px-4 py-3 text-gray-600 font-medium">% Visto</th>
              <th className="text-left px-4 py-3 text-gray-600 font-medium">Estado</th>
              <th className="text-left px-4 py-3 text-gray-600 font-medium">Última vez</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {sessions.length === 0 ? (
              <tr>
                <td colSpan={6} className="text-center py-10 text-gray-400">
                  Sin actividad registrada
                </td>
              </tr>
            ) : (
              sessions.map((s, i) => (
                <tr key={i} className="hover:bg-gray-50">
                  <td className="px-4 py-3">
                    <p className="text-gray-900">{s.session_title}</p>
                    <p className="text-xs text-gray-400">{s.module_title}</p>
                  </td>
                  <td className="px-4 py-3 text-right text-gray-600">
                    {s.duration_minutes} min
                  </td>
                  <td className="px-4 py-3 text-right text-gray-600">
                    {secondsToHm(s.watched_seconds)}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <div className="w-16 h-1.5 bg-gray-200 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-[#2B55A3] rounded-full"
                          style={{ width: `${Math.min(s.percent_watched, 100)}%` }}
                        />
                      </div>
                      <span className="text-xs text-gray-600">{s.percent_watched}%</span>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    {s.completed ? (
                      <span className="bg-green-50 text-green-700 text-xs px-2 py-1 rounded-full">
                        Completada
                      </span>
                    ) : s.watched_seconds > 0 ? (
                      <span className="bg-blue-50 text-blue-700 text-xs px-2 py-1 rounded-full">
                        En progreso
                      </span>
                    ) : (
                      <span className="bg-gray-100 text-gray-500 text-xs px-2 py-1 rounded-full">
                        No iniciada
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-gray-500 text-xs">
                    {s.last_watched_at
                      ? new Date(s.last_watched_at).toLocaleDateString("es-PE")
                      : "—"}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
