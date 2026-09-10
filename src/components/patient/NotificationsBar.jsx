import React, { useState, useEffect, useMemo } from "react";
import { base44 } from "@/api/base44Client";
import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/popover";
import { Bell, Calendar, RefreshCw, FlaskConical, Microscope, Info, Pill } from "lucide-react";

const TYPE_ICONS = {
  appointment: Calendar,
  rescheduled: RefreshCw,
  lab_request: FlaskConical,
  lab_results: Microscope,
  medication_update: Pill,
  other: Info,
};

const TYPE_COLORS = {
  appointment: "text-primary",
  rescheduled: "text-amber-600",
  lab_request: "text-primary",
  lab_results: "text-emerald-600",
  medication_update: "text-primary",
  other: "text-muted-foreground",
};

function dayLabel(iso) {
  const d = new Date(iso);
  const today = new Date();
  const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000);
  const sameDay = (a, b) =>
    a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
  if (sameDay(d, today)) return "Today";
  if (sameDay(d, yesterday)) return "Yesterday";
  return d.toLocaleDateString(undefined, { month: "long", day: "numeric" });
}

export default function NotificationsBar({ patientId, onNavigate }) {
  const [items, setItems] = useState([]);
  const [open, setOpen] = useState(false);

  const load = async () => {
    if (!patientId) return;
    try {
      const data = await base44.entities.PatientNotification.filter({ patient_id: patientId }, "-created_date", 50);
      setItems(data);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    load();
    const unsubscribe = base44.entities.PatientNotification.subscribe(() => load());
    return unsubscribe;
  }, [patientId]);

  const unread = items.filter((n) => !n.is_read).length;

  const groups = useMemo(() => {
    const map = new Map();
    items.forEach((n) => {
      const label = dayLabel(n.created_date);
      if (!map.has(label)) map.set(label, []);
      map.get(label).push(n);
    });
    return [...map.entries()];
  }, [items]);

  const handleClick = async (n) => {
    setOpen(false);
    if (n.target && onNavigate) onNavigate(n.target === "radiology" ? "access" : n.target);
    if (!n.is_read) {
      try {
        await base44.entities.PatientNotification.update(n.id, { is_read: true });
        setItems((prev) => prev.map((x) => (x.id === n.id ? { ...x, is_read: true } : x)));
      } catch (err) {
        console.error(err);
      }
    }
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button className="relative inline-flex items-center gap-2 rounded-lg border border-border bg-card px-3 py-2 text-sm font-medium hover:bg-accent transition-colors">
          <Bell className="w-4 h-4" />
          <span className="hidden sm:inline">Notifications</span>
          {unread > 0 && (
            <span className="absolute -top-1.5 -right-1.5 min-w-[18px] h-[18px] px-1 rounded-full bg-destructive text-destructive-foreground text-[10px] font-bold flex items-center justify-center">
              {unread}
            </span>
          )}
        </button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-80 sm:w-96 p-0">
        <div className="px-4 py-3 border-b border-border">
          <p className="font-semibold text-sm">Notifications</p>
          <p className="text-xs text-muted-foreground mt-0.5">Updates about your appointments and laboratory tests</p>
        </div>
        <div className="max-h-[60vh] overflow-y-auto">
          {items.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">No notifications yet</p>
          ) : (
            groups.map(([label, list]) => (
              <div key={label}>
                <p className="px-4 pt-3 pb-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground">{label}</p>
                {list.map((n) => {
                  const Icon = TYPE_ICONS[n.type] || Info;
                  return (
                    <button
                      key={n.id}
                      onClick={() => handleClick(n)}
                      className={`w-full flex items-start gap-3 px-4 py-2.5 text-left hover:bg-accent/60 ${!n.is_read ? "bg-primary/5" : ""}`}
                    >
                      <Icon className={`w-4 h-4 mt-0.5 shrink-0 ${TYPE_COLORS[n.type] || ""}`} />
                      <span className="flex-1 min-w-0">
                        <span className={`block text-sm ${n.is_read ? "text-foreground" : "font-semibold"}`}>{n.title}</span>
                        <span className="block text-xs text-muted-foreground mt-0.5 whitespace-pre-line">{n.message}</span>
                        {n.target && (
                          <span className="block text-xs font-medium text-primary mt-1">
                            {n.target === "appointments"
                              ? "View Appointment"
                              : n.target === "medications"
                                ? "Add Medication Information"
                                : n.target === "labs"
                                  ? "View Request"
                                  : n.target === "radiology" || n.target === "access"
                                    ? "Review & Authorize"
                                    : "View"}
                          </span>
                        )}
                      </span>
                      {!n.is_read && <span className="mt-1.5 w-2 h-2 rounded-full bg-primary shrink-0" />}
                    </button>
                  );
                })}
              </div>
            ))
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}