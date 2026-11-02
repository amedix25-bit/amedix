import React, { useCallback, useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";
import { Bell, Check, X } from "lucide-react";
import { formatMessageTime } from "@/lib/messaging";

const PREF_KEY = "amedix.messaging.prefs";

function readPrefs() {
  try {
    return JSON.parse(localStorage.getItem(PREF_KEY) || "{}");
  } catch (e) {
    return {};
  }
}

// In-app notification history with per-user alert preferences (stored on this
// device) controlling which alerts are surfaced here.
export default function MessagingNotificationsPanel({ onOpenThread, onClose }) {
  const [items, setItems] = useState([]);
  const [prefs, setPrefs] = useState(() => ({ messages: true, announcements: true, ...readPrefs() }));

  const load = useCallback(async () => {
    const res = await base44.functions.invoke("messagingApi", { action: "notifications" });
    setItems(res.data.notifications || []);
  }, []);

  useEffect(() => { load(); }, [load]);

  const updatePref = (key) => {
    const next = { ...prefs, [key]: !prefs[key] };
    setPrefs(next);
    try { localStorage.setItem(PREF_KEY, JSON.stringify(next)); } catch (e) { /* device storage unavailable */ }
  };

  const open = async (n) => {
    try {
      await base44.functions.invoke("messagingApi", { action: "markNotificationsRead", ids: [n.id] });
    } catch (e) { /* read state refresh below */ }
    setItems((prev) => prev.map((i) => (i.id === n.id ? { ...i, is_read: true } : i)));
    if (onOpenThread) onOpenThread(n.thread_id);
    if (onClose) onClose();
  };

  const markAll = async () => {
    try {
      await base44.functions.invoke("messagingApi", { action: "markNotificationsRead" });
      setItems((prev) => prev.map((i) => ({ ...i, is_read: true })));
    } catch (e) { /* no-op */ }
  };

  const visible = items.filter((n) => (n.kind === "announcement" ? prefs.announcements : prefs.messages));

  return (
    <div className="w-full rounded-2xl border border-border bg-card p-3 shadow-sm sm:w-80">
      <div className="mb-2 flex items-center justify-between">
        <p className="flex items-center gap-1.5 text-sm font-semibold"><Bell className="w-4 h-4" /> Notifications</p>
        <button onClick={markAll} className="text-[11px] text-muted-foreground hover:text-foreground">Mark all read</button>
      </div>
      <div className="max-h-64 space-y-1.5 overflow-y-auto">
        {visible.length === 0 && <p className="py-4 text-center text-xs text-muted-foreground">No messaging notifications.</p>}
        {visible.map((n) => (
          <button
            key={n.id}
            onClick={() => open(n)}
            className={`w-full rounded-lg border px-2.5 py-2 text-left text-xs ${n.is_read ? "border-border" : "border-primary/30 bg-primary/5"}`}
          >
            <span className="flex items-start justify-between gap-2">
              <span className="min-w-0 flex-1 font-medium">{n.title}</span>
              {n.is_read ? <Check className="w-3 h-3 text-muted-foreground" /> : <span className="mt-1 h-1.5 w-1.5 rounded-full bg-primary" />}
            </span>
            <span className="mt-0.5 block truncate text-muted-foreground">{n.message}</span>
            <span className="mt-0.5 block text-[10px] text-muted-foreground">{formatMessageTime(n.datetime)}</span>
          </button>
        ))}
      </div>
      <div className="mt-2 space-y-1 border-t border-border pt-2">
        <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">Alert preferences</p>
        <label className="flex items-center justify-between text-[11px]">
          New message notifications <input type="checkbox" checked={prefs.messages} onChange={() => updatePref("messages")} />
        </label>
        <label className="flex items-center justify-between text-[11px]">
          Announcement notifications <input type="checkbox" checked={prefs.announcements} onChange={() => updatePref("announcements")} />
        </label>
        {onClose && (
          <button onClick={onClose} className="ml-auto flex items-center gap-1 text-[11px] text-muted-foreground hover:text-foreground">
            <X className="w-3 h-3" /> Close
          </button>
        )}
      </div>
    </div>
  );
}