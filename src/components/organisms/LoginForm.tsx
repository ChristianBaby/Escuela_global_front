"use client";
import { useState } from "react";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useQueryClient } from "@tanstack/react-query";
import { Eye, EyeOff } from "lucide-react";
import { FormField, TurnstileWidget } from "@/components/molecules";
import { Button, Checkbox, Label } from "@/components/atoms";
import { useAuthStore } from "@/store/authStore";
import { authService } from "@/lib/services/auth";
import { syncCartAfterAuth } from "@/lib/cart-sync";
import { getGuestSessionToken } from "@/lib/session";
import { cn } from "@/lib/utils";
import type { User } from "@/types";

const loginSchema = z.object({
  email: z.string().email("Ingresa un correo válido"),
  password: z.string().min(6, "La contraseña debe tener al menos 6 caracteres"),
  remember_me: z.boolean(),
});

type LoginFormData = z.infer<typeof loginSchema>;

interface LoginFormProps {
  // El caller decide qué pasa después de iniciar sesión (redirigir por rol en
  // /auth/login, o cerrar el modal y continuar el pago en el checkout).
  onSuccess: (user: User) => void;
  // Si se pasa, el link "Regístrate gratis" cambia de modo en vez de navegar
  // (usado dentro del modal de checkout, que reutiliza este mismo formulario).
  onRegisterClick?: () => void;
  // false cuando el caller (el checkout) ya se encarga de fusionar el
  // carrito y sacar los cursos ya comprados con su propia UX (toast,
  // redirección) — evita hacerlo 2 veces. Por defecto true, para que
  // /auth/login también lo haga sin que cada caller tenga que acordarse.
  syncCartOnSuccess?: boolean;
}

// Mismo formulario/lógica que /auth/login — se extrajo para poder reutilizarlo
// también como modal dentro del checkout sin duplicar la validación ni las
// llamadas al backend.
export function LoginForm({ onSuccess, onRegisterClick, syncCartOnSuccess = true }: LoginFormProps) {
  const [serverError, setServerError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [turnstileToken, setTurnstileToken] = useState<string | null>(null);
  const [turnstileKey, setTurnstileKey] = useState(0);
  const { setUser } = useAuthStore();
  const queryClient = useQueryClient();

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
      const result = await authService.login({
        email: data.email,
        password: data.password,
        remember_me: data.remember_me,
        turnstileToken: turnstileToken ?? "",
      });
      if (result.access_token) {
        const maxAge = data.remember_me ? 60 * 60 * 24 * 30 : "";
        const expires = maxAge ? `; max-age=${maxAge}` : "";
        document.cookie = `access_token=${result.access_token}; path=/; SameSite=Lax${expires}`;
      }
      setUser(result.user);
      if (syncCartOnSuccess) {
        await syncCartAfterAuth(getGuestSessionToken());
        queryClient.invalidateQueries({ queryKey: ["cart"] });
      }
      onSuccess(result.user);
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      setServerError(msg ?? "Credenciales incorrectas. Inténtalo de nuevo.");
      setTurnstileToken(null);
      setTurnstileKey((k) => k + 1);
    }
  };

  return (
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

      <div className="space-y-1.5">
        <label htmlFor="login-password" className="text-sm font-medium text-gray-700">
          Contraseña <span className="text-red-500" aria-hidden>*</span>
        </label>
        <div className="relative">
          <input
            id="login-password"
            type={showPassword ? "text" : "password"}
            autoComplete="current-password"
            placeholder="••••••••"
            aria-invalid={!!errors.password}
            className={cn(
              "w-full border rounded-lg px-3 pr-10 h-10 text-sm outline-none transition",
              "focus:ring-2 focus:ring-brand-primary/30 focus:border-brand-primary",
              errors.password ? "border-red-400" : "border-gray-300"
            )}
            {...register("password")}
          />
          <button
            type="button"
            onClick={() => setShowPassword((p) => !p)}
            aria-label={showPassword ? "Ocultar contraseña" : "Mostrar contraseña"}
            className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
          >
            {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
          </button>
        </div>
        {errors.password && (
          <p role="alert" className="text-xs text-red-500">{errors.password.message}</p>
        )}
      </div>

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Checkbox
            id="login-remember_me"
            checked={rememberMe}
            onCheckedChange={(val) => setValue("remember_me", !!val)}
          />
          <Label htmlFor="login-remember_me" className="text-sm text-gray-600 cursor-pointer">
            Recuérdame 30 días
          </Label>
        </div>
        <Link
          href="/auth/forgot-password"
          className="text-sm text-brand-primary hover:text-brand-secondary transition-colors"
        >
          ¿Olvidaste tu contraseña?
        </Link>
      </div>

      <TurnstileWidget
        key={turnstileKey}
        onVerify={setTurnstileToken}
        onExpire={() => setTurnstileToken(null)}
        className="flex justify-center"
      />

      <Button
        type="submit"
        disabled={isSubmitting || !turnstileToken}
        className="w-full bg-brand-primary hover:bg-brand-primary/90 text-white h-11 font-semibold"
      >
        {isSubmitting ? "Ingresando..." : "Iniciar sesión"}
      </Button>

      <p className="text-center text-sm text-gray-500">
        ¿No tienes cuenta?{" "}
        {onRegisterClick ? (
          <button
            type="button"
            onClick={onRegisterClick}
            className="font-semibold text-brand-primary hover:text-brand-secondary transition-colors"
          >
            Regístrate gratis
          </button>
        ) : (
          <Link
            href="/auth/register"
            className="font-semibold text-brand-primary hover:text-brand-secondary transition-colors"
          >
            Regístrate gratis
          </Link>
        )}
      </p>
    </form>
  );
}
