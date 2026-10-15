"use client";

import { useEffect, useState } from "react";
import api, { Tutor } from "@/lib/api";
import { getRole } from "@/lib/auth";
import { resizeImage } from "@/lib/image";

const emptyForm = {
  fullName: "",
  email: "",
  phone: "",
  username: "",
  password: "",
  bio: "",
  photoUrl: "",
};

export default function TutorsPage() {
  const [tutors, setTutors] = useState<Tutor[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);

  async function loadTutors() {
    try {
      setLoading(true);
      const res = await api.get<Tutor[]>("/tutors");
      setTutors(res.data);
    } catch {
      setError("Failed to load tutors. Is the backend running?");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (getRole() !== "ADMIN") {
      window.location.href = "/dashboard";
      return;
    }
    loadTutors();
  }, []);

  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) {
    setForm({ ...form, [e.target.name]: e.target.value });
  }

  async function handlePhoto(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      setError("Please choose an image file.");
      return;
    }
    try {
      const dataUrl = await resizeImage(file, 300, 0.8);
      setForm((f) => ({ ...f, photoUrl: dataUrl }));
    } catch {
      setError("Could not process that image.");
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    try {
      setSaving(true);
      setError("");
      setMessage("");
      setFieldErrors({});
      if (editingId) {
        await api.put(`/tutors/${editingId}`, {
          fullName: form.fullName,
          email: form.email,
          phone: form.phone,
          bio: form.bio,
          photoUrl: form.photoUrl || null,
          password: form.password || null,
        });
        setMessage("Tutor updated.");
      } else {
        await api.post("/tutors", { ...form, photoUrl: form.photoUrl || null });
        setMessage(
          `Tutor created. Give them the username "${form.username}" and the temporary password you set. They must change it on first login.`
        );
      }
      closeForm();
      await loadTutors();
    } catch (err: any) {
      const data = err.response?.data;
      if (data?.details) setFieldErrors(data.details);
      setError(data?.message || "Failed to save tutor.");
    } finally {
      setSaving(false);
    }
  }

  function openAdd() {
    setEditingId(null);
    setForm(emptyForm);
    setFieldErrors({});
    setMessage("");
    setShowForm(true);
  }

  function handleEdit(t: Tutor) {
    setEditingId(t.id);
    setFieldErrors({});
    setMessage("");
    setForm({
      fullName: t.fullName,
      email: t.email,
      phone: t.phone || "",
      username: t.username,
      password: "",
      bio: t.bio || "",
      photoUrl: t.photoUrl || "",
    });
    setShowForm(true);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function closeForm() {
    setShowForm(false);
    setEditingId(null);
    setForm(emptyForm);
  }

  async function toggleActive(t: Tutor) {
    try {
      await api.put(`/tutors/${t.id}/toggle`);
      await loadTutors();
    } catch {
      setError("Failed to update the tutor status.");
    }
  }

  async function handleDelete(t: Tutor) {
    if (!confirm(`Delete ${t.fullName}? Their courses will become unassigned.`)) return;
    try {
      await api.delete(`/tutors/${t.id}`);
      await loadTutors();
    } catch (err: any) {
      setError(err.response?.data?.message || "Failed to delete tutor.");
    }
  }

  const inputClass =
    "w-full rounded-lg border border-slate-300 bg-white px-3 py-2 focus:border-[#3B82F6] focus:outline-none focus:ring-2 focus:ring-[#3B82F6]/30";
  const labelClass = "mb-1 block text-sm font-medium text-slate-700";
  const errClass = "mt-1 text-xs text-red-600";

  return (
    <div>
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-[#1E3A8A]">Tutors</h1>
          <p className="text-sm text-slate-500">Add tutors and assign them to courses.</p>
        </div>
        {!showForm && (
          <button onClick={openAdd} className="rounded-lg bg-[#1E3A8A] px-4 py-2 text-sm font-medium text-white hover:bg-[#1E40AF]">
            + Add tutor
          </button>
        )}
      </div>

      {error && <div className="mb-4 rounded-lg bg-red-50 p-3 text-sm text-red-600">{error}</div>}
      {message && <div className="mb-4 rounded-lg bg-emerald-50 p-3 text-sm text-emerald-700">{message}</div>}

      {showForm && (
        <form onSubmit={handleSubmit} className="mb-6 grid gap-4 rounded-xl border border-slate-200 bg-white p-5 shadow-sm sm:grid-cols-2">
          <h2 className="font-semibold text-slate-900 sm:col-span-2">{editingId ? "Edit tutor" : "New tutor"}</h2>
          <div>
            <label className={labelClass}>Full name</label>
            <input name="fullName" value={form.fullName} onChange={handleChange} className={inputClass} required />
            {fieldErrors.fullName && <p className={errClass}>{fieldErrors.fullName}</p>}
          </div>
          <div>
            <label className={labelClass}>Email</label>
            <input name="email" type="email" value={form.email} onChange={handleChange} className={inputClass} required />
            {fieldErrors.email && <p className={errClass}>{fieldErrors.email}</p>}
          </div>
          <div>
            <label className={labelClass}>Phone</label>
            <input name="phone" value={form.phone} onChange={handleChange} className={inputClass} />
          </div>
          <div>
            <label className={labelClass}>Username</label>
            <input name="username" value={form.username} onChange={handleChange} disabled={!!editingId} className={`${inputClass} disabled:bg-slate-100`} required />
            {fieldErrors.username && <p className={errClass}>{fieldErrors.username}</p>}
          </div>
          <div className="sm:col-span-2">
            <label className={labelClass}>
              {editingId ? "Reset password (leave empty to keep the current one)" : "Temporary password"}
            </label>
            <input name="password" type="text" value={form.password} onChange={handleChange} className={inputClass} required={!editingId} />
            {fieldErrors.password && <p className={errClass}>{fieldErrors.password}</p>}
          </div>
          <div className="sm:col-span-2">
            <label className={labelClass}>Short bio</label>
            <textarea name="bio" rows={3} value={form.bio} onChange={handleChange} className={inputClass} />
          </div>
          <div className="sm:col-span-2">
            <label className={labelClass}>Photo</label>
            <input type="file" accept="image/*" onChange={handlePhoto} className="w-full rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-sm file:mr-3 file:rounded file:border-0 file:bg-blue-50 file:px-3 file:py-1 file:text-[#1E3A8A]" />
            {form.photoUrl && (
              <div className="mt-2 flex items-center gap-3">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={form.photoUrl} alt="Preview" className="h-16 w-16 rounded-full object-cover" />
                <button type="button" onClick={() => setForm({ ...form, photoUrl: "" })} className="text-sm text-[#EF4444] hover:underline">
                  Remove photo
                </button>
              </div>
            )}
          </div>
          <div className="flex gap-2 sm:col-span-2">
            <button type="submit" disabled={saving} className="rounded-lg bg-[#1E3A8A] px-4 py-2 font-medium text-white hover:bg-[#1E40AF] disabled:opacity-50">
              {saving ? "Saving..." : editingId ? "Update tutor" : "Create tutor"}
            </button>
            <button type="button" onClick={closeForm} className="rounded-lg border border-slate-300 px-4 py-2 text-slate-700 hover:bg-slate-50">
              Cancel
            </button>
          </div>
        </form>
      )}

      {loading ? (
        <p className="text-slate-500">Loading tutors...</p>
      ) : tutors.length === 0 ? (
        <div className="rounded-xl border border-slate-200 bg-white p-10 text-center shadow-sm">
          <p className="font-medium text-slate-900">No tutors yet</p>
          <p className="mt-1 text-sm text-slate-500">Add your first tutor to start assigning courses.</p>
        </div>
      ) : (
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {tutors.map((t) => (
            <div key={t.id} className="flex flex-col rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="mb-3 flex items-center gap-3">
                {t.photoUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={t.photoUrl} alt={t.fullName} className="h-14 w-14 rounded-full object-cover" />
                ) : (
                  <div className="flex h-14 w-14 items-center justify-center rounded-full bg-[#1E3A8A] text-lg font-bold text-white">
                    {t.fullName.split(" ").map((w) => w[0]).join("").slice(0, 2).toUpperCase()}
                  </div>
                )}
                <div className="min-w-0">
                  <p className="truncate font-semibold text-slate-900">{t.fullName}</p>
                  <p className="truncate text-xs text-slate-500">@{t.username}</p>
                </div>
              </div>
              <p className="truncate text-sm text-slate-600">{t.email}</p>
              <p className="text-sm text-slate-600">{t.phone || "-"}</p>
              <p className="mt-2 line-clamp-2 flex-1 text-sm text-slate-500">{t.bio}</p>
              <div className="mt-3 flex items-center gap-2">
                <span className="rounded-full bg-blue-100 px-2.5 py-0.5 text-xs font-medium text-[#1E3A8A]">
                  {t.courseCount} {t.courseCount === 1 ? "course" : "courses"}
                </span>
                <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${t.active ? "bg-emerald-100 text-emerald-700" : "bg-slate-200 text-slate-600"}`}>
                  {t.active ? "Active" : "Deactivated"}
                </span>
              </div>
              <div className="mt-3 flex flex-wrap gap-4 border-t border-slate-100 pt-3 text-sm">
                <button onClick={() => handleEdit(t)} className="text-[#3B82F6] hover:underline">Edit</button>
                <button onClick={() => toggleActive(t)} className="text-slate-600 hover:underline">
                  {t.active ? "Deactivate" : "Activate"}
                </button>
                <button onClick={() => handleDelete(t)} className="text-[#EF4444] hover:underline">Delete</button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}