import React, { useState, useEffect, useCallback } from "react";
import { base44 } from "@/api/base44Client";
import { Bell, CheckCheck, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";

// Radiologist Portal → Notifications section (side navigation).
// Clicking a notification marks it read and opens the relevant patient view.
export default function RadiologistNotifications({ userId, onNavigate }) {
  const [items, setItems] = useState(null);

  const load = useCallback(async () => {
    try {
      const list = await base44.entities.RadiologistNotification.filter(
        { radiologist_user_id: userId },
        "-datetime",
        50
      );
      setItems(list);
    } catch (err) {
      console.error(err);
      setItems([]);
    }
  }, [userId]);

  useEffect(() => {
    load();
    const unsubscribe = base44.entities.RadiologistNotification.subscribe(() => load());
    return unsubscribe;
  }, [load]);

  const handleClick = async (n) => {
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

  const formatDateTime = (dt) => {
    if (!dt) return "—";
    const d = new Date(dt);
    return isNaN(d.getTime()) ? String(dt) : d.toLocaleString();
  };

  const unreadCount = (items || []).filter((n) => !n.is_read).length;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          {unreadCount > 0 ? `${unreadCount} unread notification${unreadCount !== 1 ? "s" : ""}` : "You're all caught up"}
        </p>
        {unreadCount > 0 && (
          <Button variant="outline" size="sm" onClick={markAllRead}>
            <CheckCheck className="w-4 h-4 mr-1" />
            Mark all read
          </Button>
        )}
      </div>

      {items === null ? (
        <div className="flex items-center text-muted-foreground text-sm py-8">
          <Loader2 className="w-4 h-4 mr-2 animate-spin" /> Loading...
        </div>
      ) : items.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground border border-dashed border-border rounded-2xl">
          <Bell className="w-12 h-12 mx-auto mb-3 opacity-30" />
          <p>No notifications yet</p>
          <p className="text-xs mt-1">
            You'll be notified when a patient grants, suspends or removes your access.
          </p>
        </div>
      ) : (
        <div className="rounded-xl border border-border bg-card divide-y divide-border overflow-hidden">
          {items.map((n) => (
            <button
              key={n.id}
              onClick={() => handleClick(n)}
              className="w-full text-left p-4 hover:bg-accent/30 transition-colors flex gap-3"
            >
              <span className={`mt-1.5 w-2 h-2 rounded-full shrink-0 ${n.is_read ? "bg-transparent" : "bg-primary"}`} />
              <span className="min-w-0 flex-1">
                <span className="text-sm font-medium">{n.title}</span>
                <span className="text-sm text-muted-foreground block mt-0.5">{n.message}</span>
                <span className="text-xs text-muted-foreground mt-1 block">{formatDateTime(n.datetime)}</span>
              </span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}