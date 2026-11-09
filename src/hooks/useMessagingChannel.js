import { useCallback, useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";
import useMessagingRealtime from "@/hooks/useMessagingRealtime";

// One channel of the AMedix messaging system (doctors / hospitals / patients).
// Every read and write goes through the messagingApi function, which authorizes
// the conversation on the server — this hook only keeps the screen current.
export default function useMessagingChannel({ channel, enabled = true, search = "", unreadOnly = false, extra = {} }) {
  const [threads, setThreads] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState(null);
  const [messages, setMessages] = useState([]);
  const [audit, setAudit] = useState([]);
  const [threadMeta, setThreadMeta] = useState({});
  const [error, setError] = useState("");
  const [sending, setSending] = useState(false);
  const [reloadKey, setReloadKey] = useState(0);

  const extraKey = JSON.stringify(extra || {});

  const loadThreads = useCallback(async () => {
    if (!enabled) return;
    setLoading(true);
    try {
      const res = await base44.functions.invoke("messagingApi", {
        action: "listThreads",
        channel,
        search,
        unread_only: unreadOnly,
        ...(JSON.parse(extraKey) || {}),
      });
      setThreads(res.data.threads || []);
      setError("");
    } catch (e) {
      setError(e?.response?.data?.error || "Conversations could not be loaded.");
    } finally {
      setLoading(false);
    }
  }, [channel, enabled, search, unreadOnly, extraKey]);

  useEffect(() => { loadThreads(); }, [loadThreads]);

  const openThread = useCallback(async (thread) => {
    if (!thread) return;
    setSelected(thread);
    try {
      const res = await base44.functions.invoke("messagingApi", { action: "thread", thread_id: thread.id, mark_read: true });
      setMessages(res.data.messages || []);
      setAudit(res.data.audit || []);
      setThreadMeta({
        thread: res.data.thread || thread,
        counterpart: res.data.counterpart || null,
        one_way: res.data.one_way === true,
        hospital_contact: res.data.hospital_contact || null,
        actor: res.data.actor || null,
      });
      setThreads((prev) => prev.map((t) => (t.id === thread.id ? { ...t, viewer_unread: 0 } : t)));
      setError("");
    } catch (e) {
      setError(e?.response?.data?.error || "This conversation could not be opened.");
    }
  }, []);

  const refresh = useCallback(() => {
    loadThreads();
    if (selected?.id) {
      base44.functions
        .invoke("messagingApi", { action: "thread", thread_id: selected.id, mark_read: true })
        .then((res) => {
          setMessages(res.data.messages || []);
          setAudit(res.data.audit || []);
          setThreadMeta((prev) => ({
            ...prev,
            thread: res.data.thread || prev.thread,
            counterpart: res.data.counterpart || prev.counterpart,
            hospital_contact: res.data.hospital_contact || prev.hospital_contact,
          }));
        })
        .catch(() => {});
    }
  }, [loadThreads, selected?.id]);

  useMessagingRealtime(refresh);

  const send = useCallback(async (payload) => {
    setSending(true);
    setError("");
    try {
      const res = await base44.functions.invoke("messagingApi", {
        action: "send",
        channel,
        ...(selected?.id ? { thread_id: selected.id } : {}),
        ...(payload || {}),
      });
      const thread = res.data.thread;
      await openThread(thread);
      loadThreads();
      return thread;
    } catch (e) {
      setError(e?.response?.data?.error || "The message could not be sent.");
      return null;
    } finally {
      setSending(false);
    }
  }, [channel, selected?.id, openThread, loadThreads]);

  const clearSelection = () => {
    setSelected(null);
    setMessages([]);
    setAudit([]);
    setThreadMeta({});
  };

  return {
    threads,
    loading,
    selected,
    messages,
    audit,
    threadMeta,
    sending,
    error,
    setError,
    openThread,
    clearSelection,
    send,
    reload: () => setReloadKey((k) => k + 1),
    reloadKey,
    loadThreads,
  };
}