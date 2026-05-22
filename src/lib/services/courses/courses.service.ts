import { api } from "@/lib/http/api";
import type { Course, PaginatedResponse } from "@/types";

export interface CursoParams {
  page?: number;
  limit?: number;
  search?: string;
  status?: string;
  categoria_id?: string;
  categoria_ids?: string;   // IDs separados por coma (multi-selección)
  sort?: string;             // popular | best_rated | recent | price_asc | price_desc
  min_rating?: number;
  softwares?: string;        // nombres separados por coma
  min_price?: number;
  max_price?: number;
  duration?: string;         // '<10' | '10-30' | '>30'
}

export interface InstructorInput {
  full_name: string;
  title: string;
  description?: string;
  photo_url?: string;
}

export interface CreateCursoDto {
  title: string;
  slug?: string;
  tagline: string;
  description: string;
  category_id: string;
  level: "principiante" | "intermedio" | "avanzado";
  price: number;
  discount_price?: number;
  currency: "USD" | "PEN";
  access_duration: "1_year" | "lifetime";
  status: "draft" | "published" | "archived";
  thumbnail_url?: string;
  software_tools: string[];
  instructors: InstructorInput[];
  prerequisites: string[];
  outcomes: string[];
}

export interface CreateCursoResponse {
  success: boolean;
  course: {
    id: string;
    title: string;
    slug: string;
    status: string;
    created_at: string;
  };
}

export interface CreateInstructorDto {
  first_name: string;
  last_name: string;
  title: string;
  description?: string;
  photo_url?: string;
  display_order?: number;
}

export const cursosService = {
  list: (params?: CursoParams) => {
    return api.get<PaginatedResponse<Course>>("/courses", { params }).then((r) => r.data)
  },

  // PARA MEJORAR FILTRADO DE LISTA DE CATALOGO
  listCatalog: (params?: CursoParams) =>
    api.get<PaginatedResponse<Course>>("/courses/catalog", { params }).then((r) => r.data),

  get: (id: string) =>
    api.get<Course>(`/courses/${id}`).then((r) => r.data),

  getBySlug: (slug: string) =>
    api.get<Course>(`/courses/slug/${slug}`).then((r) => r.data),

  getSoftwares: () =>
    api.get<string[]>("/courses/softwares").then((r) => r.data),

  create: (data: CreateCursoDto) =>
    api.post<CreateCursoResponse>("/courses", data).then((r) => r.data),

  update: (id: string, data: Partial<CreateCursoDto>) =>
    api.patch<Course>(`/courses/${id}`, data).then((r) => r.data),

  delete: (id: string) =>
    api.delete(`/courses/${id}`).then((r) => r.data),

  uploadThumbnail: (id: string, file: File) => {
    const formData = new FormData();
    formData.append("thumbnail", file);
    return api
      .post<{ success: boolean; thumbnail_url: string }>(
        `/courses/${id}/thumbnail`,
        formData,
        { headers: { "Content-Type": "multipart/form-data" } }
      )
      .then((r) => r.data);
  },

  addInstructor: (cursoId: string, data: CreateInstructorDto) =>
    api.post(`/courses/${cursoId}/instructors`, data).then((r) => r.data),

  removeInstructor: (cursoId: string, instructorId: string) =>
    api.delete(`/courses/${cursoId}/instructors/${instructorId}`).then((r) => r.data),

  getMatriculados: (id: string, params?: { page?: number; limit?: number; search?: string }) =>
    api.get<PaginatedResponse<Record<string, unknown>>>(`/courses/${id}/matriculados`, { params }).then((r) => r.data),
};
