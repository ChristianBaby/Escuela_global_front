"use client";

import { useQuery } from "@tanstack/react-query";
import { dashboardService } from "@/lib/services/dashboard";
import { TrendingUp, TrendingDown, Users, BookOpen, Award } from "lucide-react";

export default function AdminDashboardPage() {
  const { data: stats, isLoading, isError } = useQuery({
    queryKey: ["admin-stats"],
    queryFn: dashboardService.getStats,
  });

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-1">Dashboard</h1>
      <p className="text-gray-500 mb-8">Resumen general de la plataforma</p>

      {isError && (
        <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg px-4 py-3 mb-6 text-sm">
          No se pudieron cargar las estadísticas. Verifica la conexión con el backend.
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <KpiCard
          label="Ingresos del mes"
          value={isLoading ? "..." : stats ? `$${stats.ingresos.total_mes.toLocaleString()}` : "—"}
          sub={stats ? `Online: $${stats.ingresos.online.toLocaleString()} · Manual: $${stats.ingresos.manual.toLocaleString()}` : undefined}
          trend={stats?.ingresos.cambio_porcentual}
          icon={<TrendingUp size={20} />}
        />
        <KpiCard
          label="Estudiantes"
          value={isLoading ? "..." : stats ? stats.estudiantes.total.toLocaleString() : "—"}
          sub={stats ? `+${stats.estudiantes.nuevos_mes} este mes` : undefined}
          icon={<Users size={20} />}
        />
        <KpiCard
          label="Cursos activos"
          value={isLoading ? "..." : stats ? stats.cursos.total_activos.toLocaleString() : "—"}
          sub={stats ? `+${stats.cursos.nuevos_mes} este mes` : undefined}
          icon={<BookOpen size={20} />}
        />
        <KpiCard
          label="Tasa de finalización"
          value={isLoading ? "..." : stats ? `${stats.tasa_finalizacion}%` : "—"}
          icon={<Award size={20} />}
        />
      </div>
    </div>
  );
}

function KpiCard({
  label,
  value,
  sub,
  trend,
  icon,
}: {
  label: string;
  value: string;
  sub?: string;
  trend?: number;
  icon: React.ReactNode;
}) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-3">
        <p className="text-sm text-gray-500">{label}</p>
        <span className="text-gray-400">{icon}</span>
      </div>
      <p className="text-3xl font-bold text-gray-900 mb-1">{value}</p>
      {sub && <p className="text-xs text-gray-400">{sub}</p>}
      {trend !== undefined && (
        <p className={`text-xs mt-1 flex items-center gap-1 ${trend >= 0 ? "text-green-600" : "text-red-500"}`}>
          {trend >= 0 ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
          {Math.abs(trend)}% vs mes anterior
        </p>
      )}
    </div>
  );
}
