import { Suspense } from "react";
import { ProfileContent } from "@/components/organisms/ProfileContent";

export default function PerfilPage() {
  return (
    <Suspense fallback={<div className="max-w-2xl text-sm text-gray-500">Cargando perfil...</div>}>
      <ProfileContent />
    </Suspense>
  );
}
