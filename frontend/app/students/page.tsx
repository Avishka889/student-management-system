"use client";

import { useEffect, useMemo, useState } from "react";
import api, { Student, Course } from "@/lib/api";
import { getRole } from "@/lib/auth";

const emptyForm = {
  studentNumber: "",
  firstName: "",
  lastName: "",
  email: "",
  phone: "",
  courseId: "",
};

export default function StudentsPage() {
  const [students, setStudents] = useState<Student[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState("");

  async function loadData() {
    try {
      setLoading(true);
      setError("");
      const [s, c] = await Promise.all([
        api.get<Student[]>("/students"),
        api.get<Course[]>("/courses"),
      ]);
      setStudents(s.data);
      setCourses(c.data);
    } catch {
      setError("Failed to load students. Is the backend running?");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (getRole() !== "ADMIN") {
      window.location.href = "/dashboard";
      return;
    }
    loadData();
  }, []);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return students;
    return students.filter((s) =>
      `${s.firstName} ${s.lastName} ${s.email} ${s.studentNumber ?? ""} ${s.courseName ?? ""}`
        .toLowerCase()
        .includes(q)
    );
  }, [students, search]);

  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) {
    setForm({ ...form, [e.target.name]: e.target.value });
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const payload = {
      ...form,
      courseId: form.courseId === "" ? null : Number(form.courseId),
    };
    try {
      setSaving(true);
      setError("");
      setFieldErrors({});
      if (editingId) {
        await api.put(`/students/${editingId}`, payload);
      } else {
        await api.post("/students", payload);
      }
      closeForm();
      await loadData();
    } catch (err: any) {
      const data = err.response?.data;
      if (data?.details) setFieldErrors(data.details);
      setError(data?.message || "Failed to save student.");
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

  function handleEdit(s: Student) {
    setEditingId(s.id);
    setFieldErrors({});
    setForm({
      studentNumber: s.studentNumber || "",
      firstName: s.firstName,
      lastName: s.lastName,
      email: s.email,
      phone: s.phone || "",
      courseId: s.courseId ? String(s.courseId) : "",
    });
    setShowForm(true);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function closeForm() {
    setShowForm(false);
    setEditingId(null);
    setForm(emptyForm);
    setFieldErrors({});
  }

  async function handleDelete(s: Student) {
    if (!confirm(`Delete ${s.firstName} ${s.lastName}?`)) return;
    try {
      await api.delete(`/students/${s.id}`);
      await loadData();
    } catch (err: any) {
      setError(err.response?.data?.message || "Failed to delete student.");
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
          <h1 className="text-2xl font-bold text-[#1E3A8A]">Students</h1>
          <p className="text-sm text-slate-500">
            {students.length} registered {students.length === 1 ? "student" : "students"}
          </p>
        </div>
        {!showForm && (
          <button
            onClick={openAdd}
            className="rounded-lg bg-[#1E3A8A] px-4 py-2 text-sm font-medium text-white hover:bg-[#1E40AF]"
          >
            + Add student
          </button>
        )}
      </div>

      {error && <div className="mb-4 rounded-lg bg-red-50 p-3 text-sm text-red-600">{error}</div>}

      {showForm && (
        <form
          onSubmit={handleSubmit}
          className="mb-6 grid gap-4 rounded-xl border border-slate-200 bg-white p-5 shadow-sm sm:grid-cols-2"
        >
          <h2 className="font-semibold text-slate-900 sm:col-span-2">
            {editingId ? "Edit student" : "New student"}
          </h2>
          <div>
            <label className={labelClass}>First name</label>
            <input name="firstName" value={form.firstName} onChange={handleChange} className={inputClass} required />
            {fieldErrors.firstName && <p className={errClass}>{fieldErrors.firstName}</p>}
          </div>
          <div>
            <label className={labelClass}>Last name</label>
            <input name="lastName" value={form.lastName} onChange={handleChange} className={inputClass} required />
            {fieldErrors.lastName && <p className={errClass}>{fieldErrors.lastName}</p>}
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
            <label className={labelClass}>Student number</label>
            <input name="studentNumber" placeholder="Auto-generated if empty" value={form.studentNumber} onChange={handleChange} className={inputClass} />
          </div>
          <div>
            <label className={labelClass}>Course</label>
            <select name="courseId" value={form.courseId} onChange={handleChange} className={inputClass}>
              <option value="">No course</option>
              {courses.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.code} - {c.name}
                </option>
              ))}
            </select>
          </div>
          <div className="flex gap-2 sm:col-span-2">
            <button
              type="submit"
              disabled={saving}
              className="rounded-lg bg-[#1E3A8A] px-4 py-2 font-medium text-white hover:bg-[#1E40AF] disabled:opacity-50"
            >
              {saving ? "Saving..." : editingId ? "Update student" : "Add student"}
            </button>
            <button type="button" onClick={closeForm} className="rounded-lg border border-slate-300 px-4 py-2 text-slate-700 hover:bg-slate-50">
              Cancel
            </button>
          </div>
        </form>
      )}

      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-100 p-4">
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name, email, student number or course"
            className={inputClass}
          />
        </div>

        {loading ? (
          <p className="p-6 text-slate-500">Loading students...</p>
        ) : filtered.length === 0 ? (
          <div className="p-10 text-center">
            <p className="font-medium text-slate-900">
              {students.length === 0 ? "No students yet" : "No matching students"}
            </p>
            <p className="mt-1 text-sm text-slate-500">
              {students.length === 0
                ? "Students appear here when they register, or add one yourself."
                : "Try a different search."}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-left text-sm">
              <thead>
                <tr className="bg-slate-50 text-slate-600">
                  <th className="p-3 font-medium">Student</th>
                  <th className="p-3 font-medium">Student no.</th>
                  <th className="p-3 font-medium">Phone</th>
                  <th className="p-3 font-medium">Course</th>
                  <th className="p-3 text-right font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((s) => (
                  <tr key={s.id} className="border-t border-slate-100 hover:bg-slate-50">
                    <td className="p-3">
                      <div className="flex items-center gap-3">
                        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-blue-100 text-xs font-bold text-[#1E3A8A]">
                          {(s.firstName[0] || "") + (s.lastName[0] || "")}
                        </div>
                        <div>
                          <p className="font-medium text-slate-900">
                            {s.firstName} {s.lastName}
                          </p>
                          <p className="text-xs text-slate-500">{s.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="p-3 font-medium text-[#1E3A8A]">{s.studentNumber || "-"}</td>
                    <td className="p-3 text-slate-600">{s.phone || "-"}</td>
                    <td className="p-3">
                      {s.courseName ? (
                        <span className="rounded-full bg-emerald-100 px-2.5 py-0.5 text-xs font-medium text-emerald-700">
                          {s.courseName}
                        </span>
                      ) : (
                        <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-xs text-slate-500">
                          Not assigned
                        </span>
                      )}
                    </td>
                    <td className="p-3 text-right">
                      <button onClick={() => handleEdit(s)} className="mr-4 text-[#3B82F6] hover:underline">
                        Edit
                      </button>
                      <button onClick={() => handleDelete(s)} className="text-[#EF4444] hover:underline">
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}