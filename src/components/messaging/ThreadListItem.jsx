import React from "react";
import { categoryLabel, THREAD_STATUS_META, formatMessageTime, displayDoctor } from "@/lib/messaging";

export default function ThreadListItem({ thread, side, active, onClick }) {
  const unread = side === "doctor" ? thread.doctor_unread_count || 0 : thread.hospital_unread_count || 0;
  const status = THREAD_STATUS_META[thread.status] || THREAD_STATUS_META.pending;
  const title = side === "doctor" ? thread.hospital_name : displayDoctor(thread.doctor_name);

  return (
    <button
      onClick={onClick}
      className={`w-full border-b border-border px-3.5 py-3 text-left transition-colors ${
        active ? "bg-accent" : "hover:bg-muted/60"
      }`}
    >
      <div className="flex items-start justify-between gap-2">
        <p className={`min-w-0 flex-1 truncate text-sm ${unread > 0 ? "font-semibold" : "font-medium"}`}>
          {thread.subject}
        </p>
        <span className="shrink-0 text-[10px] text-muted-foreground">{formatMessageTime(thread.last_activity_datetime)}</span>
      </div>
      <p className="mt-0.5 truncate text-xs text-muted-foreground">
        {title}
        {thread.doctor_specialization && side === "hospital" ? ` · ${thread.doctor_specialization}` : ""}
      </p>
      <p className="mt-1 truncate text-xs text-muted-foreground">{thread.last_message_preview || "No messages yet"}</p>
      <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
        <span className="rounded border border-border bg-background px-1.5 py-0.5 text-[10px] text-muted-foreground">
          {categoryLabel(thread.category)}
        </span>
        {!thread.is_announcement && (
          <span className={`rounded border px-1.5 py-0.5 text-[10px] font-medium ${status.className}`}>{status.label}</span>
        )}
        {thread.is_announcement && (
          <span className="rounded border border-primary/30 bg-primary/10 px-1.5 py-0.5 text-[10px] font-medium text-primary">Announcement</span>
        )}
        {unread > 0 && (
          <span className="ml-auto rounded-full bg-primary px-1.5 py-0.5 text-[10px] font-semibold text-primary-foreground">
            {unread}
          </span>
        )}
      </div>
    </button>
  );
}