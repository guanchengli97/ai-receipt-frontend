"use client";

const AUTH_COOKIE = "auth_token";
const EXPIRED_COOKIE = "Thu, 01 Jan 1970 00:00:00 GMT";

export function getAuthTokenFromCookie() {
  if (typeof document === "undefined") {
    return "";
  }
  const match = document.cookie.match(new RegExp(`(?:^|;\\s*)${AUTH_COOKIE}=([^;]+)`));
  return match ? decodeURIComponent(match[1]) : "";
}

export function clearAuthTokenCookie() {
  if (typeof document === "undefined") {
    return;
  }
  const secure = window.location.protocol === "https:" ? "; Secure" : "";
  document.cookie = `${AUTH_COOKIE}=; Path=/; Max-Age=0; Expires=${EXPIRED_COOKIE}; SameSite=Lax${secure}`;
}

export function redirectToLogin() {
  if (typeof window === "undefined") {
    return;
  }
  if (window.location.pathname === "/login") {
    return;
  }
  window.location.href = "/login";
}

export function logoutAndRedirect() {
  clearAuthTokenCookie();
  redirectToLogin();
}

export function handleUnauthorizedResponse(response: Response) {
  if (response.status !== 401 && response.status !== 403) {
    return false;
  }
  logoutAndRedirect();
  return true;
}

export async function authFetch(input: RequestInfo | URL, init?: RequestInit) {
  const headers = new Headers(init?.headers);
  const token = getAuthTokenFromCookie();
  if (token && !headers.has("Authorization")) {
    headers.set("Authorization", `Bearer ${token}`);
  }

  const response = await fetch(input, {
    ...init,
    headers,
    credentials: init?.credentials ?? "include",
  });

  handleUnauthorizedResponse(response);
  return response;
}
