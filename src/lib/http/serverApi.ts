import axios from "axios";

function normalizeApiUrl(url: string) {
  const cleanUrl = url.replace(/\/+$/, "");
  return cleanUrl.endsWith("/api") ? cleanUrl : `${cleanUrl}/api`;
}

export const serverApi = axios.create({
  baseURL: normalizeApiUrl(
    process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000/api"
  ),
  headers: { "Content-Type": "application/json" },
  timeout: 30000,
});
