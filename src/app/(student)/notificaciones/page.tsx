"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { notificacionesService } from "@/lib/services/notifications";
import { Bell, CheckCheck, BookOpen, Award, Clock, UserCheck, ChevronRight } from "lucide-react";
import { useRouter } from "next/navigation";
import type { Notification } from "@/types";

// Icono según el tipo de notificación
function NotifIcon({ type }: { type: Notification["type"] }) {
  const cls = "w-5 h-5";
  switch (type) {
    case "nuevo_curso":     return <BookOpen className={cls} />;
    case "completado":      return <Award className={cls} />;
    case "recordatorio":    return <Clock className={cls} />;
    case "matriculacion":   return <UserCheck className={cls} />;
    case "certificado":     return <Award className={cls} />;
    default:                return <Bell className={cls} />;
  }
}

// Color de fondo según tipo
const TYPE_COLOR: Record<string, string> = {
  nuevo_curso:   "bg-blue-100 text-blue-600",
  completado:    "bg-green-100 text-green-600",
  recordatorio:  "bg-yellow-100 text-yellow-600",
  matriculacion: "bg-purple-100 text-purple-600",
  certificado:   "bg-[#2B55A3]/10 text-[#2B55A3]",
};

function timeAgo(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins  = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days  = Math.floor(diff / 86400000);
  if (mins < 1)   return "Ahora mismo";
  if (mins < 60)  return `Hace ${mins} min`;
  if (hours < 24) return `Hace ${hours}h`;
  return `Hace ${days} día${days !== 1 ? "s" : ""}`;
}

export default function NotificacionesPage() {
  const router = useRouter();
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ["notificaciones"],
    queryFn: notificacionesService.list,
  });

  // Marcar una notificación como leída
  const markRead = useMutation({
    mutationFn: notificacionesService.markRead,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["notificaciones"] }),
  });

  // Marcar todas como leídas
  const markAll = useMutation({
    mutationFn: notificacionesService.markAllRead,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["notificaciones"] }),
  });

  const notifs = data?.data ?? [];
  const unread = data?.unread_count ?? 0;

  function handleClick(n: Notification) {
    // Marcar como leída al hacer clic
    if (!n.is_read) markRead.mutate(n.id);
    // Redirigir si tiene URL
    if (n.redirect_url) router.push(n.redirect_url);
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Encabezado */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Bell size={22} className="text-[#2B55A3]" />
            Notificaciones
          </h1>
          {unread > 0 && (
            <p className="text-sm text-gray-500 mt-0.5">
              Tienes <span className="font-semibold text-[#2B55A3]">{unread}</span> sin leer
            </p>
          )}
        </div>
        {unread > 0 && (
          <button
            onClick={() => markAll.mutate()}
            disabled={markAll.isPending}
            className="flex items-center gap-1.5 text-sm text-[#2B55A3] hover:text-[#2B55A3]/80 border border-[#2B55A3]/30 px-3 py-1.5 rounded-lg transition-colors disabled:opacity-50"
          >
            <CheckCheck size={15} />
            Marcar todas como leídas
          </button>
        )}
      </div>

      {/* Lista */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        {isLoading ? (
          // Skeleton de carga
          <div className="divide-y divide-gray-100">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="flex items-start gap-4 p-4 animate-pulse">
                <div className="w-10 h-10 rounded-full bg-gray-200 shrink-0" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-gray-200 rounded w-3/4" />
                  <div className="h-3 bg-gray-100 rounded w-full" />
                  <div className="h-3 bg-gray-100 rounded w-1/3" />
                </div>
              </div>
            ))}
          </div>
        ) : notifs.length === 0 ? (
          // Estado vacío
          <div className="py-16 text-center">
            <Bell size={40} className="text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500 font-medium">No tienes notificaciones</p>
            <p className="text-gray-400 text-sm mt-1">Te avisaremos cuando haya novedades.</p>
          </div>
        ) : (
          // Lista de notificaciones
          <ul className="divide-y divide-gray-100">
            {notifs.map((n) => (
              <li
                key={n.id}
                onClick={() => handleClick(n)}
                className={`flex items-start gap-4 p-4 transition-colors cursor-pointer hover:bg-gray-50 ${
                  !n.is_read ? "bg-blue-50/40" : ""
                }`}
              >
                {/* Icono del tipo */}
                <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${TYPE_COLOR[n.type] ?? "bg-gray-100 text-gray-500"}`}>
                  <NotifIcon type={n.type} />
                </div>

                {/* Contenido */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <p className={`text-sm leading-snug ${!n.is_read ? "font-semibold text-gray-900" : "font-medium text-gray-700"}`}>
                      {n.title}
                    </p>
                    {/* Punto azul si no leída */}
                    {!n.is_read && (
                      <span className="w-2 h-2 rounded-full bg-[#2B55A3] shrink-0 mt-1.5" />
                    )}
                  </div>
                  <p className="text-xs text-gray-500 mt-0.5 line-clamp-2">{n.body}</p>
                  <p className="text-xs text-gray-400 mt-1">{timeAgo(n.created_at)}</p>
                </div>

                {/* Flecha si tiene redirect */}
                {n.redirect_url && (
                  <ChevronRight size={16} className="text-gray-400 shrink-0 mt-1" />
                )}
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
