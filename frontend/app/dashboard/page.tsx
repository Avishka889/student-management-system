"use client";

import { useEffect, useState } from "react";
import { getFullName } from "@/lib/auth";
import Link from "next/link";
import api, { Student, Course } from "@/lib/api";

export default function DashboardPage() {
  const [studentCount, setStudentCount] = useState(0);
  const [courseCount, setCourseCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [fullName, setFullName] = useState("");

  useEffect(() => {
    async function loadCounts() {
      try {
        setError("");
        const [students, courses] = await Promise.all([
          api.get<Student[]>("/students"),
          api.get<Course[]>("/courses"),
        ]);
        setStudentCount(students.data.length);
        setCourseCount(courses.data.length);
      } catch {
        setError("Failed to load dashboard data. Is the backend running?");
      } finally {
        setLoading(false);
      }
    }
    loadCounts();
    setFullName(getFullName() || "");
  }, []);

  return (
    <div>
      <h1 className="mb-1 text-2xl font-bold">Dashboard</h1>
        {fullName && <p className="mb-4 text-gray-500">Welcome, {fullName} 👋</p>}

      {error && (
        <div className="mb-4 rounded bg-red-100 p-3 text-red-700">{error}</div>
      )}

      {loading ? (
        <p>Loading dashboard...</p>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          <Link
            href="/students"
            className="rounded border border-gray-200 p-6 hover:shadow"
          >
            <p className="text-gray-500">Total Students</p>
            <p className="text-4xl font-bold text-blue-600">{studentCount}</p>
          </Link>
          <Link
            href="/courses"
            className="rounded border border-gray-200 p-6 hover:shadow"
          >
            <p className="text-gray-500">Total Courses</p>
            <p className="text-4xl font-bold text-blue-600">{courseCount}</p>
          </Link>
        </div>
      )}
    </div>
  );
}