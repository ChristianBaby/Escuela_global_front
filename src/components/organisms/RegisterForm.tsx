"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useQueryClient } from "@tanstack/react-query";
import { AlertCircle } from "lucide-react";
import { FormField, PasswordField, TurnstileWidget } from "@/components/molecules";
import { Button, Checkbox, Label } from "@/components/atoms";
import { authService } from "@/lib/services/auth";
import { syncCartAfterAuth } from "@/lib/cart-sync";
import { getGuestSessionToken } from "@/lib/session";
import { cn } from "@/lib/utils";
import { COUNTRIES, PROFESSIONS } from "@/lib/constants/checkout-options";
import type { User } from "@/types";

const registerSchema = z
  .object({
    nombres:              z.string().min(2, "Ingresa tu(s) nombre(s) (mínimo 2 caracteres)"),
    apellidos:            z.string().min(2, "Ingresa tus apellidos (mínimo 2 caracteres)"),
    email:                z.string().email("Ingresa un correo válido"),
    country:              z.string().min(1, "Selecciona tu país"),
    phone:                z.string().min(6, "Teléfono inválido").max(15, "Teléfono inválido"),
    profession:           z.string().min(1, "Selecciona tu profesión"),
    password:             z.string().min(8, "La contraseña debe tener mínimo 8 caracteres"),
    password_confirmation:z.string(),
    terms:                z.boolean().refine((v) => v, "Debes aceptar los términos para continuar"),
  })
  .refine((d) => d.password === d.password_confirmation, {
    message: "Las contraseñas no coinciden",
    path: ["password_confirmation"],
  });

type RegisterFormData = z.infer<typeof registerSchema>;

type EmailStatus = "idle" | "checking" | "available" | "exists";

// El backend a veces responde con 500 en vez de un 409 limpio cuando el
// correo ya está registrado — se detecta por texto como red de seguridad
// además del chequeo proactivo en el blur del campo.
function looksLikeDuplicateEmail(msg: string | null | undefined): boolean {
  if (!msg) return false;
  const m = msg.toLowerCase();
  return m.includes("correo") && (m.includes("ya") || m.includes("existe") || m.includes("uso") || m.includes("registrad"));
}

interface RegisterFormProps {
  // El caller decide qué pasa después de registrarse (mostrar "revisa tu
  // correo" en /auth/register, o cerrar el modal y continuar el pago en el
  // checkout).
  onSuccess: (user: User) => void;
  // Si se pasa, el link "Inicia sesión" cambia de modo en vez de navegar
  // (usado dentro del modal de checkout, que reutiliza este mismo formulario).
  onLoginClick?: () => void;
  // false cuando el caller (el checkout) ya se encarga de fusionar el
  // carrito con su propia UX — evita hacerlo 2 veces. Por defecto true, para
  // que /auth/register también lo haga sin que cada caller se tenga que
  // acordar (una cuenta recién creada nunca tiene cursos ya comprados, pero
  // sí puede traer cursos del carrito de invitado que hay que fusionar).
  syncCartOnSuccess?: boolean;
}

