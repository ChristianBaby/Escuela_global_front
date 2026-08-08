"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { notificacionesService } from "@/lib/services/notifications";
import { cursosService } from "@/lib/services/courses";
import {
  Bell, CheckCheck, BookOpen, Award, Clock, UserCheck,
  ChevronRight, X, PlayCircle, ExternalLink, MessageSquare, Percent, Megaphone,
} from "lucide-react";
import { useRouter } from "next/navigation";
import type { Notification } from "@/types";

// ── Icono según tipo ────────────────────────────────────────────────────────
function NotifIcon({ type }: { type: Notification["type"] }) {
  const cls = "w-5 h-5";
  switch (type) {
    case "nuevo_curso":   return <BookOpen className={cls} />;
    case "completado":    return <Award className={cls} />;
    case "recordatorio":  return <Clock className={cls} />;
    case "matriculacion": return <UserCheck className={cls} />;
    case "certificado":   return <Award className={cls} />;
    case "personalizada": return <MessageSquare className={cls} />;
    case "descuento":     return <Percent className={cls} />;
    case "anuncio":       return <Megaphone className={cls} />;
    default:              return <Bell className={cls} />;
  }
}

// ── Colores por tipo ────────────────────────────────────────────────────────
const TYPE_COLOR: Record<string, string> = {
  nuevo_curso:   "bg-blue-100 text-blue-600",
  completado:    "bg-green-100 text-green-600",
  recordatorio:  "bg-yellow-100 text-yellow-600",
  matriculacion: "bg-purple-100 text-purple-600",
  certificado:   "bg-[#084D95]/10 text-[#084D95]",
  personalizada: "bg-indigo-100 text-indigo-600",
  descuento:     "bg-orange-100 text-orange-600",
  anuncio:       "bg-pink-100 text-pink-600",
};

// ── Contenido del panel según tipo ─────────────────────────────────────────
const PANEL_CONFIG: Record<
  string,
  { heading: string; description: string; btnLabel: string; BtnIcon: React.ElementType }
> = {
  matriculacion: {
    heading: "¡Bienvenido al curso!",
    description: "Ya estás matriculado. Empieza tu aprendizaje cuando quieras y avanza a tu propio ritmo.",
    btnLabel: "Empezar a aprender",
    BtnIcon: PlayCircle,
  },
  recordatorio: {
    heading: "No olvides continuar",
    description: "Llevas un tiempo sin ver este curso. ¡Retómalo y sigue avanzando, cada minuto cuenta!",
    btnLabel: "Seguir aprendiendo",
    BtnIcon: PlayCircle,
  },
  completado: {
    heading: "¡Curso completado!",
    description: "Felicidades por terminar el curso. Ya puedes generar tu certificado y compartirlo.",
    btnLabel: "Ver mi certificado",
    BtnIcon: Award,
  },
  certificado: {
    heading: "Tu certificado está listo",
    description: "Tu certificado fue generado correctamente. Descárgalo y compártelo en tus redes.",
    btnLabel: "Ver certificado",
    BtnIcon: Award,
  },
  nuevo_curso: {
    heading: "¡Nuevo curso disponible!",
    description: "Hay un nuevo curso que puede interesarte. Échale un vistazo y matricúlate si quieres.",
    btnLabel: "Ver curso",
    BtnIcon: ExternalLink,
  },
  personalizada: {
    heading: "Mensaje del equipo",
    description: "El equipo de Escuela Global tiene un mensaje para ti.",
    btnLabel: "Ver más",
    BtnIcon: ExternalLink,
  },
  descuento: {
    heading: "¡Tienes un descuento!",
    description: "Aprovecha esta oferta especial antes de que se acabe.",
    btnLabel: "Ver oferta",
    BtnIcon: ExternalLink,
  },
  anuncio: {
    heading: "Tienes un anuncio",
    description: "Escuela Global tiene algo nuevo para contarte.",
    btnLabel: "Ver más",
    BtnIcon: ExternalLink,
  },
};

const DEFAULT_PANEL = {
  heading: "Notificación",
  description: "",
  btnLabel: "Ver más",
  BtnIcon: ExternalLink,
};

// ── Quita emojis y símbolos decorativos de textos del backend ──────────────
const EMOJI_REGEX = /[\u{1F300}-\u{1FAFF}\u{2300}-\u{27BF}\u{2B00}-\u{2BFF}\u{FE0F}\u{200D}]/gu;
function stripEmojis(text: string) {
  return text.replace(EMOJI_REGEX, "").trim();
}

// ── Tiempo relativo ─────────────────────────────────────────────────────────
function timeAgo(dateStr: string) {
  const diff  = Date.now() - new Date(dateStr).getTime();
  const mins  = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days  = Math.floor(diff / 86400000);
  if (mins < 1)   return "Ahora mismo";
  if (mins < 60)  return `Hace ${mins} min`;
  if (hours < 24) return `Hace ${hours}h`;
  return `Hace ${days} día${days !== 1 ? "s" : ""}`;
}

