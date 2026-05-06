"use client";
import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Eye, EyeOff } from "lucide-react";
import { AuthLayout } from "@/components/templates";
import { FormField } from "@/components/molecules";
import { Button, Checkbox, Label, buttonVariants } from "@/components/atoms";
import { api } from "@/lib/api";
import { cn } from "@/lib/utils";

const COUNTRIES = [
  { name: "Perú",                code: "PE", dial: "+51",   flag: "🇵🇪" },
  { name: "México",              code: "MX", dial: "+52",   flag: "🇲🇽" },
  { name: "Colombia",            code: "CO", dial: "+57",   flag: "🇨🇴" },
  { name: "Argentina",           code: "AR", dial: "+54",   flag: "🇦🇷" },
  { name: "Chile",               code: "CL", dial: "+56",   flag: "🇨🇱" },
  { name: "Ecuador",             code: "EC", dial: "+593",  flag: "🇪🇨" },
  { name: "Bolivia",             code: "BO", dial: "+591",  flag: "🇧🇴" },
  { name: "Venezuela",           code: "VE", dial: "+58",   flag: "🇻🇪" },
  { name: "Uruguay",             code: "UY", dial: "+598",  flag: "🇺🇾" },
  { name: "Paraguay",            code: "PY", dial: "+595",  flag: "🇵🇾" },
  { name: "Brasil",              code: "BR", dial: "+55",   flag: "🇧🇷" },
  { name: "España",              code: "ES", dial: "+34",   flag: "🇪🇸" },
  { name: "Estados Unidos",      code: "US", dial: "+1",    flag: "🇺🇸" },
  { name: "Canadá",              code: "CA", dial: "+1",    flag: "🇨🇦" },
  { name: "Reino Unido",         code: "GB", dial: "+44",   flag: "🇬🇧" },
  { name: "Alemania",            code: "DE", dial: "+49",   flag: "🇩🇪" },
  { name: "Francia",             code: "FR", dial: "+33",   flag: "🇫🇷" },
  { name: "Italia",              code: "IT", dial: "+39",   flag: "🇮🇹" },
  { name: "Portugal",            code: "PT", dial: "+351",  flag: "🇵🇹" },
  { name: "Panamá",              code: "PA", dial: "+507",  flag: "🇵🇦" },
  { name: "Costa Rica",          code: "CR", dial: "+506",  flag: "🇨🇷" },
  { name: "Guatemala",           code: "GT", dial: "+502",  flag: "🇬🇹" },
  { name: "Honduras",            code: "HN", dial: "+504",  flag: "🇭🇳" },
  { name: "El Salvador",         code: "SV", dial: "+503",  flag: "🇸🇻" },
  { name: "Nicaragua",           code: "NI", dial: "+505",  flag: "🇳🇮" },
  { name: "Cuba",                code: "CU", dial: "+53",   flag: "🇨🇺" },
  { name: "República Dominicana",code: "DO", dial: "+1809", flag: "🇩🇴" },
];

const PROFESSIONS = [
  "Ingeniero/a",
  "Médico/a / Profesional de salud",
  "Contador/a / Auditor/a",
  "Administrador/a de empresas",
  "Economista",
  "Arquitecto/a",
  "Abogado/a",
  "Docente / Educador/a",
  "Estadístico/a / Matemático/a",
  "Analista de datos / Data Scientist",
  "Desarrollador/a de software",
  "Diseñador/a gráfico/a",
  "Técnico/a",
  "Estudiante universitario/a",
  "Otro",
];

function getPasswordStrength(password: string): {
  score: number;
  label: string;
  color: string;
} {
  if (!password) return { score: 0, label: "", color: "" };
  let score = 0;
  if (password.length >= 8)          score++;
  if (password.length >= 12)         score++;
  if (/[A-Z]/.test(password))        score++;
  if (/[0-9]/.test(password))        score++;
  if (/[^A-Za-z0-9]/.test(password)) score++;
  if (score <= 1) return { score: 1, label: "Muy débil",  color: "bg-red-500"     };
  if (score === 2) return { score: 2, label: "Débil",      color: "bg-orange-400"  };
  if (score === 3) return { score: 3, label: "Regular",    color: "bg-yellow-400"  };
  if (score === 4) return { score: 4, label: "Fuerte",     color: "bg-green-500"   };
  return             { score: 5, label: "Muy fuerte", color: "bg-emerald-500" };
}

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

