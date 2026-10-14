import React, { useState } from "react";
import { Bell, CheckCheck, ShieldCheck } from "lucide-react";
import { base44 } from "@/api/base44Client";
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
  expiry_alert: "bg-orange-50 text-orange-700 border-orange-200",
  recall: "bg-red-50 text-red-700 border-red-200",
  other: "bg-secondary text-secondary-foreground border-border",
};

const TYPE_LABELS = {
  new_authorized: "New Prescription",
  reservation_confirmed: "Reservation",
  dispensed: "Dispensed",
  expiry_alert: "Expiry Alert",
  recall: "Recall",
  other: "Update",
};

// Bell icon with unread badge that opens the full notification side panel.
export default function PharmacyNotificationsBell({ onOpenNotification }) {
  const { notifications, unreadCount, markRead, markAllRead } = usePharmacyNotifications();
  const [open, setOpen] = useState(false);
  const [ackBusy, setAckBusy] = useState(null);
  const [acked, setAcked] = useState({});

  const handleOpen = (n) => {
    markRead(n.id);
    setOpen(false);
    onOpenNotification?.(n);
  };

  // Records the pharmacy's acknowledgement of a recall in the recall's audit
  // trail and the clinical audit log.
  const acknowledgeRecall = async (n) => {
    if (!n.recall_id) return;
    setAckBusy(n.id);
    try {
      await base44.functions.invoke("pharmacyRecallManage", { action: "acknowledge", recall_id: n.recall_id });
      setAcked((s) => ({ ...s, [n.id]: true }));
    } catch (err) {
      console.error("Failed to acknowledge recall:", err);
    } finally {
      setAckBusy(null);
    }
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
            <div
              key={n.id}
              role="button"
              tabIndex={0}
              onClick={() => handleOpen(n)}
              onKeyDown={(e) => { if (e.key === "Enter") handleOpen(n); }}
              className={`w-full text-left rounded-xl border p-3 transition-colors hover:bg-accent cursor-pointer ${
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
              {n.type === "recall" && n.recall_id && (
                acked[n.id] ? (
                  <span className="mt-2 inline-flex items-center gap-1.5 text-xs font-medium text-emerald-700">
                    <ShieldCheck className="w-3.5 h-3.5" /> Recall acknowledged
                  </span>
                ) : (
                  <button
                    type="button"
                    onClick={(e) => { e.stopPropagation(); acknowledgeRecall(n); }}
                    disabled={ackBusy === n.id}
                    className="mt-2 inline-flex items-center gap-1.5 rounded-md border border-red-200 bg-red-50 px-2.5 py-1 text-xs font-semibold text-red-700 hover:bg-red-100 disabled:opacity-50"
                  >
                    Acknowledge recall
                  </button>
                )
              )}
            </div>
          ))}
        </div>
      </SheetContent>
    </Sheet>
  );
}