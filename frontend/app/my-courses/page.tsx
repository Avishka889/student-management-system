"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import api, { Enrollment } from "@/lib/api";
import { getRole } from "@/lib/auth";
import { ProgressBar } from "@/components/charts";

export default function MyCoursesPage() {
  const [items, setItems] = useState<Enrollment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");

  async function load() {
    try {
      setLoading(true);
      setError("");
      const res = await api.get<Enrollment[]>("/enrollments/me");
      setItems(res.data);
    } catch {
      setError("Failed to load your courses. Is the backend running?");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    const role = getRole();
    if (!role) {
      window.location.href = "/login";
      return;
    }
    if (role !== "STUDENT") {
      window.location.href = "/dashboard";
      return;
    }
    load();
  }, []);

  async function cancel(e: Enrollment) {
    const msg = e.status === "APPROVED" ? "Leave this course? Your lecture progress will be removed." : "Cancel this request?";
    if (!confirm(msg)) return;
    try {
      await api.delete(`/enrollments/${e.id}`);
      await load();
    } catch (err: any) {
      setError(err.response?.data?.message || "Could not complete that action.");
    }
  }

  const q = search.trim().toLowerCase();
  const matches = (e: Enrollment) =>
    !q || `${e.courseCode} ${e.courseName} ${e.tutorName || ""}`.toLowerCase().includes(q);

  const approved = useMemo(() => items.filter((e) => e.status === "APPROVED"), [items]);
  const others = useMemo(() => items.filter((e) => e.status !== "APPROVED"), [items]);
  const avg =
    approved.length === 0 ? 0 : Math.round(approved.reduce((s, e) => s + e.progressPercent, 0) / approved.length);

  const cardClass = "rounded-xl border border-slate-200 bg-white p-5 shadow-sm";

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-[#1E3A8A]">My courses</h1>
          <p className="text-sm text-slate-500">Your enrolled courses, requests and progress.</p>
        </div>
        <Link href="/courses" className="rounded-lg bg-[#1E3A8A] px-4 py-2 text-sm font-medium text-white hover:bg-[#1E40AF]">
          Browse courses
        </Link>
      </div>

      {error && <div className="mb-4 rounded-lg bg-red-50 p-3 text-sm text-red-600">{error}</div>}

      {loading ? (
        <p className="text-slate-500">Loading...</p>
      ) : (
        <>
          <div className="grid gap-4 sm:grid-cols-3">
            <div className={cardClass}>
              <p className="text-sm text-slate-500">Enrolled courses</p>
              <p className="text-3xl font-bold text-[#1E3A8A]">{approved.length}</p>
            </div>
            <div className={cardClass}>
              <p className="text-sm text-slate-500">Pending requests</p>
              <p className="text-3xl font-bold text-[#F59E0B]">{items.filter((e) => e.status === "PENDING").length}</p>
            </div>
            <div className={cardClass}>
              <p className="text-sm text-slate-500">Average progress</p>
              <p className="text-3xl font-bold text-[#10B981]">{avg}%</p>
            </div>
          </div>

          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by course code, name or tutor"
            className="mt-6 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 focus:border-[#3B82F6] focus:outline-none focus:ring-2 focus:ring-[#3B82F6]/30"
          />

          <h2 className="mb-3 mt-6 text-lg font-semibold text-slate-900">Enrolled</h2>
          {approved.filter(matches).length === 0 ? (
            <p className="text-sm text-slate-500">
              {approved.length === 0 ? "You are not enrolled in any course yet." : "No courses match your search."}
            </p>
          ) : (
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {approved.filter(matches).map((e) => (
                <div key={e.id} className="flex flex-col overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm transition hover:shadow-md">
                  {e.courseImageUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={e.courseImageUrl} alt={e.courseName} className="h-36 w-full object-cover" />
                  ) : (
                    <div className="flex h-36 items-center justify-center bg-gradient-to-br from-[#1E3A8A] to-[#3B82F6] text-3xl font-bold text-white">
                      {e.courseCode}
                    </div>
                  )}
                  <div className="flex flex-1 flex-col p-4">
                    <span className="mb-2 w-fit rounded-full bg-blue-100 px-2.5 py-0.5 text-xs font-medium text-[#1E3A8A]">{e.courseCode}</span>
                    <h3 className="font-semibold text-slate-900">{e.courseName}</h3>
                    <p className="text-sm text-slate-500">{e.tutorName || "Tutor not assigned"}</p>
                    <div className="mt-3">
                      <div className="mb-1 flex justify-between text-xs text-slate-500">
                        <span>{e.completedLectures} / {e.totalLectures} lectures</span>
                        <span>{e.progressPercent}%</span>
                      </div>
                      <ProgressBar percent={e.progressPercent} />
                    </div>
                    <div className="mt-3 flex items-center gap-4 border-t border-slate-100 pt-3 text-sm">
                      <Link href={`/courses/${e.courseId}`} className="font-medium text-[#3B82F6] hover:underline">Open &rarr;</Link>
                      <button onClick={() => cancel(e)} className="text-[#EF4444] hover:underline">Leave</button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {others.filter(matches).length > 0 && (
            <>
              <h2 className="mb-3 mt-8 text-lg font-semibold text-slate-900">Requests</h2>
              <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
                <table className="w-full text-left text-sm">
                  <thead>
                    <tr className="bg-slate-50 text-slate-600">
                      <th className="p-3">Course</th>
                      <th className="p-3">Requested</th>
                      <th className="p-3">Status</th>
                      <th className="p-3"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {others.filter(matches).map((e) => (
                      <tr key={e.id} className="border-t border-slate-100">
                        <td className="p-3">
                          <Link href={`/courses/${e.courseId}`} className="font-medium text-[#1E3A8A] hover:underline">
                            {e.courseCode} - {e.courseName}
                          </Link>
                        </td>
                        <td className="p-3 text-slate-500">{new Date(e.requestedAt).toLocaleDateString()}</td>
                        <td className="p-3">
                          <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${e.status === "PENDING" ? "bg-amber-100 text-amber-700" : "bg-red-100 text-red-700"}`}>
                            {e.status === "PENDING" ? "Pending" : "Rejected"}
                          </span>
                        </td>
                        <td className="p-3 text-right">
                          {e.status === "PENDING" ? (
                            <button onClick={() => cancel(e)} className="text-[#EF4444] hover:underline">Cancel</button>
                          ) : (
                            <Link href={`/courses/${e.courseId}`} className="text-[#3B82F6] hover:underline">Request again</Link>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </>
      )}
    </div>
  );
}
