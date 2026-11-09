import { useCallback, useEffect, useRef, useState } from "react";
import { base44 } from "@/api/base44Client";

// Live messaging notifications for the signed-in account. The server decides
// who may be notified; this hook only keeps the bell current — a subscription
// to the account's own notification records, with a light poll as a safety net
// for devices where the socket is unavailable.
export default function useMessagingNotifications({ enabled = true, onNew } = {}) {
  const [items, setItems] = useState([]);
  const [unread, setUnread] = useState(0);
  const known = useRef(null);
  const onNewRef = useRef(onNew);
  onNewRef.current = onNew;

  const load = useCallback(async () => {
    if (!enabled) return;
    try {
      const res = await base44.functions.invoke("messagingApi", { action: "notifications" });
      const list = res.data.notifications || [];
      setItems(list);
      // The server counts unread messages across every channel (doctors,
      // hospitals, patients), so the sidebar badge reflects all messaging.
      const summary = res.data.unread || {};
      setUnread(
        typeof summary.messages_unread === "number"
          ? Math.max(summary.messages_unread, summary.notifications_unread || 0)
          : list.filter((n) => !n.is_read).length
      );
      const previous = known.current;
      known.current = new Set(list.map((n) => n.id));
      if (previous) {
        const fresh = list.filter((n) => !n.is_read && !previous.has(n.id));
        if (fresh.length > 0 && onNewRef.current) onNewRef.current(fresh);
      }
    } catch (e) {
      // A messaging account is always authorized; a transient failure simply
      // leaves the last known list in place.
    }
  }, [enabled]);

  useEffect(() => { load(); }, [load]);

  useEffect(() => {
    if (!enabled) return undefined;
    let unsubscribe = null;
    try {
      unsubscribe = base44.entities.MessageNotification.subscribe(() => load());
    } catch (e) {
      // subscription unavailable — the poll below still delivers
    }
    const poll = setInterval(() => load(), 25000);
    return () => {
      try { unsubscribe && unsubscribe(); } catch (e) { /* ignored */ }
      clearInterval(poll);
    };
  }, [enabled, load]);

  const markRead = useCallback(async (id) => {
    setItems((prev) => prev.map((n) => (n.id === id ? { ...n, is_read: true } : n)));
    setUnread((prev) => Math.max(0, prev - 1));
    try {
      await base44.functions.invoke("messagingApi", { action: "markNotificationsRead", ids: [id] });
    } catch (e) { /* the next refresh reconciles the count */ }
  }, []);

  const markAll = useCallback(async () => {
    setItems((prev) => prev.map((n) => ({ ...n, is_read: true })));
    setUnread(0);
    try {
      await base44.functions.invoke("messagingApi", { action: "markNotificationsRead" });
    } catch (e) { /* the next refresh reconciles the count */ }
  }, []);

  return { items, unread, load, markRead, markAll };
}