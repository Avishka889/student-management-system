"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import api, { AppNotification } from "@/lib/api";

export default function NotificationBell() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState<AppNotification[]>([]);
  const [count, setCount] = useState(0);

  const loadCount = useCallback(async () => {
    try {
      const res = await api.get<{ count: number }>("/notifications/unread-count");
      setCount(res.data.count);
    } catch {
      /* ignore - bell just stays as it is */
    }
  }, []);

  const loadList = useCallback(async () => {
    try {
      const res = await api.get<AppNotification[]>("/notifications");
      setItems(res.data);
    } catch {
      /* ignore */
    }
  }, []);

  // poll the unread count every 30 seconds
  useEffect(() => {
    loadCount();
    const t = setInterval(loadCount, 30000);
    return () => clearInterval(t);
  }, [loadCount]);

  async function toggle() {
    const next = !open;
    setOpen(next);
    if (next) await loadList();
  }

  async function openItem(n: AppNotification) {
    try {
      if (!n.seen) await api.put(`/notifications/${n.id}/read`);
    } catch {
      /* ignore */
    }
    setOpen(false);
    loadCount();
    if (n.link) router.push(n.link);
  }

  async function markAll() {
    try {
      await api.put("/notifications/read-all");
      setItems((list) => list.map((n) => ({ ...n, seen: true })));
      setCount(0);
    } catch {
      /* ignore */
    }
  }

  return (
    <div className="relative">
      <button
        onClick={toggle}
        aria-label="Notifications"
        className="relative rounded-full p-2 text-blue-100 hover:bg-white/10 hover:text-white"
      >
        <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M18 8a6 6 0 0 0-12 0c0 7-3 9-3 9h18s-3-2-3-9" />
          <path d="M13.7 21a2 2 0 0 1-3.4 0" />
        </svg>
        {count > 0 && (
          <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-[#EF4444] px-1 text-[10px] font-bold text-white">
            {count > 9 ? "9+" : count}
          </span>
        )}
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-20" onClick={() => setOpen(false)} />
          <div className="absolute right-0 z-30 mt-2 w-80 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-lg">
            <div className="flex items-center justify-between border-b border-slate-100 px-4 py-2.5">
              <span className="text-sm font-semibold text-slate-900">Notifications</span>
              {count > 0 && (
                <button onClick={markAll} className="text-xs font-medium text-[#3B82F6] hover:underline">
                  Mark all as read
                </button>
              )}
            </div>
            <div className="max-h-96 overflow-y-auto">
              {items.length === 0 ? (
                <p className="p-4 text-sm text-slate-500">You have no notifications.</p>
              ) : (
                items.map((n) => (
                  <button
                    key={n.id}
                    onClick={() => openItem(n)}
                    className={`block w-full border-b border-slate-100 px-4 py-3 text-left last:border-0 hover:bg-slate-50 ${
                      n.seen ? "" : "bg-blue-50/60"
                    }`}
                  >
                    <p className={`text-sm ${n.seen ? "text-slate-600" : "font-medium text-slate-900"}`}>{n.message}</p>
                    <p className="mt-0.5 text-xs text-slate-400">{new Date(n.createdAt).toLocaleString()}</p>
                  </button>
                ))
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
