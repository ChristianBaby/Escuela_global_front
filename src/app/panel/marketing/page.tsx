"use client";

import { useQuery } from "@tanstack/react-query";
import { promocionesService, slidersService } from "@/lib/services/marketing";
import Link from "next/link";
import { Megaphone, Images, Bell, CheckCircle, Clock, ArrowRight, TrendingUp } from "lucide-react";
import type { Promotion, Slider } from "@/types";

function StatCard({
  label,
  value,
  sub,
  color,
}: {
  label: string;
  value: number | string;
  sub?: string;
  color: string;
}) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5">
      <p className="text-sm text-gray-500">{label}</p>
      <p className={`text-3xl font-bold mt-1 ${color}`}>{value}</p>
      {sub && <p className="text-xs text-gray-400 mt-1">{sub}</p>}
    </div>
  );
}

export default function MarketingDashboardPage() {
  const { data: promociones = [], isLoading: loadingPromos } = useQuery<Promotion[]>({
    queryKey: ["promociones"],
    queryFn: promocionesService.list,
  });

  const { data: sliders = [], isLoading: loadingSliders } = useQuery<Slider[]>({
    queryKey: ["sliders"],
    queryFn: slidersService.list,
  });

  const activePromos = promociones.filter((p) => p.status === "active");
  const inactivePromos = promociones.filter((p) => p.status === "inactive");
  const activeSliders = sliders.filter((s) => s.status === "active");

  const now = new Date();
  const expiringSoon = activePromos.filter((p) => {
    if (!p.ends_at) return false;
    const diff = (new Date(p.ends_at).getTime() - now.getTime()) / (1000 * 60 * 60 * 24);
    return diff >= 0 && diff <= 7;
  });

  const isLoading = loadingPromos || loadingSliders;

  return (
    <div>
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-1">
          <TrendingUp size={22} className="text-[#2B55A3]" />
          <h1 className="text-2xl font-bold text-gray-900">Panel de Marketing</h1>
        </div>
        <p className="text-sm text-gray-500">
          Gestiona las publicaciones y sliders del homepage de Escuela Global.
        </p>
      </div>

      {/* Stats */}
      {isLoading ? (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="bg-white rounded-xl border border-gray-200 p-5 animate-pulse">
              <div className="h-3 bg-gray-200 rounded w-24 mb-3" />
              <div className="h-8 bg-gray-200 rounded w-12" />
            </div>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <StatCard
            label="Publicaciones activas"
            value={activePromos.length}
            sub={`de ${promociones.length} en total`}
            color="text-green-600"
          />
          <StatCard
            label="Publicaciones inactivas"
            value={inactivePromos.length}
            sub="pausadas o sin vigencia"
            color="text-gray-500"
          />
          <StatCard
            label="Sliders activos"
            value={activeSliders.length}
            sub={`de ${sliders.length} en total`}
            color="text-[#2B55A3]"
          />
          <StatCard
            label="Vencen en 7 días"
            value={expiringSoon.length}
            sub={expiringSoon.length > 0 ? "requieren atención" : "todo al día"}
            color={expiringSoon.length > 0 ? "text-amber-600" : "text-gray-400"}
          />
        </div>
      )}

      {/* Acceso rápido */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-8">
        <Link
          href="/panel/marketing/publicaciones"
          className="bg-white rounded-xl border border-gray-200 p-6 hover:border-[#2B55A3]/40 hover:shadow-sm transition-all group"
        >
          <div className="flex items-start justify-between">
            <div className="w-10 h-10 rounded-lg bg-orange-50 flex items-center justify-center mb-4">
              <Megaphone size={20} className="text-orange-500" />
            </div>
            <ArrowRight
              size={16}
              className="text-gray-300 group-hover:text-[#2B55A3] transition-colors mt-1"
            />
          </div>
          <h2 className="font-semibold text-gray-900 mb-1">Publicaciones</h2>
          <p className="text-sm text-gray-500 leading-relaxed">
            Banners e imágenes promocionales que aparecen en el homepage. Controla vigencia y
            visibilidad.
          </p>
          <div className="flex items-center gap-4 mt-4 pt-4 border-t border-gray-100">
            <span className="text-xs text-green-600 font-medium flex items-center gap-1">
              <CheckCircle size={12} />
              {activePromos.length} activas
            </span>
            <span className="text-xs text-gray-400">{promociones.length} total</span>
          </div>
        </Link>

        <Link
          href="/panel/marketing/sliders"
          className="bg-white rounded-xl border border-gray-200 p-6 hover:border-[#2B55A3]/40 hover:shadow-sm transition-all group"
        >
          <div className="flex items-start justify-between">
            <div className="w-10 h-10 rounded-lg bg-blue-50 flex items-center justify-center mb-4">
              <Images size={20} className="text-blue-500" />
            </div>
            <ArrowRight
              size={16}
              className="text-gray-300 group-hover:text-[#2B55A3] transition-colors mt-1"
            />
          </div>
          <h2 className="font-semibold text-gray-900 mb-1">Sliders</h2>
          <p className="text-sm text-gray-500 leading-relaxed">
            Carruseles de cursos destacados o banners con imagen. Configura posición y tipo de
            contenido.
          </p>
          <div className="flex items-center gap-4 mt-4 pt-4 border-t border-gray-100">
            <span className="text-xs text-blue-600 font-medium flex items-center gap-1">
              <CheckCircle size={12} />
              {activeSliders.length} activos
            </span>
            <span className="text-xs text-gray-400">{sliders.length} total</span>
          </div>
        </Link>

        <Link
          href="/panel/marketing/notificaciones"
          className="bg-white rounded-xl border border-gray-200 p-6 hover:border-[#2B55A3]/40 hover:shadow-sm transition-all group"
        >
          <div className="flex items-start justify-between">
            <div className="w-10 h-10 rounded-lg bg-indigo-50 flex items-center justify-center mb-4">
              <Bell size={20} className="text-indigo-500" />
            </div>
            <ArrowRight
              size={16}
              className="text-gray-300 group-hover:text-[#2B55A3] transition-colors mt-1"
            />
          </div>
          <h2 className="font-semibold text-gray-900 mb-1">Notificaciones</h2>
          <p className="text-sm text-gray-500 leading-relaxed">
            Envía mensajes personalizados a todos los estudiantes, a los matriculados en un
            curso o a usuarios específicos.
          </p>
        </Link>
      </div>

      {/* Publicaciones que vencen pronto */}
      {expiringSoon.length > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-5">
          <div className="flex items-center gap-2 mb-3">
            <Clock size={16} className="text-amber-600" />
            <h3 className="text-sm font-semibold text-amber-800">
              Publicaciones que vencen en los próximos 7 días
            </h3>
          </div>
          <ul className="space-y-2">
            {expiringSoon.map((p) => (
              <li key={p.id} className="flex items-center justify-between text-sm">
                <span className="text-amber-900 font-medium">{p.title}</span>
                <span className="text-amber-700 text-xs">
                  Vence el{" "}
                  {p.ends_at
                    ? new Date(p.ends_at).toLocaleDateString("es-PE", {
                        day: "numeric",
                        month: "short",
                      })
                    : "—"}
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Lista de publicaciones activas */}
      {!isLoading && activePromos.length > 0 && (
        <div className="mt-6">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold text-gray-700">Publicaciones activas</h3>
            <Link
              href="/panel/marketing/publicaciones"
              className="text-xs text-[#2B55A3] hover:underline"
            >
              Ver todas →
            </Link>
          </div>
          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="text-left px-4 py-3 text-gray-600 font-medium">Publicación</th>
                  <th className="text-left px-4 py-3 text-gray-600 font-medium">Vigencia</th>
                  <th className="text-left px-4 py-3 text-gray-600 font-medium">Estado</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {activePromos.slice(0, 5).map((p) => (
                  <tr key={p.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 font-medium text-gray-900">{p.title}</td>
                    <td className="px-4 py-3 text-gray-500 text-xs">
                      {p.ends_at
                        ? `hasta ${new Date(p.ends_at).toLocaleDateString("es-PE")}`
                        : "Sin límite"}
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-xs px-2 py-1 rounded-full bg-green-50 text-green-700">
                        Activa
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
