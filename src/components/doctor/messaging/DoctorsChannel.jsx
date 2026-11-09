import React, { useCallback, useState } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Loader2, MessageSquarePlus, Search, ShieldCheck } from "lucide-react";
import ThreadListItem from "@/components/messaging/ThreadListItem";
import ConversationThread from "@/components/messaging/ConversationThread";
import MessagingNotificationBell from "@/components/messaging/MessagingNotificationBell";
import NewDoctorMessage from "@/components/doctor/messaging/NewDoctorMessage";
import useMessagingChannel from "@/hooks/useMessagingChannel";
import { useAuth } from "@/lib/AuthContext";

// Doctor ↔ doctor: two-way private messaging between verified doctors, across
// hospitals. The server verifies both accounts on every conversation.
export default function DoctorsChannel({ profile }) {
  const { user } = useAuth();
  const [search, setSearch] = useState("");
  const [unreadOnly, setUnreadOnly] = useState(false);
  const [showNew, setShowNew] = useState(false);

  const channel = useMessagingChannel({ channel: "doctor", search, unreadOnly });
  const verified = profile?.is_verified === true;

  const openNotificationThread = useCallback(
    (threadId) => {
      const loaded = channel.threads.find((t) => t.id === threadId);
      if (loaded) { channel.openThread(loaded); return; }
      channel.openThread({ id: threadId });
    },
    [channel]
  );

  const unreadTotal = channel.threads.reduce((sum, t) => sum + (t.viewer_unread || 0), 0);

  if (!verified) {
    return (
      <div className="rounded-2xl border border-warning/30 bg-warning/5 p-5">
        <p className="flex items-center gap-2 text-sm font-semibold text-warning">
          <ShieldCheck className="w-4 h-4" /> Verification required
        </p>
        <p className="mt-1 text-xs text-muted-foreground">
          Doctor-to-doctor messaging is available to verified doctors only. Your account is still awaiting verification.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-2">
        <div className="flex items-center gap-2">
          <h2 className="font-heading text-base font-semibold">Doctor Messages</h2>
          {unreadTotal > 0 && (
            <span className="rounded-full bg-primary px-2 py-0.5 text-[11px] font-semibold text-primary-foreground">{unreadTotal} unread</span>
          )}
        </div>
        <div className="ml-auto flex items-center gap-2">
          <MessagingNotificationBell activeThreadId={channel.selected?.id} onOpenThread={openNotificationThread} />
          <Button size="sm" onClick={() => { setShowNew(true); channel.clearSelection(); }}>
            <MessageSquarePlus className="w-4 h-4" /> New Message
          </Button>
        </div>
      </div>

      {channel.error && <p className="rounded-lg border border-critical/30 bg-critical/5 px-3 py-2 text-xs text-critical">{channel.error}</p>}

      <div className="flex flex-wrap items-center gap-2">
        <div className="relative min-w-[180px] flex-1">
          <Search className="absolute left-2.5 top-2.5 w-4 h-4 text-muted-foreground" />
          <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search colleagues or conversations…" className="pl-8" />
        </div>
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
                No colleague conversations yet. Start a private message with a verified doctor.
              </p>
            )}
            {channel.threads.map((t) => (
              <ThreadListItem
                key={t.id}
                thread={t}
                side="doctor"
                active={channel.selected?.id === t.id}
                title={t.counterpart_name}
                subtitle={t.counterpart_subtitle}
                unread={t.viewer_unread || 0}
                onClick={() => { setShowNew(false); channel.openThread(t); }}
              />
            ))}
          </div>
        </div>

        <div className={`min-h-[420px] ${channel.selected || showNew ? "" : "hidden lg:block"}`}>
          {showNew ? (
            <NewDoctorMessage
              onClose={() => setShowNew(false)}
              onSent={(thread) => { setShowNew(false); channel.openThread(thread); }}
            />
          ) : channel.selected ? (
            <ConversationThread
              thread={channel.threadMeta.thread || channel.selected}
              messages={channel.messages}
              audit={channel.audit}
              side="doctor"
              viewerUserId={user?.id}
              counterpart={channel.threadMeta.counterpart}
              sending={channel.sending}
              onSend={(text, attachments) => channel.send({ body: text, attachments })}
              onBack={channel.clearSelection}
            />
          ) : (
            <div className="flex h-full min-h-[420px] flex-col items-center justify-center rounded-2xl border border-dashed border-border bg-card p-6 text-center">
              <p className="text-sm font-medium">Select a conversation</p>
              <p className="mt-1 max-w-xs text-xs text-muted-foreground">
                Private conversations between verified AMedix doctors. Sharing patient information requires the patient's own authorization.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}