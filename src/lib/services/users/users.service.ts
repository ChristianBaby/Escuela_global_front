import { api } from "@/lib/http/api";
import type { User, PaginatedResponse, UserRole } from "@/types";

export interface UsuarioParams {
  page?: number;
  limit?: number;
  search?: string;
  role?: UserRole;
  status?: string;
}

export interface CreateUsuarioDto {
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  country?: string;
  role: UserRole;
  password: string;
}

export const usuariosService = {
  list: (params?: UsuarioParams) =>
    api.get<PaginatedResponse<User>>("/admin/usuarios", { params }).then((r) => r.data),

  get: (id: string) =>
    api.get<User>(`/users/${id}`).then((r) => r.data),

  create: (data: CreateUsuarioDto) =>
    api.post<User>("/users", data).then((r) => r.data),

  update: (id: string, data: Partial<CreateUsuarioDto>) =>
    api.patch<User>(`/users/${id}`, data).then((r) => r.data),

  suspend: (id: string) =>
    api.patch(`/users/${id}/suspender`).then((r) => r.data),

  activate: (id: string) =>
    api.patch(`/users/${id}/activar`).then((r) => r.data),

  delete: (id: string) =>
    api.delete(`/users/${id}`).then((r) => r.data),
};