// ─── PasswordInput con forwardRef para que el ojito funcione con react-hook-form
interface PasswordInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  hasError?: boolean;
}

const PasswordInput = React.forwardRef<HTMLInputElement, PasswordInputProps>(
  function PasswordInput({ hasError, className, ...props }, ref) {
    const [show, setShow] = useState(false);
    return (
      <div className="relative">
        <input
          ref={ref}
          type={show ? "text" : "password"}
          aria-invalid={hasError}
          className={cn(
            "w-full border rounded-lg px-3 pr-10 h-10 text-sm outline-none transition focus:ring-2 focus:ring-brand-primary/30 focus:border-brand-primary",
            hasError ? "border-red-400" : "border-gray-300",
            className
          )}
          {...props}
        />
        <button
          type="button"
          onClick={() => setShow((p) => !p)}
          aria-label={show ? "Ocultar contraseña" : "Mostrar contraseña"}
          className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
        >
          {show ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
        </button>
      </div>
    );
  }
);

// ─── Página principal ─────────────────────────────────────────────────────────
export default function RegisterPage() {
  const [serverError, setServerError] = useState<string | null>(null);
  const [success,     setSuccess]     = useState(false);
  const [phonePrefix, setPhonePrefix] = useState("+51");

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
  const strength      = getPasswordStrength(watchPassword);
  const selectedCountry = COUNTRIES.find((c) => c.code === watchCountry);

  useEffect(() => {
    if (selectedCountry) setPhonePrefix(selectedCountry.dial);
  }, [selectedCountry]);

  const onSubmit = async (data: RegisterFormData) => {
    setServerError(null);
    try {
      const { nombres, apellidos, email, country, phone: rawPhone, password, password_confirmation } = data;
      const phone = `${phonePrefix}${rawPhone.replace(/\D/g, "")}`;
      const full_name  = `${nombres.trim()} ${apellidos.trim()}`;
      const first_name = nombres.trim().split(" ")[0];
      await api.post("/api/auth/register", {
        full_name,
        first_name,
        fisrt_name: first_name,
        email,
        phone,
        country,
        password,
        password_confirmation,
      });
      setSuccess(true);
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
      setServerError(
        msg ?? firstError ?? "Error al registrarte. Revisa que el backend este activo."
      );
    }
  };

  // ── Estado de éxito ────────────────────────────────────────────────────────
  if (success) {
    return (
      <AuthLayout title="¡Registro exitoso!" subtitle="Revisa tu correo electrónico">
        <div className="text-center space-y-5">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto">
            <svg className="w-8 h-8 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <p className="text-gray-600 text-sm leading-relaxed">
            Te enviamos un enlace de verificación a tu correo. Activa tu cuenta para comenzar a aprender.
          </p>
          <Link
            href="/login"
            className={cn(
              buttonVariants(),
              "w-full bg-brand-primary hover:bg-brand-primary/90 text-white h-11 justify-center"
            )}
          >
            Ir a iniciar sesión
          </Link>
        </div>
      </AuthLayout>
    );
  }

  // ── Formulario ─────────────────────────────────────────────────────────────
  return (
    <AuthLayout title="Crea tu cuenta" subtitle="Comienza tu camino hacia la especialización">
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
        {serverError && (
          <div
            role="alert"
            className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-4 py-3"
          >
            {serverError}
          </div>
        )}

        {/* Nombre(s) */}
        <FormField
          label="Nombre(s)"
          type="text"
          autoComplete="given-name"
          placeholder="Juan Carlos"
          error={errors.nombres?.message}
          required
          {...register("nombres")}
        />

        {/* Apellidos */}
        <FormField
          label="Apellidos"
          type="text"
          autoComplete="family-name"
          placeholder="Pérez García"
          error={errors.apellidos?.message}
          required
          {...register("apellidos")}
        />

        {/* Email */}
        <FormField
          label="Correo electrónico"
          type="email"
          autoComplete="email"
          placeholder="tu@correo.com"
          error={errors.email?.message}
          required
          {...register("email")}
        />

        {/* País */}
        <div className="space-y-1.5">
          <Label htmlFor="country" className="text-sm font-medium text-gray-700">
            País <span className="text-red-500" aria-hidden>*</span>
          </Label>
          <select
            id="country"
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

        {/* Teléfono con prefijo */}
        <div className="space-y-1.5">
          <Label htmlFor="phone" className="text-sm font-medium text-gray-700">
            Teléfono <span className="text-red-500" aria-hidden>*</span>
          </Label>
          <div className="flex">
            <div className="flex items-center gap-1.5 px-3 bg-gray-50 border border-r-0 border-gray-300 rounded-l-lg text-sm text-gray-600 shrink-0 select-none">
              <span className="text-base leading-none">{selectedCountry?.flag ?? "🌍"}</span>
              <span className="font-medium tabular-nums">{phonePrefix}</span>
            </div>
            <input
              id="phone"
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

        {/* Profesión */}
        <div className="space-y-1.5">
          <Label htmlFor="profession" className="text-sm font-medium text-gray-700">
            Profesión <span className="text-red-500" aria-hidden>*</span>
          </Label>
          <select
            id="profession"
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

        {/* Contraseña */}
        <div className="space-y-1.5">
          <Label htmlFor="password" className="text-sm font-medium text-gray-700">
            Contraseña <span className="text-red-500" aria-hidden>*</span>
          </Label>
          <PasswordInput
            id="password"
            autoComplete="new-password"
            placeholder="Mínimo 8 caracteres"
            hasError={!!errors.password}
            {...register("password")}
          />
          {errors.password && (
            <p role="alert" className="text-xs text-red-500">
              {errors.password.message}
            </p>
          )}
          {watchPassword.length > 0 && (
            <div className="mt-2 space-y-1.5">
              <div className="flex gap-1">
                {[1, 2, 3, 4, 5].map((i) => (
                  <div
                    key={i}
                    className={cn(
                      "h-1.5 flex-1 rounded-full transition-all duration-300",
                      i <= strength.score ? strength.color : "bg-gray-200"
                    )}
                  />
                ))}
              </div>
              <p
                className={cn(
                  "text-xs font-medium",
                  strength.score <= 1 && "text-red-500",
                  strength.score === 2 && "text-orange-500",
                  strength.score === 3 && "text-yellow-600",
                  strength.score >= 4 && "text-green-600"
                )}
              >
                {strength.label}
              </p>
            </div>
          )}
        </div>

        {/* Confirmar contraseña */}
        <div className="space-y-1.5">
          <Label htmlFor="password_confirmation" className="text-sm font-medium text-gray-700">
            Confirmar contraseña <span className="text-red-500" aria-hidden>*</span>
          </Label>
          <PasswordInput
            id="password_confirmation"
            autoComplete="new-password"
            placeholder="Repite tu contraseña"
            hasError={!!errors.password_confirmation}
            {...register("password_confirmation")}
          />
          {errors.password_confirmation && (
            <p role="alert" className="text-xs text-red-500">
              {errors.password_confirmation.message}
            </p>
          )}
        </div>

        {/* Términos */}
        <div className="space-y-1 pt-1">
          <div className="flex items-start gap-2">
            <Checkbox
              id="terms"
              className="mt-0.5 shrink-0"
              checked={terms}
              onCheckedChange={(val) => setValue("terms", !!val)}
            />
            <Label htmlFor="terms" className="text-sm text-gray-600 leading-snug cursor-pointer">
              Acepto los{" "}
              <Link href="/terminos" className="text-brand-primary hover:underline">
                términos de uso
              </Link>{" "}
              y la{" "}
              <Link href="/privacidad" className="text-brand-primary hover:underline">
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

        {/* Botón submit */}
        <Button
          type="submit"
          disabled={isSubmitting}
          className="w-full bg-brand-primary hover:bg-brand-primary/90 text-white h-11 font-semibold mt-2"
        >
          {isSubmitting ? "Creando cuenta..." : "Crear cuenta"}
        </Button>

        <p className="text-center text-sm text-gray-500">
          ¿Ya tienes cuenta?{" "}
          <Link
            href="/login"
            className="font-semibold text-brand-primary hover:text-brand-secondary transition-colors"
          >
            Inicia sesión
          </Link>
        </p>
      </form>
    </AuthLayout>
  );
}
