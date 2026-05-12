import { serverApi } from "@/lib/http/serverApi";
import type { Course } from "@/types";

export const coursesServerService = {
  getFeatured: async (): Promise<Course[]> => {
    const { data, status } = await serverApi.get("/courses", {
      params: { limit: 8, sort: "popular", status: "published" },
    });

    if (status < 200 || status >= 300) return [];
    return data.data ?? [];
  },
};
