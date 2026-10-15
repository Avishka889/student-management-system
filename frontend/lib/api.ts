import axios from "axios";

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080/api",
});

// Hama request ekakatama token eka add karanawa
api.interceptors.request.use((config) => {
  if (typeof window !== "undefined") {
    const token = localStorage.getItem("token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  }
  return config;
});

// Token expire wela / waradi nam login ekata yawanawa
api.interceptors.response.use(
  (res) => res,
  (error) => {
    if (typeof window !== "undefined" && error.response?.status === 401) {
      const path = window.location.pathname;
      if (path !== "/login" && path !== "/register") {
        localStorage.clear();
        window.location.href = "/login";
      }
    }
    return Promise.reject(error);
  }
);

export default api;

export interface Course {
  id: number;
  code: string;
  name: string;
  description?: string;
  credits?: number;
  imageUrl?: string;
  tutorId?: number;
  tutorName?: string;
  tutorPhotoUrl?: string;
}

export interface Tutor {
  id: number;
  fullName: string;
  username: string;
  email: string;
  phone?: string;
  bio?: string;
  photoUrl?: string;
  active: boolean;
  courseCount: number;
}

export interface AuthResponse {
  token: string;
  username: string;
  fullName: string;
  role: string;
  mustChangePassword: boolean;
}