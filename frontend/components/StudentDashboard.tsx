"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import api, { Student, Course, Profile, Enrollment } from "@/lib/api";
import { ProgressBar } from "./charts";

export default function StudentDashboard() {
  const [fullName, setFullName] = useState("");
  const [photoUrl, setPhotoUrl] = useState<string | undefined>();
  const [profile, setProfile] = useState<Student | null>(null);
  const [courses, setCourses] = useState<Course[]>([]);
  const [enrollments, setEnrollments] = useState<Enrollment[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function load() {
      try {
        const [p, c, pr, en] = await Promise.all([
          api.get<Student>("/students/me"),
          api.get<Course[]>("/courses"),
          api.get<Profile>("/profile"),
          api.get<Enrollment[]>("/enrollments/me"),
        ]);
        setProfile(p.data);
        setCourses(c.data);
        setPhotoUrl(pr.data.photoUrl);
        setFullName(pr.data.fullName);
        setEnrollments(en.data);
      } catch {
        setError("Failed to load your dashboard. Is the backend running?");
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const initials = fullName
    .split(" ")
    .map((w) => w[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  const statusByCourse = useMemo(() => {
    const m = new Map<number, Enrollment>();
    enrollments.forEach((e) => m.set(e.courseId, e));
    return m;
  }, [enrollments]);

  const approved = enrollments.filter((e) => e.status === "APPROVED");
  const pending = enrollments.filter((e) => e.status === "PENDING");
  const avg = approved.length === 0 ? 0 : Math.round(approved.reduce((s, e) => s + e.progressPercent, 0) / approved.length);
  const lecturesDone = approved.reduce((s, e) => s + e.completedLectures, 0);
  const lecturesTotal = approved.reduce((s, e) => s + e.totalLectures, 0);

  const q = search.trim().toLowerCase();
  const filtered = courses.filter(
    (c) => !q || `${c.code} ${c.name} ${c.tutorName || ""}`.toLowerCase().includes(q)
  );

  const row = (label: string, value?: string | null) => (
    <div className="flex justify-between gap-4 border-b border-slate-100 py-2 text-sm last:border-0">
      <span className="text-slate-500">{label}</span>
      <span className="text-right font-medium text-slate-900">{value || "-"}</span>
    </div>
  );

  const cardClass = "rounded-xl border border-slate-200 bg-white p-5 shadow-sm";

  return (
    <div>
      <h1 className="text-2xl font-bold text-[#1E3A8A]">Student dashboard</h1>
      {fullName && <p className="mb-6 mt-1 text-slate-500">Welcome back, {fullName}</p>}

      {error && <div className="mb-4 rounded-lg bg-red-50 p-3 text-sm text-red-600">{error}</div>}

      {loading ? (
        <p className="text-slate-500">Loading your dashboard...</p>
      ) : (
        <>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <Link href="/my-courses" className={`${cardClass} transition hover:shadow-md`}>
              <p className="text-sm text-slate-500">Enrolled courses</p>
              <p className="text-3xl font-bold text-[#1E3A8A]">{approved.length}</p>
            </Link>
            <Link href="/my-courses" className={`${cardClass} transition hover:shadow-md`}>
              <p className="text-sm text-slate-500">Pending requests</p>
              <p className="text-3xl font-bold text-[#F59E0B]">{pending.length}</p>
            </Link>
            <div className={cardClass}>
              <p className="text-sm text-slate-500">Lectures completed</p>
              <p className="text-3xl font-bold text-[#1E3A8A]">{lecturesDone}<span className="text-lg text-slate-400"> / {lecturesTotal}</span></p>
            </div>
            <div className={cardClass}>
              <p className="text-sm text-slate-500">Overall progress</p>
              <p className="text-3xl font-bold text-[#10B981]">{avg}%</p>
              <ProgressBar percent={avg} className="mt-2" />
            </div>
          </div>

          <div className="mt-5 grid gap-5 md:grid-cols-2">
            <div className={cardClass}>
              <div className="mb-4 flex items-center gap-4">
                {photoUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={photoUrl} alt="Profile" className="h-14 w-14 rounded-full object-cover" />
                ) : (
                  <div className="flex h-14 w-14 items-center justify-center rounded-full bg-[#1E3A8A] text-lg font-bold text-white">
                    {initials}
                  </div>
                )}
                <div>
                  <p className="font-semibold text-slate-900">{fullName}</p>
                  <p className="text-sm text-slate-500">{profile?.studentNumber}</p>
                </div>
              </div>
              <h2 className="mb-1 text-sm font-semibold uppercase tracking-wide text-slate-400">My profile</h2>
              {row("Email", profile?.email)}
              {row("Phone", profile?.phone)}
              <Link href="/profile" className="mt-3 inline-block text-sm font-medium text-[#3B82F6] hover:underline">
                Edit profile &rarr;
              </Link>
            </div>

            <div className={cardClass}>
              <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-slate-400">My courses</h2>
              {approved.length === 0 ? (
                <p className="text-sm text-slate-500">You are not enrolled in a course yet. Request one below.</p>
              ) : (
                <div className="space-y-4">
                  {approved.slice(0, 4).map((e) => (
                    <Link key={e.id} href={`/courses/${e.courseId}`} className="block">
                      <div className="mb-1 flex justify-between text-sm">
                        <span className="font-medium text-slate-900">{e.courseCode} - {e.courseName}</span>
                        <span className="text-slate-500">{e.progressPercent}%</span>
                      </div>
                      <ProgressBar percent={e.progressPercent} />
                    </Link>
                  ))}
                  {approved.length > 4 && (
                    <Link href="/my-courses" className="text-sm font-medium text-[#3B82F6] hover:underline">
                      See all {approved.length} courses &rarr;
                    </Link>
                  )}
                </div>
              )}
            </div>
          </div>

          <div className="mb-3 mt-8 flex flex-wrap items-center justify-between gap-3">
            <h2 className="text-lg font-semibold text-slate-900">Available courses</h2>
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by code, name or tutor"
              className="w-full rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-sm focus:border-[#3B82F6] focus:outline-none focus:ring-2 focus:ring-[#3B82F6]/30 sm:w-64"
            />
          </div>
          {filtered.length === 0 ? (
            <p className="text-slate-500">{courses.length === 0 ? "No courses yet." : "No courses match your search."}</p>
          ) : (
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {filtered.map((c) => {
                const st = statusByCourse.get(c.id)?.status;
                return (
                  <div key={c.id} className="flex flex-col overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm transition hover:shadow-md">
                    {c.imageUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={c.imageUrl} alt={c.name} className="h-36 w-full object-cover" />
                    ) : (
                      <div className="flex h-36 items-center justify-center bg-gradient-to-br from-[#1E3A8A] to-[#3B82F6] text-3xl font-bold text-white">
                        {c.code}
                      </div>
                    )}
                    <div className="flex flex-1 flex-col p-4">
                      <div className="mb-2 flex items-center justify-between">
                        <span className="rounded-full bg-blue-100 px-2.5 py-0.5 text-xs font-medium text-[#1E3A8A]">{c.code}</span>
                        {st === "APPROVED" ? (
                          <span className="rounded-full bg-emerald-100 px-2.5 py-0.5 text-xs font-medium text-emerald-700">Enrolled</span>
                        ) : st === "PENDING" ? (
                          <span className="rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-medium text-amber-700">Pending</span>
                        ) : st === "REJECTED" ? (
                          <span className="rounded-full bg-red-100 px-2.5 py-0.5 text-xs font-medium text-red-700">Rejected</span>
                        ) : (
                          c.credits != null && <span className="text-xs text-slate-500">{c.credits} credits</span>
                        )}
                      </div>
                      <h3 className="font-semibold text-slate-900">{c.name}</h3>
                      <p className="mt-1 line-clamp-3 flex-1 text-sm text-slate-500">{c.description}</p>
                      <p className="mt-2 text-xs text-slate-400">
                        {c.tutorName || "Tutor not assigned"} &middot; {c.lectureCount ?? 0} lectures
                      </p>
                      <Link href={`/courses/${c.id}`} className="mt-3 text-sm font-medium text-[#3B82F6] hover:underline">
                        {st ? "View details" : "View & request"} &rarr;
                      </Link>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </>
      )}
    </div>
  );
}
