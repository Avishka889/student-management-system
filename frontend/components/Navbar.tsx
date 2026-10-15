"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { clearAuth, getUsername, getRole, mustChangePassword } from "@/lib/auth";
import Logo from "./Logo";

export default function Navbar() {
  const pathname = usePathname();
  const [username, setUsername] = useState<string | null>(null);
  const [role, setRole] = useState<string | null>(null);

  useEffect(() => {
    setUsername(getUsername());
    setRole(getRole());
    if (getUsername() && mustChangePassword() && pathname !== "/profile") {
      window.location.href = "/profile";
    }
  }, [pathname]);

  function logout() {
    clearAuth();
    window.location.href = "/login";
  }

  const linkClass = (href: string) =>
    `rounded-md px-3 py-1.5 text-sm font-medium transition ${
      pathname === href || pathname.startsWith(href + "/")
        ? "bg-[#3B82F6] text-white"
        : "text-blue-100 hover:bg-white/10 hover:text-white"
    }`;

  return (
    <nav className="sticky top-0 z-10 bg-[#1E3A8A] shadow">
      <div className="mx-auto flex max-w-5xl flex-wrap items-center justify-between gap-2 px-4 py-3">
        <Link href="/dashboard" className="flex items-center gap-2">
          <Logo />
          <span className="text-lg font-bold text-white">EduTrack</span>
        </Link>
        <div className="flex flex-wrap items-center gap-1">
          {username ? (
            <>
              <Link href="/dashboard" className={linkClass("/dashboard")}>Dashboard</Link>
              {role === "ADMIN" && (
                <>
                  <Link href="/students" className={linkClass("/students")}>Students</Link>
                  <Link href="/tutors" className={linkClass("/tutors")}>Tutors</Link>
                </>
              )}
              <Link href="/courses" className={linkClass("/courses")}>Courses</Link>
              <Link href="/profile" className={linkClass("/profile")}>Profile</Link>
              <span className="ml-2 rounded-full bg-white/15 px-3 py-1 text-xs text-white">
                {username} ({role})
              </span>
              <button onClick={logout} className="ml-1 rounded-md bg-white px-3 py-1.5 text-sm font-medium text-[#1E3A8A] hover:bg-blue-50">
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