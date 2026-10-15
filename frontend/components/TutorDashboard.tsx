"use client";

import { useEffect, useState } from "react";
import { getFullName } from "@/lib/auth";

export default function TutorDashboard() {
  const [fullName, setFullName] = useState("");

  useEffect(() => {
    setFullName(getFullName() || "");
  }, []);

  return (
    <div>
      <h1 className="text-2xl font-bold text-[#1E3A8A]">Tutor dashboard</h1>
      <p className="mt-1 text-slate-500">Welcome, {fullName}. Your courses and lectures will appear here soon.</p>
    </div>
  );
}