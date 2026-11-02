import React, { useCallback, useRef, useState } from "react";
import { Bell } from "lucide-react";
import { Button } from "@/components/ui/button";
import MessagingNotificationList from "@/components/messaging/MessagingNotificationList";
import useMessagingNotifications from "@/hooks/useMessagingNotifications";
import { useToast } from "@/components/ui/use-toast";

const PREF_KEY = "amedix.messaging.prefs";

function readPrefs() {
  try {
    return JSON.parse(localStorage.getItem(PREF_KEY) || "{}");
  } catch (e) {
    return {};
  }
}

// The live notification bell: an unread count that updates the moment a
// message is delivered, an immediate pop-up alert, and the full history.
export default function MessagingNotificationBell({ onOpenThread, activeThreadId }) {
  const [open, setOpen] = useState(false);
  const [prefs, setPrefs] = useState(() => ({ messages: true, announcements: true, ...readPrefs() }));
  const { toast } = useToast();
  const activeRef = useRef(activeThreadId);
  activeRef.current = activeThreadId;

  // A message in the conversation already on screen needs no pop-up — the
  // thread itself is updating. Everything else alerts immediately.
  const handleNew = useCallback((fresh) => {
    const alert = fresh.find((n) => n.thread_id !== activeRef.current);
    if (!alert) return;
    toast({ title: alert.title, description: alert.message, duration: 8000 });
  }, [toast]);

  const { items, unread, markAll, markRead } = useMessagingNotifications({ onNew: handleNew });

  const togglePref = (key) => {
    const next = { ...prefs, [key]: !prefs[key] };
    setPrefs(next);
    try { localStorage.setItem(PREF_KEY, JSON.stringify(next)); } catch (e) { /* device storage unavailable */ }
  };

  const openItem = async (n) => {
    await markRead(n.id);
    setOpen(false);
    if (onOpenThread) onOpenThread(n.thread_id);
  };

  const visible = items.filter((n) => (n.kind === "announcement" ? prefs.announcements : prefs.messages));

  return (
    <div className="relative">
      <Button
        variant="outline"
        size="sm"
        onClick={() => setOpen((v) => !v)}
        aria-label={unread > 0 ? `Notifications, ${unread} unread` : "Notifications"}
        className="relative"
      >
        <Bell className="w-4 h-4" />
        {unread > 0 && (
          <span className="absolute -right-1.5 -top-1.5 min-w-[18px] rounded-full bg-critical px-1 text-[10px] font-semibold leading-[18px] text-destructive-foreground">
            {unread > 99 ? "99+" : unread}
          </span>
        )}
      </Button>

      {open && (
        <div className="absolute right-0 z-40 mt-2 w-[19rem] max-w-[85vw]">
          <div className="rounded-2xl border border-border bg-card p-3 shadow-lg">
            <div className="mb-2 flex items-center justify-between">
              <p className="flex items-center gap-1.5 text-sm font-semibold">
                <Bell className="w-4 h-4" /> Notifications
                {unread > 0 && <span className="rounded-full bg-critical/10 px-1.5 text-[10px] font-semibold text-critical">{unread} new</span>}
              </p>
              <button onClick={markAll} className="text-[11px] text-muted-foreground hover:text-foreground">Mark all read</button>
            </div>
            <MessagingNotificationList items={visible} onOpen={openItem} />
            <div className="mt-2 space-y-1 border-t border-border pt-2">
              <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">Alert preferences</p>
              <label className="flex items-center justify-between text-[11px]">
                New message alerts <input type="checkbox" checked={prefs.messages} onChange={() => togglePref("messages")} />
              </label>
              <label className="flex items-center justify-between text-[11px]">
                Announcement alerts <input type="checkbox" checked={prefs.announcements} onChange={() => togglePref("announcements")} />
              </label>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}