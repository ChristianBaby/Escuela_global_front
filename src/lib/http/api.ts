import axios from "axios";

function normalizeApiUrl(url: string) {
  const cleanUrl = url.replace(/\/+$/, "");
  return cleanUrl.endsWith("/api") ? cleanUrl : `${cleanUrl}/api`;
}

export const api = axios.create({
  baseURL: normalizeApiUrl(process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000/api"),
  headers: { "Content-Type": "application/json" },
  withCredentials: true,
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      if (typeof window !== "undefined") {
        window.location.href = "/auth/login";
      }
    }
    return Promise.reject(error);
  }
);
