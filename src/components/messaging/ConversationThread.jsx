import React, { useEffect, useRef, useState } from "react";
import { ArrowLeft, ChevronDown, ChevronUp, Info, ShieldCheck } from "lucide-react";
import MessageBubble from "@/components/messaging/MessageBubble";
import MessageComposer from "@/components/messaging/MessageComposer";
import { useAppLanguage } from "@/lib/appLanguage";
import { categoryLabel, displayDoctor, patientMessageTypeLabel, THREAD_STATUS_META } from "@/lib/messaging";

// The conversation window. `oneWay` renders the doctor → patient channel: the
// composer is replaced by a notice, because a patient can never reply and the
// doctor writes from the patient screen. `counterpart` carries the resolved
// name / subtitle the server authorized for this viewer.
export default function ConversationThread({
  thread,
  messages,
  audit = [],
  side,
  onSend,
  onBack,
  controls,
  sending,
  oneWay = false,
  readOnly = false,
  counterpart,
  hospitalContact,
  composerPlaceholder,
  viewerUserId,
}) {
  const { t, isArabic } = useAppLanguage();
  const endRef = useRef(null);
  const [showAudit, setShowAudit] = useState(false);
  const status = THREAD_STATUS_META[thread.status] || THREAD_STATUS_META.pending;

  const title = counterpart?.name || (side === "doctor" ? thread.hospital_name : displayDoctor(thread.doctor_name));
  const subtitle = counterpart
    ? [counterpart.subtitle, counterpart.hospital].filter(Boolean).join(" · ")
    : [thread.doctor_specialization].filter(Boolean).join(" · ");

  useEffect(() => {
    endRef.current?.scrollIntoView({ block: "end" });
  }, [messages.length, thread.id]);

  return (
    <div className="flex h-full min-h-0 flex-col overflow-hidden rounded-2xl border border-border bg-card">
      <div className="border-b border-border px-4 py-3">
        <div className="flex items-start gap-2">
          <button onClick={onBack} className="mt-0.5 text-muted-foreground hover:text-foreground lg:hidden" title={t("Back")}>
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div className="min-w-0 flex-1">
            <h3 className="truncate font-heading text-sm font-semibold">{title}</h3>
            <p className="mt-0.5 truncate text-[11px] text-muted-foreground">
              {thread.channel === "doctor" || thread.channel === "patient" ? thread.subject : (thread.subject || title)}
              {subtitle ? ` · ${subtitle}` : ""}
              {thread.channel === "hospital" ? ` · ${t(categoryLabel(thread.category))}` : ""}
              {thread.patient_cin && thread.channel === "patient" ? ` · CIN ${thread.patient_cin}` : ""}
              {thread.thread_ref ? ` · ${thread.thread_ref}` : ""}
            </p>
          </div>
          {thread.channel !== "patient" && (
            <span className={`shrink-0 rounded border px-1.5 py-0.5 text-[10px] font-medium ${status.className}`}>{t(status.label)}</span>
          )}
        </div>
        {controls}
      </div>

      <div className="min-h-0 flex-1 space-y-3 overflow-y-auto p-4">
        {thread.is_announcement && (
          <div className="rounded-lg border border-primary/20 bg-primary/5 px-3 py-2 text-[11px] text-primary">
            {t("Hospital announcement")}{thread.target_department ? ` — ${thread.target_department}` : ` — ${t("all doctors")}`}.
          </div>
        )}
        {oneWay && (
          <div className="flex items-start gap-2 rounded-lg border border-success/30 bg-success/5 px-3 py-2 text-[11px] text-success">
            <Info className="mt-0.5 h-3.5 w-3.5 shrink-0" />
            <span>
              {t("One-way message: the patient can read these instructions and cannot reply here.")}
              {thread.patient_message_type ? ` ${t(patientMessageTypeLabel(thread.patient_message_type))}.` : ""}
            </span>
          </div>
        )}
        {messages.map((m) => (
          <MessageBubble
            key={m.id}
            message={m}
            threadId={thread.id}
            side={side}
            own={thread.channel === "doctor" ? m.sender_user_id === viewerUserId : m.sender_role === side}
            readByOther={m.read_by_counterpart}
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
            {t("Activity & access trail")} ({audit.length})
            {showAudit ? <ChevronUp className="ml-auto w-3.5 h-3.5" /> : <ChevronDown className="ml-auto w-3.5 h-3.5" />}
          </button>
          {showAudit && (
            <ul className="mt-2 max-h-40 space-y-1 overflow-y-auto pb-1">
              {audit.map((a) => (
                <li key={a.id} className="text-[11px] text-muted-foreground">
                  <span className="font-medium text-foreground">{a.actor_name}</span> {a.action_label}
                  {a.detail ? ` — ${a.detail}` : ""} · {new Date(a.datetime).toLocaleString(isArabic ? "ar" : undefined)}
                </li>
              ))}
            </ul>
          )}
        </div>
      )}

      {readOnly ? (
        <div className="border-t border-border bg-card p-3">
          <p className="text-[11px] text-muted-foreground">
            {t("This is a one-way message from your doctor. Replies are not available.")}
            {hospitalContact?.name
              ? ` ${t("For assistance, contact")} ${hospitalContact.name}${hospitalContact.phone ? ` — ${hospitalContact.phone}` : ""}.`
              : ""}
          </p>
        </div>
      ) : (
        <MessageComposer
          onSend={onSend}
          sending={sending}
          placeholder={composerPlaceholder || (oneWay ? `Send another message to ${title}…` : `Reply to ${title}…`)}
        />
      )}
    </div>
  );
}