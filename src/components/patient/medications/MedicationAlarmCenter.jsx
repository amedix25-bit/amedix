import React, { useCallback, useEffect, useRef, useState } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Pill, Clock, Check, SkipForward, BellRing } from "lucide-react";
import { usePatientLanguage } from "@/lib/patientLanguage";

// In-app medication alarm. Shows a clear reminder at the scheduled minute while
// the Patient Portal is open, with Taken / Snooze / Skip recorded through the
// same dose-log function the Medications screen uses. It never marks a dose as
// taken on its own.
//
// Honest scope: a website cannot raise an audible alarm while the browser is
// closed or the device is offline. The durable side of reminders is the
// server-side schedule (Medication Reminders workflow) which writes a Patient
// Portal notification even when the patient is away; this component adds the
// in-app alarm, an optional browser notification (where the browser allows it)
// and the one-tap response while AMedix is open.

const TZ_FALLBACK = "Africa/Tripoli";
const ALARM_WINDOW_MINUTES = 12;

function zonedNow(tz) {
  const fmt = new Intl.DateTimeFormat("en-CA", {
    timeZone: tz || TZ_FALLBACK,
    year: "numeric", month: "2-digit", day: "2-digit",
    hour: "2-digit", minute: "2-digit", hour12: false, weekday: "short",
  });
  const p = {};
  for (const { type, value } of fmt.formatToParts(new Date())) p[type] = value;
  const weekdayMap = { Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6 };
  const hour = p.hour === "24" ? "00" : p.hour;
  return {
    date: `${p.year}-${p.month}-${p.day}`,
    minutes: Number(hour) * 60 + Number(p.minute),
    weekday: weekdayMap[p.weekday] ?? 0,
  };
}

const slotMinutes = (value) => {
  const m = String(value || "").match(/^(\d{2}):(\d{2})$/);
  return m ? Number(m[1]) * 60 + Number(m[2]) : null;
};

const shownKey = (reminderId, slotKey) => `amedix-med-alarm:${reminderId}:${slotKey}`;

function chime() {
  try {
    const Ctx = window.AudioContext || window.webkitAudioContext;
    if (!Ctx) return;
    const ctx = new Ctx();
    const beep = (start, freq) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "sine";
      osc.frequency.value = freq;
      gain.gain.setValueAtTime(0.0001, ctx.currentTime + start);
      gain.gain.exponentialRampToValueAtTime(0.22, ctx.currentTime + start + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + start + 0.45);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(ctx.currentTime + start);
      osc.stop(ctx.currentTime + start + 0.5);
    };
    beep(0, 880);
    beep(0.55, 1046);
  } catch (e) {
    /* Audio is best-effort; the visual reminder always shows. */
  }
}

