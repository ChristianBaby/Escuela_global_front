import { api } from "@/lib/http/api";
import type { Module, Session, Material, PaginatedResponse } from "@/types";

export interface CreateModuleDto {
  title: string;
  description?: string;
}

export interface UpdateModuleDto {
  title?: string;
  description?: string;
  display_order?: number;
}

export interface CreateSessionDto {
  title: string;
  description?: string;
  youtube_url: string;
  duration_minutes: number;
}

export interface UpdateSessionDto {
  title?: string;
  description?: string;
  youtube_url?: string;
  duration_minutes?: number;
  display_order?: number;
}

export interface CreateMaterialDto {
  name: string;
  drive_url: string;
  type: "PDF" | "Excel" | "Word" | "Otro";
}

export interface UpdateMaterialDto {
  name?: string;
  drive_url?: string;
  type?: "PDF" | "Excel" | "Word" | "Otro";
}

export const modulesService = {
  // ── Módulos ────────────────────────────────────────────────────────
  getModules: (courseId: string) =>
    api.get<Module[]>(`/courses/${courseId}/modules`).then((r) => r.data),

  createModule: (courseId: string, data: CreateModuleDto) =>
    api.post<Module>(`/courses/${courseId}/modules`, data).then((r) => r.data),

  updateModule: (courseId: string, moduleId: string, data: UpdateModuleDto) =>
    api.patch<Module>(`/courses/${courseId}/modules/${moduleId}`, data).then((r) => r.data),

  deleteModule: (courseId: string, moduleId: string) =>
    api.delete(`/courses/${courseId}/modules/${moduleId}`).then((r) => r.data),

  reorderModules: (courseId: string, data: { module_id: string; display_order: number }[]) =>
    api.patch(`/courses/${courseId}/modules/reorder`, { modules: data }).then((r) => r.data),

  // ── Sesiones ───────────────────────────────────────────────────────
  getSessions: (courseId: string, moduleId: string) =>
    api.get<Session[]>(`/courses/${courseId}/modules/${moduleId}/sessions`).then((r) => r.data),

  createSession: (courseId: string, moduleId: string, data: CreateSessionDto) =>
    api.post<Session>(`/courses/${courseId}/modules/${moduleId}/sessions`, data).then((r) => r.data),

  updateSession: (courseId: string, moduleId: string, sessionId: string, data: UpdateSessionDto) =>
    api.patch<Session>(`/courses/${courseId}/modules/${moduleId}/sessions/${sessionId}`, data).then((r) => r.data),

  deleteSession: (courseId: string, moduleId: string, sessionId: string) =>
    api.delete(`/courses/${courseId}/modules/${moduleId}/sessions/${sessionId}`).then((r) => r.data),

  reorderSessions: (courseId: string, moduleId: string, data: { session_id: string; display_order: number }[]) =>
    api.patch(`/courses/${courseId}/modules/${moduleId}/sessions/reorder`, { sessions: data }).then((r) => r.data),

  // ── Materiales ─────────────────────────────────────────────────────
  getMaterials: (courseId: string, moduleId: string, sessionId: string) =>
    api.get<Material[]>(`/courses/${courseId}/modules/${moduleId}/sessions/${sessionId}/materials`).then((r) => r.data),

  createMaterial: (courseId: string, moduleId: string, sessionId: string, data: CreateMaterialDto) =>
    api.post<Material>(`/courses/${courseId}/modules/${moduleId}/sessions/${sessionId}/materials`, data).then((r) => r.data),

  updateMaterial: (courseId: string, moduleId: string, sessionId: string, materialId: string, data: UpdateMaterialDto) =>
    api.patch<Material>(`/courses/${courseId}/modules/${moduleId}/sessions/${sessionId}/materials/${materialId}`, data).then((r) => r.data),

  deleteMaterial: (courseId: string, moduleId: string, sessionId: string, materialId: string) =>
    api.delete(`/courses/${courseId}/modules/${moduleId}/sessions/${sessionId}/materials/${materialId}`).then((r) => r.data),
};
