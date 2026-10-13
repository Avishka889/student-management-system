"use client";

import { useEffect, useState } from "react";
import api, { Student } from "@/lib/api";

const emptyForm = {
  firstName: "",
  lastName: "",
  email: "",
  phone: "",
  address: "",
};

export default function StudentsPage() {
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [saving, setSaving] = useState(false);

  async function loadStudents() {
    try {
      setLoading(true);
      setError("");
      const res = await api.get<Student[]>("/students");
      setStudents(res.data);
    } catch {
      setError("Failed to load students. Is the backend running?");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadStudents();
  }, []);

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    setForm({ ...form, [e.target.name]: e.target.value });
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    try {
      setSaving(true);
      setError("");
      if (editingId) {
        await api.put(`/students/${editingId}`, form);
      } else {
        await api.post("/students", form);
      }
      setForm(emptyForm);
      setEditingId(null);
      await loadStudents();
    } catch {
      setError("Failed to save student. Check the fields (email must be valid and unique).");
    } finally {
      setSaving(false);
    }
  }

  function handleEdit(s: Student) {
    setEditingId(s.id);
    setForm({
      firstName: s.firstName,
      lastName: s.lastName,
      email: s.email,
      phone: s.phone || "",
      address: s.address || "",
    });
  }

  async function handleDelete(id: number) {
    if (!confirm("Delete this student?")) return;
    try {
      await api.delete(`/students/${id}`);
      await loadStudents();
    } catch {
      setError("Failed to delete student.");
    }
  }

  function cancelEdit() {
    setEditingId(null);
    setForm(emptyForm);
  }

  const inputClass = "w-full rounded border border-gray-300 p-2";

  return (
    <div>
      <h1 className="mb-4 text-2xl font-bold">Students</h1>

      {error && (
        <div className="mb-4 rounded bg-red-100 p-3 text-red-700">{error}</div>
      )}

      <form
        onSubmit={handleSubmit}
        className="mb-6 grid gap-3 rounded border border-gray-200 p-4 sm:grid-cols-2"
      >
        <input name="firstName" placeholder="First name" value={form.firstName} onChange={handleChange} className={inputClass} required />
        <input name="lastName" placeholder="Last name" value={form.lastName} onChange={handleChange} className={inputClass} required />
        <input name="email" type="email" placeholder="Email" value={form.email} onChange={handleChange} className={inputClass} required />
        <input name="phone" placeholder="Phone" value={form.phone} onChange={handleChange} className={inputClass} />
        <input name="address" placeholder="Address" value={form.address} onChange={handleChange} className={`${inputClass} sm:col-span-2`} />
        <div className="flex gap-2 sm:col-span-2">
          <button type="submit" disabled={saving} className="rounded bg-blue-600 px-4 py-2 text-white disabled:opacity-50">
            {saving ? "Saving..." : editingId ? "Update Student" : "Add Student"}
          </button>
          {editingId && (
            <button type="button" onClick={cancelEdit} className="rounded border px-4 py-2">
              Cancel
            </button>
          )}
        </div>
      </form>

      {loading ? (
        <p>Loading students...</p>
      ) : students.length === 0 ? (
        <p className="text-gray-500">No students yet. Add one above.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-left">
            <thead>
              <tr className="bg-gray-100 text-black">
                <th className="p-2">Name</th>
                <th className="p-2">Email</th>
                <th className="p-2">Phone</th>
                <th className="p-2">Address</th>
                <th className="p-2">Actions</th>
              </tr>
            </thead>
            <tbody>
              {students.map((s) => (
                <tr key={s.id} className="border-t">
                  <td className="p-2">{s.firstName} {s.lastName}</td>
                  <td className="p-2">{s.email}</td>
                  <td className="p-2">{s.phone}</td>
                  <td className="p-2">{s.address}</td>
                  <td className="p-2">
                    <button onClick={() => handleEdit(s)} className="mr-3 text-blue-600 hover:underline">Edit</button>
                    <button onClick={() => handleDelete(s.id)} className="text-red-600 hover:underline">Delete</button>
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