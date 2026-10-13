import axios from "axios";

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080/api",
});

export default api;

export interface Student {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  address?: string;
}

export interface Course {
  id: number;
  code: string;
  name: string;
  description?: string;
  credits?: number;
}