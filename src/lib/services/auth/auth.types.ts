import type { User } from "@/types";

export interface LoginDto {
  email: string;
  password: string;
  remember_me: boolean;
}

export interface LoginResponse {
  mensaje: string;
  user: User;
}

export interface RegisterDto {
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  country?: string;
  password: string;
}

export interface ForgotPasswordDto {
  email: string;
  captcha_token?: string;
}

export interface ResetPasswordDto {
  token: string;
  password: string;
}

export interface VerifyEmailDto {
  token: string;
}
