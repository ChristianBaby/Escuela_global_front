"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { dashboardService } from "@/lib/services/dashboard";

const ACTION_LABELS = { create: "Creación", update: "Edición", delete: "Eliminación" };
const ACTION_STYLES = {
  create: "bg-green-50 text-green-700",
  update: "bg-blue-50 text-blue-700",
  delete: "bg-red-50 text-red-700",
};

export default function AuditoriaPage() {
  const [page, setPage] = useState(1);

  const { data, isLoading, isError } = useQuery({
    queryKey: ["auditoria", page],
    queryFn: () => dashboardService.getAuditLogs({ page, limit: 20 }),
  });

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Auditoría</h1>
        <p className="text-gray-500 text-sm">Registro de cambios realizados en el sistema</p>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        {isLoading ? (
          <div className="p-8 text-center text-gray-400 text-sm">Cargando registros...</div>
        ) : isError ? (
          <div className="p-8 text-center text-red-500 text-sm">Error al cargar el log de auditoría</div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="text-left px-4 py-3 text-gray-600 font-medium">Fecha</th>
                <th className="text-left px-4 py-3 text-gray-600 font-medium">Usuario</th>
                <th className="text-left px-4 py-3 text-gray-600 font-medium">Acción</th>
                <th className="text-left px-4 py-3 text-gray-600 font-medium">Entidad</th>
                <th className="text-left px-4 py-3 text-gray-600 font-medium">Cambios</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {data?.data.length === 0 ? (
                <tr><td colSpan={5} className="text-center py-8 text-gray-400">Sin registros</td></tr>
              ) : (
                data?.data.map((log) => (
                  <tr key={log.id} className="hover:bg-gray-50 align-top">
                    <td className="px-4 py-3 text-gray-500 whitespace-nowrap">
                      {new Date(log.created_at).toLocaleDateString("es-PE")}{" "}
                      <span className="text-xs">{new Date(log.created_at).toLocaleTimeString("es-PE", { hour: "2-digit", minute: "2-digit" })}</span>
                    </td>
                    <td className="px-4 py-3">
                      <p className="text-gray-900">{log.user?.full_name ?? "—"}</p>
                      <p className="text-xs text-gray-400">{log.user?.email}</p>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`text-xs px-2 py-1 rounded-full ${ACTION_STYLES[log.action]}`}>
                        {ACTION_LABELS[log.action]}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-gray-600">
                      <p>{log.entity_type}</p>
                      <p className="text-xs text-gray-400 font-mono truncate max-w-[120px]">{log.entity_id}</p>
                    </td>
                    <td className="px-4 py-3 max-w-xs">
                      <pre className="text-xs text-gray-500 bg-gray-50 rounded p-2 overflow-x-auto whitespace-pre-wrap">
                        {JSON.stringify(log.changes, null, 2)}
                      </pre>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        )}

        {data && data.total > 20 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-gray-100 text-sm text-gray-500">
            <span>Página {page} — {data.total} registros totales</span>
            <div className="flex gap-2">
              <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1} className="px-3 py-1 border rounded-lg disabled:opacity-40 hover:bg-gray-50">Anterior</button>
              <button onClick={() => setPage((p) => p + 1)} disabled={data.data.length < 20} className="px-3 py-1 border rounded-lg disabled:opacity-40 hover:bg-gray-50">Siguiente</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
