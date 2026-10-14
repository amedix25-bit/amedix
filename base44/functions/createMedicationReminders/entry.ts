import { createClientFromRequest } from 'npm:@base44/sdk@0.8.54';
import { todayInTz as todayStr, timeInTz } from "../../shared/medicationSafety.ts";
import { createPatientNotification } from "../../shared/patientNotifications.ts";

// Hourly adherence-reminder scheduler — invoked by the "Medication Reminders"
// workflow; an administrator can also run it on demand. For every ENABLED
// reminder whose dose time has just passed today (and was not already
// notified, and not already logged by the patient) a Patient Portal
// notification is created. Reminders are optional — the patient controls the
// schedule and can turn them off.
export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me().catch(() => null);
    if (user && user.role !== 'admin') {
      return Response.json({ error: 'Forbidden' }, { status: 403 });
    }

    const today = todayStr();
    const nowTime = timeInTz(new Date());
    const slotKey = (time) => `${today}T${time}`;

    // Scan all enabled reminders.
    let reminders = [];
    let cursor = undefined;
    for (;;) {
      const page = await base44.asServiceRole.entities.MedicationReminder.filter(
        { enabled: true }, cursor ? { limit: 200, cursor } : { limit: 200 }
      );
      reminders = reminders.concat(page.items || []);
      if (!page.has_more || !page.next_cursor) break;
      cursor = page.next_cursor;
    }

    let sent = 0;
    for (const reminder of reminders) {
      const times = (reminder.times || []).filter((t) => /^\d{2}:\d{2}$/.test(String(t)));
      if (times.length === 0) continue;
      const notified = new Set(reminder.notified_for || []);
      const due = times.filter((t) => t <= nowTime && !notified.has(slotKey(t)));
      if (due.length === 0) {
        // Housekeeping: keep the dedupe list small.
        if ((reminder.notified_for || []).length > 100) {
          await base44.asServiceRole.entities.MedicationReminder.update(reminder.id, {
            notified_for: (reminder.notified_for || []).slice(-50),
          });
        }
        continue;
      }

      for (const time of due) {
        // Skip doses the patient already logged for this slot.
        let alreadyLogged = false;
        try {
          const logs = await base44.asServiceRole.entities.MedicationDoseLog.filter(
            { medication_id: reminder.medication_id, dose_date: today, scheduled_time: time },
            { limit: 1 }
          );
          alreadyLogged = (logs.items || logs).length > 0;
        } catch (e) { alreadyLogged = false; }
        if (alreadyLogged) {
          notified.add(slotKey(time));
          continue;
        }

        await createPatientNotification(base44.asServiceRole, {
          patient_id: reminder.patient_id,
          type: 'medication_reminder',
          title: 'Medication Reminder',
          message: `${reminder.medication_name} — scheduled dose at ${time}. Open Medications to log it as taken or missed.`,
          target: 'reminders',
          related_id: reminder.medication_id,
          event_date: today,
        });
        notified.add(slotKey(time));
        sent++;
      }

      await base44.asServiceRole.entities.MedicationReminder.update(reminder.id, {
        notified_for: Array.from(notified).slice(-100),
      });
    }

    return Response.json({ checked: reminders.length, sent, date: today });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}