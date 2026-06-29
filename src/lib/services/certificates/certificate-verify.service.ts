import { api } from "@/lib/http";

export interface CertificateTemplateData {
  background_image_url: string;
  back_image_url: string | null;
  student_name_position: { x: number; y: number };
  qr_position: { x: number; y: number };
  qr_size: number;
  font_family: string;
  font_sizes: { student_name?: number; [key: string]: number | undefined };
}

export interface CertificateVerification {
  verification_code: string;
  type: "Certificado" | "Constancia";
  pdf_url: string;
  student_name: string;
  course_title: string;
  issued_at: string;
  total_hours: number;
  instructors: string[];
  template: CertificateTemplateData;
}

export const certificateVerifyService = {
  verify: async (code: string): Promise<CertificateVerification> => {
    const res = await api.get<CertificateVerification>(
      `/certificates/verify/${code}`,
    );
    return res.data;
  },
};
