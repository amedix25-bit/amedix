import React, { useState, useEffect, useCallback } from "react";
import { base44 } from "@/api/base44Client";
import { Bell, CheckCheck, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";

// Radiologist Portal → Notifications bell at the top of the portal.
// Shows an unread badge and a dropdown of recent notifications; clicking one
// marks it read and navigates to the relevant patient view.
export default function RadiologistNotificationsBell({ userId, onOpenAll, onNavigate }) {
  const [unread, setUnread] = useState(0);
  const [recent, setRecent] = useState([]);
  const [open, setOpen] = useState(false);

  const load = useCallback(async () => {
    try {
      const [unreadItems, latest] = await Promise.all([
        base44.entities.RadiologistNotification.filter({ radiologist_user_id: userId, is_read: false }),
        base44.entities.RadiologistNotification.filter({ radiologist_user_id: userId }, "-datetime", 5),
      ]);
      setUnread(unreadItems.length);
      setRecent(latest);
    } catch (err) {
      console.error(err);
    }
  }, [userId]);

  useEffect(() => {
    load();
    const unsubscribe = base44.entities.RadiologistNotification.subscribe(() => load());
    return unsubscribe;
  }, [load]);

  const handleClick = async (n) => {
    setOpen(false);
    if (!n.is_read) {
      try {
        await base44.entities.RadiologistNotification.update(n.id, { is_read: true });
        load();
      } catch (err) {
        console.error(err);
      }
    }
    onNavigate(n.target);
  };

  const markAllRead = async () => {
    try {
      await base44.entities.RadiologistNotification.updateMany(
        { radiologist_user_id: userId, is_read: false },
        { $set: { is_read: true } }
      );
      load();
    } catch (err) {
      console.error(err);
    }
  };

  const timeAgo = (dt) => {
    if (!dt) return "";
    const d = new Date(dt);
    if (isNaN(d.getTime())) return "";
    const mins = Math.floor((Date.now() - d.getTime()) / 60000);
    if (mins < 1) return "just now";
    if (mins < 60) return `${mins}m ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h ago`;
    return d.toLocaleDateString();
  };

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="relative w-10 h-10 rounded-full border border-border bg-card flex items-center justify-center hover:bg-accent transition-colors"
        aria-label="Notifications"
      >
        <Bell className="w-5 h-5 text-muted-foreground" />
        {unread > 0 && (
          <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 rounded-full bg-destructive text-destructive-foreground text-[10px] font-bold flex items-center justify-center">
            {unread > 9 ? "9+" : unread}
          </span>
        )}
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="absolute right-0 mt-2 w-80 max-w-[calc(100vw-2rem)] rounded-xl border border-border bg-card shadow-lg z-50 overflow-hidden">
            <div className="flex items-center justify-between px-4 py-3 border-b border-border">
              <p className="text-sm font-semibold">Notifications</p>
              {unread > 0 && (
                <Button variant="ghost" size="sm" onClick={markAllRead}>
                  <CheckCheck className="w-4 h-4 mr-1" />
                  Mark all read
                </Button>
              )}
            </div>
            <div className="max-h-80 overflow-y-auto divide-y divide-border">
              {recent.length === 0 ? (
                <p className="px-4 py-6 text-sm text-muted-foreground text-center">No notifications yet</p>
              ) : (
                recent.map((n) => (
                  <button
                    key={n.id}
                    onClick={() => handleClick(n)}
                    className="w-full text-left px-4 py-3 hover:bg-accent/40 transition-colors flex gap-2"
                  >
                    <span
                      className={`mt-1.5 w-2 h-2 rounded-full shrink-0 ${
                        n.is_read ? "bg-transparent" : "bg-primary"
                      }`}
                    />
                    <span className="min-w-0">
                      <span className="text-sm font-medium block truncate">{n.title}</span>
                      <span className="text-xs text-muted-foreground block truncate">{n.message}</span>
                      <span className="text-[11px] text-muted-foreground mt-0.5 block">{timeAgo(n.datetime)}</span>
                    </span>
                  </button>
                ))
              )}
            </div>
            <button
              onClick={() => {
                setOpen(false);
                onOpenAll();
              }}
              className="w-full px-4 py-2.5 text-xs font-medium text-primary hover:bg-accent/40 border-t border-border"
            >
              View all notifications
            </button>
          </div>
        </>
      )}
    </div>
  );
}