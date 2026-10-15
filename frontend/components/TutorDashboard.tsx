"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import api, { Course } from "@/lib/api";
import { getFullName } from "@/lib/auth";
import { BarChart } from "./charts";

export default function TutorDashboard() {
  const [fullName, setFullName] = useState("");
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    setFullName(getFullName() || "");
    async function load() {
      try {
        const res = await api.get<Course[]>("/tutors/me/courses");
        setCourses(res.data);
      } catch {
        setError("Failed to load your courses. Is the backend running?");
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const totalCredits = courses.reduce((sum, c) => sum + (c.credits || 0), 0);
  const totalStudents = courses.reduce((sum, c) => sum + (c.enrolledCount || 0), 0);
  const totalLectures = courses.reduce((sum, c) => sum + (c.lectureCount || 0), 0);
  const cardClass = "rounded-xl border border-slate-200 bg-white p-5 shadow-sm";

  return (
    <div>
      <h1 className="text-2xl font-bold text-[#1E3A8A]">Tutor dashboard</h1>
      {fullName && <p className="mb-6 mt-1 text-slate-500">Welcome back, {fullName}</p>}

      {error && <div className="mb-4 rounded-lg bg-red-50 p-3 text-sm text-red-600">{error}</div>}

      {loading ? (
        <p className="text-slate-500">Loading your dashboard...</p>
      ) : (
        <>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div className={cardClass}>
              <p className="text-sm text-slate-500">My courses</p>
              <p className="text-3xl font-bold text-[#1E3A8A]">{courses.length}</p>
            </div>
            <div className={cardClass}>
              <p className="text-sm text-slate-500">Total credits</p>
              <p className="text-3xl font-bold text-[#1E3A8A]">{totalCredits}</p>
            </div>
            <div className={cardClass}>
              <p className="text-sm text-slate-500">Enrolled students</p>
              <p className="text-3xl font-bold text-[#10B981]">{totalStudents}</p>
            </div>
            <div className={cardClass}>
              <p className="text-sm text-slate-500">Lectures</p>
              <p className="text-3xl font-bold text-[#3B82F6]">{totalLectures}</p>
            </div>
          </div>

          {courses.length > 0 && (
            <div className={`${cardClass} mt-5`}>
              <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-slate-400">Students per course</h2>
              <BarChart data={courses.map((c) => ({ label: `${c.code} - ${c.name}`, value: c.enrolledCount || 0 }))} />
            </div>
          )}

          <h2 className="mb-3 mt-8 text-lg font-semibold text-slate-900">My courses</h2>
          {courses.length === 0 ? (
            <div className="rounded-xl border border-slate-200 bg-white p-10 text-center shadow-sm">
              <p className="font-medium text-slate-900">No courses assigned yet</p>
              <p className="mt-1 text-sm text-slate-500">Your administrator will assign courses to you.</p>
            </div>
          ) : (
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {courses.map((c) => (
                <div key={c.id} className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm transition hover:shadow-md">
                  {c.imageUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={c.imageUrl} alt={c.name} className="h-36 w-full object-cover" />
                  ) : (
                    <div className="flex h-36 items-center justify-center bg-gradient-to-br from-[#1E3A8A] to-[#3B82F6] text-3xl font-bold text-white">
                      {c.code}
                    </div>
                  )}
                  <div className="p-4">
                    <div className="mb-2 flex items-center justify-between">
                      <span className="rounded-full bg-blue-100 px-2.5 py-0.5 text-xs font-medium text-[#1E3A8A]">{c.code}</span>
                      {c.credits != null && <span className="text-xs text-slate-500">{c.credits} credits</span>}
                    </div>
                    <h3 className="font-semibold text-slate-900">{c.name}</h3>
                    <p className="mt-1 line-clamp-2 text-sm text-slate-500">{c.description}</p>
                    <p className="mt-2 text-xs text-slate-400">
                      {c.enrolledCount ?? 0} students &middot; {c.lectureCount ?? 0} lectures
                    </p>
                    <Link href={`/courses/${c.id}`} className="mt-3 inline-block text-sm font-medium text-[#3B82F6] hover:underline">
                      Manage lectures &rarr;
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}
