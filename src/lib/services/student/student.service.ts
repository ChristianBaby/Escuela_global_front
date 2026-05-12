import { api } from "@/lib/http/api";
import type { Enrollment } from "@/types";

export const studentService = {
  getMyEnrollments: () =>
    api.get<Enrollment[]>("/estudiantes/mis-inscripciones").then((r) => r.data),
};
