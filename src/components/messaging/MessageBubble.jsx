import React, { useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";
import { Paperclip, Download, AlertTriangle } from "lucide-react";
import { formatMessageTime, initials } from "@/lib/messaging";

function AttachmentRow({ attachment, threadId }) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const open = async () => {
    setBusy(true);
    setError("");
    try {
      const res = await base44.functions.invoke("messagingApi", {
        action: "attachmentUrl",
        thread_id: threadId,
        file_uri: attachment.file_uri,
      });
      if (res.data?.signed_url) window.open(res.data.signed_url, "_blank", "noopener");
      else setError("Not available");
    } catch (e) {
      setError("Access denied");
    } finally {
      setBusy(false);
    }
  };

  return (
    <button
      onClick={open}
      disabled={busy}
      className="mt-2 flex w-full items-center gap-2 rounded-lg border border-border bg-background/60 px-2.5 py-2 text-left text-xs hover:bg-accent transition-colors"
    >
      <Paperclip className="w-3.5 h-3.5 shrink-0 text-muted-foreground" />
      <span className="min-w-0 flex-1 truncate">{attachment.file_name}</span>
      {error ? (
        <span className="flex items-center gap-1 text-critical">
          <AlertTriangle className="w-3 h-3" /> {error}
        </span>
      ) : (
        <Download className="w-3.5 h-3.5 shrink-0 text-muted-foreground" />
      )}
    </button>
  );
}

export default function MessageBubble({ message, own, side, threadId }) {
  const isSystem = message.kind === "system";
  const readByOther = side === "doctor" ? message.read_by_hospital : message.read_by_doctor;

  if (isSystem) {
    return (
      <div className="flex justify-center py-1">
        <p className="rounded-full bg-muted px-3 py-1 text-[11px] text-muted-foreground text-center">
          {message.sender_name} — {message.body} · {formatMessageTime(message.datetime)}
        </p>
      </div>
    );
  }

  return (
    <div className={`flex gap-2 ${own ? "justify-end" : "justify-start"}`}>
      {!own && (
        <span className="mt-1 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-accent text-[10px] font-semibold text-accent-foreground">
          {initials(message.sender_name)}
        </span>
      )}
      <div className={`max-w-[85%] sm:max-w-[75%] ${own ? "items-end" : "items-start"} flex flex-col`}>
        {!own && (
          <p className="mb-0.5 text-[11px] font-medium text-muted-foreground">
            {message.sender_name}
            {message.sender_title ? ` · ${message.sender_title}` : ""}
          </p>
        )}
        {message.kind === "correction" && (
          <span className="mb-1 rounded bg-warning/10 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-warning">
            Correction
          </span>
        )}
        {message.kind === "announcement" && (
          <span className="mb-1 rounded bg-primary/10 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-primary">
            Announcement
          </span>
        )}
        <div
          className={`rounded-2xl px-3.5 py-2.5 text-sm whitespace-pre-wrap break-words ${
            own ? "bg-primary text-primary-foreground rounded-br-sm" : "bg-card text-card-foreground border border-border rounded-bl-sm"
          }`}
        >
          {message.body}
          {(message.attachments || []).map((a, i) => (
            <AttachmentRow key={`${a.file_uri}-${i}`} attachment={a} threadId={threadId} />
          ))}
        </div>
        <p className="mt-1 text-[10px] text-muted-foreground">
          {formatMessageTime(message.datetime)}
          {own ? (readByOther ? " · Read" : " · Delivered") : ""}
        </p>
      </div>
    </div>
  );
}