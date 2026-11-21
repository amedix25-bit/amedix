import { createClientFromRequest } from 'npm:@base44/sdk@0.8.54';
import { createPatientNotification } from "../../shared/patientNotifications.ts";

// Medication-reminder scheduler. Invoked by the "Medication Reminders" workflow
// every hour (Africa/Tripoli) and runnable on demand by an administrator.
//
// For every ENABLED reminder that is active today (start/end date, days of the
// week) it delivers one Patient Portal notification per dose slot that has just
// become due and was not already alerted. It never marks a dose as taken: the
// patient records taken / skipped themselves, and a missed dose stays
// distinguishable from a taken one.
//
// Reliability rules:
//  - notified_for is the deduplication key, so a re-run never duplicates a slot.
//  - A slot older than CATCH_UP_MINUTES is not alerted: after an outage the
//    patient is not flooded with every past dose of the day.
//  - A snoozed slot is re-alerted exactly once when its snooze time passes.
//  - Times are evaluated in the reminder's own timezone (default Africa/Tripoli).

const DEFAULT_TZ = 'Africa/Tripoli';
const CATCH_UP_MINUTES = 180;

function zonedNow(tz) {
  const fmt = new Intl.DateTimeFormat('en-CA', {
    timeZone: tz || DEFAULT_TZ,
    year: 'numeric', month: '2-digit', day: '2-digit',
    hour: '2-digit', minute: '2-digit', hour12: false, weekday: 'short',
  });
  const p = {};
  for (const { type, value } of fmt.formatToParts(new Date())) p[type] = value;
  const weekdayMap = { Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6 };
  const hour = p.hour === '24' ? '00' : p.hour;
  return {
    date: `${p.year}-${p.month}-${p.day}`,
    time: `${hour}:${p.minute}`,
    minutes: Number(hour) * 60 + Number(p.minute),
    weekday: weekdayMap[p.weekday] ?? 0,
  };
}

function slotMinutes(value) {
  const m = String(value || '').match(/^(\d{2}):(\d{2})$/);
  if (!m) return null;
  return Number(m[1]) * 60 + Number(m[2]);
}

function activeOn(reminder, now) {
  if (reminder.start_date && now.date < reminder.start_date) return false;
  if (reminder.end_date && now.date > reminder.end_date) return false;
  const days = Array.isArray(reminder.days_of_week) ? reminder.days_of_week : [];
  if (days.length > 0 && !days.includes(now.weekday)) return false;
  return true;
}

export default async function (req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me().catch(() => null);
    if (user && user.role !== 'admin') {
      return Response.json({ error: 'Forbidden' }, { status: 403 });
    }

    // All enabled reminders (paged).
    let reminders = [];
    let cursor = undefined;
    for (;;) {
      const page = await base44.asServiceRole.entities.MedicationReminder.filter(
        { enabled: true },
        cursor ? { limit: 200, cursor } : { limit: 200 }
      );
      reminders = reminders.concat(page.items || []);
      if (!page.has_more || !page.next_cursor) break;
      cursor = page.next_cursor;
    }

    let sent = 0;
    let snoozed = 0;

    for (const reminder of reminders) {
      const now = zonedNow(reminder.timezone);
      if (!activeOn(reminder, now)) continue;

      const notified = new Set(reminder.notified_for || []);
      const times = (reminder.times || []).filter((t) => slotMinutes(t) !== null);
      if (times.length === 0 && !reminder.snooze_slot) continue;

      const due = [];
      for (const time of times) {
        const mins = slotMinutes(time);
        const key = `${now.date}T${time}`;
        if (notified.has(key)) continue;
        if (mins > now.minutes) continue; // not due yet
        if (now.minutes - mins > CATCH_UP_MINUTES) continue; // too old to alert safely
        due.push({ time, key, snoozed: false });
      }

      // A snoozed dose is re-alerted once, at the time the patient chose.
      if (reminder.snooze_slot && reminder.snooze_until) {
        const until = new Date(reminder.snooze_until).getTime();
        if (!isNaN(until) && until <= Date.now() && !notified.has(reminder.snooze_slot)) {
          due.push({
            time: String(reminder.snooze_slot).slice(11),
            key: reminder.snooze_slot,
            snoozed: true,
          });
        }
      }

      if (due.length === 0) {
        // Housekeeping only — keep the dedupe list bounded.
        if ((reminder.notified_for || []).length > 120) {
          await base44.asServiceRole.entities.MedicationReminder.update(reminder.id, {
            notified_for: (reminder.notified_for || []).slice(-60),
          });
        }
        continue;
      }

      let clearedSnooze = false;
      for (const slot of due) {
        // Never alert a dose the patient already recorded for this slot.
        let alreadyLogged = false;
        try {
          const logs = await base44.asServiceRole.entities.MedicationDoseLog.filter(
            {
              medication_id: reminder.medication_id,
              dose_date: String(slot.key).slice(0, 10),
              scheduled_time: slot.time,
            },
            { limit: 1 }
          );
          alreadyLogged = (logs.items || []).length > 0;
        } catch (e) {
          alreadyLogged = false;
        }
        if (alreadyLogged) {
          notified.add(slot.key);
          continue;
        }

        const dose = reminder.dosage ? ` (${reminder.dosage})` : '';
        const note = reminder.instructions ? ` ${reminder.instructions}` : '';
        await createPatientNotification(base44.asServiceRole, {
          patient_id: reminder.patient_id,
          type: 'medication_reminder',
          title: slot.snoozed ? 'Medication Reminder (snoozed)' : 'Medication Reminder',
          message: `${reminder.medication_name}${dose} — scheduled dose at ${slot.time}.${note} Open Medications to record it as taken or skipped.`,
          target: 'drugs',
          related_id: reminder.medication_id,
          event_date: String(slot.key).slice(0, 10),
        });

        notified.add(slot.key);
        sent++;
        if (slot.snoozed) {
          snoozed++;
          clearedSnooze = true;
        }
      }

      const patch = {
        notified_for: Array.from(notified).slice(-120),
        last_reminder_datetime: new Date().toISOString(),
      };
      if (clearedSnooze) {
        patch.snooze_slot = '';
        patch.snooze_until = '';
      }
      await base44.asServiceRole.entities.MedicationReminder.update(reminder.id, patch);
    }

    return Response.json({ checked: reminders.length, sent, snoozed, date: zonedNow(DEFAULT_TZ).date });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}