"use client";

import { useEffect, useState } from "react";
import api, { Profile } from "@/lib/api";
import { clearMustChange, mustChangePassword, setFullName } from "@/lib/auth";
import { resizeImage } from "@/lib/image";

export default function ProfilePage() {
  const [firstLogin, setFirstLogin] = useState(false);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [form, setForm] = useState({ fullName: "", phone: "", bio: "", photoUrl: "" });
  const [pw, setPw] = useState({ currentPassword: "", newPassword: "", confirm: "" });
  const [loading, setLoading] = useState(true);
  const [savingProfile, setSavingProfile] = useState(false);
  const [savingPw, setSavingPw] = useState(false);
  const [profileMsg, setProfileMsg] = useState("");
  const [profileErr, setProfileErr] = useState("");
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [pwMsg, setPwMsg] = useState("");
  const [pwErr, setPwErr] = useState("");

  useEffect(() => {
    setFirstLogin(mustChangePassword());
    async function load() {
      try {
        const res = await api.get<Profile>("/profile");
        setProfile(res.data);
        setForm({
          fullName: res.data.fullName,
          phone: res.data.phone || "",
          bio: res.data.bio || "",
          photoUrl: res.data.photoUrl || "",
        });
      } catch {
        setProfileErr("Could not load your profile. Is the backend running?");
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) {
    setForm({ ...form, [e.target.name]: e.target.value });
  }

  async function handlePhoto(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      setProfileErr("Please choose an image file.");
      return;
    }
    try {
      const dataUrl = await resizeImage(file, 300, 0.8);
      setForm((f) => ({ ...f, photoUrl: dataUrl }));
    } catch {
      setProfileErr("Could not process that image.");
    }
  }

  async function saveProfile(e: React.FormEvent) {
    e.preventDefault();
    setProfileErr("");
    setProfileMsg("");
    setFieldErrors({});
    try {
      setSavingProfile(true);
      const res = await api.put<Profile>("/profile", {
        ...form,
        photoUrl: form.photoUrl || null,
      });
      setProfile(res.data);
      setFullName(res.data.fullName);
      setProfileMsg("Profile updated.");
    } catch (err: any) {
      const data = err.response?.data;
      if (data?.details) setFieldErrors(data.details);
      setProfileErr(data?.message || "Could not update your profile.");
    } finally {
      setSavingProfile(false);
    }
  }

  async function savePassword(e: React.FormEvent) {
    e.preventDefault();
    setPwErr("");
    setPwMsg("");

    if (pw.newPassword.length < 6) {
      setPwErr("New password must be at least 6 characters.");
      return;
    }
    if (pw.newPassword !== pw.confirm) {
      setPwErr("New password and confirmation do not match.");
      return;
    }

    try {
      setSavingPw(true);
      await api.put("/profile/password", {
        currentPassword: pw.currentPassword,
        newPassword: pw.newPassword,
      });
      clearMustChange();
      setPw({ currentPassword: "", newPassword: "", confirm: "" });
      setPwMsg("Password changed successfully.");
      if (firstLogin) {
        setTimeout(() => (window.location.href = "/dashboard"), 1200);
      }
    } catch (err: any) {
      const data = err.response?.data;
      setPwErr(data?.details?.newPassword || data?.message || "Could not change the password.");
    } finally {
      setSavingPw(false);
    }
  }

  const inputClass =
    "w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 focus:border-[#3B82F6] focus:outline-none focus:ring-2 focus:ring-[#3B82F6]/30";
  const readOnlyClass = `${inputClass} bg-slate-100 text-slate-500`;
  const labelClass = "mb-1 block text-sm font-medium text-slate-700";

  const initials = (profile?.fullName || "")
    .split(" ")
    .map((w) => w[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  if (loading) return <p className="text-slate-500">Loading profile...</p>;

  return (
    <div className="mx-auto max-w-2xl">
      <h1 className="text-2xl font-bold text-[#1E3A8A]">My profile</h1>
      <p className="mb-5 mt-1 text-sm text-slate-500">Manage your details and account security.</p>

      {firstLogin && (
        <div className="mb-4 rounded-lg bg-amber-50 p-3 text-sm text-amber-800">
          For security, please set a new password below before you continue.
        </div>
      )}

      <form onSubmit={saveProfile} className="mb-6 grid gap-4 rounded-xl border border-slate-200 bg-white p-6 shadow-sm sm:grid-cols-2">
        <div className="flex items-center gap-4 sm:col-span-2">
          {form.photoUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={form.photoUrl} alt="Profile" className="h-20 w-20 rounded-full object-cover" />
          ) : (
            <div className="flex h-20 w-20 items-center justify-center rounded-full bg-[#1E3A8A] text-2xl font-bold text-white">
              {initials}
            </div>
          )}
          <div>
            <input type="file" accept="image/*" onChange={handlePhoto} className="text-sm file:mr-3 file:rounded file:border-0 file:bg-blue-50 file:px-3 file:py-1 file:text-[#1E3A8A]" />
            {form.photoUrl && (
              <button type="button" onClick={() => setForm({ ...form, photoUrl: "" })} className="mt-1 block text-sm text-[#EF4444] hover:underline">
                Remove photo
              </button>
            )}
          </div>
        </div>

        {profileErr && <div className="rounded-lg bg-red-50 p-3 text-sm text-red-600 sm:col-span-2">{profileErr}</div>}
        {profileMsg && <div className="rounded-lg bg-emerald-50 p-3 text-sm text-emerald-700 sm:col-span-2">{profileMsg}</div>}

        <div>
          <label className={labelClass}>Full name</label>
          <input name="fullName" value={form.fullName} onChange={handleChange} className={inputClass} required />
          {fieldErrors.fullName && <p className="mt-1 text-xs text-red-600">{fieldErrors.fullName}</p>}
        </div>
        <div>
          <label className={labelClass}>Phone</label>
          <input name="phone" value={form.phone} onChange={handleChange} className={inputClass} />
          {fieldErrors.phone && <p className="mt-1 text-xs text-red-600">{fieldErrors.phone}</p>}
        </div>
        <div>
          <label className={labelClass}>Username</label>
          <input value={profile?.username || ""} readOnly className={readOnlyClass} />
        </div>
        <div>
          <label className={labelClass}>Email</label>
          <input value={profile?.email || ""} readOnly className={readOnlyClass} />
        </div>
        {profile?.role === "TUTOR" && (
          <div className="sm:col-span-2">
            <label className={labelClass}>Bio</label>
            <textarea name="bio" rows={3} value={form.bio} onChange={handleChange} className={inputClass} />
          </div>
        )}
        <div className="sm:col-span-2">
          <button type="submit" disabled={savingProfile} className="rounded-lg bg-[#1E3A8A] px-5 py-2.5 font-medium text-white hover:bg-[#1E40AF] disabled:opacity-50">
            {savingProfile ? "Saving..." : "Save profile"}
          </button>
        </div>
      </form>

      <form onSubmit={savePassword} className="grid gap-4 rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="font-semibold text-slate-900">Change password</h2>
        {pwErr && <div className="rounded-lg bg-red-50 p-3 text-sm text-red-600">{pwErr}</div>}
        {pwMsg && <div className="rounded-lg bg-emerald-50 p-3 text-sm text-emerald-700">{pwMsg}</div>}
        <div>
          <label className={labelClass}>Current password</label>
          <input type="password" value={pw.currentPassword} onChange={(e) => setPw({ ...pw, currentPassword: e.target.value })} className={inputClass} required />
        </div>
        <div>
          <label className={labelClass}>New password</label>
          <input type="password" value={pw.newPassword} onChange={(e) => setPw({ ...pw, newPassword: e.target.value })} className={inputClass} required />
        </div>
        <div>
          <label className={labelClass}>Confirm new password</label>
          <input type="password" value={pw.confirm} onChange={(e) => setPw({ ...pw, confirm: e.target.value })} className={inputClass} required />
        </div>
        <button type="submit" disabled={savingPw} className="rounded-lg bg-[#1E3A8A] px-5 py-2.5 font-medium text-white hover:bg-[#1E40AF] disabled:opacity-50">
          {savingPw ? "Saving..." : "Change password"}
        </button>
      </form>
    </div>
  );
}