// Mismo formulario/lógica que /auth/register — se extrajo para poder
// reutilizarlo también como modal dentro del checkout sin duplicar la
// validación ni las llamadas al backend.
export function RegisterForm({ onSuccess, onLoginClick, syncCartOnSuccess = true }: RegisterFormProps) {
  const [serverError, setServerError] = useState<string | null>(null);
  const [phonePrefix, setPhonePrefix] = useState("+51");
  const [turnstileToken, setTurnstileToken] = useState<string | null>(null);
  const [turnstileKey, setTurnstileKey] = useState(0);
  const [emailStatus, setEmailStatus] = useState<EmailStatus>("idle");
  const queryClient = useQueryClient();

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    watch,
    setValue,
  } = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
    defaultValues: { terms: false, country: "PE" },
  });

  const terms         = watch("terms");
  const watchCountry  = watch("country");
  const watchPassword = watch("password") ?? "";
  const selectedCountry = COUNTRIES.find((c) => c.code === watchCountry);

  useEffect(() => {
    if (selectedCountry) setPhonePrefix(selectedCountry.dial);
  }, [selectedCountry]);

  // Aviso proactivo apenas se sale del campo de correo, en vez de dejar que
  // el alumno llene todo el formulario y recién en el submit se entere de
  // que ese correo ya tiene cuenta (el backend a veces ni siquiera responde
  // con un error claro ahí — puede devolver un 500 genérico).
  async function handleEmailBlur(email: string) {
    if (!email || !z.string().email().safeParse(email).success) {
      setEmailStatus("idle");
      return;
    }
    setEmailStatus("checking");
    try {
      const res = await authService.checkEmail(email);
      setEmailStatus(res.available ? "available" : "exists");
    } catch {
      setEmailStatus("idle");
    }
  }

  const onSubmit = async (data: RegisterFormData) => {
    setServerError(null);
    if (emailStatus === "exists") return;
    try {
      const { nombres, apellidos, email, country, phone: rawPhone, profession, password } = data;

      const phone = `${phonePrefix}${rawPhone.replace(/\D/g, "")}`;

      const res = await authService.register({
        first_name: nombres.trim(),
        last_name: apellidos.trim(),
        email,
        phone,
        password,
        country,
        profession,
        turnstileToken: turnstileToken ?? "",
      });

      if (syncCartOnSuccess) {
        await syncCartAfterAuth(getGuestSessionToken());
        queryClient.invalidateQueries({ queryKey: ["cart"] });
      }
      onSuccess(res.user);
    } catch (err: unknown) {
      console.error("Register error:", err);
      const msg =
        (err as { response?: { data?: { message?: string } } })?.response?.data
          ?.message;
      const errors = (err as { response?: { data?: { errors?: Record<string, string[] | string> } } })
        ?.response?.data?.errors;
      const firstError = errors
        ? Object.values(errors)
            .flat()
            .find(Boolean)
        : null;
      const finalMsg = (msg ?? firstError) as string | undefined;
      if (looksLikeDuplicateEmail(finalMsg)) {
        // Red de seguridad si el blur no llegó a marcarlo (autofill, correo
        // pegado sin salir del campo) — mismo aviso que el chequeo proactivo.
        setEmailStatus("exists");
      } else {
        setServerError(finalMsg ?? "Error al registrarte. Revisa que el backend este activo.");
      }
      setTurnstileToken(null);
      setTurnstileKey((k) => k + 1);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
      {serverError && (
        <div
          role="alert"
          className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-4 py-3"
        >
          {serverError}
        </div>
      )}

      <FormField
        label="Nombre(s)"
        type="text"
        autoComplete="given-name"
        placeholder="Juan Carlos"
        error={errors.nombres?.message}
        required
        {...register("nombres")}
      />

      <FormField
        label="Apellidos"
        type="text"
        autoComplete="family-name"
        placeholder="Pérez García"
        error={errors.apellidos?.message}
        required
        {...register("apellidos")}
      />

      <FormField
        label="Correo electrónico"
        type="email"
        autoComplete="email"
        placeholder="tu@correo.com"
        error={errors.email?.message}
        required
        {...register("email", { onBlur: (e) => handleEmailBlur(e.target.value) })}
      />

      {emailStatus === "checking" && (
        <p className="text-xs text-gray-400 -mt-2">Verificando correo…</p>
      )}

      {emailStatus === "exists" && (
        <div
          role="alert"
          className="flex items-start gap-2.5 bg-amber-50 border border-amber-200 rounded-lg p-3.5 -mt-2 text-sm text-amber-800"
        >
          <AlertCircle size={16} className="shrink-0 mt-0.5" />
          <div className="space-y-1.5">
            <p>Este correo ya tiene una cuenta registrada.</p>
            <div className="flex flex-wrap gap-x-4 gap-y-1 font-semibold">
              {onLoginClick ? (
                <button type="button" onClick={onLoginClick} className="underline hover:text-amber-900">
                  Iniciar sesión
                </button>
              ) : (
                <Link href="/auth/login" className="underline hover:text-amber-900">
                  Iniciar sesión
                </Link>
              )}
              <Link href="/auth/forgot-password" className="underline hover:text-amber-900">
                ¿Olvidaste tu contraseña?
              </Link>
            </div>
          </div>
        </div>
      )}

      <div className="space-y-1.5">
        <Label htmlFor="register-country" className="text-sm font-medium text-gray-700">
          País <span className="text-red-500" aria-hidden>*</span>
        </Label>
        <select
          id="register-country"
          {...register("country")}
          className={cn(
            "w-full border rounded-lg px-3 h-10 text-sm bg-white text-gray-900 outline-none transition focus:ring-2 focus:ring-brand-primary/30 focus:border-brand-primary",
            errors.country ? "border-red-400" : "border-gray-300"
          )}
        >
          <option value="">Selecciona tu país</option>
          {COUNTRIES.map((c) => (
            <option key={c.code} value={c.code}>
              {c.flag} {c.name}
            </option>
          ))}
        </select>
        {errors.country && (
          <p role="alert" className="text-xs text-red-500">
            {errors.country.message}
          </p>
        )}
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="register-phone" className="text-sm font-medium text-gray-700">
          Teléfono <span className="text-red-500" aria-hidden>*</span>
        </Label>
        <div className="flex">
          <div className="flex items-center gap-1.5 px-3 bg-gray-50 border border-r-0 border-gray-300 rounded-l-lg text-sm text-gray-600 shrink-0 select-none">
            <span className="text-base leading-none">{selectedCountry?.flag ?? "🌍"}</span>
            <span className="font-medium tabular-nums">{phonePrefix}</span>
          </div>
          <input
            id="register-phone"
            type="tel"
            autoComplete="tel"
            placeholder="999 999 999"
            aria-invalid={!!errors.phone}
            className={cn(
              "flex-1 border rounded-r-lg px-3 h-10 text-sm outline-none transition focus:ring-2 focus:ring-brand-primary/30 focus:border-brand-primary",
              errors.phone ? "border-red-400" : "border-gray-300"
            )}
            {...register("phone")}
          />
        </div>
        {errors.phone && (
          <p role="alert" className="text-xs text-red-500">
            {errors.phone.message}
          </p>
        )}
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="register-profession" className="text-sm font-medium text-gray-700">
          Profesión <span className="text-red-500" aria-hidden>*</span>
        </Label>
        <select
          id="register-profession"
          {...register("profession")}
          className={cn(
            "w-full border rounded-lg px-3 h-10 text-sm bg-white text-gray-900 outline-none transition focus:ring-2 focus:ring-brand-primary/30 focus:border-brand-primary",
            errors.profession ? "border-red-400" : "border-gray-300"
          )}
        >
          <option value="">Selecciona tu profesión</option>
          {PROFESSIONS.map((p) => (
            <option key={p} value={p}>{p}</option>
          ))}
        </select>
        {errors.profession && (
          <p role="alert" className="text-xs text-red-500">
            {errors.profession.message}
          </p>
        )}
      </div>

      <PasswordField
        label="Contraseña"
        id="register-password"
        autoComplete="new-password"
        placeholder="Mínimo 8 caracteres"
        error={errors.password?.message}
        required
        showStrength
        value={watchPassword}
        {...register("password")}
      />

      <PasswordField
        label="Confirmar contraseña"
        id="register-password_confirmation"
        autoComplete="new-password"
        placeholder="Repite tu contraseña"
        error={errors.password_confirmation?.message}
        required
        {...register("password_confirmation")}
      />

      <div className="space-y-1 pt-1">
        <div className="flex items-start gap-2">
          <Checkbox
            id="register-terms"
            className="mt-0.5 shrink-0"
            checked={terms}
            onCheckedChange={(val) => setValue("terms", !!val)}
          />
          <Label htmlFor="register-terms" className="text-sm text-gray-600 leading-snug cursor-pointer">
            Acepto los{" "}
            <Link href="/institucional/terminos" className="text-brand-primary hover:underline" target="_blank">
              términos de uso
            </Link>{" "}
            y la{" "}
            <Link href="/institucional/privacidad" className="text-brand-primary hover:underline" target="_blank">
              política de privacidad
            </Link>
          </Label>
        </div>
        {errors.terms && (
          <p role="alert" className="text-xs text-red-500 pl-6">
            {errors.terms.message}
          </p>
        )}
      </div>

      <TurnstileWidget
        key={turnstileKey}
        onVerify={setTurnstileToken}
        onExpire={() => setTurnstileToken(null)}
        className="flex justify-center"
      />

      <Button
        type="submit"
        disabled={isSubmitting || !turnstileToken || emailStatus === "exists"}
        className="w-full bg-brand-primary hover:bg-brand-primary/90 text-white h-11 font-semibold mt-2"
      >
        {isSubmitting ? "Creando cuenta..." : "Crear cuenta"}
      </Button>

      <p className="text-center text-sm text-gray-500">
        ¿Ya tienes cuenta?{" "}
        {onLoginClick ? (
          <button
            type="button"
            onClick={onLoginClick}
            className="font-semibold text-brand-primary hover:text-brand-secondary transition-colors"
          >
            Inicia sesión
          </button>
        ) : (
          <Link
            href="/auth/login"
            className="font-semibold text-brand-primary hover:text-brand-secondary transition-colors"
          >
            Inicia sesión
          </Link>
        )}
      </p>
    </form>
  );
}
