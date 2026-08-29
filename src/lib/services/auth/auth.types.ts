import type { User } from "@/types";

export interface LoginDto {
  email: string;
  password: string;
  remember_me: boolean;
  turnstileToken: string;
}

export interface LoginResponse {
  mensaje?: string;
  access_token?: string;
  user: User;
}

export interface RegisterDto {
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  country?: string;
  profession?: string;
  password: string;
  turnstileToken: string;
}

export interface RegisterResponse {
  success: boolean;
  message?: string;
  user: User;
}

export interface CheckEmailResponse {
  available: boolean;
}

export interface ForgotPasswordDto {
  email: string;
  turnstileToken: string;
}

export interface ResetPasswordDto {
  token: string;
  password: string;
  turnstileToken: string;
}

export interface VerifyEmailDto {
  token: string;
}
