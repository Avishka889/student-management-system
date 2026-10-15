"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import api, { Course, Tutor } from "@/lib/api";
import { getRole } from "@/lib/auth";
import { resizeImage } from "@/lib/image";

const emptyForm = {
  code: "",
  name: "",
  description: "",
  credits: "",
  imageUrl: "",
  tutorId: "",
};

export default function CoursesPage() {
  const [isAdmin, setIsAdmin] = useState(false);
  const [courses, setCourses] = useState<Course[]>([]);
  const [tutors, setTutors] = useState<Tutor[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState("");

  async function loadData(admin: boolean) {
    try {
      setLoading(true);
      setError("");
      const requests: Promise<any>[] = [api.get<Course[]>("/courses")];
      if (admin) requests.push(api.get<Tutor[]>("/tutors"));
      const [c, t] = await Promise.all(requests);
      setCourses(c.data);
      if (t) setTutors(t.data);
    } catch {
      setError("Failed to load courses. Is the backend running?");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    const admin = getRole() === "ADMIN";
    setIsAdmin(admin);
    loadData(admin);
  }, []);

  function handleChange(
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) {
    setForm({ ...form, [e.target.name]: e.target.value });
  }

  async function handleImage(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      setError("Please choose an image file.");
      return;
    }
    try {
      setError("");
      const dataUrl = await resizeImage(file);
      setForm((f) => ({ ...f, imageUrl: dataUrl }));
    } catch {
      setError("Could not process that image. Try another one.");
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const payload = {
      code: form.code,
      name: form.name,
      description: form.description,
      credits: form.credits === "" ? null : Number(form.credits),
      imageUrl: form.imageUrl || null,
      tutorId: form.tutorId === "" ? null : Number(form.tutorId),
    };
    try {
      setSaving(true);
      setError("");
      setFieldErrors({});
      if (editingId) {
        await api.put(`/courses/${editingId}`, payload);
      } else {
        await api.post("/courses", payload);
      }
      closeForm();
      await loadData(true);
    } catch (err: any) {
      const data = err.response?.data;
      if (data?.details) setFieldErrors(data.details);
      setError(data?.message || "Failed to save course.");
    } finally {
      setSaving(false);
    }
  }

  function openAdd() {
    setEditingId(null);
    setForm(emptyForm);
    setFieldErrors({});
    setShowForm(true);
  }

  function handleEdit(c: Course) {
    setEditingId(c.id);
    setFieldErrors({});
    setForm({
      code: c.code,
      name: c.name,
      description: c.description || "",
      credits: c.credits != null ? String(c.credits) : "",
      imageUrl: c.imageUrl || "",
      tutorId: c.tutorId ? String(c.tutorId) : "",
    });
    setShowForm(true);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function closeForm() {
    setShowForm(false);
    setEditingId(null);
    setForm(emptyForm);
  }

  async function handleDelete(id: number) {
    if (!confirm("Delete this course?")) return;
    try {
      await api.delete(`/courses/${id}`);
      await loadData(true);
    } catch (err: any) {
      setError(err.response?.data?.message || "Failed to delete course.");
    }
  }

  const q = search.trim().toLowerCase();
  const filtered = courses.filter(
    (c) => !q || `${c.code} ${c.name} ${c.tutorName || ""}`.toLowerCase().includes(q)
  );

  const inputClass =
    "w-full rounded-lg border border-slate-300 bg-white px-3 py-2 focus:border-[#3B82F6] focus:outline-none focus:ring-2 focus:ring-[#3B82F6]/30";
  const errClass = "mt-1 text-xs text-red-600";

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-[#1E3A8A]">Courses</h1>
          <p className="text-sm text-slate-500">
            {isAdmin ? "Create courses and assign tutors." : "Browse available courses."}
          </p>
        </div>
        {isAdmin && !showForm && (
          <button onClick={openAdd} className="rounded-lg bg-[#1E3A8A] px-4 py-2 text-sm font-medium text-white hover:bg-[#1E40AF]">
            + Add course
          </button>
        )}
      </div>

      {error && <div className="mb-4 rounded-lg bg-red-50 p-3 text-sm text-red-600">{error}</div>}

      {isAdmin && showForm && (
        <form onSubmit={handleSubmit} className="mb-6 grid gap-3 rounded-xl border border-slate-200 bg-white p-5 shadow-sm sm:grid-cols-2">
          <h2 className="font-semibold text-slate-900 sm:col-span-2">
            {editingId ? "Edit course" : "New course"}
          </h2>
          <div>
            <input name="code" placeholder="Course code (e.g. CS101)" value={form.code} onChange={handleChange} className={inputClass} required />
            {fieldErrors.code && <p className={errClass}>{fieldErrors.code}</p>}
          </div>
          <div>
            <input name="name" placeholder="Course name" value={form.name} onChange={handleChange} className={inputClass} required />
            {fieldErrors.name && <p className={errClass}>{fieldErrors.name}</p>}
          </div>
          <input name="credits" type="number" min="0" placeholder="Credits" value={form.credits} onChange={handleChange} className={inputClass} />
          <select name="tutorId" value={form.tutorId} onChange={handleChange} className={inputClass}>
            <option value="">No tutor assigned</option>
            {tutors.filter((t) => t.active || String(t.id) === form.tutorId).map((t) => (
              <option key={t.id} value={t.id}>{t.fullName}</option>
            ))}
          </select>
          <textarea name="description" placeholder="Course summary" value={form.description} onChange={handleChange} rows={4} className={`${inputClass} sm:col-span-2`} />
          <div className="sm:col-span-2">
            <label className="mb-1 block text-sm font-medium text-slate-700">Course photo</label>
            <input type="file" accept="image/*" onChange={handleImage} className="w-full rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-sm file:mr-3 file:rounded file:border-0 file:bg-blue-50 file:px-3 file:py-1 file:text-[#1E3A8A]" />
          </div>
          {form.imageUrl && (
            <div className="flex items-center gap-3 sm:col-span-2">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={form.imageUrl} alt="Preview" className="h-24 w-40 rounded-lg object-cover" />
              <button type="button" onClick={() => setForm({ ...form, imageUrl: "" })} className="text-sm text-[#EF4444] hover:underline">
                Remove photo
              </button>
            </div>
          )}
          <div className="flex gap-2 sm:col-span-2">
            <button type="submit" disabled={saving} className="rounded-lg bg-[#1E3A8A] px-4 py-2 font-medium text-white hover:bg-[#1E40AF] disabled:opacity-50">
              {saving ? "Saving..." : editingId ? "Update course" : "Add course"}
            </button>
            <button type="button" onClick={closeForm} className="rounded-lg border border-slate-300 px-4 py-2 text-slate-700 hover:bg-slate-50">
              Cancel
            </button>
          </div>
        </form>
      )}

      <input
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        placeholder="Search by course code, name or tutor"
        className={`${inputClass} mb-4`}
      />

      {loading ? (
        <p className="text-slate-500">Loading courses...</p>
      ) : filtered.length === 0 ? (
        <p className="text-slate-500">{courses.length === 0 ? "No courses yet." : "No courses match your search."}</p>
      ) : (
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((c) => (
            <div key={c.id} className="flex flex-col overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm transition hover:shadow-md">
              {c.imageUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={c.imageUrl} alt={c.name} className="h-40 w-full object-cover" />
              ) : (
                <div className="flex h-40 items-center justify-center bg-gradient-to-br from-[#1E3A8A] to-[#3B82F6] text-3xl font-bold text-white">
                  {c.code}
                </div>
              )}
              <div className="flex flex-1 flex-col p-4">
                <div className="mb-2 flex items-center justify-between">
                  <span className="rounded-full bg-blue-100 px-2.5 py-0.5 text-xs font-medium text-[#1E3A8A]">{c.code}</span>
                  {c.credits != null && <span className="text-xs text-slate-500">{c.credits} credits</span>}
                </div>
                <h3 className="font-semibold text-slate-900">{c.name}</h3>
                <p className="mt-1 line-clamp-3 flex-1 text-sm text-slate-500">{c.description}</p>

                <div className="mt-3 flex items-center gap-2 text-sm text-slate-600">
                  {c.tutorPhotoUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={c.tutorPhotoUrl} alt="" className="h-7 w-7 rounded-full object-cover" />
                  ) : (
                    <div className="flex h-7 w-7 items-center justify-center rounded-full bg-slate-200 text-xs text-slate-600">
                      {c.tutorName ? c.tutorName[0] : "?"}
                    </div>
                  )}
                  <span>{c.tutorName || "Tutor not assigned"}</span>
                </div>
                <p className="mt-2 text-xs text-slate-400">
                  {c.enrolledCount ?? 0} students &middot; {c.lectureCount ?? 0} lectures
                </p>

                <div className="mt-3 flex items-center gap-4 border-t border-slate-100 pt-3 text-sm">
                  <Link href={`/courses/${c.id}`} className="font-medium text-[#3B82F6] hover:underline">
                    View details &rarr;
                  </Link>
                  {isAdmin && (
                    <>
                      <button onClick={() => handleEdit(c)} className="text-slate-600 hover:underline">Edit</button>
                      <button onClick={() => handleDelete(c.id)} className="text-[#EF4444] hover:underline">Delete</button>
                    </>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}