"use client";

import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { toast } from "sonner";
import { dashboardService } from "@/lib/services/dashboard";
import { categoriasService } from "@/lib/services/categories";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { TrendingUp, TrendingDown, Users, BookOpen, Award, DollarSign, Download, Loader2 } from "lucide-react";

function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

const CHART_COLORS = [
  "#084D95",
  "#10b981",
  "#f59e0b",
  "#ef4444",
  "#8b5cf6",
  "#06b6d4",
  "#ec4899",
  "#84cc16",
  "#f97316",
  "#6366f1",
];

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

function ChartCard({
  title,
  children,
  loading,
  error,
  height = 220,
}: {
  title: string;
  children: React.ReactNode;
  loading?: boolean;
  error?: boolean;
  height?: number;
}) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6">
      <h3 className="text-sm font-semibold text-gray-700 mb-4">{title}</h3>
      {loading ? (
        <div
          className="flex items-center justify-center text-gray-400 text-sm"
          style={{ height }}
        >
          Cargando...
        </div>
      ) : error ? (
        <div
          className="flex items-center justify-center text-gray-400 text-sm"
          style={{ height }}
        >
          Sin datos disponibles
        </div>
      ) : (
        children
      )}
    </div>
  );
}

export default function AdminDashboardPage() {
  const [desde, setDesde] = useState("");
  const [hasta, setHasta] = useState("");
  const [categoriaId, setCategoriaId] = useState("");

  const filters = {
    desde: desde || undefined,
    hasta: hasta || undefined,
    categoria_id: categoriaId || undefined,
  };

  const { data: categorias } = useQuery({
    queryKey: ["categorias"],
    queryFn: categoriasService.list,
  });

  const { data: stats, isLoading: lStats, isError: eStats } = useQuery({
    queryKey: ["admin-stats", desde, hasta, categoriaId],
    queryFn: () => dashboardService.getStats(filters),
  });

  const { data: ingresos, isLoading: lIngresos, isError: eIngresos } = useQuery({
    queryKey: ["admin-ingresos-chart", desde, hasta, categoriaId],
    queryFn: () => dashboardService.getIngresosChart(filters),
  });

  const { data: topCursos, isLoading: lTopCursos, isError: eTopCursos } = useQuery({
    queryKey: ["admin-top-cursos", desde, hasta, categoriaId],
    queryFn: () => dashboardService.getTopCursos(filters),
  });

  const { data: categoriasDist, isLoading: lCat, isError: eCat } = useQuery({
    queryKey: ["admin-categorias-dist", desde, hasta, categoriaId],
    queryFn: () => dashboardService.getCategoriasDistribucion(filters),
  });

  const { data: estActivos, isLoading: lEst, isError: eEst } = useQuery({
    queryKey: ["admin-est-activos", desde, hasta, categoriaId],
    queryFn: () => dashboardService.getEstudiantesActivos(filters),
  });

  const { data: topFinalizacion, isLoading: lFin, isError: eFin } = useQuery({
    queryKey: ["admin-top-finalizacion", desde, hasta, categoriaId],
    queryFn: () => dashboardService.getTopFinalizacion(filters),
  });

  const { data: topEstudiantes, isLoading: lTopEst, isError: eTopEst } = useQuery({
    queryKey: ["admin-top-estudiantes", desde, hasta, categoriaId],
    queryFn: () => dashboardService.getTopEstudiantes(filters),
  });

  const hasFilters = desde || hasta || categoriaId;

  const exportMutation = useMutation({
    mutationFn: () => dashboardService.exportDashboard(filters),
    onSuccess: (blob) => {
      downloadBlob(blob, "dashboard-escuela-global.xlsx");
      toast.success("Excel exportado correctamente");
    },
    onError: () => toast.error("Error al exportar el Excel"),
  });

  return (
    <div>
      {/* Header + Filtros */}
      <div className="flex flex-wrap items-start justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-bold text-brand-primary">Dashboard</h1>
          <p className="text-gray-500 text-sm">Resumen general de la plataforma</p>
        </div>
        <div className="flex flex-wrap gap-3">
          <div className="flex flex-col gap-0.5">
            <label className="text-xs text-gray-400">Desde</label>
            <input
              type="date"
              value={desde}
              onChange={(e) => setDesde(e.target.value)}
              className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#084D95]/30"
            />
          </div>
          <div className="flex flex-col gap-0.5">
            <label className="text-xs text-gray-400">Hasta</label>
            <input
              type="date"
              value={hasta}
              onChange={(e) => setHasta(e.target.value)}
              className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#084D95]/30"
            />
          </div>
          <div className="flex flex-col gap-0.5">
            <label className="text-xs text-gray-400">Categoría</label>
            <select
              value={categoriaId}
              onChange={(e) => setCategoriaId(e.target.value)}
              className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none"
            >
              <option value="">Todas</option>
              {categorias?.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>
          {hasFilters && (
            <button
              onClick={() => {
                setDesde("");
                setHasta("");
                setCategoriaId("");
              }}
              className="self-end px-3 py-2 text-sm text-gray-500 border border-gray-300 rounded-lg hover:bg-gray-50"
            >
              Limpiar
            </button>
          )}
          <button
            onClick={() => exportMutation.mutate()}
            disabled={exportMutation.isPending}
            className="self-end flex items-center gap-2 px-4 py-2 text-sm bg-[#084D95] text-white rounded-lg hover:bg-[#084D95]/90 disabled:opacity-50 transition-colors"
          >
            {exportMutation.isPending ? (
              <Loader2 size={15} className="animate-spin" />
            ) : (
              <Download size={15} />
            )}
            Exportar Excel
          </button>
        </div>
      </div>

      {eStats && (
        <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg px-4 py-3 mb-6 text-sm">
          No se pudieron cargar las estadísticas. Verifica la conexión con el backend.
        </div>
      )}

      {/* KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <KpiCard
          label="Ingresos del mes"
          value={lStats ? "..." : stats ? `$${stats.ingresos.total_mes.toLocaleString()}` : "—"}
          sub={
            stats
              ? `Online: $${stats.ingresos.online.toLocaleString()} · Manual: $${stats.ingresos.manual.toLocaleString()}`
              : undefined
          }
          trend={stats?.ingresos.cambio_porcentual}
          icon={<DollarSign size={20} />}
        />
        <KpiCard
          label="Estudiantes registrados"
          value={lStats ? "..." : stats ? stats.estudiantes.total.toLocaleString() : "—"}
          sub={stats ? `+${stats.estudiantes.nuevos_mes} este mes` : undefined}
          icon={<Users size={20} />}
        />
        <KpiCard
          label="Cursos activos"
          value={lStats ? "..." : stats ? stats.cursos.total_activos.toLocaleString() : "—"}
          sub={stats ? `+${stats.cursos.nuevos_mes} este mes` : undefined}
          icon={<BookOpen size={20} />}
        />
        <KpiCard
          label="Tasa de finalización"
          value={lStats ? "..." : stats ? `${stats.tasa_finalizacion}%` : "—"}
          icon={<Award size={20} />}
        />
      </div>

      {/* Gráficos fila 1: Ingresos (2/3) + Categorías donut (1/3) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        <div className="lg:col-span-2">
          <ChartCard
            title="Ingresos por mes — últimos 12 meses"
            loading={lIngresos}
            error={eIngresos}
            height={220}
          >
            <ResponsiveContainer width="100%" height={220}>
              <LineChart data={ingresos} margin={{ right: 8 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="mes" tick={{ fontSize: 11 }} />
                <YAxis
                  tick={{ fontSize: 11 }}
                  tickFormatter={(v: number) =>
                    v >= 1000 ? `$${(v / 1000).toFixed(0)}k` : `$${v}`
                  }
                />
                <Tooltip
                  formatter={(v) => [`$${Number(v).toLocaleString()}`, ""]}
                />
                <Legend iconSize={10} />
                <Line
                  type="monotone"
                  dataKey="total"
                  stroke="#084D95"
                  strokeWidth={2}
                  dot={false}
                  name="Total"
                />
                <Line
                  type="monotone"
                  dataKey="online"
                  stroke="#10b981"
                  strokeWidth={1.5}
                  dot={false}
                  strokeDasharray="4 2"
                  name="Online"
                />
                <Line
                  type="monotone"
                  dataKey="manual"
                  stroke="#f59e0b"
                  strokeWidth={1.5}
                  dot={false}
                  strokeDasharray="4 2"
                  name="Manual"
                />
              </LineChart>
            </ResponsiveContainer>
          </ChartCard>
        </div>

        <ChartCard title="Distribución por categoría" loading={lCat} error={eCat} height={220}>
          <ResponsiveContainer width="100%" height={220}>
            <PieChart>
              <Pie
                data={categoriasDist}
                dataKey="count"
                nameKey="name"
                cx="50%"
                cy="45%"
                innerRadius={52}
                outerRadius={80}
                paddingAngle={2}
              >
                {categoriasDist?.map((_, i) => (
                  <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                ))}
              </Pie>
              <Tooltip formatter={(v, name) => [v, name]} />
              <Legend iconType="circle" iconSize={8} />
            </PieChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>

      {/* Gráficos fila 2: Top cursos + Estudiantes activos vs inactivos */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <ChartCard
          title="Top 10 cursos más vendidos"
          loading={lTopCursos}
          error={eTopCursos}
          height={280}
        >
          <ResponsiveContainer width="100%" height={280}>
            <BarChart
              data={topCursos}
              layout="vertical"
              margin={{ left: 4, right: 16, top: 4, bottom: 4 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" horizontal={false} />
              <XAxis type="number" tick={{ fontSize: 11 }} />
              <YAxis
                type="category"
                dataKey="title"
                width={148}
                tick={{ fontSize: 10 }}
                tickFormatter={(v: string) => (v.length > 24 ? v.substring(0, 24) + "…" : v)}
              />
              <Tooltip />
              <Bar
                dataKey="enrolled_count"
                fill="#084D95"
                name="Matriculados"
                radius={[0, 3, 3, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard
          title="Estudiantes activos vs inactivos"
          loading={lEst}
          error={eEst}
          height={280}
        >
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={estActivos}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="mes" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip />
              <Legend iconSize={10} />
              <Bar dataKey="activos" stackId="a" fill="#084D95" name="Activos" />
              <Bar
                dataKey="inactivos"
                stackId="a"
                fill="#e5e7eb"
                name="Inactivos"
                radius={[3, 3, 0, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>

      {/* Tablas */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top finalización */}
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100">
            <h3 className="text-sm font-semibold text-gray-700">
              Top 10 — Mayor tasa de finalización
            </h3>
          </div>
          {lFin ? (
            <div className="p-8 text-center text-gray-400 text-sm">Cargando...</div>
          ) : eFin ? (
            <div className="p-8 text-center text-gray-400 text-sm">Sin datos disponibles</div>
          ) : (
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-100">
                <tr>
                  <th className="text-left px-4 py-2 text-gray-500 font-medium text-xs">#</th>
                  <th className="text-left px-4 py-2 text-gray-500 font-medium text-xs">Curso</th>
                  <th className="text-right px-4 py-2 text-gray-500 font-medium text-xs">
                    Matriculados
                  </th>
                  <th className="text-right px-4 py-2 text-gray-500 font-medium text-xs">
                    Finalización
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {!topFinalizacion?.length ? (
                  <tr>
                    <td colSpan={4} className="px-4 py-8 text-center text-gray-400">
                      Sin datos
                    </td>
                  </tr>
                ) : (
                  topFinalizacion.map((c, i) => (
                    <tr key={c.id} className="hover:bg-gray-50">
                      <td className="px-4 py-2.5 text-gray-400 text-xs">{i + 1}</td>
                      <td className="px-4 py-2.5 text-gray-900 text-xs leading-tight">
                        {c.title}
                      </td>
                      <td className="px-4 py-2.5 text-right text-gray-600 text-xs">
                        {c.enrolled_count}
                      </td>
                      <td className="px-4 py-2.5 text-right">
                        <span className="text-green-700 font-semibold text-xs">
                          {c.completion_rate}%
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          )}
        </div>

        {/* Top estudiantes */}
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100">
            <h3 className="text-sm font-semibold text-gray-700">
              Top 10 — Estudiantes más activos
            </h3>
          </div>
          {lTopEst ? (
            <div className="p-8 text-center text-gray-400 text-sm">Cargando...</div>
          ) : eTopEst ? (
            <div className="p-8 text-center text-gray-400 text-sm">Sin datos disponibles</div>
          ) : (
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-100">
                <tr>
                  <th className="text-left px-4 py-2 text-gray-500 font-medium text-xs">#</th>
                  <th className="text-left px-4 py-2 text-gray-500 font-medium text-xs">
                    Estudiante
                  </th>
                  <th className="text-right px-4 py-2 text-gray-500 font-medium text-xs">Cursos</th>
                  <th className="text-right px-4 py-2 text-gray-500 font-medium text-xs">Horas</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {!topEstudiantes?.length ? (
                  <tr>
                    <td colSpan={4} className="px-4 py-8 text-center text-gray-400">
                      Sin datos
                    </td>
                  </tr>
                ) : (
                  topEstudiantes.map((e, i) => (
                    <tr key={e.id} className="hover:bg-gray-50">
                      <td className="px-4 py-2.5 text-gray-400 text-xs">{i + 1}</td>
                      <td className="px-4 py-2.5">
                        <p className="text-gray-900 text-xs font-medium">
                          {e.first_name} {e.last_name}
                        </p>
                        <p className="text-xs text-gray-400">{e.email}</p>
                      </td>
                      <td className="px-4 py-2.5 text-right text-gray-600 text-xs">
                        {e.courses_count}
                      </td>
                      <td className="px-4 py-2.5 text-right text-gray-600 text-xs">
                        {e.total_watched_hours}h
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}
