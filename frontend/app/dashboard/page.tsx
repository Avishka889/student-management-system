"use client";

import { useEffect, useState } from "react";
import AdminDashboard from "@/components/AdminDashboard";
import StudentDashboard from "@/components/StudentDashboard";
import TutorDashboard from "@/components/TutorDashboard";
import { getRole } from "@/lib/auth";

export default function DashboardPage() {
  const [role, setRole] = useState<string | null>(null);

  useEffect(() => {
    const r = getRole();
    if (!r) {
      window.location.href = "/login";
      return;
    }
    setRole(r);
  }, []);

  if (!role) return <p className="text-slate-500">Loading...</p>;
  if (role === "ADMIN") return <AdminDashboard />;
  if (role === "TUTOR") return <TutorDashboard />;
  return <StudentDashboard />;
}