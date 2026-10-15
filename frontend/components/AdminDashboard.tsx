"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import api, { Student, Course, Enrollment } from "@/lib/api";
import { getFullName } from "@/lib/auth";
import { BarChart, DonutChart } from "./charts";

export default function AdminDashboard() {
  const [fullName, setFullName] = useState("");
  const [students, setStudents] = useState<Student[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [enrollments, setEnrollments] = useState<Enrollment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    setFullName(getFullName() || "");
    async function load() {
      try {
        const [s, c, e] = await Promise.all([
          api.get<Student[]>("/students"),
          api.get<Course[]>("/courses"),
          api.get<Enrollment[]>("/enrollments"),
        ]);
        setStudents(s.data);
        setCourses(c.data);
        setEnrollments(e.data);
      } catch {
        setError("Failed to load dashboard data. Is the backend running?");
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const enrolled = students.filter((s) => s.courseId).length;
  const recent = [...students].sort((a, b) => b.id - a.id).slice(0, 5);
  const pending = enrollments.filter((e) => e.status === "PENDING");
  const approvedCount = enrollments.filter((e) => e.status === "APPROVED").length;
  const rejectedCount = enrollments.filter((e) => e.status === "REJECTED").length;

  const topCourses = [...courses]
    .sort((a, b) => (b.enrolledCount || 0) - (a.enrolledCount || 0))
    .slice(0, 8)
    .map((c) => ({ label: `${c.code} - ${c.name}`, value: c.enrolledCount || 0 }));

  const cardClass = "rounded-xl border border-slate-200 bg-white p-5 shadow-sm";

  return (
    <div>
      <h1 className="text-2xl font-bold text-[#1E3A8A]">Admin dashboard</h1>
      {fullName && <p className="mb-6 mt-1 text-slate-500">Welcome back, {fullName}</p>}

      {error && <div className="mb-4 rounded-lg bg-red-50 p-3 text-sm text-red-600">{error}</div>}

      {loading ? (
        <p className="text-slate-500">Loading dashboard...</p>
      ) : (
        <>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <Link href="/students" className={`${cardClass} transition hover:shadow-md`}>
              <p className="text-sm text-slate-500">Registered students</p>
              <p className="text-3xl font-bold text-[#1E3A8A]">{students.length}</p>
            </Link>
            <Link href="/courses" className={`${cardClass} transition hover:shadow-md`}>
              <p className="text-sm text-slate-500">Courses</p>
              <p className="text-3xl font-bold text-[#1E3A8A]">{courses.length}</p>
            </Link>
            <div className={cardClass}>
              <p className="text-sm text-slate-500">Students with a course</p>
              <p className="text-3xl font-bold text-[#10B981]">{enrolled}</p>
            </div>
            <Link href="/enrollments" className={`${cardClass} transition hover:shadow-md`}>
              <p className="text-sm text-slate-500">Pending requests</p>
              <p className="text-3xl font-bold text-[#F59E0B]">{pending.length}</p>
            </Link>
          </div>

          <div className="mt-6 flex flex-wrap gap-3">
            <Link href="/students" className="rounded-lg bg-[#1E3A8A] px-4 py-2 text-sm font-medium text-white hover:bg-[#1E40AF]">
              Manage students
            </Link>
            <Link href="/courses" className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50">
              Manage courses
            </Link>
            <Link href="/enrollments" className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50">
              Review enrollments
            </Link>
          </div>

          <div className="mt-6 grid gap-5 md:grid-cols-2">
            <div className={cardClass}>
              <h2 className="mb-4 text-sm font-semibold uppercase tracking-wide text-slate-400">Students per course</h2>
              <BarChart data={topCourses} />
            </div>
            <div className={cardClass}>
              <h2 className="mb-4 text-sm font-semibold uppercase tracking-wide text-slate-400">Enrollment requests</h2>
              <DonutChart
                data={[
                  { label: "Approved", value: approvedCount, color: "#10B981" },
                  { label: "Pending", value: pending.length, color: "#F59E0B" },
                  { label: "Rejected", value: rejectedCount, color: "#EF4444" },
                ]}
              />
            </div>
          </div>

          <div className="mt-6 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
            <div className="border-b border-slate-100 px-4 py-3 font-semibold text-slate-900">
              Recently registered students
            </div>
            {recent.length === 0 ? (
              <p className="p-4 text-sm text-slate-500">No students yet.</p>
            ) : (
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="bg-slate-50 text-slate-600">
                    <th className="p-3">Student no.</th>
                    <th className="p-3">Name</th>
                    <th className="p-3">Email</th>
                    <th className="p-3">Course</th>
                  </tr>
                </thead>
                <tbody>
                  {recent.map((s) => (
                    <tr key={s.id} className="border-t border-slate-100">
                      <td className="p-3 font-medium text-[#1E3A8A]">{s.studentNumber || "-"}</td>
                      <td className="p-3">{s.firstName} {s.lastName}</td>
                      <td className="p-3 text-slate-500">{s.email}</td>
                      <td className="p-3 text-slate-500">{s.courseName || "-"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </>
      )}
    </div>
  );
}
