import React from "react";
import { Check } from "lucide-react";
import { formatMessageTime } from "@/lib/messaging";

// The notification history itself — every message, reply, announcement,
// assignment and status change that reached this account.
export default function MessagingNotificationList({ items, onOpen }) {
  if (items.length === 0) {
    return <p className="py-4 text-center text-xs text-muted-foreground">No messaging notifications.</p>;
  }
  return (
    <div className="max-h-72 space-y-1.5 overflow-y-auto">
      {items.map((n) => (
        <button
          key={n.id}
          onClick={() => onOpen(n)}
          className={`w-full rounded-lg border px-2.5 py-2 text-left text-xs ${n.is_read ? "border-border" : "border-primary/30 bg-primary/5"}`}
        >
          <span className="flex items-start justify-between gap-2">
            <span className="min-w-0 flex-1 font-medium">{n.title}</span>
            {n.is_read ? <Check className="w-3 h-3 text-muted-foreground" /> : <span className="mt-1 h-1.5 w-1.5 rounded-full bg-primary" />}
          </span>
          <span className="mt-0.5 block truncate text-muted-foreground">{n.message}</span>
          <span className="mt-0.5 block text-[10px] text-muted-foreground">{formatMessageTime(n.datetime)}</span>
        </button>
      ))}
    </div>
  );
}