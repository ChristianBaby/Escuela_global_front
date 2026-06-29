import { api } from "@/lib/http/api";
import type { Notification } from "@/types";

export interface NotificationsResponse {
  data: Notification[];
  total: number;
  unread_count: number;
}

// Servicio de notificaciones del estudiante
export const notificacionesService = {
  // Obtener todas las notificaciones del usuario autenticado
  list: () =>
    api.get<NotificationsResponse>("/notifications").then((r) => r.data),

  // Marcar una notificación como leída
  markRead: (id: string) =>
    api.patch(`/notifications/${id}/read`).then((r) => r.data),

  // Marcar todas las notificaciones como leídas
  markAllRead: () =>
    api.patch("/notifications/read-all").then((r) => r.data),
};
