"use client";

import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { profileService, type UpdateProfileDto, type ChangePasswordDto } from "@/lib/services/profile";
import { useAuthStore } from "@/store/authStore";
import { toast } from "sonner";
import { Eye, EyeOff } from "lucide-react";

const ROLE_LABELS: Record<string, string> = {
  admin: "Administrador",
  soporte: "Soporte",
  marketing: "Marketing",
  estudiante: "Estudiante",
};

const ROLE_COLORS: Record<string, string> = {
  admin: "bg-purple-100 text-purple-700",
  soporte: "bg-blue-100 text-blue-700",
  marketing: "bg-orange-100 text-orange-700",
  estudiante: "bg-green-100 text-green-700",
};

const profileSchema = z.object({
  first_name: z.string().min(2, "Mínimo 2 caracteres"),
  last_name: z.string().min(2, "Mínimo 2 caracteres"),
  phone: z.string().optional(),
  country: z.string().optional(),
  profession: z.string().optional(),
});

const passwordSchema = z
  .object({
    current_password: z.string().min(1, "Campo requerido"),
    new_password: z.string().min(8, "Mínimo 8 caracteres"),
    confirm_password: z.string().min(1, "Campo requerido"),
  })
  .refine((d) => d.new_password === d.confirm_password, {
    message: "Las contraseñas no coinciden",
    path: ["confirm_password"],
  });

type ProfileFormValues = z.infer<typeof profileSchema>;
type PasswordFormValues = z.infer<typeof passwordSchema>;

