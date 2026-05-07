"use client";
import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { AuthLayout } from "@/components/templates";
import { FormField } from "@/components/molecules";
import { Button, Checkbox, Label } from "@/components/atoms";
import { useAuthStore } from "@/store/authStore";
import { api } from "@/lib/api";
import type { User } from "@/types";

const loginSchema = z.object({
  email: z.string().email("Ingresa un correo válido"),
  password: z.string().min(6, "La contraseña debe tener al menos 6 caracteres"),
  remember_me: z.boolean(),
});

type LoginFormData = z.infer<typeof loginSchema>;

const ROLE_REDIRECTS: Record<string, string> = {
  estudiante: "/dashboard",
  soporte: "/soporte/cursos",
  marketing: "/marketing/publicaciones",
  admin: "/admin/dashboard",
};

export default function LoginPage() {
  const [serverError, setServerError] = useState<string | null>(null);
  const { setUser } = useAuthStore();
  const router = useRouter();

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    watch,
    setValue,
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: { remember_me: false },
  });

  const rememberMe = watch("remember_me");

  const onSubmit = async (data: LoginFormData) => {
    setServerError(null);
    try {
	    const dataLimpia = {email: data.email, password: data.password}
	    const res = await fetch("api/auth/login",{
		    method: "POST",
		    headers: {
			    "Content-Type":"application/json"
		    },
		    body: JSON.stringify(dataLimpia),
		    credentials: "include"
	    })
	    const datauser = await res.json()
	    router.push(ROLE_REDIRECTS[datauser.role]?? "/dashboard")
	    console.log(datauser)
      /*const res = await api.post<{ access_token: string; user: User }>("/api/auth/login", data);
      const { access_token, user } = res.data;
      setUser(user, access_token, data.remember_me);
      router.push(ROLE_REDIRECTS[user.role] ?? "/dashboard"); */
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      setServerError(msg ?? "Credenciales incorrectas. Inténtalo de nuevo.");
    }
  };

  return (
    <AuthLayout title="Bienvenido de vuelta" subtitle="Ingresa tus datos para continuar">
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5" noValidate>
        {serverError && (
          <div
            role="alert"
            className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-4 py-3"
          >
            {serverError}
          </div>
        )}

        <FormField
          label="Correo electrónico"
          type="email"
          autoComplete="email"
          placeholder="tu@correo.com"
          error={errors.email?.message}
          required
          {...register("email")}
        />

        <FormField
          label="Contraseña"
          type="password"
          autoComplete="current-password"
          placeholder="••••••••"
          error={errors.password?.message}
          required
          {...register("password")}
        />

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Checkbox
              id="remember_me"
              checked={rememberMe}
              onCheckedChange={(val) => setValue("remember_me", !!val)}
            />
            <Label htmlFor="remember_me" className="text-sm text-gray-600 cursor-pointer">
              Recuérdame 30 días
            </Label>
          </div>
          <Link
            href="/recuperar-contraseña"
            className="text-sm text-brand-primary hover:text-brand-secondary transition-colors"
          >
            ¿Olvidaste tu contraseña?
          </Link>
        </div>

        <Button
          type="submit"
          disabled={isSubmitting}
          className="w-full bg-brand-primary hover:bg-brand-primary/90 text-white h-11 font-semibold"
        >
          {isSubmitting ? "Ingresando..." : "Iniciar sesión"}
        </Button>

        <p className="text-center text-sm text-gray-500">
          ¿No tienes cuenta?{" "}
          <Link
            href="/registro"
            className="font-semibold text-brand-primary hover:text-brand-secondary transition-colors"
          >
            Regístrate gratis
          </Link>
        </p>
      </form>
    </AuthLayout>
  );
}
