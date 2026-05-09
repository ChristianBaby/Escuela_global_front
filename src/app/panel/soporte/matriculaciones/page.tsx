"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { matriculacionesService, type CreateMatriculacionDto } from "@/lib/services/matriculaciones";
import { cursosService } from "@/lib/services/cursos";
import { toast } from "sonner";

const METODOS = [
  { value: "transferencia", label: "Transferencia bancaria" },
  { value: "efectivo", label: "Efectivo" },
  { value: "cortesia", label: "Cortesía" },
  { value: "otro", label: "Otro" },
];

export default function MatriculacionesPage() {
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [showForm, setShowForm] = useState(false);
  const [studentSearch, setStudentSearch] = useState("");
  const [studentResults, setStudentResults] = useState<{ id: string; full_name: string; email: string }[]>([]);
  const [selectedStudent, setSelectedStudent] = useState<{ id: string; full_name: string; email: string } | null>(null);
  const [selectedCourses, setSelectedCourses] = useState<string[]>([]);
  const [metodo, setMetodo] = useState<CreateMatriculacionDto["offline_payment_method"]>("transferencia");
  const [monto, setMonto] = useState("");
  const [notas, setNotas] = useState("");

  const { data: matriculaciones, isLoading } = useQuery({
    queryKey: ["matriculaciones", page],
    queryFn: () => matriculacionesService.list({ page, limit: 15 }),
  });

  const { data: cursosData } = useQuery({
    queryKey: ["cursos-activos"],
    queryFn: () => cursosService.list({ status: "published", limit: 100 }),
  });

  const createMutation = useMutation({
    mutationFn: matriculacionesService.create,
    onSuccess: () => {
      toast.success("Matriculación realizada. Se envió email al estudiante.");
      queryClient.invalidateQueries({ queryKey: ["matriculaciones"] });
      resetForm();
    },
    onError: (err: unknown) => {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      toast.error(msg ?? "Error al matricular");
    },
  });

  const resetForm = () => {
    setShowForm(false);
    setSelectedStudent(null);
    setStudentSearch("");
    setStudentResults([]);
    setSelectedCourses([]);
    setMetodo("transferencia");
    setMonto("");
    setNotas("");
  };

  const buscarEstudiante = async (q: string) => {
    setStudentSearch(q);
    if (q.length < 3) { setStudentResults([]); return; }
    try {
      const results = await matriculacionesService.buscarEstudiante(q);
      setStudentResults(results);
    } catch {
      setStudentResults([]);
    }
  };

  const toggleCurso = (id: string) => {
    setSelectedCourses((prev) =>
      prev.includes(id) ? prev.filter((c) => c !== id) : [...prev, id]
    );
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedStudent) { toast.error("Selecciona un estudiante"); return; }
    if (selectedCourses.length === 0) { toast.error("Selecciona al menos un curso"); return; }

    createMutation.mutate({
      user_id: selectedStudent.id,
      course_ids: selectedCourses,
      offline_payment_method: metodo,
      offline_amount: monto ? parseFloat(monto) : undefined,
      internal_notes: notas || undefined,
    });
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Matriculaciones</h1>
          <p className="text-gray-500 text-sm">Matriculación manual de estudiantes (sin pago online)</p>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="bg-[#2B55A3] text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-[#2B55A3]/90 transition-colors"
        >
          + Nueva matriculación
        </button>
      </div>

      {/* Formulario de matriculación */}
      {showForm && (
        <div className="bg-white rounded-xl border border-gray-200 p-6 mb-6">
          <h2 className="font-semibold text-gray-900 mb-4">Nueva matriculación manual</h2>
          <form onSubmit={handleSubmit} className="space-y-5">

            {/* Buscar estudiante */}
            <div className="space-y-1">
              <label className="text-sm font-medium text-gray-700">Estudiante *</label>
              {selectedStudent ? (
                <div className="flex items-center justify-between bg-blue-50 border border-blue-200 rounded-lg px-4 py-3">
                  <div>
                    <p className="font-medium text-gray-900 text-sm">{selectedStudent.full_name}</p>
                    <p className="text-xs text-gray-500">{selectedStudent.email}</p>
                  </div>
                  <button type="button" onClick={() => { setSelectedStudent(null); setStudentSearch(""); }} className="text-xs text-red-500 hover:underline">
                    Cambiar
                  </button>
                </div>
              ) : (
                <div className="relative">
                  <input
                    type="text"
                    placeholder="Buscar por nombre o email (mín. 3 caracteres)..."
                    value={studentSearch}
                    onChange={(e) => buscarEstudiante(e.target.value)}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#2B55A3]/30"
                  />
                  {studentResults.length > 0 && (
                    <div className="absolute top-full left-0 right-0 bg-white border border-gray-200 rounded-lg shadow-lg mt-1 z-10">
                      {studentResults.map((s) => (
                        <button
                          key={s.id}
                          type="button"
                          onClick={() => { setSelectedStudent(s); setStudentResults([]); setStudentSearch(""); }}
                          className="w-full text-left px-4 py-3 hover:bg-gray-50 border-b border-gray-100 last:border-0"
                        >
                          <p className="text-sm font-medium text-gray-900">{s.full_name}</p>
                          <p className="text-xs text-gray-500">{s.email}</p>
                        </button>
                      ))}
                    </div>
                  )}
                  {studentSearch.length >= 3 && studentResults.length === 0 && (
                    <p className="text-xs text-gray-400 mt-1">No se encontraron estudiantes. El estudiante debe estar registrado en el sistema.</p>
                  )}
                </div>
              )}
            </div>

            {/* Cursos */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">Cursos *</label>
              <div className="border border-gray-200 rounded-lg max-h-48 overflow-y-auto">
                {cursosData?.data.map((curso) => (
                  <label key={curso.id} className="flex items-center gap-3 px-4 py-2.5 hover:bg-gray-50 cursor-pointer border-b border-gray-100 last:border-0">
                    <input
                      type="checkbox"
                      checked={selectedCourses.includes(curso.id)}
                      onChange={() => toggleCurso(curso.id)}
                      className="rounded"
                    />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-gray-900 truncate">{curso.title}</p>
                      <p className="text-xs text-gray-500">{curso.currency} {curso.price}</p>
                    </div>
                  </label>
                ))}
              </div>
              {selectedCourses.length > 0 && (
                <p className="text-xs text-[#2B55A3]">{selectedCourses.length} curso(s) seleccionado(s)</p>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-sm font-medium text-gray-700">Método de pago *</label>
                <select
                  value={metodo}
                  onChange={(e) => setMetodo(e.target.value as CreateMatriculacionDto["offline_payment_method"])}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none"
                >
                  {METODOS.map((m) => (
                    <option key={m.value} value={m.value}>{m.label}</option>
                  ))}
                </select>
              </div>
              <div className="space-y-1">
                <label className="text-sm font-medium text-gray-700">Monto pagado (opcional)</label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={monto}
                  onChange={(e) => setMonto(e.target.value)}
                  placeholder="0.00"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none"
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-sm font-medium text-gray-700">Notas internas</label>
              <textarea
                value={notas}
                onChange={(e) => setNotas(e.target.value)}
                rows={2}
                placeholder="Información adicional para el equipo..."
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none"
              />
            </div>

            <div className="flex justify-end gap-3">
              <button type="button" onClick={resetForm} className="px-4 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-50">
                Cancelar
              </button>
              <button type="submit" disabled={createMutation.isPending} className="px-4 py-2 text-sm bg-[#2B55A3] text-white rounded-lg hover:bg-[#2B55A3]/90 disabled:opacity-50">
                {createMutation.isPending ? "Matriculando..." : "Matricular estudiante"}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Historial */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="px-4 py-3 border-b border-gray-200">
          <h2 className="font-medium text-gray-900 text-sm">Historial de matriculaciones</h2>
        </div>
        {isLoading ? (
          <div className="p-8 text-center text-gray-400 text-sm">Cargando...</div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="text-left px-4 py-3 text-gray-600 font-medium">Estudiante</th>
                <th className="text-left px-4 py-3 text-gray-600 font-medium">Curso</th>
                <th className="text-left px-4 py-3 text-gray-600 font-medium">Método</th>
                <th className="text-left px-4 py-3 text-gray-600 font-medium">Fecha</th>
                <th className="text-left px-4 py-3 text-gray-600 font-medium">Progreso</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {matriculaciones?.data.length === 0 ? (
                <tr>
                  <td colSpan={5} className="text-center py-8 text-gray-400">Sin matriculaciones aún</td>
                </tr>
              ) : (
                matriculaciones?.data.map((m) => (
                  <tr key={m.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 text-gray-900">{m.user?.full_name ?? m.user_id}</td>
                    <td className="px-4 py-3 text-gray-600">{m.course?.title ?? m.course_id}</td>
                    <td className="px-4 py-3">
                      <span className="text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded-full capitalize">
                        {m.offline_payment_method ?? m.enrollment_type}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-gray-500">{new Date(m.enrolled_at).toLocaleDateString("es-PE")}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <div className="flex-1 h-1.5 bg-gray-200 rounded-full w-16">
                          <div className="h-1.5 bg-[#2B55A3] rounded-full" style={{ width: `${m.progress_percent}%` }} />
                        </div>
                        <span className="text-xs text-gray-500">{m.progress_percent}%</span>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        )}
        {matriculaciones && matriculaciones.total_pages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-gray-100 text-sm text-gray-500">
            <span>Página {page} de {matriculaciones.total_pages} — {matriculaciones.total} registros</span>
            <div className="flex gap-2">
              <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1} className="px-3 py-1 border rounded-lg disabled:opacity-40 hover:bg-gray-50">Anterior</button>
              <button onClick={() => setPage((p) => Math.min(matriculaciones.total_pages, p + 1))} disabled={page === matriculaciones.total_pages} className="px-3 py-1 border rounded-lg disabled:opacity-40 hover:bg-gray-50">Siguiente</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
