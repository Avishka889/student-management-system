"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { clearAuth, getUsername, getRole } from "@/lib/auth";

export default function Navbar() {
  const pathname = usePathname();
  const [username, setUsername] = useState<string | null>(null);
  const [role, setRole] = useState<string | null>(null);

  useEffect(() => {
    setUsername(getUsername());
    setRole(getRole());
  }, [pathname]);

  function logout() {
    clearAuth();
    window.location.href = "/login";
  }

  const linkClass = (href: string) =>
    `rounded-md px-3 py-1.5 text-sm font-medium transition ${
      pathname === href ? "bg-white/20 text-white" : "text-blue-100 hover:bg-white/10 hover:text-white"
    }`;

  return (
    <nav className="bg-blue-700 shadow">
      <div className="mx-auto flex max-w-5xl flex-wrap items-center justify-between gap-2 p-4">
        <span className="text-lg font-bold text-white">🎓 Student Management</span>
        <div className="flex flex-wrap items-center gap-1">
          {username ? (
            <>
              <Link href="/dashboard" className={linkClass("/dashboard")}>Dashboard</Link>
              <Link href="/students" className={linkClass("/students")}>Students</Link>
              <Link href="/courses" className={linkClass("/courses")}>Courses</Link>
              <span className="ml-2 rounded-full bg-white/20 px-3 py-1 text-xs text-white">
                {username} ({role})
              </span>
              <button onClick={logout} className="ml-1 rounded-md bg-white px-3 py-1.5 text-sm font-medium text-blue-700 hover:bg-blue-50">
                Logout
              </button>
            </>
          ) : (
            <>
              <Link href="/login" className={linkClass("/login")}>Login</Link>
              <Link href="/register" className={linkClass("/register")}>Register</Link>
            </>
          )}
        </div>
      </div>
    </nav>
  );
}