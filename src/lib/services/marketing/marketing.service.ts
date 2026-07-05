import { api } from "@/lib/http/api";
import type { EventType, Promotion, Slider } from "@/types";

export interface CreatePromocionDto {
  title: string;
  image?: File;
  destination_url?: string;
  destination_course_id?: string;
  display_order?: number;
  status: "active" | "inactive";
  starts_at?: string;
  ends_at?: string;
}

export interface CreateEventTypeDto {
  name: string;
  display_order?: number;
}

export interface CreateSliderDto {
  title: string;
  subtitle?: string;
  type: "courses" | "banner";
  event_type_id?: string | null;
  image_url?: string;
  destination_url?: string;
  contact_url?: string;
  position_on_page: "top" | "middle" | "bottom";
  display_order?: number;
  status: "active" | "inactive";
  course_ids?: string[];
}

function buildFormData(data: CreatePromocionDto): FormData {
  const formData = new FormData();
  formData.append("title", data.title);
  if (data.image) formData.append("image", data.image);
  if (data.destination_url) formData.append("destination_url", data.destination_url);
  if (data.destination_course_id) formData.append("destination_course_id", data.destination_course_id);
  if (data.display_order !== undefined) formData.append("display_order", String(data.display_order));
  formData.append("status", data.status);
  if (data.starts_at) formData.append("starts_at", data.starts_at);
  if (data.ends_at) formData.append("ends_at", data.ends_at);
  return formData;
}

export const promocionesService = {
  list: (params?: { vigente?: boolean }) =>
    api.get<Promotion[]>("/promociones", { params }).then((r) => r.data),

  create: (data: CreatePromocionDto) =>
    api.post<Promotion>("/promociones", buildFormData(data), {
      headers: { "Content-Type": "multipart/form-data" },
    }).then((r) => r.data),

  update: (id: string, data: Partial<CreatePromocionDto>) =>
    api.patch<Promotion>(`/promociones/${id}`, buildFormData(data as CreatePromocionDto), {
      headers: { "Content-Type": "multipart/form-data" },
    }).then((r) => r.data),

  delete: (id: string) =>
    api.delete(`/promociones/${id}`).then((r) => r.data),

  reorder: (ids: string[]) =>
    api.patch("/promociones/reorder", { ids }).then((r) => r.data),
};

export const eventTypesService = {
  list: () =>
    api.get<EventType[]>("/event-types").then((r) => r.data),

  create: (data: CreateEventTypeDto) =>
    api.post<EventType>("/event-types", data).then((r) => r.data),

  update: (id: string, data: Partial<CreateEventTypeDto>) =>
    api.patch<EventType>(`/event-types/${id}`, data).then((r) => r.data),

  delete: (id: string) =>
    api.delete(`/event-types/${id}`).then((r) => r.data),
};

// ── Notificaciones personalizadas ───────────────────────────────────────────

export interface SendNotificationDto {
  title: string;
  body: string;
  redirect_url?: string;
  audience: "all" | "course" | "users";
  type: "nuevo_curso" | "descuento" | "anuncio" | "recordatorio";
  course_id?: string;
  user_ids?: string[];
}

export interface NotificationRecipient {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
}

export const notificacionesMktService = {
  getRecipients: (params?: { search?: string; course_id?: string; category_id?: string }) =>
    api.get<NotificationRecipient[]>("/marketing/notifications/recipients", { params }).then((r) => r.data),

  send: (data: SendNotificationDto) =>
    api.post<{ success: boolean; sent: number }>("/marketing/notifications/send", data).then((r) => r.data),
};

export const slidersService = {
  list: () =>
    api.get<Slider[]>("/sliders").then((r) => r.data),

  create: (data: CreateSliderDto) =>
    api.post<Slider>("/sliders", data).then((r) => r.data),

  update: (id: string, data: Partial<CreateSliderDto>) =>
    api.patch<Slider>(`/sliders/${id}`, data).then((r) => r.data),

  delete: (id: string) =>
    api.delete(`/sliders/${id}`).then((r) => r.data),

  uploadImage: (sliderId: string, file: File) => {
    const formData = new FormData();
    formData.append("image", file);
    return api
      .post<{ success: boolean; image_url: string }>(
        `/sliders/${sliderId}/image`,
        formData,
        { headers: { "Content-Type": "multipart/form-data" } }
      )
      .then((r) => r.data);
  },
};
