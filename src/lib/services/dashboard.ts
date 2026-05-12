import { api } from "@/lib/api";

export interface DashboardStats {
  ingresos: {
    total_mes: number;
    total_mes_anterior: number;
    cambio_porcentual: number;
    online: number;
    manual: number;
  };
  estudiantes: {
    total: number;
    nuevos_mes: number;
  };
  cursos: {
    total_activos: number;
    nuevos_mes: number;
  };
  tasa_finalizacion: number;
}

export interface AuditLog {
  id: string;
  user_id: string;
  user?: { full_name: string; email: string };
  entity_type: string;
  entity_id: string;
  action: "create" | "update" | "delete";
  changes: Record<string, unknown>;
  created_at: string;
}

export const dashboardService = {
  getStats: () =>
    api.get<DashboardStats>("/admin/stats").then((r) => r.data),

  getAuditLogs: (params?: { page?: number; limit?: number }) =>
    api.get<{ data: AuditLog[]; total: number }>("/admin/auditoria", { params }).then((r) => r.data),
};
