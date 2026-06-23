import { api } from "@/lib/http/api";

export interface CourseCertificationData {
  course_id: string;
  course_title: string;
  certification_mode: "auto" | "manual";
  certificate_template: { id: string; name: string } | null;
  constancia_template: { id: string; name: string } | null;
  modules: { id: string; title: string; display_order: number }[];
  students: {
    enrollment_id: string;
    user_id: string;
    first_name: string;
    last_name: string;
    email: string;
    average_grade: number | null;
    module_grades: Record<string, number>;
    certificate_type: "Certificado" | "Constancia" | null;
    certificate_issued_at: string | null;
    progress_percent: number;
  }[];
}

export const certificationsService = {
  get: (courseId: string) =>
    api
      .get<CourseCertificationData>(`/courses/${courseId}/certifications`)
      .then((r) => r.data),

  exportExcel: (courseId: string) =>
    api
      .get(`/courses/${courseId}/certifications/export`, {
        responseType: "blob",
      })
      .then((r) => r.data as Blob),

  importGrades: (courseId: string, file: File) => {
    const fd = new FormData();
    fd.append("file", file);
    return api
      .post<{ success: boolean; processed: number }>(
        `/courses/${courseId}/certifications/import`,
        fd,
        { headers: { "Content-Type": "multipart/form-data" } }
      )
      .then((r) => r.data);
  },

  emit: (
    courseId: string,
    data: { enrollment_id: string; type: "Certificado" | "Constancia"; template_id: string }
  ) =>
    api
      .post<{ id: string; type: string; action: string }>(
        `/courses/${courseId}/certifications/emit`,
        data
      )
      .then((r) => r.data),

  removeEmit: (courseId: string, enrollmentId: string) =>
    api
      .delete(`/courses/${courseId}/certifications/emit/${enrollmentId}`)
      .then((r) => r.data),

  updateTemplate: (courseId: string, templateId: string | null) =>
    api
      .patch(`/courses/${courseId}`, { certificate_template_id: templateId })
      .then((r) => r.data),
};
