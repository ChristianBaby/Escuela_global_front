import { api } from "@/lib/http/api";
import type { Enrollment, CourseContent, CourseProgress, CertificateDetail } from "@/types";

export interface SubmitReviewDto {
  course_id: string;
  enrollment_id: string;
  rating: number;
  comment: string;
}

export const studentService = {
  getMyEnrollments: () =>
    api.get<Enrollment[]>("/estudiantes/mis-inscripciones").then((r) => r.data),

  getCourseContent: (courseId: string) =>
    api.get<CourseContent>(`/cursos/${courseId}/contenido`).then((r) => r.data),

  getMyCourseProgress: (courseId: string) =>
    api.get<CourseProgress>(`/mi-progreso/cursos/${courseId}`).then((r) => r.data),

  updateSessionProgress: (sessionId: string, watchedSeconds: number) =>
    api
      .put<{ completed: boolean; progress_percent: number }>(
        `/mi-progreso/sesiones/${sessionId}`,
        { watched_seconds: watchedSeconds }
      )
      .then((r) => r.data),

  submitReview: (data: SubmitReviewDto) =>
    api.post<{ id: string; certificate_available: boolean }>("/reviews", data).then((r) => r.data),

  getMyCertificate: (enrollmentId: string) =>
    api.get<CertificateDetail>(`/certificados/mi-certificado/${enrollmentId}`).then((r) => r.data),
};
