import { api } from "@/lib/api";
import type { Enrollment, PaginatedResponse } from "@/types";

export interface MatriculacionParams {
  page?: number;
  limit?: number;
  search?: string;
  curso_id?: string;
}

export interface CreateMatriculacionDto {
  user_id: string;
  course_ids: string[];
  offline_payment_method: "transferencia" | "efectivo" | "cortesia" | "otro";
  offline_amount?: number;
  internal_notes?: string;
}

export const matriculacionesService = {
  list: (params?: MatriculacionParams) =>
    api.get<PaginatedResponse<Enrollment>>("/matriculaciones", { params }).then((r) => r.data),

  create: (data: CreateMatriculacionDto) =>
    api.post<Enrollment[]>("/matriculaciones", data).then((r) => r.data),

  // Buscar estudiantes para el autocompletado
  buscarEstudiante: (query: string) =>
    api.get<{ id: string; full_name: string; email: string }[]>(
      "/usuarios/buscar",
      { params: { q: query, role: "estudiante" } }
    ).then((r) => r.data),
};
