import { api } from "@/lib/http/api";
import type { Course, PaginatedResponse } from "@/types";

export interface CursoParams {
  page?: number;
  limit?: number;
  search?: string;
  status?: string;
  categoria_id?: string;
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
  list: (params?: CursoParams) =>
    api.get<PaginatedResponse<Course>>("/cursos", { params }).then((r) => r.data),

  get: (id: string) =>
    api.get<Course>(`/cursos/${id}`).then((r) => r.data),

  create: (data: CreateCursoDto) =>
    api.post<CreateCursoResponse>("/cursos", data).then((r) => r.data),

  update: (id: string, data: Partial<CreateCursoDto>) =>
    api.patch<Course>(`/cursos/${id}`, data).then((r) => r.data),

  delete: (id: string) =>
    api.delete(`/cursos/${id}`).then((r) => r.data),

  uploadThumbnail: (id: string, file: File) => {
    const formData = new FormData();
    formData.append("thumbnail", file);
    return api
      .post<{ success: boolean; thumbnail_url: string }>(
        `/cursos/${id}/thumbnail`,
        formData,
        { headers: { "Content-Type": "multipart/form-data" } }
      )
      .then((r) => r.data);
  },

  addInstructor: (cursoId: string, data: CreateInstructorDto) =>
    api.post(`/cursos/${cursoId}/instructores`, data).then((r) => r.data),

  removeInstructor: (cursoId: string, instructorId: string) =>
    api.delete(`/cursos/${cursoId}/instructores/${instructorId}`).then((r) => r.data),

  getMatriculados: (id: string, params?: { page?: number; limit?: number; search?: string }) =>
    api.get<PaginatedResponse<Record<string, unknown>>>(`/cursos/${id}/matriculados`, { params }).then((r) => r.data),
};
