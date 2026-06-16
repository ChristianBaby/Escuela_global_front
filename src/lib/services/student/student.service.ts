import { api } from "@/lib/http/api";
import type { Enrollment, CourseContent, CourseProgress, CertificateDetail, CertificateSummary } from "@/types";

export interface SubmitReviewDto {
	course_id: string;
	enrollment_id: string;
	rating: number;
	comment: string;
}

export const studentService = {
	getMyEnrollments: () => api.get<Enrollment[]>("/student/enrollments").then((r) => r.data),

	getCourseContent: async (courseId: string) => await api.get<CourseContent>(`/student/courses/${courseId}/content`).then((r) => r.data),

	getMyCourseProgress: (courseId: string) => api.get<CourseProgress>(`/student/progress/courses/${courseId}`).then((r) => r.data),

	updateSessionProgress: (sessionId: string, watchedSeconds: number, forceComplete = false) =>
		api.put<{ completed: boolean; progress_percent: number }>(
			`student/progress/sessions/${sessionId}`,
			{ watched_seconds: watchedSeconds, force_complete: forceComplete },
		).then((r) => r.data),

	submitReview: (data: SubmitReviewDto) => api.post<{ id: string; certificate_available: boolean }>("/reviews", data).then((r) => r.data),
	getMyCertificates: () => api.get<CertificateSummary[]>("/student/certificates").then((r) => r.data),
	getMyCertificate: (enrollmentId: string) => api.get<CertificateDetail>(`/student/certificates/${enrollmentId}`).then((r) => r.data),
};
