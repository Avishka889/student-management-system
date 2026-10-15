"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { getFullName } from "@/lib/auth";

export default function StudentDashboard() {
  const [fullName, setFullName] = useState("");

  useEffect(() => {
    setFullName(getFullName() || "");
  }, []);

  return (
    <div>
      <h1 className="text-2xl font-bold text-[#1E3A8A]">Student dashboard</h1>
      <p className="mb-6 mt-1 text-slate-500">Welcome, {fullName}</p>
      <Link href="/courses" className="rounded-lg bg-[#1E3A8A] px-4 py-2 text-sm font-medium text-white hover:bg-[#1E40AF]">
        Browse courses
      </Link>
    </div>
  );
}