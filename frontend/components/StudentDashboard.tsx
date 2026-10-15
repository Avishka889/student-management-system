"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import api, { Student, Course, Profile } from "@/lib/api";

export default function StudentDashboard() {
  const [fullName, setFullName] = useState("");
  const [photoUrl, setPhotoUrl] = useState<string | undefined>();
  const [profile, setProfile] = useState<Student | null>(null);
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function load() {
      try {
        const [p, c, pr] = await Promise.all([
          api.get<Student>("/students/me"),
          api.get<Course[]>("/courses"),
          api.get<Profile>("/profile"),
        ]);
        setProfile(p.data);
        setCourses(c.data);
        setPhotoUrl(pr.data.photoUrl);
        setFullName(pr.data.fullName);
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

  const myCourse = courses.find((c) => c.id === profile?.courseId);

  const row = (label: string, value?: string | null) => (
    <div className="flex justify-between gap-4 border-b border-slate-100 py-2 text-sm last:border-0">
      <span className="text-slate-500">{label}</span>
      <span className="text-right font-medium text-slate-900">{value || "-"}</span>
    </div>
  );

  return (
    <div>
      <h1 className="text-2xl font-bold text-[#1E3A8A]">Student dashboard</h1>
      {fullName && <p className="mb-6 mt-1 text-slate-500">Welcome back, {fullName}</p>}

      {error && <div className="mb-4 rounded-lg bg-red-50 p-3 text-sm text-red-600">{error}</div>}

      {loading ? (
        <p className="text-slate-500">Loading your dashboard...</p>
      ) : (
        <>
          <div className="grid gap-5 md:grid-cols-2">
            <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
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

            <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
              <h2 className="px-5 pt-5 text-sm font-semibold uppercase tracking-wide text-slate-400">My course</h2>
              {myCourse ? (
                <div className="p-5 pt-3">
                  {myCourse.imageUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={myCourse.imageUrl} alt={myCourse.name} className="mb-3 h-32 w-full rounded-lg object-cover" />
                  ) : (
                    <div className="mb-3 flex h-32 items-center justify-center rounded-lg bg-gradient-to-br from-[#1E3A8A] to-[#3B82F6] text-2xl font-bold text-white">
                      {myCourse.code}
                    </div>
                  )}
                  <p className="font-semibold text-slate-900">{myCourse.name}</p>
                  <p className="mt-1 text-sm text-slate-500">{myCourse.description}</p>
                </div>
              ) : (
                <p className="p-5 pt-3 text-sm text-slate-500">
                  You are not enrolled in a course yet. Pick one below.
                </p>
              )}
            </div>
          </div>

          <h2 className="mb-3 mt-8 text-lg font-semibold text-slate-900">Available courses</h2>
          {courses.length === 0 ? (
            <p className="text-slate-500">No courses yet.</p>
          ) : (
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {courses.map((c) => (
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
                      {c.id === profile?.courseId ? (
                        <span className="rounded-full bg-emerald-100 px-2.5 py-0.5 text-xs font-medium text-emerald-700">My course</span>
                      ) : (
                        c.credits != null && <span className="text-xs text-slate-500">{c.credits} credits</span>
                      )}
                    </div>
                    <h3 className="font-semibold text-slate-900">{c.name}</h3>
                    <p className="mt-1 line-clamp-3 flex-1 text-sm text-slate-500">{c.description}</p>
                    <Link href={`/courses/${c.id}`} className="mt-3 text-sm font-medium text-[#3B82F6] hover:underline">
                      View details &rarr;
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