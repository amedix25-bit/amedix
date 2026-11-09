import React, { useCallback, useEffect, useState } from "react";
import { Loader2, MessageSquarePlus, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import ThreadListItem from "@/components/messaging/ThreadListItem";
import ConversationThread from "@/components/messaging/ConversationThread";
import NewConversationForm from "@/components/messaging/NewConversationForm";
import MessagingNotificationBell from "@/components/messaging/MessagingNotificationBell";
import useMessagingChannel from "@/hooks/useMessagingChannel";
import { MESSAGING_CATEGORIES } from "@/lib/messaging";

// Doctor ↔ hospital channel — the existing hospital messaging, unchanged in
// behaviour: only the doctor's own conversations with their affiliated
// hospitals are ever returned, and each hospital keeps a separate space.
export default function HospitalsChannel({ hospitals = [], hospitalSession }) {
  const [hospitalKey, setHospitalKey] = useState("");
  const [category, setCategory] = useState("all");
  const [search, setSearch] = useState("");
  const [unreadOnly, setUnreadOnly] = useState(false);
  const [showNew, setShowNew] = useState(false);

  const activeHospital = hospitals.find((h) => (h.hospital_user_id || h.hospital_name) === hospitalKey) || hospitals[0] || null;

  useEffect(() => {
    if (!hospitalKey && hospitals.length > 0) {
      const preferred = hospitals.find((h) => h.hospital_name === hospitalSession?.hospital_name);
      const chosen = preferred || hospitals[0];
      setHospitalKey(chosen.hospital_user_id || chosen.hospital_name || "");
    }
  }, [hospitals, hospitalKey, hospitalSession?.hospital_name]);

  const channel = useMessagingChannel({
    channel: "hospital",
    search,
    unreadOnly,
    extra: {
      category: category === "all" ? "" : category,
      hospital_user_id: activeHospital?.hospital_user_id || "",
      hospital_name: activeHospital?.hospital_user_id ? "" : activeHospital?.hospital_name || "",
    },
  });

  const openNotificationThread = useCallback(
    (threadId) => {
      const loaded = channel.threads.find((t) => t.id === threadId);
      if (loaded) { channel.openThread(loaded); return; }
      channel.openThread({ id: threadId });
    },
    [channel]
  );

  const unreadTotal = channel.threads.reduce((sum, t) => sum + (t.viewer_unread || 0), 0);

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-2">
        <div className="flex items-center gap-2">
          <h2 className="font-heading text-base font-semibold">Hospital Messages</h2>
          {unreadTotal > 0 && (
            <span className="rounded-full bg-primary px-2 py-0.5 text-[11px] font-semibold text-primary-foreground">{unreadTotal} unread</span>
          )}
        </div>
        <div className="ml-auto flex items-center gap-2">
          <MessagingNotificationBell activeThreadId={channel.selected?.id} onOpenThread={openNotificationThread} />
          <Button size="sm" onClick={() => { setShowNew(true); channel.clearSelection(); }}>
            <MessageSquarePlus className="w-4 h-4" /> New Conversation
          </Button>
        </div>
      </div>

      {channel.error && <p className="rounded-lg border border-critical/30 bg-critical/5 px-3 py-2 text-xs text-critical">{channel.error}</p>}

      {hospitals.length > 1 && (
        <div className="flex flex-wrap gap-1.5">
          {hospitals.map((h) => {
            const key = h.hospital_user_id || h.hospital_name;
            return (
              <button
                key={key}
                onClick={() => { setHospitalKey(key); channel.clearSelection(); setShowNew(false); }}
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
        <div className={`min-h-[420px] overflow-hidden rounded-2xl border border-border bg-card ${channel.selected || showNew ? "hidden lg:block" : ""}`}>
          <div className="max-h-[560px] overflow-y-auto">
            {channel.loading && channel.threads.length === 0 && (
              <div className="flex justify-center py-10"><Loader2 className="w-5 h-5 animate-spin text-primary" /></div>
            )}
            {!channel.loading && channel.threads.length === 0 && (
              <p className="px-4 py-10 text-center text-xs text-muted-foreground">
                No conversations yet. Start one with {activeHospital?.hospital_name || "your hospital"}.
              </p>
            )}
            {channel.threads.map((t) => (
              <ThreadListItem key={t.id} thread={t} side="doctor" active={channel.selected?.id === t.id} onClick={() => { setShowNew(false); channel.openThread(t); }} />
            ))}
          </div>
        </div>

        <div className={`min-h-[420px] ${channel.selected || showNew ? "" : "hidden lg:block"}`}>
          {showNew ? (
            <NewConversationForm
              mode="doctor"
              hospitals={hospitals}
              onClose={() => setShowNew(false)}
              onCreated={(thread) => { setShowNew(false); channel.openThread(thread); }}
            />
          ) : channel.selected ? (
            <ConversationThread
              thread={channel.selected}
              messages={channel.messages}
              audit={channel.audit}
              side="doctor"
              sending={channel.sending}
              onSend={(text, attachments) => channel.send({ body: text, attachments })}
              onBack={channel.clearSelection}
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