import { api } from "@/lib/http/api";
import type {
	ForgotPasswordDto,
	LoginDto,
	LoginResponse,
	RegisterDto,
	ResetPasswordDto,
	VerifyEmailDto,
} from "./auth.types";

export const authService = {
	login: (data: LoginDto) =>
		api.post<LoginResponse>("/auth/login", data).then((r) => r.data),

	register: (data: RegisterDto) =>
		api.post("/auth/register", data).then((r) => r.data),

	forgotPassword: (data: ForgotPasswordDto) =>
		api.post("/auth/forgot-password", data).then((r) => r.data),

	resetPassword: (data: ResetPasswordDto) =>
		api.post("/auth/reset-password", data).then((r) => r.data),

	verifyEmail: ({ token }: VerifyEmailDto) =>
		api.get("/auth/verify-email", { params: { token } }).then((r) => r.data),
};
