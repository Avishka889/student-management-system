"use client";

import { useEffect, useState } from "react";
import api from "@/lib/api";
import { clearMustChange, mustChangePassword } from "@/lib/auth";

export default function ProfilePage() {
  const [firstLogin, setFirstLogin] = useState(false);
  const [form, setForm] = useState({ currentPassword: "", newPassword: "", confirm: "" });
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setFirstLogin(mustChangePassword());
  }, []);

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    setForm({ ...form, [e.target.name]: e.target.value });
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setMessage("");

    if (form.newPassword.length < 6) {
      setError("New password must be at least 6 characters.");
      return;
    }
    if (form.newPassword !== form.confirm) {
      setError("New password and confirmation do not match.");
      return;
    }

    try {
      setSaving(true);
      await api.put("/profile/password", {
        currentPassword: form.currentPassword,
        newPassword: form.newPassword,
      });
      clearMustChange();
      setForm({ currentPassword: "", newPassword: "", confirm: "" });
      setMessage("Password changed successfully.");
      if (firstLogin) {
        setTimeout(() => (window.location.href = "/dashboard"), 1200);
      }
    } catch (err: any) {
      const data = err.response?.data;
      setError(data?.details?.newPassword || data?.message || "Could not change the password.");
    } finally {
      setSaving(false);
    }
  }

  const inputClass =
    "w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 focus:border-[#3B82F6] focus:outline-none focus:ring-2 focus:ring-[#3B82F6]/30";
  const labelClass = "mb-1 block text-sm font-medium text-slate-700";

  return (
    <div className="mx-auto max-w-md">
      <h1 className="text-2xl font-bold text-[#1E3A8A]">My profile</h1>
      <p className="mb-5 mt-1 text-sm text-slate-500">Manage your account security.</p>

      {firstLogin && (
        <div className="mb-4 rounded-lg bg-amber-50 p-3 text-sm text-amber-800">
          For security, please set a new password before you continue.
        </div>
      )}
      {error && <div className="mb-4 rounded-lg bg-red-50 p-3 text-sm text-red-600">{error}</div>}
      {message && <div className="mb-4 rounded-lg bg-emerald-50 p-3 text-sm text-emerald-700">{message}</div>}

      <form onSubmit={handleSubmit} className="grid gap-4 rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="font-semibold text-slate-900">Change password</h2>
        <div>
          <label className={labelClass}>Current password</label>
          <input name="currentPassword" type="password" value={form.currentPassword} onChange={handleChange} className={inputClass} required />
        </div>
        <div>
          <label className={labelClass}>New password</label>
          <input name="newPassword" type="password" value={form.newPassword} onChange={handleChange} className={inputClass} required />
        </div>
        <div>
          <label className={labelClass}>Confirm new password</label>
          <input name="confirm" type="password" value={form.confirm} onChange={handleChange} className={inputClass} required />
        </div>
        <button type="submit" disabled={saving} className="rounded-lg bg-[#1E3A8A] px-4 py-2.5 font-medium text-white hover:bg-[#1E40AF] disabled:opacity-50">
          {saving ? "Saving..." : "Change password"}
        </button>
      </form>
    </div>
  );
}