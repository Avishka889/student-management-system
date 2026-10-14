"use client";

import { useEffect, useState } from "react";
import api, { Course } from "@/lib/api";
import { getRole } from "@/lib/auth";

const emptyForm = {
  code: "",
  name: "",
  description: "",
  credits: "",
};

export default function CoursesPage() {
  const isAdmin = getRole() === "ADMIN";
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [saving, setSaving] = useState(false);

  async function loadCourses() {
    try {
      setLoading(true);
      setError("");
      const res = await api.get<Course[]>("/courses");
      setCourses(res.data);
    } catch {
      setError("Failed to load courses. Is the backend running?");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadCourses();
  }, []);

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    setForm({ ...form, [e.target.name]: e.target.value });
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const payload = {
      ...form,
      credits: form.credits === "" ? null : Number(form.credits),
    };
    try {
      setSaving(true);
      setError("");
      if (editingId) {
        await api.put(`/courses/${editingId}`, payload);
      } else {
        await api.post("/courses", payload);
      }
      setForm(emptyForm);
      setEditingId(null);
      await loadCourses();
    } catch {
      setError("Failed to save course. The course code must be unique.");
    } finally {
      setSaving(false);
    }
  }

  function handleEdit(c: Course) {
    setEditingId(c.id);
    setForm({
      code: c.code,
      name: c.name,
      description: c.description || "",
      credits: c.credits != null ? String(c.credits) : "",
    });
  }

  async function handleDelete(id: number) {
    if (!confirm("Delete this course?")) return;
    try {
      await api.delete(`/courses/${id}`);
      await loadCourses();
    } catch {
      setError("Failed to delete course.");
    }
  }

  function cancelEdit() {
    setEditingId(null);
    setForm(emptyForm);
  }

  const inputClass = "w-full rounded border border-gray-300 p-2";

  return (
    <div>
      <h1 className="mb-4 text-2xl font-bold">Courses</h1>

      {error && (
        <div className="mb-4 rounded bg-red-100 p-3 text-red-700">{error}</div>
      )}

      <form
        onSubmit={handleSubmit}
        className="mb-6 grid gap-3 rounded border border-gray-200 p-4 sm:grid-cols-2"
      >
        <input name="code" placeholder="Course code (e.g. CS101)" value={form.code} onChange={handleChange} className={inputClass} required />
        <input name="name" placeholder="Course name" value={form.name} onChange={handleChange} className={inputClass} required />
        <input name="description" placeholder="Description" value={form.description} onChange={handleChange} className={inputClass} />
        <input name="credits" type="number" min="0" placeholder="Credits" value={form.credits} onChange={handleChange} className={inputClass} />
        <div className="flex gap-2 sm:col-span-2">
          <button type="submit" disabled={saving} className="rounded bg-blue-600 px-4 py-2 text-white disabled:opacity-50">
            {saving ? "Saving..." : editingId ? "Update Course" : "Add Course"}
          </button>
          {editingId && (
            <button type="button" onClick={cancelEdit} className="rounded border px-4 py-2">
              Cancel
            </button>
          )}
        </div>
      </form>

      {loading ? (
        <p>Loading courses...</p>
      ) : courses.length === 0 ? (
        <p className="text-gray-500">No courses yet. Add one above.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-left">
            <thead>
              <tr className="bg-gray-100 text-black">
                <th className="p-2">Code</th>
                <th className="p-2">Name</th>
                <th className="p-2">Description</th>
                <th className="p-2">Credits</th>
                <th className="p-2">Actions</th>
              </tr>
            </thead>
            <tbody>
              {courses.map((c) => (
                <tr key={c.id} className="border-t">
                  <td className="p-2">{c.code}</td>
                  <td className="p-2">{c.name}</td>
                  <td className="p-2">{c.description}</td>
                  <td className="p-2">{c.credits}</td>
                  <td className="p-2">
                     <button onClick={() => handleEdit(c)} className="mr-3 text-blue-600 hover:underline">Edit</button>
                     {isAdmin && (
                        <button onClick={() => handleDelete(c.id)} className="text-red-600 hover:underline">Delete</button>
                     )}
                 </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}