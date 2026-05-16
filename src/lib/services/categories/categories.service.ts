import { api } from "@/lib/http/api";
import type { Category } from "@/types";

export interface CreateCategoriaDto {
  name: string;
  slug: string;
  icon: string;
  color: string;
  description?: string;
  display_order?: number;
}

export const categoriasService = {
  list: () =>
    api.get<Category[]>("/categorias").then((r) => r.data),

  get: (id: string) =>
    api.get<Category>(`/categorias/${id}`).then((r) => r.data),

  create: (data: CreateCategoriaDto) =>
    api.post<Category>("/categorias", data).then((r) => r.data),

  update: (id: string, data: Partial<CreateCategoriaDto>) =>
    api.patch<Category>(`/categorias/${id}`, data).then((r) => r.data),

  delete: (id: string) =>
    api.delete(`/categorias/${id}`).then((r) => r.data),

  reorder: (ids: string[]) =>
    api.patch("/categorias/reorder", { ids }).then((r) => r.data),
};