// ── Panel lateral de detalle ────────────────────────────────────────────────
function NotifPanel({
  notif,
  onClose,
  onRedirect,
}: {
  notif: Notification;
  onClose: () => void;
  onRedirect: (notif: Notification) => void;
}) {
  const cfg = PANEL_CONFIG[notif.type] ?? DEFAULT_PANEL;
  const { BtnIcon } = cfg;

  return (
    // Overlay
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40"
      onClick={onClose}
    >
      {/* Panel */}
      <div
        className="relative bg-white rounded-2xl shadow-xl w-full max-w-md mx-4 p-6"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Cerrar */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-700 transition-colors"
        >
          <X size={20} />
        </button>

        {/* Imagen adjunta */}
        {notif.image_url && (
          <img
            src={notif.image_url}
            alt=""
            className="w-full h-40 object-cover rounded-xl mb-4 bg-gray-100"
            onError={(e) => (e.currentTarget.style.display = "none")}
          />
        )}

        {/* Ícono grande */}
        <div className={`w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 ${TYPE_COLOR[notif.type] ?? "bg-gray-100 text-gray-500"}`}>
          <NotifIcon type={notif.type} />
        </div>

        {/* Título dinámico */}
        <h2 className="text-xl font-bold text-brand-primary text-center">{cfg.heading}</h2>

        {/* Título real de la notificación */}
        <p className="text-sm font-semibold text-[#084D95] text-center mt-1">{stripEmojis(notif.title)}</p>

        {/* Descripción dinámica */}
        <p className="text-sm text-gray-600 text-center mt-3 leading-relaxed">{cfg.description}</p>

        {/* Cuerpo de la notificación */}
        {notif.body && (
          <p className="text-xs text-gray-500 text-center mt-2 italic">{stripEmojis(notif.body)}</p>
        )}

        <p className="text-xs text-gray-400 text-center mt-2">{timeAgo(notif.created_at)}</p>

        {/* Botón de acción (solo si tiene redirect) */}
        {notif.redirect_url && (
          <button
            onClick={() => onRedirect(notif)}
            className="mt-5 w-full flex items-center justify-center gap-2 bg-[#084D95] hover:bg-[#084D95]/90 text-white font-semibold py-2.5 rounded-xl transition-colors"
          >
            <BtnIcon size={16} />
            {cfg.btnLabel}
          </button>
        )}

        {/* Botón cerrar secundario */}
        <button
          onClick={onClose}
          className="mt-2 w-full text-sm text-gray-500 hover:text-gray-700 py-2 transition-colors"
        >
          Cerrar
        </button>
      </div>
    </div>
  );
}

// ── Página principal ────────────────────────────────────────────────────────
export default function NotificacionesPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [selected, setSelected] = useState<Notification | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ["notificaciones"],
    queryFn: notificacionesService.list,
    staleTime: 0,
  });

  // Marcar una como leída
  const markRead = useMutation({
    mutationFn: notificacionesService.markRead,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["notificaciones"] }),
  });

  // Marcar todas como leídas
  const markAll = useMutation({
    mutationFn: notificacionesService.markAllRead,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["notificaciones"] }),
  });

  const notifs  = data?.data ?? [];
  const unread  = data?.unread_count ?? 0;

  function handleClick(n: Notification) {
    // Marcar como leída y abrir panel
    if (!n.is_read) markRead.mutate(n.id);
    setSelected(n);
  }

  async function handleRedirect(notif: Notification) {
    setSelected(null);

    // La notificación de matrícula trae el link público de venta (/cursos/[slug]);
    // como ya está matriculado, lo llevamos directo al visor del curso (/curso/[id]).
    if (notif.type === "matriculacion" && notif.redirect_url) {
      const match = notif.redirect_url.match(/^\/cursos\/([^/?#]+)/);
      if (match) {
        try {
          const curso = await cursosService.getBySlug(match[1]);
          router.push(`/curso/${curso.id}`);
          return;
        } catch {
          // si falla la búsqueda, cae al comportamiento original
        }
      }
    }

    router.push(notif.redirect_url!);
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Panel de detalle */}
      {selected && (
        <NotifPanel
          notif={selected}
          onClose={() => setSelected(null)}
          onRedirect={handleRedirect}
        />
      )}

      {/* Encabezado */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-brand-primary flex items-center gap-2">
            <Bell size={22} className="text-[#084D95]" />
            Notificaciones
          </h1>
          {unread > 0 && (
            <p className="text-sm text-gray-500 mt-0.5">
              Tienes <span className="font-semibold text-[#084D95]">{unread}</span> sin leer
            </p>
          )}
        </div>
        {unread > 0 && (
          <button
            onClick={() => markAll.mutate()}
            disabled={markAll.isPending}
            className="flex items-center gap-1.5 text-sm text-[#084D95] hover:text-[#084D95]/80 border border-[#084D95]/30 px-3 py-1.5 rounded-lg transition-colors disabled:opacity-50"
          >
            <CheckCheck size={15} />
            Marcar todas como leídas
          </button>
        )}
      </div>

      {/* Lista */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        {isLoading ? (
          // Skeleton
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
          // Lista
          <ul className="divide-y divide-gray-100">
            {notifs.map((n) => (
              <li
                key={n.id}
                onClick={() => handleClick(n)}
                className={`flex items-start gap-4 p-4 transition-colors cursor-pointer hover:bg-gray-50 ${
                  !n.is_read ? "bg-blue-50/40" : ""
                }`}
              >
                {/* Ícono o miniatura */}
                {n.image_url ? (
                  <img
                    src={n.image_url}
                    alt=""
                    className="w-10 h-10 rounded-full object-cover shrink-0 bg-gray-100"
                    onError={(e) => (e.currentTarget.style.display = "none")}
                  />
                ) : (
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${TYPE_COLOR[n.type] ?? "bg-gray-100 text-gray-500"}`}>
                    <NotifIcon type={n.type} />
                  </div>
                )}

                {/* Contenido */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <p className={`text-sm leading-snug ${!n.is_read ? "font-semibold text-gray-900" : "font-medium text-gray-700"}`}>
                      {stripEmojis(n.title)}
                    </p>
                    {/* Punto azul si no leída */}
                    {!n.is_read && (
                      <span className="w-2 h-2 rounded-full bg-[#084D95] shrink-0 mt-1.5" />
                    )}
                  </div>
                  <p className="text-xs text-gray-500 mt-0.5 line-clamp-2">{stripEmojis(n.body)}</p>
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
