import { useState, useEffect, useCallback } from "react";
import { base44 } from "@/api/base44Client";
import { useAuth } from "@/lib/AuthContext";

const POLL_MS = 30000;

// Pharmacy Portal notifications. Reads the PharmacyNotification entity directly
// (RLS scopes it to the pharmacy account) and subscribes for live updates.
export function usePharmacyNotifications() {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState(null);

  const load = useCallback(async () => {
    if (!user) return;
    try {
      const items = await base44.entities.PharmacyNotification.filter(
        { pharmacy_user_id: user.id },
        "-created_date",
        100
      );
      setNotifications(items);
    } catch (err) {
      console.error(err);
    }
  }, [user]);

  useEffect(() => {
    load();
    const unsubscribe = base44.entities.PharmacyNotification.subscribe(() => load());
    return unsubscribe;
  }, [load]);

  const markRead = useCallback(async (id) => {
    setNotifications((prev) =>
      prev ? prev.map((n) => (n.id === id ? { ...n, is_read: true } : n)) : prev
    );
    try {
      await base44.entities.PharmacyNotification.update(id, {
        is_read: true,
        read_at: new Date().toISOString(),
      });
    } catch (err) {
      console.error(err);
    }
  }, []);

  const markAllRead = useCallback(async () => {
    setNotifications((prev) => (prev ? prev.map((n) => ({ ...n, is_read: true })) : prev));
    try {
      await base44.entities.PharmacyNotification.updateMany(
        { pharmacy_user_id: user.id, is_read: false },
        { $set: { is_read: true, read_at: new Date().toISOString() } }
      );
    } catch (err) {
      console.error(err);
    }
  }, [user]);

  const unreadCount = (notifications || []).filter((n) => !n.is_read).length;

  return { notifications, unreadCount, markRead, markAllRead, refresh: load };
}