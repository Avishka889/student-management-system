"use client";

import { useEffect, useMemo, useState } from "react";
import api, { Enrollment, EnrollmentStatus } from "@/lib/api";
import { getRole } from "@/lib/auth";

type Filter = "ALL" | EnrollmentStatus;

const badge: Record<EnrollmentStatus, string> = {
  PENDING: "bg-amber-100 text-amber-700",
  APPROVED: "bg-emerald-100 text-emerald-700",
  REJECTED: "bg-red-100 text-red-700",
};

export default function EnrollmentsPage() {
  const [items, setItems] = useState<Enrollment[]>([]);
  const [filter, setFilter] = useState<Filter>("PENDING");
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [busyId, setBusyId] = useState<number | null>(null);

  async function load() {
    try {
      setLoading(true);
      setError("");
      const res = await api.get<Enrollment[]>("/enrollments");
      setItems(res.data);
    } catch {
      setError("Failed to load enrollment requests. Is the backend running?");
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
    if (role !== "ADMIN") {
      window.location.href = "/dashboard";
      return;
    }
    load();
  }, []);

  async function decide(e: Enrollment, action: "approve" | "reject") {
    try {
      setBusyId(e.id);
      setError("");
      await api.put(`/enrollments/${e.id}/${action}`);
      await load();
    } catch (err: any) {
      setError(err.response?.data?.message || `Could not ${action} this request.`);
    } finally {
      setBusyId(null);
    }
  }

  const counts = useMemo(
    () => ({
      ALL: items.length,
      PENDING: items.filter((e) => e.status === "PENDING").length,
      APPROVED: items.filter((e) => e.status === "APPROVED").length,
      REJECTED: items.filter((e) => e.status === "REJECTED").length,
    }),
    [items]
  );

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return items.filter((e) => {
      if (filter !== "ALL" && e.status !== filter) return false;
      if (!q) return true;
      return `${e.studentName} ${e.studentNumber || ""} ${e.courseCode} ${e.courseName}`.toLowerCase().includes(q);
    });
  }, [items, filter, search]);

  const tabs: Filter[] = ["PENDING", "APPROVED", "REJECTED", "ALL"];

  return (
    <div>
      <h1 className="text-2xl font-bold text-[#1E3A8A]">Enrollments</h1>
      <p className="mb-4 text-sm text-slate-500">Approve or reject course requests from students.</p>

      {error && <div className="mb-4 rounded-lg bg-red-50 p-3 text-sm text-red-600">{error}</div>}

      <div className="mb-4 flex flex-wrap items-center gap-2">
        {tabs.map((t) => (
          <button
            key={t}
            onClick={() => setFilter(t)}
            className={`rounded-full px-3 py-1.5 text-sm font-medium transition ${
              filter === t ? "bg-[#1E3A8A] text-white" : "border border-slate-300 bg-white text-slate-700 hover:bg-slate-50"
            }`}
          >
            {t === "ALL" ? "All" : t[0] + t.slice(1).toLowerCase()} ({counts[t]})
          </button>
        ))}
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search student or course"
          className="ml-auto w-full rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-sm focus:border-[#3B82F6] focus:outline-none focus:ring-2 focus:ring-[#3B82F6]/30 sm:w-64"
        />
      </div>

      {loading ? (
        <p className="text-slate-500">Loading...</p>
      ) : filtered.length === 0 ? (
        <div className="rounded-xl border border-slate-200 bg-white p-10 text-center shadow-sm">
          <p className="font-medium text-slate-900">Nothing here</p>
          <p className="mt-1 text-sm text-slate-500">
            {items.length === 0 ? "No enrollment requests yet." : "No requests match this filter."}
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-sm">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="bg-slate-50 text-slate-600">
                <th className="p-3">Student</th>
                <th className="p-3">Course</th>
                <th className="p-3">Requested</th>
                <th className="p-3">Status</th>
                <th className="p-3 text-right">Action</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((e) => (
                <tr key={e.id} className="border-t border-slate-100">
                  <td className="p-3">
                    <div className="font-medium text-slate-900">{e.studentName}</div>
                    <div className="text-xs text-slate-500">{e.studentNumber || "-"}</div>
                  </td>
                  <td className="p-3">
                    <span className="font-medium text-[#1E3A8A]">{e.courseCode}</span>{" "}
                    <span className="text-slate-600">{e.courseName}</span>
                  </td>
                  <td className="p-3 text-slate-500">{new Date(e.requestedAt).toLocaleString()}</td>
                  <td className="p-3">
                    <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${badge[e.status]}`}>
                      {e.status[0] + e.status.slice(1).toLowerCase()}
                    </span>
                  </td>
                  <td className="p-3 text-right">
                    {e.status !== "APPROVED" && (
                      <button
                        onClick={() => decide(e, "approve")}
                        disabled={busyId === e.id}
                        className="mr-2 rounded-md bg-[#10B981] px-3 py-1 text-xs font-medium text-white hover:opacity-90 disabled:opacity-50"
                      >
                        Approve
                      </button>
                    )}
                    {e.status === "PENDING" && (
                      <button
                        onClick={() => decide(e, "reject")}
                        disabled={busyId === e.id}
                        className="rounded-md bg-[#EF4444] px-3 py-1 text-xs font-medium text-white hover:opacity-90 disabled:opacity-50"
                      >
                        Reject
                      </button>
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
