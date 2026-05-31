import { api } from "@/lib/http/api";
import type { Promotion, Slider } from "@/types";

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

export interface CreateSliderDto {
  title: string;
  subtitle?: string;
  type: "courses" | "banner";
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
  list: () =>
    api.get<Promotion[]>("/promociones").then((r) => r.data),

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

export const slidersService = {
  list: () =>
    api.get<Slider[]>("/sliders").then((r) => r.data),

  create: (data: CreateSliderDto) =>
    api.post<Slider>("/sliders", data).then((r) => r.data),

  update: (id: string, data: Partial<CreateSliderDto>) =>
    api.patch<Slider>(`/sliders/${id}`, data).then((r) => r.data),

  delete: (id: string) =>
    api.delete(`/sliders/${id}`).then((r) => r.data),
};
