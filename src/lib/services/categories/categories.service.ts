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
    api.get<Category[]>("/categories").then((r) => r.data),

  get: (id: string) =>
    api.get<Category>(`/categories/${id}`).then((r) => r.data),

  create: (data: CreateCategoriaDto) =>
    api.post<Category>("/categories", data).then((r) => r.data),

  update: (id: string, data: Partial<CreateCategoriaDto>) =>
    api.patch<Category>(`/categories/${id}`, data).then((r) => r.data),

  delete: (id: string) =>
    api.delete(`/categories/${id}`).then((r) => r.data),

  reorder: (ids: string[]) =>
    api.patch("/categories/reorder", { ids }).then((r) => r.data),
};
