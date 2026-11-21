import React, { useState, useEffect, useMemo } from "react";
import { base44 } from "@/api/base44Client";
import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/popover";
import { Bell, Calendar, RefreshCw, FlaskConical, Microscope, Info, Pill, MessageSquare } from "lucide-react";
import { usePatientLanguage } from "@/lib/patientLanguage";
import { resolvePatientTarget, notificationMeta } from "@/lib/notificationDestinations";

// What the click actually opens — always a tab that exists in this portal.
const DESTINATION_LABEL = {
  appointments: "View Appointment",
  drugs: "Open Medications",
  labs: "View Request",
  access: "Review & Authorize",
  imaging: "View Imaging",
  messages: "Read Message",
  documents: "Open Documents",
  health: "Open Health Summary",
  overview: "Open Home",
};

const TYPE_ICONS = {
  appointment: Calendar,
  rescheduled: RefreshCw,
  lab_request: FlaskConical,
  lab_results: Microscope,
  medication_update: Pill,
  doctor_message: MessageSquare,
  other: Info,
};

const TYPE_COLORS = {
  appointment: "text-primary",
  rescheduled: "text-amber-600",
  lab_request: "text-primary",
  lab_results: "text-emerald-600",
  medication_update: "text-primary",
  doctor_message: "text-primary",
  other: "text-muted-foreground",
};

export default function NotificationsBar({ patientId, onNavigate, compact = false, open: controlledOpen, onOpenChange }) {
  const { t, isArabic, locale } = usePatientLanguage();
  const [items, setItems] = useState([]);
  const [localOpen, setLocalOpen] = useState(false);
  const open = controlledOpen ?? localOpen;
  const setOpen = onOpenChange || setLocalOpen;

  const dayLabel = (iso) => {
    const d = new Date(iso);
    const today = new Date();
    const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const sameDay = (a, b) =>
      a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
    if (sameDay(d, today)) return t("Today");
    if (sameDay(d, yesterday)) return t("Yesterday");
    return d.toLocaleDateString(locale, { month: "long", day: "numeric" });
  };

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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [items, isArabic]);

  const handleClick = async (n) => {
    setOpen(false);
    if (onNavigate) onNavigate(resolvePatientTarget(n));
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
        <button type="button" aria-label={`${t("Notifications")}${unread ? ` (${unread})` : ""}`} className={compact ? "pp-notification-trigger" : "relative inline-flex items-center gap-2 rounded-lg border border-border bg-card px-3 py-2 text-sm font-medium hover:bg-accent transition-colors"}>
          <Bell className="w-4 h-4" />
          {!compact && <span className="hidden sm:inline">{t("Notifications")}</span>}
          {compact && unread > 0 && <span className="pp-notification-dot" aria-hidden="true" />}
          {!compact && unread > 0 && (
            <span className="absolute -top-1.5 -right-1.5 min-w-[18px] h-[18px] px-1 rounded-full bg-destructive text-destructive-foreground text-[10px] font-bold flex items-center justify-center">
              {unread}
            </span>
          )}
        </button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-80 sm:w-96 p-0">
        <div className="px-4 py-3 border-b border-border">
          <p className="font-semibold text-sm">{t("Notifications")}</p>
          <p className="text-xs text-muted-foreground mt-0.5">{t("Updates about your appointments and laboratory tests")}</p>
        </div>
        <div className="max-h-[60vh] overflow-y-auto">
          {items.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">{t("No notifications yet")}</p>
          ) : (
            groups.map(([label, list]) => (
              <div key={label}>
                <p className="px-4 pt-3 pb-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground">{label}</p>
                {list.map((n) => {
                  const Icon = TYPE_ICONS[n.type] || Info;
                  const meta = notificationMeta(n);
                  return (
                    <button
                      key={n.id}
                      onClick={() => handleClick(n)}
                      className={`w-full flex items-start gap-3 px-4 py-2.5 text-left hover:bg-accent/60 ${!n.is_read ? "bg-primary/5" : ""}`}
                    >
                      <Icon className={`w-4 h-4 mt-0.5 shrink-0 ${TYPE_COLORS[n.type] || ""}`} />
                      <span className="flex-1 min-w-0">
                        <span className="flex flex-wrap items-center gap-1.5">
                          <span className={`block text-sm ${n.is_read ? "text-foreground" : "font-semibold"}`}>{t(n.title)}</span>
                          {meta.urgent && (
                            <span className="rounded-full bg-critical px-1.5 py-0.5 text-[10px] font-bold uppercase text-destructive-foreground">
                              {t("Urgent")}
                            </span>
                          )}
                        </span>
                        <span className="block text-xs text-muted-foreground mt-0.5 whitespace-pre-line">{t(n.message)}</span>
                        <span className="block text-xs font-medium text-primary mt-1">
                          {t(DESTINATION_LABEL[resolvePatientTarget(n)] || "View")}
                        </span>
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