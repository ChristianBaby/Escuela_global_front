import { api } from "@/lib/http/api";
import type { EventType, Promotion, Slider, UpcomingLaunch, StaffMember, Software, ScrollPopup, Alliance } from "@/types";

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
  type: "courses" | "banner" | "catalog";
  event_type_id?: string | null;
  image_url?: string;
  destination_url?: string;
  contact_url?: string;
  position_on_page: "top" | "middle" | "bottom";
  display_order?: number;
  status: "active" | "inactive";
  show_content?: boolean;
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
  image?: File;
}

export interface NotificationRecipient {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
}

function buildNotificationFormData(data: SendNotificationDto): FormData {
  const formData = new FormData();
  formData.append("title", data.title);
  formData.append("body", data.body);
  if (data.redirect_url) formData.append("redirect_url", data.redirect_url);
  formData.append("audience", data.audience);
  formData.append("type", data.type);
  if (data.course_id) formData.append("course_id", data.course_id);
  if (data.user_ids) data.user_ids.forEach((id) => formData.append("user_ids", id));
  if (data.image) formData.append("image", data.image);
  return formData;
}

export const notificacionesMktService = {
  getRecipients: (params?: { search?: string; course_id?: string; category_id?: string }) =>
    api.get<NotificationRecipient[]>("/marketing/notifications/recipients", { params }).then((r) => r.data),

  send: (data: SendNotificationDto) =>
    data.image
      ? api.post<{ success: boolean; sent: number }>(
          "/marketing/notifications/send",
          buildNotificationFormData(data),
          { headers: { "Content-Type": "multipart/form-data" } }
        ).then((r) => r.data)
      : api.post<{ success: boolean; sent: number }>("/marketing/notifications/send", data).then((r) => r.data),
};

// ── Próximos Lanzamientos ───────────────────────────────────────────────────

export interface CreateUpcomingLaunchDto {
  category_label: string;
  title: string;
  start_date: string;
  image?: File;
  link_url?: string;
  display_order?: number;
  status: "active" | "inactive";
}

function buildLaunchFormData(data: Partial<CreateUpcomingLaunchDto>): FormData {
  const formData = new FormData();
  if (data.category_label !== undefined) formData.append("category_label", data.category_label);
  if (data.title !== undefined) formData.append("title", data.title);
  if (data.start_date !== undefined) formData.append("start_date", data.start_date);
  if (data.image) formData.append("image", data.image);
  if (data.link_url) formData.append("link_url", data.link_url);
  if (data.display_order !== undefined) formData.append("display_order", String(data.display_order));
  if (data.status !== undefined) formData.append("status", data.status);
  return formData;
}

export const lanzamientosService = {
  list: (vigente?: boolean) =>
    api.get<UpcomingLaunch[]>("/lanzamientos", { params: vigente !== undefined ? { vigente } : {} }).then((r) => r.data),

  create: (data: CreateUpcomingLaunchDto) =>
    api.post<UpcomingLaunch>("/lanzamientos", buildLaunchFormData(data), {
      headers: { "Content-Type": "multipart/form-data" },
    }).then((r) => r.data),

  update: (id: string, data: Partial<CreateUpcomingLaunchDto>) =>
    api.patch<UpcomingLaunch>(`/lanzamientos/${id}`, buildLaunchFormData(data), {
      headers: { "Content-Type": "multipart/form-data" },
    }).then((r) => r.data),

  delete: (id: string) =>
    api.delete(`/lanzamientos/${id}`).then((r) => r.data),
};

// ── Nuestros Docentes ───────────────────────────────────────────────────────

export interface CreateStaffMemberDto {
  image?: File;
  display_order?: number;
  status: "active" | "inactive";
}

function buildStaffFormData(data: Partial<CreateStaffMemberDto>): FormData {
  const formData = new FormData();
  if (data.image) formData.append("image", data.image);
  if (data.display_order !== undefined) formData.append("display_order", String(data.display_order));
  if (data.status !== undefined) formData.append("status", data.status);
  return formData;
}

