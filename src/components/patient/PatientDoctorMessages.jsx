import React from "react";
import { Loader2, MessageSquare, ShieldAlert } from "lucide-react";
import ConversationThread from "@/components/messaging/ConversationThread";
import ThreadListItem from "@/components/messaging/ThreadListItem";
import useMessagingChannel from "@/hooks/useMessagingChannel";
import { useAuth } from "@/lib/AuthContext";
import { patientMessageTypeLabel } from "@/lib/messaging";

// Patient Portal → Messages from Doctors. Strictly read-only: there is no
// composer and no way to start a conversation. The patient reads what their
// treating doctors sent, with the doctor's name, specialty and hospital.
export default function PatientDoctorMessages({ profile }) {
  const { user } = useAuth();
  const channel = useMessagingChannel({ channel: "patient" });
  const threads = channel.threads;
  const unreadTotal = threads.reduce((sum, t) => sum + (t.viewer_unread || 0), 0);

  if (channel.loading && threads.length === 0) {
    return (
      <div className="flex justify-center py-16">
        <Loader2 className="w-5 h-5 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div>
        <h2 className="font-heading text-base font-semibold">Messages from Doctors</h2>
        <p className="text-[11px] text-muted-foreground">
          One-way messages sent to you by your treating doctors
          {unreadTotal > 0 ? ` · ${unreadTotal} unread` : ""}
        </p>
      </div>

      <div className="flex items-start gap-2 rounded-lg border border-border bg-muted/40 px-3 py-2 text-[11px] text-muted-foreground">
        <ShieldAlert className="mt-0.5 h-3.5 w-3.5 shrink-0" />
        <span>
          This is a one-way message channel. Replies are not available and messages cannot be edited.
          For anything urgent, contact your hospital or your doctor's clinic directly — this is not an emergency service.
        </span>
      </div>

      {channel.error && (
        <p className="rounded-lg border border-critical/30 bg-critical/5 px-3 py-2 text-xs text-critical">{channel.error}</p>
      )}

      {threads.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border bg-card px-6 py-14 text-center">
          <MessageSquare className="mx-auto mb-3 h-8 w-8 text-muted-foreground/40" />
          <p className="text-sm font-medium">No messages from your doctors yet</p>
          <p className="mt-1 text-xs text-muted-foreground">
            When a doctor sends you instructions or a follow-up, it will appear here{profile?.full_name ? `, ${profile.full_name.split(" ")[0]}` : ""}.
          </p>
        </div>
      ) : (
        <div className="grid gap-4 lg:grid-cols-[320px_1fr]">
          <div className={`overflow-hidden rounded-2xl border border-border bg-card ${channel.selected ? "hidden lg:block" : ""}`}>
            <div className="max-h-[560px] overflow-y-auto">
              {threads.map((t) => (
                <ThreadListItem
                  key={t.id}
                  thread={{ ...t, channel: "patient" }}
                  side="patient"
                  active={channel.selected?.id === t.id}
                  title={t.counterpart_name}
                  subtitle={[t.counterpart_subtitle, patientMessageTypeLabel(t.patient_message_type)].filter(Boolean).join(" · ")}
                  unread={t.viewer_unread || 0}
                  onClick={() => channel.openThread(t)}
                />
              ))}
            </div>
          </div>

          <div className={`min-h-[420px] ${channel.selected ? "" : "hidden lg:block"}`}>
            {channel.selected ? (
              <ConversationThread
                thread={channel.threadMeta.thread || channel.selected}
                messages={channel.messages}
                audit={[]}
                side="patient"
                oneWay
                readOnly
                viewerUserId={user?.id}
                counterpart={channel.threadMeta.counterpart}
                hospitalContact={channel.threadMeta.hospital_contact}
                onBack={channel.clearSelection}
              />
            ) : (
              <div className="flex h-full min-h-[420px] flex-col items-center justify-center rounded-2xl border border-dashed border-border bg-card p-6 text-center">
                <p className="text-sm font-medium">Select a message</p>
                <p className="mt-1 max-w-xs text-xs text-muted-foreground">
                  You will see the doctor's name, specialty, hospital and the date and time of each message.
                </p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}