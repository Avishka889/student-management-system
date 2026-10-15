import { AuthResponse } from "./api";

export function saveAuth(data: AuthResponse) {
  localStorage.setItem("token", data.token);
  localStorage.setItem("username", data.username);
  localStorage.setItem("fullName", data.fullName);
  localStorage.setItem("role", data.role);
  localStorage.setItem("mustChangePassword", String(data.mustChangePassword));
}

export function clearAuth() {
  ["token", "username", "fullName", "role", "mustChangePassword"].forEach((k) =>
    localStorage.removeItem(k)
  );
}

function read(key: string): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(key);
}

export const getRole = () => read("role");
export const getUsername = () => read("username");
export const getFullName = () => read("fullName");
export const isLoggedIn = () => !!read("token");
export const mustChangePassword = () => read("mustChangePassword") === "true";

export function clearMustChange() {
  localStorage.setItem("mustChangePassword", "false");
}

export function setFullName(name: string) {
  localStorage.setItem("fullName", name);
}