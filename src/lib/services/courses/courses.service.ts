import { api } from "@/lib/http/api";
import type { Course, PaginatedResponse, Review, VideoProvider } from "@/types";

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
  price_pen: number;
  discount_price_pen?: number;
  price_usd: number;
  discount_price_usd?: number;
  access_duration_months: number;
  status: "draft" | "published" | "archived";
  thumbnail_url?: string;
  software_tools: string[];
  instructors: InstructorInput[];
  prerequisites: string[];
  outcomes: string[];
  academic_hours?: number;
  certification_mode?: "auto" | "manual";
  certificate_template_id?: string | null;
  constancia_template_id?: string | null;
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
  video_provider: VideoProvider;
  youtube_url?: string | null;
  youtube_video_id?: string | null;
  drive_url?: string | null;
  duration_minutes: number;
  display_order: number;
  materials_count: number;
}

export interface CreateSessionDto {
  title: string;
  description?: string;
  video_provider: VideoProvider;
  /** Requerido si video_provider = "youtube". */
  youtube_url?: string;
  /** Requerido si video_provider = "drive". */
  drive_url?: string;
  duration_minutes?: number;
}

// ── Materiales

export interface DriveLinkInspection {
  provider: "google" | "other";
  kind: "file" | "folder" | "document" | null;
  access: "public" | "private" | "not_found" | "unknown";
}

export interface MaterialItem {
  id: string;
  name: string;
  drive_url: string;
  type: "PDF" | "Excel" | "Word" | "Otro" | "Video";
}

export interface CreateMaterialDto {
  name: string;
  drive_url: string;
  type: "PDF" | "Excel" | "Word" | "Otro" | "Video";
}

// ── Import/Export masivo ──────────────────────────────────────────────────

export interface ImportCoursesResult {
  imported: {
    title: string;
    id: string;
    modules_count: number;
    sessions_count: number;
    materials_count: number;
  }[];
  failed: { title: string; errors: string[] }[];
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

  getReviews: (id: string) =>
    api.get<Review[]>(`/courses/${id}/reviews`).then((r) => r.data),

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

  checkDriveLink: (url: string) =>
    api
      .get<DriveLinkInspection>("/materials/drive-check", { params: { url } })
      .then((r) => r.data),

  // ── Import/Export masivo ──────────────────────────────────────────────────

  // Reciben los mismos filtros que `list`; se exportan todos los cursos que los
  // cumplen (sin paginar).
  exportCoursesExcel: (params?: CursoParams) =>
    api
      .get("/courses/bulk/export/excel", { params, responseType: "blob" })
      .then((r) => r.data as Blob),

  exportCoursesJson: (params?: CursoParams) =>
    api.get("/courses/bulk/export/json", { params }).then((r) => r.data),

  importCoursesExcel: (file: File) => {
    const fd = new FormData();
    fd.append("file", file);
    return api
      .post<ImportCoursesResult>("/courses/bulk/import/excel", fd, {
        headers: { "Content-Type": "multipart/form-data" },
      })
      .then((r) => r.data);
  },

  importCoursesJson: (data: unknown) =>
    api
      .post<ImportCoursesResult>("/courses/bulk/import/json", data)
      .then((r) => r.data),
};
