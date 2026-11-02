import React, { useEffect, useRef, useState } from "react";
import { ArrowLeft, ChevronDown, ChevronUp, ShieldCheck } from "lucide-react";
import MessageBubble from "@/components/messaging/MessageBubble";
import MessageComposer from "@/components/messaging/MessageComposer";
import { categoryLabel, displayDoctor, THREAD_STATUS_META } from "@/lib/messaging";

export default function ConversationThread({ thread, messages, audit = [], side, onSend, onBack, controls, sending }) {
  const endRef = useRef(null);
  const [showAudit, setShowAudit] = useState(false);
  const status = THREAD_STATUS_META[thread.status] || THREAD_STATUS_META.pending;

  useEffect(() => {
    endRef.current?.scrollIntoView({ block: "end" });
  }, [messages.length, thread.id]);

  return (
    <div className="flex h-full min-h-0 flex-col overflow-hidden rounded-2xl border border-border bg-card">
      <div className="border-b border-border px-4 py-3">
        <div className="flex items-start gap-2">
          <button onClick={onBack} className="mt-0.5 text-muted-foreground hover:text-foreground lg:hidden" title="Back">
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div className="min-w-0 flex-1">
            <h3 className="truncate font-heading text-sm font-semibold">{thread.subject}</h3>
            <p className="mt-0.5 truncate text-[11px] text-muted-foreground">
              {side === "doctor" ? thread.hospital_name : displayDoctor(thread.doctor_name)}
              {thread.doctor_specialization ? ` · ${thread.doctor_specialization}` : ""}
              {" · "}{categoryLabel(thread.category)}
              {thread.thread_ref ? ` · ${thread.thread_ref}` : ""}
            </p>
          </div>
          <span className={`shrink-0 rounded border px-1.5 py-0.5 text-[10px] font-medium ${status.className}`}>{status.label}</span>
        </div>
        {controls}
      </div>

      <div className="min-h-0 flex-1 space-y-3 overflow-y-auto p-4">
        {thread.is_announcement && (
          <div className="rounded-lg border border-primary/20 bg-primary/5 px-3 py-2 text-[11px] text-primary">
            Hospital announcement{thread.target_department ? ` — ${thread.target_department}` : " — all doctors"}.
          </div>
        )}
        {messages.map((m) => (
          <MessageBubble
            key={m.id}
            message={m}
            threadId={thread.id}
            side={side}
            own={m.sender_role === side}
          />
        ))}
        <div ref={endRef} />
      </div>

      {audit.length > 0 && (
        <div className="border-t border-border bg-muted/30 px-4 py-2">
          <button
            onClick={() => setShowAudit((v) => !v)}
            className="flex w-full items-center gap-1.5 text-[11px] font-medium text-muted-foreground hover:text-foreground"
          >
            <ShieldCheck className="w-3.5 h-3.5" />
            Activity & access trail ({audit.length})
            {showAudit ? <ChevronUp className="ml-auto w-3.5 h-3.5" /> : <ChevronDown className="ml-auto w-3.5 h-3.5" />}
          </button>
          {showAudit && (
            <ul className="mt-2 max-h-40 space-y-1 overflow-y-auto pb-1">
              {audit.map((a) => (
                <li key={a.id} className="text-[11px] text-muted-foreground">
                  <span className="font-medium text-foreground">{a.actor_name}</span> {a.action_label}
                  {a.detail ? ` — ${a.detail}` : ""} · {new Date(a.datetime).toLocaleString()}
                </li>
              ))}
            </ul>
          )}
        </div>
      )}

      <MessageComposer onSend={onSend} sending={sending} placeholder={`Reply to ${side === "doctor" ? thread.hospital_name : displayDoctor(thread.doctor_name)}…`} />
    </div>
  );
}