export function ProfileContent() {
  const [tab, setTab] = useState<"personal" | "security">("personal");
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const { user, updateUser } = useAuthStore();

  const { data: profile } = useQuery({
    queryKey: ["profile-me", user?.id],
    queryFn: () => profileService.getMe(user!.id),
    enabled: !!user?.id,
  });

  const currentUser = profile ?? user;
  const initials = currentUser
    ? `${currentUser.first_name?.[0] ?? ""}${currentUser.last_name?.[0] ?? ""}`.toUpperCase()
    : "?";

  const {
    register: registerProfile,
    handleSubmit: handleProfileSubmit,
    formState: { errors: profileErrors },
  } = useForm<ProfileFormValues>({
    resolver: zodResolver(profileSchema),
    values: {
      first_name: currentUser?.first_name ?? "",
      last_name: currentUser?.last_name ?? "",
      phone: currentUser?.phone ?? "",
      country: currentUser?.country ?? "",
      profession: currentUser?.profession ?? "",
    },
  });

  const {
    register: registerPassword,
    handleSubmit: handlePasswordSubmit,
    formState: { errors: passwordErrors },
    reset: resetPassword,
  } = useForm<PasswordFormValues>({
    resolver: zodResolver(passwordSchema),
  });

  const updateMutation = useMutation({
    mutationFn: (data: UpdateProfileDto) => profileService.update(user!.id, data),
    onSuccess: (updated) => {
      updateUser(updated);
      toast.success("Perfil actualizado correctamente");
    },
    onError: (err: unknown) =>
      toast.error(
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ??
          "Error al actualizar el perfil"
      ),
  });

  const passwordMutation = useMutation({
    mutationFn: (data: ChangePasswordDto) => profileService.changePassword(data),
    onSuccess: () => {
      resetPassword();
      toast.success("Contraseña actualizada correctamente");
    },
    onError: (err: unknown) =>
      toast.error(
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ??
          "Error al cambiar la contraseña"
      ),
  });

  const onProfileSubmit = (data: ProfileFormValues) => updateMutation.mutate(data);

  const onPasswordSubmit = (data: PasswordFormValues) =>
    passwordMutation.mutate({
      current_password: data.current_password,
      new_password: data.new_password,
    });

  return (
    <div className="max-w-2xl">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Mi Perfil</h1>
        <p className="text-sm text-gray-500">Administra tu información personal y seguridad de cuenta</p>
      </div>

      {/* Card superior: avatar + info */}
      <div className="bg-white rounded-xl border border-gray-200 p-6 flex items-center gap-5 mb-6">
        <div className="w-16 h-16 rounded-full bg-[#2B55A3] flex items-center justify-center text-white text-xl font-bold shrink-0">
          {initials}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-lg font-semibold text-gray-900">
            {currentUser?.first_name} {currentUser?.last_name}
          </p>
          <p className="text-sm text-gray-500 truncate">{currentUser?.email}</p>
          <div className="flex items-center gap-2 mt-1.5 flex-wrap">
            <span
              className={`text-xs px-2.5 py-0.5 rounded-full font-medium ${
                ROLE_COLORS[currentUser?.role ?? ""] ?? "bg-gray-100 text-gray-600"
              }`}
            >
              {ROLE_LABELS[currentUser?.role ?? ""] ?? currentUser?.role}
            </span>
            {currentUser?.email_verified && (
              <span className="text-xs px-2.5 py-0.5 rounded-full font-medium bg-green-50 text-green-700">
                Correo verificado
              </span>
            )}
          </div>
        </div>
        <div className="text-right text-xs text-gray-400 shrink-0">
          <p>Miembro desde</p>
          <p className="font-medium text-gray-600 mt-0.5">
            {currentUser?.created_at
              ? new Date(currentUser.created_at).toLocaleDateString("es-PE", {
                  month: "long",
                  year: "numeric",
                })
              : "—"}
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 border-b border-gray-200 mb-4">
        {(
          [
            { key: "personal", label: "Datos personales" },
            { key: "security", label: "Seguridad" },
          ] as const
        ).map(({ key, label }) => (
          <button
            key={key}
            onClick={() => setTab(key)}
            className={`px-4 py-2.5 text-sm font-medium transition-colors border-b-2 -mb-px ${
              tab === key
                ? "border-[#2B55A3] text-[#2B55A3]"
                : "border-transparent text-gray-500 hover:text-gray-700"
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Tab: Datos personales */}
      {tab === "personal" && (
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <form onSubmit={handleProfileSubmit(onProfileSubmit)} className="space-y-5">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-gray-700">Nombres *</label>
                <input
                  {...registerProfile("first_name")}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#2B55A3]/30"
                />
                {profileErrors.first_name && (
                  <p className="text-xs text-red-500">{profileErrors.first_name.message}</p>
                )}
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-gray-700">Apellidos *</label>
                <input
                  {...registerProfile("last_name")}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#2B55A3]/30"
                />
                {profileErrors.last_name && (
                  <p className="text-xs text-red-500">{profileErrors.last_name.message}</p>
                )}
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-sm font-medium text-gray-700">Correo electrónico</label>
              <input
                value={currentUser?.email ?? ""}
                disabled
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm bg-gray-50 text-gray-500 cursor-not-allowed"
              />
              <p className="text-xs text-gray-400">El correo no puede modificarse desde aquí.</p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-gray-700">Teléfono</label>
                <input
                  {...registerProfile("phone")}
                  placeholder="+51 999 000 111"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#2B55A3]/30"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-gray-700">País</label>
                <input
                  {...registerProfile("country")}
                  placeholder="Perú"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#2B55A3]/30"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-sm font-medium text-gray-700">Profesión</label>
              <input
                {...registerProfile("profession")}
                placeholder="Ej: Contador, Ingeniero, Diseñador..."
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#2B55A3]/30"
              />
            </div>

            <div className="flex justify-end pt-2">
              <button
                type="submit"
                disabled={updateMutation.isPending}
                className="px-6 py-2 bg-[#2B55A3] text-white rounded-lg text-sm font-medium hover:bg-[#2B55A3]/90 disabled:opacity-50 transition-colors"
              >
                {updateMutation.isPending ? "Guardando..." : "Guardar cambios"}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Tab: Seguridad */}
      {tab === "security" && (
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <div className="mb-5">
            <h2 className="text-sm font-semibold text-gray-900">Cambiar contraseña</h2>
            <p className="text-xs text-gray-500 mt-0.5">
              Utiliza al menos 8 caracteres combinando letras y números.
            </p>
          </div>
          <form onSubmit={handlePasswordSubmit(onPasswordSubmit)} className="space-y-4">
            {/* Contraseña actual */}
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-gray-700">Contraseña actual</label>
              <div className="relative">
                <input
                  {...registerPassword("current_password")}
                  type={showCurrent ? "text" : "password"}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 pr-10 text-sm focus:outline-none focus:ring-2 focus:ring-[#2B55A3]/30"
                />
                <button
                  type="button"
                  onClick={() => setShowCurrent(!showCurrent)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showCurrent ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
              {passwordErrors.current_password && (
                <p className="text-xs text-red-500">{passwordErrors.current_password.message}</p>
              )}
            </div>

            {/* Nueva contraseña */}
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-gray-700">Nueva contraseña</label>
              <div className="relative">
                <input
                  {...registerPassword("new_password")}
                  type={showNew ? "text" : "password"}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 pr-10 text-sm focus:outline-none focus:ring-2 focus:ring-[#2B55A3]/30"
                />
                <button
                  type="button"
                  onClick={() => setShowNew(!showNew)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showNew ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
              {passwordErrors.new_password && (
                <p className="text-xs text-red-500">{passwordErrors.new_password.message}</p>
              )}
            </div>

            {/* Confirmar contraseña */}
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-gray-700">Confirmar contraseña</label>
              <div className="relative">
                <input
                  {...registerPassword("confirm_password")}
                  type={showConfirm ? "text" : "password"}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 pr-10 text-sm focus:outline-none focus:ring-2 focus:ring-[#2B55A3]/30"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirm(!showConfirm)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showConfirm ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
              {passwordErrors.confirm_password && (
                <p className="text-xs text-red-500">{passwordErrors.confirm_password.message}</p>
              )}
            </div>

            <div className="flex justify-end pt-2">
              <button
                type="submit"
                disabled={passwordMutation.isPending}
                className="px-6 py-2 bg-[#2B55A3] text-white rounded-lg text-sm font-medium hover:bg-[#2B55A3]/90 disabled:opacity-50 transition-colors"
              >
                {passwordMutation.isPending ? "Actualizando..." : "Actualizar contraseña"}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
