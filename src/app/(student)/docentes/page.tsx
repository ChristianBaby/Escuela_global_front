"use client";

import { DocentesDirectory } from "@/components/organisms/DocentesDirectory";

export default function DocentesPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-brand-primary">Plana Docente</h1>
        <p className="text-sm text-gray-500 mt-1">
          Instructores y consultores especialistas a cargo de las asignaturas y programas.
        </p>
      </div>

      <DocentesDirectory />
    </div>
  );
}