export default function MedicationAlarmCenter({ patient }) {
  const { t } = usePatientLanguage();
  const [reminders, setReminders] = useState([]);
  const [alarm, setAlarm] = useState(null);
  const [busy, setBusy] = useState("");
  const [permission, setPermission] = useState(
    typeof Notification !== "undefined" ? Notification.permission : "unsupported"
  );
  const localSnoozes = useRef([]);

  const load = useCallback(async () => {
    if (!patient?.id) return;
    try {
      const page = await base44.entities.MedicationReminder.filter(
        { patient_id: patient.id, enabled: true },
        { limit: 50 }
      );
      setReminders(page.items || page || []);
    } catch (err) {
      console.error(err);
    }
  }, [patient?.id]);

  useEffect(() => {
    load();
  }, [load]);

  // Look for a due slot; one alarm is shown at a time and the rest queue behind
  // it, so several medications never stack on top of each other.
  const check = useCallback(async () => {
    if (!patient?.id || alarm || busy) return;
    const now = zonedNow();
    let loggedSlots = new Set();
    try {
      const logs = await base44.entities.MedicationDoseLog.filter(
        { patient_id: patient.id, dose_date: now.date },
        { limit: 100 }
      );
      loggedSlots = new Set((logs.items || logs || []).map((l) => `${l.medication_id}:${l.scheduled_time || ""}`));
    } catch (err) {
      /* If logs cannot be read we still show the reminder; the patient decides. */
    }

    // A snooze the patient chose, re-shown locally at the chosen minute.
    const dueSnooze = localSnoozes.current.find((s) => s.at <= Date.now());
    if (dueSnooze) {
      localSnoozes.current = localSnoozes.current.filter((s) => s !== dueSnooze);
      setAlarm({ reminder: dueSnooze.reminder, time: dueSnooze.time, key: dueSnooze.key, snoozed: true });
      return;
    }

    for (const reminder of reminders) {
      const local = zonedNow(reminder.timezone);
      if (reminder.start_date && local.date < reminder.start_date) continue;
      if (reminder.end_date && local.date > reminder.end_date) continue;
      const days = Array.isArray(reminder.days_of_week) ? reminder.days_of_week : [];
      if (days.length > 0 && !days.includes(local.weekday)) continue;

      for (const time of reminder.times || []) {
        const mins = slotMinutes(time);
        if (mins === null) continue;
        const diff = local.minutes - mins;
        if (diff < 0 || diff > ALARM_WINDOW_MINUTES) continue;
        const key = `${local.date}T${time}`;
        if (loggedSlots.has(`${reminder.medication_id}:${time}`)) continue;
        if (localStorage.getItem(shownKey(reminder.id, key))) continue;
        localStorage.setItem(shownKey(reminder.id, key), "1");
        setAlarm({ reminder, time, key, snoozed: false });
        return;
      }
    }
  }, [alarm, busy, patient?.id, reminders]);

  useEffect(() => {
    const id = setInterval(check, 20000);
    check();
    const onVisible = () => {
      if (document.visibilityState === "visible") check();
    };
    document.addEventListener("visibilitychange", onVisible);
    return () => {
      clearInterval(id);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, [check]);

  // Alert when the modal opens: sound plus a browser notification if allowed.
  useEffect(() => {
    if (!alarm) return;
    chime();
    try {
      if (typeof Notification !== "undefined" && Notification.permission === "granted") {
        new Notification("AMedix reminder", {
          body: "Open AMedix to view your scheduled reminder.",
          tag: alarm.key,
        });
      }
    } catch (e) {
      /* Notification API unavailable (e.g. iOS without install) — in-app alert stands. */
    }
  }, [alarm]);

  const enableBrowserAlerts = async () => {
    try {
      const result = await Notification.requestPermission();
      setPermission(result);
    } catch (e) {
      setPermission("unsupported");
    }
  };

  const record = async (status) => {
    if (!alarm) return;
    setBusy(status);
    try {
      await base44.functions.invoke("logMedicationDose", {
        medication_id: alarm.reminder.medication_id,
        status,
        scheduled_time: alarm.time,
        dose_date: alarm.key.slice(0, 10),
      });
      setAlarm(null);
    } catch (err) {
      console.error(err);
    } finally {
      setBusy("");
    }
  };

  const snooze = async () => {
    if (!alarm) return;
    setBusy("snooze");
    const at = Date.now() + 10 * 60 * 1000;
    try {
      await base44.entities.MedicationReminder.update(alarm.reminder.id, {
        snooze_slot: alarm.key,
        snooze_until: new Date(at).toISOString(),
      });
    } catch (err) {
      console.error(err);
    } finally {
      localSnoozes.current.push({ reminder: alarm.reminder, time: alarm.time, key: alarm.key, at });
      setBusy("");
      setAlarm(null);
    }
  };

  if (!alarm) return null;

  const { reminder, time } = alarm;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-foreground/40 p-4 backdrop-blur-sm">
      <div
        role="alertdialog"
        aria-modal="true"
        aria-label={t("Medication reminder")}
        className="w-full max-w-md overflow-hidden rounded-2xl border border-border bg-card shadow-2xl"
      >
        <div className="flex items-center gap-2 bg-primary px-5 py-3 text-primary-foreground">
          <BellRing className="h-5 w-5 shrink-0" />
          <p className="text-sm font-semibold">{t("Medication reminder")}</p>
          <span className="ml-auto text-xs opacity-90">{time}</span>
        </div>

        <div className="space-y-3 p-5">
          <div className="flex items-start gap-3">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-secondary">
              <Pill className="h-5 w-5 text-primary" />
            </span>
            <div className="min-w-0">
              <p className="font-heading text-lg font-semibold leading-tight">{reminder.medication_name}</p>
              {reminder.dosage && <p className="text-sm text-muted-foreground">{reminder.dosage}</p>}
              {reminder.instructions && (
                <p className="mt-1 text-xs text-muted-foreground">{reminder.instructions}</p>
              )}
            </div>
          </div>

          <div className="grid gap-2 sm:grid-cols-2">
            <Button
              className="h-11 rounded-xl"
              disabled={!!busy}
              onClick={() => record("taken")}
            >
              <Check className="mr-2 h-4 w-4" />
              {busy === "taken" ? t("Saving...") : t("Taken")}
            </Button>
            <Button variant="outline" className="h-11 rounded-xl" disabled={!!busy} onClick={snooze}>
              <Clock className="mr-2 h-4 w-4" />
              {busy === "snooze" ? t("Saving...") : t("Snooze 10 min")}
            </Button>
            <Button
              variant="ghost"
              className="h-11 rounded-xl sm:col-span-2"
              disabled={!!busy}
              onClick={() => record("skipped")}
            >
              <SkipForward className="mr-2 h-4 w-4" />
              {t("Skip this dose")}
            </Button>
          </div>

          <p className="text-[11px] leading-relaxed text-muted-foreground">
            {t(
              "This alarm runs while AMedix is open in your browser. A closed browser or an offline device cannot sound an alarm — your reminder stays saved and appears in your notifications."
            )}
          </p>

          {permission === "default" && (
            <Button variant="link" className="h-auto p-0 text-xs" onClick={enableBrowserAlerts}>
              {t("Turn on browser alerts for reminders")}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}