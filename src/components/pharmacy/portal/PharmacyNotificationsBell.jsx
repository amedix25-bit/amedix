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
import { usePharmacyNotifications } from "@/hooks/usePharmacyNotifications";

const TYPE_STYLES = {
  new_authorized: "bg-sky-50 text-sky-700 border-sky-200",
  reservation_confirmed: "bg-amber-50 text-amber-700 border-amber-200",
  dispensed: "bg-emerald-50 text-emerald-700 border-emerald-200",
  other: "bg-secondary text-secondary-foreground border-border",
};

const TYPE_LABELS = {
  new_authorized: "New Prescription",
  reservation_confirmed: "Reservation",
  dispensed: "Dispensed",
  other: "Update",
};

// Bell icon with unread badge that opens the full notification side panel.
export default function PharmacyNotificationsBell({ onOpenNotification }) {
  const { notifications, unreadCount, markRead, markAllRead } = usePharmacyNotifications();
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
              <Bell className="w-4 h-4" />
              Notifications
            </span>
            {unreadCount > 0 && (
              <Button variant="ghost" size="sm" onClick={markAllRead} className="gap-1 text-xs">
                <CheckCheck className="w-3.5 h-3.5" />
                Mark all read
              </Button>
            )}
          </SheetTitle>
        </SheetHeader>
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {!notifications && <p className="text-sm text-muted-foreground text-center py-8">Loading...</p>}
          {notifications && notifications.length === 0 && (
            <p className="text-sm text-muted-foreground text-center py-8">No notifications yet.</p>
          )}
          {notifications && notifications.map((n) => (
            <button
              key={n.id}
              onClick={() => handleOpen(n)}
              className={`w-full text-left rounded-xl border p-3 transition-colors hover:bg-accent ${
                n.is_read ? "border-border bg-card" : "border-primary/30 bg-primary/5"
              }`}
            >
              <span className={`inline-flex items-center px-2 py-0.5 rounded-full border text-[11px] font-medium ${TYPE_STYLES[n.type] || TYPE_STYLES.other}`}>
                {TYPE_LABELS[n.type] || TYPE_LABELS.other}
              </span>
              <p className="text-sm font-semibold mt-2">{n.title}</p>
              <p className="text-xs text-muted-foreground mt-1">{n.message}</p>
              <p className="text-[11px] text-muted-foreground mt-1">
                {new Date(n.created_date).toLocaleString()}
              </p>
            </button>
          ))}
        </div>
      </SheetContent>
    </Sheet>
  );
}