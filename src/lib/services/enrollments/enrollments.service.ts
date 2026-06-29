import { api } from "@/lib/http/api";
import type { Enrollment, PaginatedResponse } from "@/types";

export interface MatriculasParams {
  page?: number;
  limit?: number;
  search?: string;
  curso_id?: string;
}

export interface CreateMatriculasDto {
  user_id: string;
  course_ids: string[];
  offline_payment_method: "transferencia" | "efectivo" | "cortesia" | "otro";
  offline_amount?: number;
  internal_notes?: string;
}

export const matriculasService = {
  list: (params?: MatriculasParams) =>
    api.get<PaginatedResponse<Enrollment>>("/enrollments", { params }).then((r) => r.data),

  create: (data: CreateMatriculasDto) =>
    api.post<Enrollment[]>("/enrollments", data).then((r) => r.data),

  deleteEnrollment: (enrollmentId: string) =>
    api.delete(`/enrollments/${enrollmentId}`).then((r) => r.data),

  buscarEstudiante: (query: string) =>
    api.get<{ id: string; first_name: string; last_name: string; email: string }[]>(
      "/users/buscar",
      { params: { q: query, role: "estudiante" } }
    ).then((r) => r.data),
};
