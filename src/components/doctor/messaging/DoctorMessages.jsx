import React, { useCallback, useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Loader2, MessageSquarePlus, Search } from "lucide-react";
import ThreadListItem from "@/components/messaging/ThreadListItem";
import ConversationThread from "@/components/messaging/ConversationThread";
import NewConversationForm from "@/components/messaging/NewConversationForm";
import MessagingNotificationBell from "@/components/messaging/MessagingNotificationBell";
import useMessagingRealtime from "@/hooks/useMessagingRealtime";
import { MESSAGING_CATEGORIES } from "@/lib/messaging";

// Doctor Portal → Messages. Only the doctor's own conversations with their
// affiliated hospitals are ever returned — the server scopes every query to
// the signed-in doctor, and each hospital keeps a separate space.
export default function DoctorMessages({ profile, hospitalSession }) {
  const [context, setContext] = useState(null);
  const [hospitalKey, setHospitalKey] = useState("");
  const [threads, setThreads] = useState([]);
  const [loading, setLoading] = useState(true);
  const [category, setCategory] = useState("all");
  const [search, setSearch] = useState("");
  const [unreadOnly, setUnreadOnly] = useState(false);
  const [selected, setSelected] = useState(null);
  const [messages, setMessages] = useState([]);
  const [audit, setAudit] = useState([]);
  const [sending, setSending] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await base44.functions.invoke("messagingApi", { action: "context" });
        if (cancelled) return;
        setContext(res.data);
        const hospitals = res.data.hospitals || [];
        const preferred = hospitals.find((h) => h.hospital_name === hospitalSession?.hospital_name);
        setHospitalKey((preferred || hospitals[0]) ? (preferred || hospitals[0]).hospital_user_id || (preferred || hospitals[0]).hospital_name : "");
      } catch (e) {
        if (!cancelled) setError(e?.response?.data?.error || "Messaging is unavailable for this account.");
      }
    })();
    return () => { cancelled = true; };
  }, [hospitalSession?.hospital_name]);

  const hospitals = context?.hospitals || [];
  const activeHospital = hospitals.find((h) => (h.hospital_user_id || h.hospital_name) === hospitalKey) || hospitals[0] || null;

  const loadThreads = useCallback(async () => {
    if (!context) return;
    setLoading(true);
    try {
      const res = await base44.functions.invoke("messagingApi", {
        action: "listThreads",
        category: category === "all" ? "" : category,
        search,
        unread_only: unreadOnly,
        hospital_user_id: activeHospital?.hospital_user_id || "",
        hospital_name: activeHospital?.hospital_user_id ? "" : activeHospital?.hospital_name || "",
      });
      setThreads(res.data.threads || []);
    } catch (e) {
      setError(e?.response?.data?.error || "Conversations could not be loaded.");
    } finally {
      setLoading(false);
    }
  }, [context, activeHospital?.hospital_user_id, activeHospital?.hospital_name, category, search, unreadOnly]);

  useEffect(() => { loadThreads(); }, [loadThreads]);

  const openThread = useCallback(async (thread) => {
    setSelected(thread);
    setShowNew(false);
    try {
      const res = await base44.functions.invoke("messagingApi", { action: "thread", thread_id: thread.id, mark_read: true });
      setMessages(res.data.messages || []);
      setAudit(res.data.audit || []);
      setThreads((prev) => prev.map((t) => (t.id === thread.id ? { ...t, doctor_unread_count: 0 } : t)));
    } catch (e) {
      setError(e?.response?.data?.error || "This conversation could not be opened.");
    }
  }, []);

  // A notification always opens the conversation it refers to, even when that
  // conversation is not in the current hospital or filter view.
  const openNotificationThread = async (threadId) => {
    const loaded = threads.find((t) => t.id === threadId);
    if (loaded) { openThread(loaded); return; }
    try {
      const res = await base44.functions.invoke("messagingApi", { action: "listThreads" });
      const found = (res.data.threads || []).find((t) => t.id === threadId);
      if (found) openThread(found);
      else loadThreads();
    } catch (e) {
      loadThreads();
    }
  };

  const refresh = useCallback(() => {
    loadThreads();
    if (selected?.id) {
      base44.functions
        .invoke("messagingApi", { action: "thread", thread_id: selected.id, mark_read: true })
        .then((res) => {
          setMessages(res.data.messages || []);
          setAudit(res.data.audit || []);
        })
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
      setError(e?.response?.data?.error || "The message could not be sent.");
    } finally {
      setSending(false);
    }
  };

  const unreadTotal = threads.reduce((sum, t) => sum + (t.doctor_unread_count || 0), 0);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        <div className="flex items-center gap-2">
          <h2 className="font-heading text-lg font-semibold">Hospital Messages</h2>
          {unreadTotal > 0 && (
            <span className="rounded-full bg-primary px-2 py-0.5 text-[11px] font-semibold text-primary-foreground">{unreadTotal} unread</span>
          )}
        </div>
        <div className="ml-auto flex items-center gap-2">
          <MessagingNotificationBell
            activeThreadId={selected?.id}
            onOpenThread={openNotificationThread}
          />
          <Button size="sm" onClick={() => { setShowNew(true); setSelected(null); }}>
            <MessageSquarePlus className="w-4 h-4" /> New Conversation
          </Button>
        </div>
      </div>

      {error && <p className="rounded-lg border border-critical/30 bg-critical/5 px-3 py-2 text-xs text-critical">{error}</p>}

      {hospitals.length > 1 && (
        <div className="flex flex-wrap gap-1.5">
          {hospitals.map((h) => {
            const key = h.hospital_user_id || h.hospital_name;
            return (
              <button
                key={key}
                onClick={() => { setHospitalKey(key); setSelected(null); setShowNew(false); }}
                className={`rounded-full border px-3 py-1 text-xs font-medium transition-colors ${
                  key === hospitalKey ? "border-primary bg-primary text-primary-foreground" : "border-border bg-card text-muted-foreground hover:bg-accent"
                }`}
              >
                {h.hospital_name}
              </button>
            );
          })}
        </div>
      )}

      <div className="flex flex-wrap items-center gap-2">
        <div className="relative min-w-[180px] flex-1">
          <Search className="absolute left-2.5 top-2.5 w-4 h-4 text-muted-foreground" />
          <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search conversations…" className="pl-8" />
        </div>
        <select value={category} onChange={(e) => setCategory(e.target.value)} className="h-9 rounded-md border border-input bg-transparent px-2 text-xs">
          <option value="all">All categories</option>
          {MESSAGING_CATEGORIES.map((c) => <option key={c.key} value={c.key}>{c.label}</option>)}
        </select>
        <button
          onClick={() => setUnreadOnly((v) => !v)}
          className={`h-9 rounded-md border px-2.5 text-xs font-medium ${unreadOnly ? "border-primary bg-primary text-primary-foreground" : "border-border text-muted-foreground"}`}
        >
          Unread only
        </button>
      </div>

      <div className="grid gap-4 lg:grid-cols-[320px_1fr]">
        <div className={`min-h-[420px] overflow-hidden rounded-2xl border border-border bg-card ${selected || showNew ? "hidden lg:block" : ""}`}>
          <div className="max-h-[560px] overflow-y-auto">
            {loading && threads.length === 0 && (
              <div className="flex justify-center py-10"><Loader2 className="w-5 h-5 animate-spin text-primary" /></div>
            )}
            {!loading && threads.length === 0 && (
              <p className="px-4 py-10 text-center text-xs text-muted-foreground">
                No conversations yet. Start one with {activeHospital?.hospital_name || "your hospital"}.
              </p>
            )}
            {threads.map((t) => (
              <ThreadListItem key={t.id} thread={t} side="doctor" active={selected?.id === t.id} onClick={() => openThread(t)} />
            ))}
          </div>
        </div>

        <div className={`min-h-[420px] ${selected || showNew ? "" : "hidden lg:block"}`}>
          {showNew ? (
            <NewConversationForm
              mode="doctor"
              hospitals={hospitals}
              onClose={() => setShowNew(false)}
              onCreated={(thread) => { setShowNew(false); setSelected(thread); openThread(thread); loadThreads(); }}
            />
          ) : selected ? (
            <ConversationThread
              thread={selected}
              messages={messages}
              audit={audit}
              side="doctor"
              sending={sending}
              onSend={send}
              onBack={() => setSelected(null)}
            />
          ) : (
            <div className="flex h-full min-h-[420px] flex-col items-center justify-center rounded-2xl border border-dashed border-border bg-card p-6 text-center">
              <p className="text-sm font-medium">Select a conversation</p>
              <p className="mt-1 max-w-xs text-xs text-muted-foreground">
                Messages are private to you and {activeHospital?.hospital_name || "your hospital"} administration.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}