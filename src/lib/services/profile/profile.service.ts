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
  getMe: async (id: string) => {
    const { data } = await api.get(`/users/profile/${id}`); // Coincide con @Get('profile/:id') de tu NestJS
    return data;
  },

  update: async (id: string, formData: FormData) => {
    const { data } = await api.patch(`/users/profile/${id}`, formData);
    return data;
  },

  changePassword: (data: ChangePasswordDto) =>
    api.patch<{ message: string }>("/usuarios/me/password", data).then((r) => r.data),
};
