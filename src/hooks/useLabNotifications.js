import { useState, useEffect, useCallback } from "react";
import { base44 } from "@/api/base44Client";
import { useAuth } from "@/lib/AuthContext";

const POLL_MS = 30000;

// Lab notifications for both portals. With a technician session, requests go through
// the secure labNotifications backend function; without one (Lab Portal), it reads
// the LabNotification entity directly and subscribes for live updates.
export function useLabNotifications({ session } = {}) {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState(null);

  const load = useCallback(async () => {
    try {
      if (session) {
        const res = await base44.functions.invoke("labNotifications", {
          technician_id: session.technician_id,
          session_token: session.session_token,
        });
        setNotifications(res.data.notifications || []);
      } else if (user) {
        const items = await base44.entities.LabNotification.filter(
          { lab_user_id: user.id },
          "-created_date",
          100
        );
        setNotifications(items);
      }
    } catch (err) {
      console.error(err);
    }
  }, [session, user]);

  useEffect(() => {
    load();
    if (session) {
      const timer = setInterval(() => load(), POLL_MS);
      return () => clearInterval(timer);
    }
    const unsubscribe = base44.entities.LabNotification.subscribe(() => load());
    return unsubscribe;
  }, [load]);

  const markRead = useCallback(
    async (id) => {
      setNotifications((prev) =>
        prev ? prev.map((n) => (n.id === id ? { ...n, is_read: true } : n)) : prev
      );
      try {
        if (session) {
          await base44.functions.invoke("labNotifications", {
            technician_id: session.technician_id,
            session_token: session.session_token,
            action: "mark_read",
            id,
          });
        } else {
          await base44.entities.LabNotification.update(id, {
            is_read: true,
            read_at: new Date().toISOString(),
          });
        }
      } catch (err) {
        console.error(err);
      }
    },
    [session]
  );

  const markAllRead = useCallback(async () => {
    setNotifications((prev) => (prev ? prev.map((n) => ({ ...n, is_read: true })) : prev));
    try {
      if (session) {
        await base44.functions.invoke("labNotifications", {
          technician_id: session.technician_id,
          session_token: session.session_token,
          action: "mark_all_read",
        });
      } else {
        await base44.entities.LabNotification.updateMany(
          { lab_user_id: user.id, is_read: false },
          { $set: { is_read: true, read_at: new Date().toISOString() } }
        );
      }
    } catch (err) {
      console.error(err);
    }
  }, [session, user]);

  const unreadCount = (notifications || []).filter((n) => !n.is_read).length;

  return { notifications, unreadCount, markRead, markAllRead, refresh: load };
}