import type { Enrollment } from "@/types";

// El acceso a un curso comprado no es indefinido — tiene una fecha de
// vencimiento (access_expires_at). Pasada esa fecha, ya no cuenta como
// "matriculado" activo: el curso debe volver a comportarse como cualquier
// otro (precio + botones de compra), igual que ya se refleja en /mis-cursos
// con la etiqueta "Acceso vencido".
export function isEnrollmentActive(enrollment: Enrollment): boolean {
  if (!enrollment.access_expires_at) return true;
  return new Date(enrollment.access_expires_at) > new Date();
}
