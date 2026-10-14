"use client";

import { useState } from "react";
import Link from "next/link";
import api, { AuthResponse } from "@/lib/api";

export default function RegisterPage() {
  const [form, setForm] = useState({ fullName: "", phone: "", username: "", email: "", password: "" });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    setForm({ ...form, [e.target.name]: e.target.value });
  }

  function validate() {
    const e: Record<string, string> = {};
    if (!form.fullName.trim()) e.fullName = "Full name is required";
    if (form.phone && !/^[0-9]{10}$/.test(form.phone)) e.phone = "Phone must be 10 digits";
    if (form.username.length < 3) e.username = "Username must be at least 3 characters";
    if (!/^\S+@\S+\.\S+$/.test(form.email)) e.email = "Enter a valid email";
    if (form.password.length < 6) e.password = "Password must be at least 6 characters";
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (!validate()) return;

    try {
      setLoading(true);
      const res = await api.post<AuthResponse>("/auth/register", form);
      window.location.href = "/login?registered=true";
    } catch (err: any) {
      const data = err.response?.data;
      if (data?.details) setErrors(data.details);
      setError(data?.message || "Registration failed. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  const inputClass =
    "w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200";

  return (
    <div className="mx-auto mt-10 max-w-sm rounded-xl border border-gray-200 bg-white p-8 shadow-sm">
      <h1 className="mb-1 text-2xl font-bold text-gray-900">Create account</h1>
      <p className="mb-6 text-sm text-gray-500">Register to start managing students.</p>

      {error && (
        <div className="mb-4 rounded-lg bg-red-50 p-3 text-sm text-red-700">{error}</div>
      )}

      <form onSubmit={handleSubmit} className="grid gap-4">
        <div>
          <input name="fullName" placeholder="Full name" value={form.fullName} onChange={handleChange} className={inputClass} />
          {errors.fullName && <p className="mt-1 text-xs text-red-600">{errors.fullName}</p>}
        </div>
        <div>
          <input name="phone" placeholder="Phone (optional)" value={form.phone} onChange={handleChange} className={inputClass} />
          {errors.phone && <p className="mt-1 text-xs text-red-600">{errors.phone}</p>}
        </div>
        <div>
          <input name="username" placeholder="Username" value={form.username} onChange={handleChange} className={inputClass} />
          {errors.username && <p className="mt-1 text-xs text-red-600">{errors.username}</p>}
        </div>
        <div>
          <input name="email" type="email" placeholder="Email" value={form.email} onChange={handleChange} className={inputClass} />
          {errors.email && <p className="mt-1 text-xs text-red-600">{errors.email}</p>}
        </div>
        <div>
          <input name="password" type="password" placeholder="Password" value={form.password} onChange={handleChange} className={inputClass} />
          {errors.password && <p className="mt-1 text-xs text-red-600">{errors.password}</p>}
        </div>
        <button type="submit" disabled={loading} className="rounded-lg bg-blue-600 px-4 py-2 font-medium text-white hover:bg-blue-700 disabled:opacity-50">
          {loading ? "Creating account..." : "Register"}
        </button>
      </form>

      <p className="mt-4 text-center text-sm text-gray-500">
        Already have an account?{" "}
        <Link href="/login" className="font-medium text-blue-600 hover:underline">
          Login
        </Link>
      </p>
    </div>
  );
}