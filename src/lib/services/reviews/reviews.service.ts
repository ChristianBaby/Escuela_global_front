import { api } from "@/lib/http/api";
import type { PaginatedResponse, Review, ReviewStatus } from "@/types";

export interface ListReviewsParams {
  page?: number;
  limit?: number;
  course_id?: string;
  status?: ReviewStatus;
}

export const reviewsService = {
  list: (params?: ListReviewsParams) =>
    api.get<PaginatedResponse<Review>>("/reviews", { params }).then((r) => r.data),

  updateStatus: (id: string, status: ReviewStatus) =>
    api.patch<{ id: string; status: ReviewStatus }>(`/reviews/${id}`, { status }).then((r) => r.data),
};
