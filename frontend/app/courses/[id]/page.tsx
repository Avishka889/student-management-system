import { Suspense } from "react";
import CourseDetail from "./CourseDetail";

export default function CourseDetailPage() {
  return (
    <Suspense fallback={<p className="text-slate-500">Loading...</p>}>
      <CourseDetail />
    </Suspense>
  );
}