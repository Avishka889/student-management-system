"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import api, { AuthResponse } from "@/lib/api";
import { saveAuth } from "@/lib/auth";
import Logo from "@/components/Logo";

export default function LoginPage() {
  const [form, setForm] = useState({ username: "", password: "" });
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get("registered") === "true") {
      setSuccess("Account created successfully. Please login.");
    }
  }, []);

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    setForm({ ...form, [e.target.name]: e.target.value });
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (!form.username || !form.password) {
      setError("Please enter your username and password.");
      return;
    }

    try {
      setLoading(true);
      const res = await api.post<AuthResponse>("/auth/login", form);
      saveAuth(res.data);
      window.location.href = "/dashboard";
    } catch (err: any) {
      setError(err.response?.data?.message || "Login failed. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  const inputClass =
    "w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-slate-900 placeholder:text-slate-400 focus:border-[#3B82F6] focus:outline-none focus:ring-2 focus:ring-[#3B82F6]/30";
  const labelClass = "mb-1 block text-sm font-medium text-slate-700";

  return (
    <div className="flex min-h-[calc(100vh-10rem)] items-center justify-center">
      <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-8 shadow-lg">
        <div className="mb-6 flex flex-col items-center text-center">
          <Logo size={52} variant="dark" />
          <h1 className="mt-4 text-2xl font-bold text-[#1E3A8A]">Welcome back</h1>
          <p className="mt-1 text-sm text-slate-500">Login to manage students and courses.</p>
        </div>

        {success && (
          <div className="mb-4 rounded-lg bg-emerald-50 p-3 text-sm text-emerald-700">{success}</div>
        )}
        {error && (
          <div className="mb-4 rounded-lg bg-red-50 p-3 text-sm text-red-600">{error}</div>
        )}

        <form onSubmit={handleSubmit} className="grid gap-4">
          <div>
            <label className={labelClass}>Username</label>
            <input name="username" placeholder="Enter your username" value={form.username} onChange={handleChange} className={inputClass} />
          </div>
          <div>
            <label className={labelClass}>Password</label>
            <div className="relative">
              <input
                name="password"
                type={showPassword ? "text" : "password"}
                placeholder="Enter your password"
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
          </div>
          <button
            type="submit"
            disabled={loading}
            className="mt-2 rounded-lg bg-[#1E3A8A] px-4 py-2.5 font-medium text-white transition hover:bg-[#1E40AF] disabled:opacity-50"
          >
            {loading ? "Logging in..." : "Login"}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-slate-500">
          Don&apos;t have an account?{" "}
          <Link href="/register" className="font-medium text-[#3B82F6] hover:underline">
            Create one
          </Link>
        </p>
      </div>
    </div>
  );
}