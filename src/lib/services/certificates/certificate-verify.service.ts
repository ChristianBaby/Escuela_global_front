import { api } from "@/lib/http";

export interface CertificateVerification {
  verification_code: string;
  type: "Certificado" | "Constancia";
  pdf_url: string;
  student_name: string;
  course_title: string;
  issued_at: string;
  total_hours: number;
  instructors: string[];
}

export const certificateVerifyService = {
  verify: async (code: string): Promise<CertificateVerification> => {
    const res = await api.get<CertificateVerification>(
      `/certificates/verify/${code}`,
    );
    return res.data;
  },
};
