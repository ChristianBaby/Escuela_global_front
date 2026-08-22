import { api } from "@/lib/http/api";
import type { CertificateTemplate, XYPosition, CertificateFontSizes } from "@/types";

export type CertificateTemplateOwnerType =
  | "course_certificado"
  | "course_constancia"
  | "module";

export interface CreateCertificateTemplateDto {
  name: string;
  owner_type: CertificateTemplateOwnerType;
  owner_id: string;
  background_image?: File | null;
  back_image?: File | null;
  student_name_position: XYPosition;
  qr_position: XYPosition;
  qr_size: number;
  font_family: string;
  font_sizes: CertificateFontSizes;
}

function buildFormData(data: Partial<CreateCertificateTemplateDto>): FormData {
  const fd = new FormData();
  if (data.name) fd.append("name", data.name);
  if (data.owner_type) fd.append("owner_type", data.owner_type);
  if (data.owner_id) fd.append("owner_id", data.owner_id);
  if (data.background_image) fd.append("background_image", data.background_image);
  if (data.back_image) fd.append("back_image", data.back_image);
  if (data.font_family) fd.append("font_family", data.font_family);
  if (data.student_name_position) fd.append("student_name_position", JSON.stringify(data.student_name_position));
  if (data.qr_position)           fd.append("qr_position",           JSON.stringify(data.qr_position));
  if (data.qr_size !== undefined)  fd.append("qr_size",               String(data.qr_size));
  if (data.font_sizes)            fd.append("font_sizes",            JSON.stringify(data.font_sizes));
  return fd;
}

export const certificateTemplatesService = {
  list: () =>
    api.get<CertificateTemplate[]>("/certificate-templates").then((r) => r.data),

  getById: (id: string) =>
    api.get<CertificateTemplate>(`/certificate-templates/${id}`).then((r) => r.data),

  create: (data: CreateCertificateTemplateDto) =>
    api
      .post<CertificateTemplate>("/certificate-templates", buildFormData(data), {
        headers: { "Content-Type": "multipart/form-data" },
      })
      .then((r) => r.data),

  update: (id: string, data: Partial<CreateCertificateTemplateDto>) =>
    api
      .patch<CertificateTemplate>(`/certificate-templates/${id}`, buildFormData(data), {
        headers: { "Content-Type": "multipart/form-data" },
      })
      .then((r) => r.data),

  delete: (id: string) =>
    api.delete(`/certificate-templates/${id}`).then((r) => r.data),
};
