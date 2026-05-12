import { api } from "@/lib/http/api";
import type { User } from "@/types";

export interface UpdateProfileDto {
  first_name: string;
  last_name: string;
  phone?: string;
  country?: string;
}

export interface ChangePasswordDto {
  current_password: string;
  new_password: string;
}

export const profileService = {
  getMe: () =>
    api.get<User>("/usuarios/me").then((r) => r.data),

  update: (data: UpdateProfileDto) =>
    api.patch<User>("/usuarios/me", data).then((r) => r.data),

  changePassword: (data: ChangePasswordDto) =>
    api.patch<{ message: string }>("/usuarios/me/password", data).then((r) => r.data),
};
