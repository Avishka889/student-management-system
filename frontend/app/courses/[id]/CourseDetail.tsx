"use client";

import { useCallback, useEffect, useState, ChangeEvent } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import api, { Course, Enrollment, Lecture } from "@/lib/api";
import { getRole } from "@/lib/auth";
import { ProgressBar } from "@/components/charts";

const emptyForm = { title: "", description: "", videoUrl: "", pdfUrl: "" };

// Google Drive "view" links can't be embedded; the /preview version can
function toEmbedUrl(url: string) {
  const drive = url.match(/drive\.google\.com\/file\/d\/([^/]+)/);
  if (drive) return `https://drive.google.com/file/d/${drive[1]}/preview`;
  return url;
}

export default function CourseDetail() {
  const params = useParams<{ id: string }>();
  const courseId = Number(params.id);

  const [role, setRole] = useState<string | null>(null);
  const [course, setCourse] = useState<Course | null>(null);
  const [lectures, setLectures] = useState<Lecture[]>([]);
  const [enrollment, setEnrollment] = useState<Enrollment | null>(null);
  const [isOwner, setIsOwner] = useState(false);
  const [canSeeLectures, setCanSeeLectures] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [openPdfId, setOpenPdfId] = useState<number | null>(null);

  // lecture form (tutor only)
  const [form, setForm] = useState(emptyForm);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [editingId, setEditingId] = useState<number | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadMsg, setUploadMsg] = useState<{ ok: boolean; text: string } | null>(null);

  const load = useCallback(
    async (r: string) => {
      try {
        setLoading(true);
        setError("");
        const c = await api.get<Course>(`/courses/${courseId}`);
        setCourse(c.data);

        let canSee = r === "ADMIN";
        if (r === "TUTOR") {
          const mine = await api.get<Course[]>("/tutors/me/courses");
          const owner = mine.data.some((x) => x.id === courseId);
          setIsOwner(owner);
          canSee = owner;
        }
        if (r === "STUDENT") {
          const en = await api.get<Enrollment[]>("/enrollments/me");
          const e = en.data.find((x) => x.courseId === courseId) || null;
          setEnrollment(e);
          canSee = e?.status === "APPROVED";
        }

        setCanSeeLectures(canSee);
        if (canSee) {
          const l = await api.get<Lecture[]>(`/lectures/course/${courseId}`);
          setLectures(l.data);
        } else {
          setLectures([]);
        }
      } catch (err: any) {
        setError(err.response?.data?.message || "Failed to load this course. Is the backend running?");
      } finally {
        setLoading(false);
      }
    },
    [courseId]
  );

  useEffect(() => {
    const r = getRole();
    if (!r) {
      window.location.href = "/login";
      return;
    }
    setRole(r);
    load(r);
  }, [load]);

  // ---------- student actions ----------

  async function requestJoin() {
    try {
      setBusy(true);
      setError("");
      await api.post(`/enrollments/request/${courseId}`);
      await load("STUDENT");
    } catch (err: any) {
      setError(err.response?.data?.message || "Could not send the request.");
    } finally {
      setBusy(false);
    }
  }

  async function cancelOrLeave() {
    if (!enrollment) return;
    const msg =
      enrollment.status === "APPROVED"
        ? "Leave this course? Your lecture progress will be removed."
        : "Cancel your request?";
    if (!confirm(msg)) return;
    try {
      setBusy(true);
      setError("");
      await api.delete(`/enrollments/${enrollment.id}`);
      setEnrollment(null);
      await load("STUDENT");
    } catch (err: any) {
      setError(err.response?.data?.message || "Could not complete that action.");
    } finally {
      setBusy(false);
    }
  }

  async function toggleDone(l: Lecture) {
    try {
      const res = l.completed
        ? await api.delete<Lecture>(`/lectures/${l.id}/complete`)
        : await api.put<Lecture>(`/lectures/${l.id}/complete`);
      setLectures((list) => list.map((x) => (x.id === l.id ? { ...x, completed: res.data.completed } : x)));
    } catch (err: any) {
      setError(err.response?.data?.message || "Could not update your progress.");
    }
  }

  // ---------- tutor actions ----------

  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) {
    setForm({ ...form, [e.target.name]: e.target.value });
  }

  function openAdd() {
    setUploadMsg(null);
    setEditingId(null);
    setForm(emptyForm);
    setFieldErrors({});
    setShowForm(true);
  }

  function openEdit(l: Lecture) {
    setEditingId(l.id);
    setForm({
      title: l.title,
      description: l.description || "",
      videoUrl: l.videoUrl || "",
      pdfUrl: l.pdfUrl || "",
    });
    setFieldErrors({});
    setShowForm(true);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function closeForm() {
    setUploadMsg(null);
    setShowForm(false);
    setEditingId(null);
    setForm(emptyForm);
    setFieldErrors({});
  }

  async function handlePdfUpload(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadMsg(null);

    if (file.type !== "application/pdf") {
      setUploadMsg({ ok: false, text: "Please choose a PDF file." });
      e.target.value = "";
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      setUploadMsg({ ok: false, text: "PDF must be 10 MB or smaller." });
      e.target.value = "";
      return;
    }

    try {
      setUploading(true);
      const data = new FormData();
      data.append("file", file);
      const res = await api.post<{ url: string }>("/lectures/upload", data);
      setForm((f) => ({ ...f, pdfUrl: res.data.url }));
      setUploadMsg({ ok: true, text: `Uploaded: ${file.name}` });
    } catch (err: any) {
      setUploadMsg({
        ok: false,
        text: err.response?.data?.message || `Upload failed (${err.response?.status ?? "no response"})`,
      });
    } finally {
      setUploading(false);
      e.target.value = "";
    }
  }

  async function saveLecture(e: React.FormEvent) {
    e.preventDefault();
    const payload = { courseId, ...form };
    try {
      setSaving(true);
      setError("");
      setFieldErrors({});
      if (editingId) {
        await api.put(`/lectures/${editingId}`, payload);
      } else {
        await api.post("/lectures", payload);
      }
      closeForm();
      await load("TUTOR");
    } catch (err: any) {
      const data = err.response?.data;
      if (data?.details) setFieldErrors(data.details);
      setError(data?.message || "Failed to save the lecture.");
    } finally {
      setSaving(false);
    }
  }

  async function deleteLecture(id: number) {
    if (!confirm("Delete this lecture?")) return;
    try {
      await api.delete(`/lectures/${id}`);
      await load("TUTOR");
    } catch (err: any) {
      setError(err.response?.data?.message || "Failed to delete the lecture.");
    }
  }

  const inputClass =
    "w-full rounded-lg border border-slate-300 bg-white px-3 py-2 focus:border-[#3B82F6] focus:outline-none focus:ring-2 focus:ring-[#3B82F6]/30";
  const errClass = "mt-1 text-xs text-red-600";

  const doneCount = lectures.filter((l) => l.completed).length;
  const percent = lectures.length === 0 ? 0 : Math.round((doneCount / lectures.length) * 100);

  if (loading) return <p className="text-slate-500">Loading course...</p>;
  if (!course) {
    return (
      <div>
        {error && <div className="mb-4 rounded-lg bg-red-50 p-3 text-sm text-red-600">{error}</div>}
        <Link href="/courses" className="text-sm font-medium text-[#3B82F6] hover:underline">&larr; Back to courses</Link>
      </div>
    );
  }

  return (
    <div>
      <Link href="/courses" className="text-sm font-medium text-[#3B82F6] hover:underline">&larr; Back to courses</Link>

      {error && <div className="my-4 rounded-lg bg-red-50 p-3 text-sm text-red-600">{error}</div>}

      {/* ---------- course summary ---------- */}
      <div className="mt-4 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
        {course.imageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={course.imageUrl} alt={course.name} className="h-48 w-full object-cover" />
        ) : (
          <div className="flex h-48 items-center justify-center bg-gradient-to-br from-[#1E3A8A] to-[#3B82F6] text-5xl font-bold text-white">
            {course.code}
          </div>
        )}
        <div className="p-5">
          <div className="mb-2 flex flex-wrap items-center gap-3">
            <span className="rounded-full bg-blue-100 px-2.5 py-0.5 text-xs font-medium text-[#1E3A8A]">{course.code}</span>
            {course.credits != null && <span className="text-sm text-slate-500">{course.credits} credits</span>}
            <span className="text-sm text-slate-500">{course.lectureCount ?? 0} lectures</span>
            <span className="text-sm text-slate-500">{course.enrolledCount ?? 0} students</span>
          </div>
          <h1 className="text-2xl font-bold text-[#1E3A8A]">{course.name}</h1>
          <p className="mt-2 whitespace-pre-line text-slate-600">{course.description || "No summary yet."}</p>

          <div className="mt-4 flex items-center gap-2 text-sm text-slate-600">
            {course.tutorPhotoUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={course.tutorPhotoUrl} alt="" className="h-8 w-8 rounded-full object-cover" />
            ) : (
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-200 text-xs text-slate-600">
                {course.tutorName ? course.tutorName[0] : "?"}
              </div>
            )}
            <span>Tutor: <span className="font-medium text-slate-900">{course.tutorName || "not assigned yet"}</span></span>
          </div>

          {role === "STUDENT" && (
            <div className="mt-5 flex flex-wrap items-center gap-3 border-t border-slate-100 pt-4">
              {!enrollment && (
                <button onClick={requestJoin} disabled={busy} className="rounded-lg bg-[#1E3A8A] px-4 py-2 text-sm font-medium text-white hover:bg-[#1E40AF] disabled:opacity-50">
                  {busy ? "Sending..." : "Request to join"}
                </button>
              )}
              {enrollment?.status === "PENDING" && (
                <>
                  <span className="rounded-full bg-amber-100 px-3 py-1 text-sm font-medium text-amber-700">Request pending</span>
                  <button onClick={cancelOrLeave} disabled={busy} className="text-sm text-[#EF4444] hover:underline">Cancel request</button>
                </>
              )}
              {enrollment?.status === "REJECTED" && (
                <>
                  <span className="rounded-full bg-red-100 px-3 py-1 text-sm font-medium text-red-700">Request rejected</span>
                  <button onClick={requestJoin} disabled={busy} className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm text-slate-700 hover:bg-slate-50 disabled:opacity-50">
                    Request again
                  </button>
                </>
              )}
              {enrollment?.status === "APPROVED" && (
                <>
                  <span className="rounded-full bg-emerald-100 px-3 py-1 text-sm font-medium text-emerald-700">You are enrolled</span>
                  <button onClick={cancelOrLeave} disabled={busy} className="text-sm text-[#EF4444] hover:underline">Leave course</button>
                </>
              )}
            </div>
          )}
        </div>
      </div>

      {/* ---------- lectures ---------- */}
      <div className="mt-8 flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-lg font-semibold text-slate-900">Lectures</h2>
        {isOwner && !showForm && (
          <button onClick={openAdd} className="rounded-lg bg-[#1E3A8A] px-4 py-2 text-sm font-medium text-white hover:bg-[#1E40AF]">
            + Add lecture
          </button>
        )}
      </div>

      {role === "STUDENT" && canSeeLectures && lectures.length > 0 && (
        <div className="mt-3 rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="mb-2 flex justify-between text-sm">
            <span className="text-slate-600">Your progress</span>
            <span className="font-medium text-slate-900">{doneCount} / {lectures.length} lectures ({percent}%)</span>
          </div>
          <ProgressBar percent={percent} />
        </div>
      )}

      {isOwner && showForm && (
        <form onSubmit={saveLecture} className="mt-3 grid gap-3 rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <h3 className="font-semibold text-slate-900">{editingId ? "Edit lecture" : "New lecture"}</h3>
          <div>
            <input name="title" placeholder="Lecture title" value={form.title} onChange={handleChange} className={inputClass} required />
            {fieldErrors.title && <p className={errClass}>{fieldErrors.title}</p>}
          </div>
          <textarea name="description" placeholder="Short description (optional)" value={form.description} onChange={handleChange} rows={3} className={inputClass} />
          <div>
            <input name="videoUrl" type="url" placeholder="Video link (https://...)" value={form.videoUrl} onChange={handleChange} className={inputClass} />
            {fieldErrors.videoUrl && <p className={errClass}>{fieldErrors.videoUrl}</p>}
          </div>
          <div>
            <input name="pdfUrl" type="url" placeholder="PDF link (https://...)" value={form.pdfUrl} onChange={handleChange} className={inputClass} />
            {fieldErrors.pdfUrl && <p className={errClass}>{fieldErrors.pdfUrl}</p>}
            <div className="mt-2 flex items-center gap-2 text-sm text-slate-500">
              <span>or upload:</span>
              <input
                type="file"
                accept="application/pdf"
                onChange={handlePdfUpload}
                disabled={uploading}
                className="text-sm"
              />
              {uploading && <span>Uploading...</span>}
            </div>
            {uploadMsg && (
              <p className={`mt-1 text-xs ${uploadMsg.ok ? "text-emerald-600" : "text-red-600"}`}>
                {uploadMsg.text}
              </p>
            )}
          </div>
          <div className="flex gap-2">
            <button type="submit" disabled={saving} className="rounded-lg bg-[#1E3A8A] px-4 py-2 font-medium text-white hover:bg-[#1E40AF] disabled:opacity-50">
              {saving ? "Saving..." : editingId ? "Update lecture" : "Add lecture"}
            </button>
            <button type="button" onClick={closeForm} className="rounded-lg border border-slate-300 px-4 py-2 text-slate-700 hover:bg-slate-50">
              Cancel
            </button>
          </div>
        </form>
      )}

      <div className="mt-3 space-y-3">
        {!canSeeLectures ? (
          <p className="rounded-xl border border-slate-200 bg-white p-5 text-sm text-slate-500 shadow-sm">
            {role === "STUDENT"
              ? "Lectures are visible once your enrollment is approved."
              : "Lectures are visible to the course tutor and the administrator."}
          </p>
        ) : lectures.length === 0 ? (
          <p className="rounded-xl border border-slate-200 bg-white p-5 text-sm text-slate-500 shadow-sm">
            No lectures have been added yet.
          </p>
        ) : (
          lectures.map((l, i) => (
            <div key={l.id} className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
              <div className="flex items-start gap-3">
                {role === "STUDENT" && (
                  <input
                    type="checkbox"
                    checked={l.completed}
                    onChange={() => toggleDone(l)}
                    className="mt-1 h-4 w-4 accent-[#10B981]"
                    aria-label="Mark as done"
                  />
                )}
                <div className="flex-1">
                  <h3 className={`font-semibold ${l.completed ? "text-slate-400 line-through" : "text-slate-900"}`}>
                    {i + 1}. {l.title}
                  </h3>
                  {l.description && <p className="mt-1 whitespace-pre-line text-sm text-slate-500">{l.description}</p>}
                  <div className="mt-2 flex flex-wrap items-center gap-4 text-sm">
                    {l.videoUrl && (
                      <a
                        href={l.videoUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="font-medium text-[#3B82F6] hover:underline"
                      >
                        &#9654; Watch video
                      </a>
                    )}
                    {l.pdfUrl && (
                      <button
                        type="button"
                        onClick={() => setOpenPdfId(openPdfId === l.id ? null : l.id)}
                        className="font-medium text-[#3B82F6] hover:underline"
                      >
                        {openPdfId === l.id ? "Hide PDF" : "View PDF"}
                      </button>
                    )}
                    {!l.videoUrl && !l.pdfUrl && <span className="text-slate-400">No links attached</span>}
                    {isOwner && (
                      <>
                        <button onClick={() => openEdit(l)} className="text-slate-600 hover:underline">Edit</button>
                        <button onClick={() => deleteLecture(l.id)} className="text-[#EF4444] hover:underline">Delete</button>
                      </>
                    )}
                  </div>

                  {l.pdfUrl && openPdfId === l.id && (
                    <div className="mt-3">
                      <iframe
                        src={toEmbedUrl(l.pdfUrl)}
                        title={`${l.title} PDF`}
                        className="h-[600px] w-full rounded-lg border border-slate-200"
                      />
                      <a
                        href={l.pdfUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="mt-1 inline-block text-xs text-slate-500 hover:underline"
                      >
                        PDF eka penne naththam new tab eke open karanna
                      </a>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
