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
  scope: "course" | "module";
  verification_code: string;
  type: "Certificado";
  download_url: string;
  student_name: string;
  course_title: string;
  module_title: string | null;
  issued_at: string;
  total_hours: number | null;
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
