import Link from "next/link";

export default function SinAccesoPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center">
        <p className="text-5xl font-bold text-[#2B55A3] mb-4">403</p>
        <h1 className="text-xl font-semibold text-gray-900 mb-2">Sin acceso</h1>
        <p className="text-gray-500 mb-6">No tienes permisos para ver esta página.</p>
        <Link href="/login" className="text-sm text-[#2B55A3] hover:underline">
          Volver al inicio
        </Link>
      </div>
    </div>
  );
}
