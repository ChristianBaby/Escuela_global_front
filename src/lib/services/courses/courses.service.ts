import { api } from "@/lib/http/api";
import type { Course, PaginatedResponse } from "@/types";

export interface CursoParams {
  page?: number;
  limit?: number;
  search?: string;
  status?: string;
  categoria_id?: string;
  categoria_ids?: string;  
  sort?: string;           
  min_rating?: number;
  softwares?: string;     
  min_price?: number;
  max_price?: number;
  duration?: string;        
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

// ── Módulos

export interface ModuleListItem {
  id: string;
  title: string;
  description?: string;
  display_order: number;
  sessions_count: number;
  total_duration: number;
}

export interface CreateModuleDto {
  title: string;
  description?: string;
}

// ── Sesiones 

export interface SessionListItem {
  id: string;
  title: string;
  description?: string;
  youtube_url: string;
  youtube_video_id: string;
  duration_minutes: number;
  display_order: number;
  materials_count: number;
}

export interface CreateSessionDto {
  title: string;
  description?: string;
  youtube_url: string;
  duration_minutes: number;
}

// ── Materiales

export interface MaterialItem {
  id: string;
  name: string;
  drive_url: string;
  type: "PDF" | "Excel" | "Word" | "Otro";
}

export interface CreateMaterialDto {
  name: string;
  drive_url: string;
  type: "PDF" | "Excel" | "Word" | "Otro";
}

export const cursosService = {
  list: (params?: CursoParams) => {
    return api.get<PaginatedResponse<Course>>("/courses", { params }).then((r) => r.data)
  },

  // CATALOGO
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

  // ── Módulos ────────────────────────────────────────────────────────────────

  getModules: (courseId: string) =>
    api.get<ModuleListItem[]>(`/courses/${courseId}/modules`).then((r) => r.data),

  createModule: (courseId: string, data: CreateModuleDto) =>
    api.post<{ success: boolean; module: ModuleListItem }>(`/courses/${courseId}/modules`, data).then((r) => r.data),

  updateModule: (moduleId: string, data: CreateModuleDto) =>
    api.patch<{ success: boolean; module: ModuleListItem }>(`/modules/${moduleId}`, data).then((r) => r.data),

  deleteModule: (moduleId: string) =>
    api.delete<{ success: boolean }>(`/modules/${moduleId}`).then((r) => r.data),

  // ── Sesiones ───────────────────────────────────────────────────────────────

  getSessions: (moduleId: string) =>
    api.get<SessionListItem[]>(`/modules/${moduleId}/sessions`).then((r) => r.data),

  createSession: (moduleId: string, data: CreateSessionDto) =>
    api.post<{ success: boolean; session: SessionListItem }>(`/modules/${moduleId}/sessions`, data).then((r) => r.data),

  updateSession: (sessionId: string, data: CreateSessionDto) =>
    api.patch<{ success: boolean; session: SessionListItem }>(`/sessions/${sessionId}`, data).then((r) => r.data),

  deleteSession: (sessionId: string) =>
    api.delete<{ success: boolean }>(`/sessions/${sessionId}`).then((r) => r.data),

  // ── Materiales ─────────────────────────────────────────────────────────────

  getMaterials: (sessionId: string) =>
    api.get<MaterialItem[]>(`/sessions/${sessionId}/materials`).then((r) => r.data),

  createMaterial: (sessionId: string, data: CreateMaterialDto) =>
    api.post<{ success: boolean; material: MaterialItem }>(`/sessions/${sessionId}/materials`, data).then((r) => r.data),

  deleteMaterial: (materialId: string) =>
    api.delete<{ success: boolean }>(`/materials/${materialId}`).then((r) => r.data),
};
