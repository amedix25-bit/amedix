import React, { useCallback, useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Bell, Loader2, MessageSquarePlus, Search } from "lucide-react";
import ThreadListItem from "@/components/messaging/ThreadListItem";
import ConversationThread from "@/components/messaging/ConversationThread";
import NewConversationForm from "@/components/messaging/NewConversationForm";
import MessagingNotificationsPanel from "@/components/messaging/MessagingNotificationsPanel";
import HospitalConversationControls from "@/components/hospital/messaging/HospitalConversationControls";
import useMessagingRealtime from "@/hooks/useMessagingRealtime";
import { MESSAGING_CATEGORIES, THREAD_STATUS_META } from "@/lib/messaging";

// Hospital inbox: every conversation between this hospital and its affiliated
// doctors. Filters, search, unread state, assignment and status live here; all
// of it is enforced server-side per hospital.
export default function HospitalInbox({ actor, staff = [], departments = [], initialThread = null }) {
  const [threads, setThreads] = useState([]);
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState("all");
  const [category, setCategory] = useState("all");
  const [search, setSearch] = useState("");
  const [unreadOnly, setUnreadOnly] = useState(false);
  const [selected, setSelected] = useState(null);
  const [messages, setMessages] = useState([]);
  const [audit, setAudit] = useState([]);
  const [sending, setSending] = useState(false);
  const [busy, setBusy] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [doctors, setDoctors] = useState([]);
  const [error, setError] = useState("");

  const loadThreads = useCallback(async () => {
    setLoading(true);
    try {
      const res = await base44.functions.invoke("messagingApi", {
        action: "listThreads",
        status: status === "all" ? "" : status,
        category: category === "all" ? "" : category,
        search,
        unread_only: unreadOnly,
      });
      setThreads(res.data.threads || []);
    } catch (e) {
      setError(e?.response?.data?.error || "Conversations could not be loaded.");
    } finally {
      setLoading(false);
    }
  }, [status, category, search, unreadOnly]);

  useEffect(() => { loadThreads(); }, [loadThreads]);

  const openThread = useCallback(async (thread) => {
    setSelected(thread);
    setShowNew(false);
    try {
      const res = await base44.functions.invoke("messagingApi", { action: "thread", thread_id: thread.id, mark_read: true });
      setSelected(res.data.thread);
      setMessages(res.data.messages || []);
      setAudit(res.data.audit || []);
      setThreads((prev) => prev.map((t) => (t.id === thread.id ? { ...t, hospital_unread_count: 0 } : t)));
    } catch (e) {
      setError(e?.response?.data?.error || "This conversation could not be opened.");
    }
  }, []);

  useEffect(() => {
    if (initialThread) openThread(initialThread);
  }, [initialThread?.id, openThread]);

  const refresh = useCallback(() => {
    loadThreads();
    if (selected?.id) {
      base44.functions.invoke("messagingApi", { action: "thread", thread_id: selected.id, mark_read: true })
        .then((res) => { setSelected(res.data.thread); setMessages(res.data.messages || []); setAudit(res.data.audit || []); })
        .catch(() => {});
    }
  }, [loadThreads, selected?.id]);

  useMessagingRealtime(refresh);

  const send = async (text, attachments) => {
    if (!selected) return;
    setSending(true);
    setError("");
    try {
      await base44.functions.invoke("messagingApi", { action: "send", thread_id: selected.id, body: text, attachments });
      await openThread(selected);
      loadThreads();
    } catch (e) {
      setError(e?.response?.data?.error || "The reply could not be sent.");
    } finally {
      setSending(false);
    }
  };

  const updateThread = async (patch) => {
    if (!selected) return;
    setBusy(true);
    setError("");
    try {
      await base44.functions.invoke("messagingApi", { action: "updateThread", thread_id: selected.id, ...patch });
      await openThread(selected);
      loadThreads();
    } catch (e) {
      setError(e?.response?.data?.error || "The conversation could not be updated.");
    } finally {
      setBusy(false);
    }
  };

  const startNew = async () => {
    setShowNew(true);
    setSelected(null);
    if (doctors.length === 0) {
      try {
        const res = await base44.functions.invoke("messagingApi", { action: "directory" });
        setDoctors(res.data.doctors || []);
      } catch (e) {
        setError("The doctor directory could not be loaded.");
      }
    }
  };

  const unreadTotal = threads.reduce((sum, t) => sum + (t.hospital_unread_count || 0), 0);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        <div className="flex items-center gap-2">
          <h3 className="font-heading text-lg font-semibold">Doctor Communication Center</h3>
          {unreadTotal > 0 && (
            <span className="rounded-full bg-primary px-2 py-0.5 text-[11px] font-semibold text-primary-foreground">{unreadTotal} unread</span>
          )}
        </div>
        <div className="ml-auto flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => setShowNotifications((v) => !v)}>
            <Bell className="w-4 h-4" /> Notifications
          </Button>
          <Button size="sm" onClick={startNew}>
            <MessageSquarePlus className="w-4 h-4" /> New Conversation
          </Button>
        </div>
      </div>

      {error && <p className="rounded-lg border border-critical/30 bg-critical/5 px-3 py-2 text-xs text-critical">{error}</p>}

      {showNotifications && (
        <div className="flex justify-end">
          <MessagingNotificationsPanel onClose={() => setShowNotifications(false)} onOpenThread={() => loadThreads()} />
        </div>
      )}

      <div className="flex flex-wrap items-center gap-1.5">
        <button
          onClick={() => setStatus("all")}
          className={`rounded-full border px-3 py-1 text-xs font-medium ${status === "all" ? "border-primary bg-primary text-primary-foreground" : "border-border bg-card text-muted-foreground"}`}
        >
          All
        </button>
        {Object.entries(THREAD_STATUS_META).map(([key, meta]) => (
          <button
            key={key}
            onClick={() => setStatus(key)}
            className={`rounded-full border px-3 py-1 text-xs font-medium ${status === key ? meta.className : "border-border bg-card text-muted-foreground"}`}
          >
            {meta.label}
          </button>
        ))}
        <button
          onClick={() => setUnreadOnly((v) => !v)}
          className={`rounded-full border px-3 py-1 text-xs font-medium ${unreadOnly ? "border-primary bg-primary text-primary-foreground" : "border-border bg-card text-muted-foreground"}`}
        >
          Unread
        </button>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <div className="relative min-w-[180px] flex-1">
          <Search className="absolute left-2.5 top-2.5 w-4 h-4 text-muted-foreground" />
          <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search subject, doctor, staff or reference…" className="pl-8" />
        </div>
        <select value={category} onChange={(e) => setCategory(e.target.value)} className="h-9 rounded-md border border-input bg-transparent px-2 text-xs">
          <option value="all">All categories</option>
          {MESSAGING_CATEGORIES.map((c) => <option key={c.key} value={c.key}>{c.label}</option>)}
        </select>
      </div>

      <div className="grid gap-4 lg:grid-cols-[340px_1fr]">
        <div className={`min-h-[440px] overflow-hidden rounded-2xl border border-border bg-card ${selected || showNew ? "hidden lg:block" : ""}`}>
          <div className="max-h-[600px] overflow-y-auto">
            {loading && threads.length === 0 && (
              <div className="flex justify-center py-10"><Loader2 className="w-5 h-5 animate-spin text-primary" /></div>
            )}
            {!loading && threads.length === 0 && (
              <p className="px-4 py-10 text-center text-xs text-muted-foreground">No conversations match these filters.</p>
            )}
            {threads.map((t) => (
              <ThreadListItem key={t.id} thread={t} side="hospital" active={selected?.id === t.id} onClick={() => openThread(t)} />
            ))}
          </div>
        </div>

        <div className={`min-h-[440px] ${selected || showNew ? "" : "hidden lg:block"}`}>
          {showNew ? (
            <NewConversationForm
              mode="hospital"
              doctors={doctors}
              onClose={() => setShowNew(false)}
              onCreated={(thread) => { setShowNew(false); openThread(thread); loadThreads(); }}
            />
          ) : selected ? (
            <ConversationThread
              thread={selected}
              messages={messages}
              audit={audit}
              side="hospital"
              sending={sending}
              onSend={send}
              onBack={() => setSelected(null)}
              controls={
                selected.is_announcement ? null : (
                  <HospitalConversationControls
                    thread={selected}
                    staff={staff}
                    departments={departments}
                    actor={actor}
                    busy={busy}
                    onUpdate={updateThread}
                  />
                )
              }
            />
          ) : (
            <div className="flex h-full min-h-[440px] flex-col items-center justify-center rounded-2xl border border-dashed border-border bg-card p-6 text-center">
              <p className="text-sm font-medium">Select a conversation</p>
              <p className="mt-1 max-w-xs text-xs text-muted-foreground">
                Only conversations belonging to your hospital are ever shown here.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}