"use client";

import { useState } from "react";
import Link from "next/link";
import api, { AuthResponse } from "@/lib/api";
import Logo from "@/components/Logo";

export default function RegisterPage() {
  const [form, setForm] = useState({
    fullName: "",
    phone: "",
    username: "",
    email: "",
    password: "",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

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
      await api.post<AuthResponse>("/auth/register", form);
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
    "w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-slate-900 placeholder:text-slate-400 focus:border-[#3B82F6] focus:outline-none focus:ring-2 focus:ring-[#3B82F6]/30";
  const labelClass = "mb-1 block text-sm font-medium text-slate-700";
  const errClass = "mt-1 text-xs text-red-600";

  return (
    <div className="flex min-h-[calc(100vh-10rem)] items-center justify-center">
      <div className="w-full max-w-lg rounded-2xl border border-slate-200 bg-white p-8 shadow-lg">
        <div className="mb-6 flex flex-col items-center text-center">
          <Logo size={52} variant="dark" />
          <h1 className="mt-4 text-2xl font-bold text-[#1E3A8A]">Create your account</h1>
          <p className="mt-1 text-sm text-slate-500">Register to start managing students and courses.</p>
        </div>

        {error && (
          <div className="mb-4 rounded-lg bg-red-50 p-3 text-sm text-red-600">{error}</div>
        )}

        <form onSubmit={handleSubmit} className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className={labelClass}>Full name</label>
            <input name="fullName" placeholder="Kamal Perera" value={form.fullName} onChange={handleChange} className={inputClass} />
            {errors.fullName && <p className={errClass}>{errors.fullName}</p>}
          </div>
          <div>
            <label className={labelClass}>Phone (optional)</label>
            <input name="phone" placeholder="0771234567" value={form.phone} onChange={handleChange} className={inputClass} />
            {errors.phone && <p className={errClass}>{errors.phone}</p>}
          </div>
          <div>
            <label className={labelClass}>Username</label>
            <input name="username" placeholder="kamal123" value={form.username} onChange={handleChange} className={inputClass} />
            {errors.username && <p className={errClass}>{errors.username}</p>}
          </div>
          <div>
            <label className={labelClass}>Email</label>
            <input name="email" type="email" placeholder="name@example.com" value={form.email} onChange={handleChange} className={inputClass} />
            {errors.email && <p className={errClass}>{errors.email}</p>}
          </div>
          <div className="sm:col-span-2">
            <label className={labelClass}>Password</label>
            <div className="relative">
              <input
                name="password"
                type={showPassword ? "text" : "password"}
                placeholder="At least 6 characters"
                value={form.password}
                onChange={handleChange}
                className={`${inputClass} pr-16`}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-medium text-[#3B82F6] hover:underline"
              >
                {showPassword ? "Hide" : "Show"}
              </button>
            </div>
            {errors.password && <p className={errClass}>{errors.password}</p>}
          </div>
          <button
            type="submit"
            disabled={loading}
            className="mt-2 rounded-lg bg-[#1E3A8A] px-4 py-2.5 font-medium text-white transition hover:bg-[#1E40AF] disabled:opacity-50 sm:col-span-2"
          >
            {loading ? "Creating account..." : "Create account"}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-slate-500">
          Already have an account?{" "}
          <Link href="/login" className="font-medium text-[#3B82F6] hover:underline">
            Login
          </Link>
        </p>
      </div>
    </div>
  );
}