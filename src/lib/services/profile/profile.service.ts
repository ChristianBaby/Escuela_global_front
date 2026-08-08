import { api } from "@/lib/http/api";
import type { User } from "@/types";

export interface UpdateProfileDto {
  first_name: string;
  last_name: string;
  phone?: string;
  country?: string;
  profession?: string;
}

export interface ChangePasswordDto {
  current_password: string;
  new_password: string;
}

export const profileService = {
  getMe: (id: string) =>
    api.get<User>(`/users/profile/${id}`).then((r) => r.data),

  update: (id: string, data: UpdateProfileDto) =>
    api.patch<User>(`/users/profile/${id}`, data).then((r) => r.data),

  changePassword: (data: ChangePasswordDto) =>
    api.patch<{ message: string }>("/users/me/password", data).then((r) => r.data),
};
