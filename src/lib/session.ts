const GUEST_TOKEN_KEY = "guest_session_token";

export function getGuestSessionToken(): string {
  if (typeof window === "undefined") return "";

  let token = localStorage.getItem(GUEST_TOKEN_KEY);
  if (!token) {
    token = crypto.randomUUID();
    localStorage.setItem(GUEST_TOKEN_KEY, token);
  }
  return token;
}

export function clearGuestSessionToken() {
  if (typeof window === "undefined") return;
  localStorage.removeItem(GUEST_TOKEN_KEY);
}
