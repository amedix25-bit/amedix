import React, { useState } from "react";
import { Bell, CheckCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { useLabNotifications } from "@/hooks/useLabNotifications";

const TYPE_STYLES = {
  new_request: "bg-blue-50 text-blue-700 border-blue-200",
  results_uploaded: "bg-sky-50 text-sky-700 border-sky-200",
  request_completed: "bg-emerald-50 text-emerald-700 border-emerald-200",
  request_updated: "bg-amber-50 text-amber-700 border-amber-200",
  other: "bg-secondary text-secondary-foreground border-border",
};

const TYPE_LABELS = {
  new_request: "New Request",
  results_uploaded: "Results Uploaded",
  request_completed: "Completed",
  request_updated: "Request Update",
  other: "Update",
};

// Bell icon with unread badge that opens the full notification side panel.
// Works in both the Lab Portal (no session) and Technician Portal (session).
export default function NotificationsBell({ session, onOpenNotification }) {
  const { notifications, unreadCount, markRead, markAllRead } = useLabNotifications({ session });
  const [open, setOpen] = useState(false);

  const handleOpen = (n) => {
    markRead(n.id);
    setOpen(false);
    onOpenNotification?.(n);
  };

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <button
          type="button"
          aria-label="Notifications"
          className="relative inline-flex items-center justify-center w-9 h-9 rounded-lg border border-border hover:bg-accent transition-colors"
        >
          <Bell className="w-4 h-4" />
          {unreadCount > 0 && (
            <span className="absolute -top-1 -right-1 inline-flex items-center justify-center min-w-4 h-4 px-1 rounded-full bg-destructive text-destructive-foreground text-[10px] font-bold">
              {unreadCount > 99 ? "99+" : unreadCount}
            </span>
          )}
        </button>
      </SheetTrigger>
      <SheetContent side="right" className="w-full sm:max-w-md p-0 flex flex-col">
        <SheetHeader className="border-b border-border">
          <SheetTitle className="flex items-center justify-between gap-2">
            <span className="flex items-center gap-2">
              <Bell className="w-4 h-4" /> Notifications
            </span>
            {unreadCount > 0 && (
              <Button variant="ghost" size="sm" onClick={markAllRead}>
                <CheckCheck className="w-4 h-4 mr-1" /> Mark all read
              </Button>
            )}
          </SheetTitle>
        </SheetHeader>
        <div className="flex-1 overflow-y-auto px-4 py-4 space-y-2">
          {notifications === null || notifications.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">No notifications yet.</p>
          ) : (
            notifications.map((n) => (
              <button
                key={n.id}
                type="button"
                onClick={() => handleOpen(n)}
                className={`w-full text-left rounded-lg border p-3 transition-colors ${
                  n.is_read
                    ? "border-border bg-card opacity-70"
                    : "border-primary/40 bg-primary/5 hover:border-primary"
                }`}
              >
                <div className="flex items-center justify-between gap-2">
                  <span
                    className={`text-[10px] font-bold uppercase px-1.5 py-0.5 rounded border ${
                      TYPE_STYLES[n.type] || TYPE_STYLES.other
                    }`}
                  >
                    {TYPE_LABELS[n.type] || "Update"}
                  </span>
                  {!n.is_read && <span className="w-2 h-2 rounded-full bg-primary shrink-0" />}
                </div>
                <p className="text-sm font-medium mt-1.5">{n.title}</p>
                {n.message && <p className="text-xs text-muted-foreground mt-0.5">{n.message}</p>}
                <p className="text-[10px] text-muted-foreground mt-1.5">
                  {n.created_date ? new Date(n.created_date).toLocaleString() : ""}
                </p>
              </button>
            ))
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}