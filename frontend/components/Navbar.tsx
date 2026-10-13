import Link from "next/link";

export default function Navbar() {
  return (
    <nav className="bg-blue-600 text-white">
      <div className="mx-auto flex max-w-5xl flex-wrap items-center justify-between gap-2 p-4">
        <span className="text-lg font-bold">Student Management</span>
        <div className="flex gap-4">
          <Link href="/dashboard" className="hover:underline">Dashboard</Link>
          <Link href="/students" className="hover:underline">Students</Link>
          <Link href="/courses" className="hover:underline">Courses</Link>
          <Link href="/login" className="hover:underline">Login</Link>
        </div>
      </div>
    </nav>
  );
}