export const docentesService = {
  list: (vigente?: boolean) =>
    api.get<StaffMember[]>("/docentes", { params: vigente !== undefined ? { vigente } : {} }).then((r) => r.data),

  create: (data: CreateStaffMemberDto) =>
    api.post<StaffMember>("/docentes", buildStaffFormData(data), {
      headers: { "Content-Type": "multipart/form-data" },
    }).then((r) => r.data),

  update: (id: string, data: Partial<CreateStaffMemberDto>) =>
    api.patch<StaffMember>(`/docentes/${id}`, buildStaffFormData(data), {
      headers: { "Content-Type": "multipart/form-data" },
    }).then((r) => r.data),

  delete: (id: string) =>
    api.delete(`/docentes/${id}`).then((r) => r.data),
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

// ── Domina los siguientes softwares ─────────────────────────────────────────

export interface CreateSoftwareDto {
  image?: File;
  name: string;
  display_order?: number;
  status: "active" | "inactive";
}

function buildSoftwareFormData(data: Partial<CreateSoftwareDto>): FormData {
  const formData = new FormData();
  if (data.image) formData.append("image", data.image);
  if (data.name !== undefined) formData.append("name", data.name);
  if (data.display_order !== undefined) formData.append("display_order", String(data.display_order));
  if (data.status !== undefined) formData.append("status", data.status);
  return formData;
}

export const softwaresService = {
  list: (vigente?: boolean) =>
    api.get<Software[]>("/softwares", { params: vigente !== undefined ? { vigente } : {} }).then((r) => r.data),

  create: (data: CreateSoftwareDto) =>
    api.post<Software>("/softwares", buildSoftwareFormData(data), {
      headers: { "Content-Type": "multipart/form-data" },
    }).then((r) => r.data),

  update: (id: string, data: Partial<CreateSoftwareDto>) =>
    api.patch<Software>(`/softwares/${id}`, buildSoftwareFormData(data), {
      headers: { "Content-Type": "multipart/form-data" },
    }).then((r) => r.data),

  delete: (id: string) =>
    api.delete(`/softwares/${id}`).then((r) => r.data),
};

// ── Popup promocional (al hacer scroll en el index) ─────────────────────────

export interface CreateScrollPopupDto {
  image?: File;
  destination_url?: string;
  display_order?: number;
  status: "active" | "inactive";
}

function buildScrollPopupFormData(data: Partial<CreateScrollPopupDto>): FormData {
  const formData = new FormData();
  if (data.image) formData.append("image", data.image);
  if (data.destination_url !== undefined) formData.append("destination_url", data.destination_url);
  if (data.display_order !== undefined) formData.append("display_order", String(data.display_order));
  if (data.status !== undefined) formData.append("status", data.status);
  return formData;
}

export const scrollPopupsService = {
  list: (vigente?: boolean) =>
    api.get<ScrollPopup[]>("/scroll-popups", { params: vigente !== undefined ? { vigente } : {} }).then((r) => r.data),

  create: (data: CreateScrollPopupDto) =>
    api.post<ScrollPopup>("/scroll-popups", buildScrollPopupFormData(data), {
      headers: { "Content-Type": "multipart/form-data" },
    }).then((r) => r.data),

  update: (id: string, data: Partial<CreateScrollPopupDto>) =>
    api.patch<ScrollPopup>(`/scroll-popups/${id}`, buildScrollPopupFormData(data), {
      headers: { "Content-Type": "multipart/form-data" },
    }).then((r) => r.data),

  delete: (id: string) =>
    api.delete(`/scroll-popups/${id}`).then((r) => r.data),
};

// ── Alianzas estratégicas ────────────────────────────────────────────────────

export interface CreateAllianceDto {
  image?: File;
  display_order?: number;
  status: "active" | "inactive";
}

function buildAllianceFormData(data: Partial<CreateAllianceDto>): FormData {
  const formData = new FormData();
  if (data.image) formData.append("image", data.image);
  if (data.display_order !== undefined) formData.append("display_order", String(data.display_order));
  if (data.status !== undefined) formData.append("status", data.status);
  return formData;
}

export const alianzasService = {
  list: (vigente?: boolean) =>
    api.get<Alliance[]>("/alianzas", { params: vigente !== undefined ? { vigente } : {} }).then((r) => r.data),

  create: (data: CreateAllianceDto) =>
    api.post<Alliance>("/alianzas", buildAllianceFormData(data), {
      headers: { "Content-Type": "multipart/form-data" },
    }).then((r) => r.data),

  update: (id: string, data: Partial<CreateAllianceDto>) =>
    api.patch<Alliance>(`/alianzas/${id}`, buildAllianceFormData(data), {
      headers: { "Content-Type": "multipart/form-data" },
    }).then((r) => r.data),

  delete: (id: string) =>
    api.delete(`/alianzas/${id}`).then((r) => r.data),
};
