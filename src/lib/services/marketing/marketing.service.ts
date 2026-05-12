import { api } from "@/lib/http/api";
import type { Promotion, Slider } from "@/types";

export interface CreatePromocionDto {
  title: string;
  image_url: string;
  destination_url?: string;
  destination_course_id?: string;
  display_order?: number;
  status: "active" | "inactive";
  starts_at?: string;
  ends_at?: string;
}

export interface CreateSliderDto {
  title: string;
  type: "courses" | "banner";
  image_url?: string;
  destination_url?: string;
  position_on_page: "top" | "middle" | "bottom";
  display_order?: number;
  status: "active" | "inactive";
  course_ids?: string[];
}

export const promocionesService = {
  list: () =>
    api.get<Promotion[]>("/promociones").then((r) => r.data),

  create: (data: CreatePromocionDto) =>
    api.post<Promotion>("/promociones", data).then((r) => r.data),

  update: (id: string, data: Partial<CreatePromocionDto>) =>
    api.patch<Promotion>(`/promociones/${id}`, data).then((r) => r.data),

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
