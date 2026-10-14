import React, { useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { CheckCircle2, Bell, BellOff, Loader2, Plus, Trash2, CircleAlert } from "lucide-react";
import MedicationFeedbackDialog from "@/components/patient/medications/MedicationFeedbackDialog";
import { doseTimesFromFrequency } from "@/lib/doseSchedule";
import { todayStr } from "@/lib/medicationUtils";
import { usePatientLanguage } from "@/lib/patientLanguage";

const TIME_RE = /^\d{2}:\d{2}$/;

// Optional adherence panel for one active medication: dose reminders the
// patient manages (times pre-filled from the prescribed frequency), logging
// today's dose as taken / missed / skipped with medication-specific missed-dose
// guidance, and reporting problems to the care team. Patient-reported doses
// are always separate from pharmacy-confirmed dispensing.
export default function AdherencePanel({ med, patient, onChanged }) {
  const { t } = usePatientLanguage();
  const [reminder, setReminder] = useState(null);
  const [times, setTimes] = useState([]);
  const [enabled, setEnabled] = useState(true);
  const [savingReminder, setSavingReminder] = useState(false);
  const [logging, setLogging] = useState("");
  const [guidance, setGuidance] = useState(null);
  const [logs, setLogs] = useState(null);

  const load = async () => {
    if (!patient?.user_id) return;
    try {
      const [remPage, logPage] = await Promise.all([
        base44.entities.MedicationReminder.filter({ medication_id: med.id }, { limit: 1 }),
        base44.entities.MedicationDoseLog.filter(
          { medication_id: med.id, dose_date: todayStr() },
          { sort: "-reported_datetime", limit: 20 }
        ),
      ]);
      const rem = (remPage.items || remPage)[0] || null;
      setReminder(rem);
      if (rem) {
        setTimes(rem.times || []);
        setEnabled(rem.enabled !== false);
      } else {
        setTimes(doseTimesFromFrequency(med.frequency, med.prn));
        setEnabled(true);
      }
      setLogs(logPage.items || logPage);
    } catch (err) {
      console.error(err);
      setLogs([]);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [med.id]);

  const saveReminder = async (nextEnabled, nextTimes) => {
    setSavingReminder(true);
    try {
      const data = {
        patient_id: patient.id,
        patient_user_id: patient.user_id,
        medication_id: med.id,
        prescription_id: med.prescription_id || "",
        medication_name: med.name,
        times: nextTimes.filter(TIME_RE.test.bind(TIME_RE)),
        enabled: nextEnabled,
      };
      let saved;
      if (reminder) {
        saved = await base44.entities.MedicationReminder.update(reminder.id, data);
      } else {
        saved = await base44.entities.MedicationReminder.create({ ...data, created_datetime: new Date().toISOString() });
      }
      setReminder(saved);
      setTimes(data.times);
      setEnabled(nextEnabled);
    } catch (err) {
      console.error(err);
    } finally {
      setSavingReminder(false);
    }
  };

  const logDose = async (status, scheduledTime) => {
    setLogging(status + (scheduledTime || ""));
    try {
      const res = await base44.functions.invoke("logMedicationDose", {
        medication_id: med.id,
        status,
        scheduled_time: scheduledTime || "",
      });
      if (status === "missed" && res.data.guidance) setGuidance(res.data.guidance);
      await load();
      onChanged?.();
    } catch (err) {
      console.error(err);
    } finally {
      setLogging("");
    }
  };

  const today = todayStr();
  const loggedToday = logs || [];
  const loggedSlots = new Set(loggedToday.map((l) => l.scheduled_time || ""));
  const scheduledSlots = (med.prn ? [] : (times.length > 0 ? times : doseTimesFromFrequency(med.frequency, false)))
    .filter(TIME_RE.test.bind(TIME_RE));
  const isPRN = !!med.prn;

  return (
    <div className="rounded-xl border border-border bg-muted/30 p-3 mt-2 space-y-3">
      {/* Reminders — optional, patient-managed */}
      <div className="flex items-center justify-between gap-2">
        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide flex items-center gap-1.5">
          {enabled ? <Bell className="w-3.5 h-3.5 text-primary" /> : <BellOff className="w-3.5 h-3.5" />}
          {t("Dose Reminders")}
        </p>
        <div className="flex items-center gap-2">
          <Switch
            checked={enabled}
            onCheckedChange={(v) => {
              setEnabled(v);
              saveReminder(v, times);
            }}
            disabled={savingReminder || !isPRN && scheduledSlots.length === 0 && times.length === 0}
          />
          <span className="text-xs text-muted-foreground">{enabled ? t("On") : t("Off")}</span>
        </div>
      </div>
      {!isPRN && (
        <div className="space-y-1.5">
          {times.map((time, i) => (
            <div key={i} className="flex items-center gap-1.5">
              <Input
                type="time"
                value={time}
                onChange={(e) => setTimes(times.map((v, j) => (j === i ? e.target.value : v)))}
                className="h-8 w-32"
              />
              <button
                type="button"
                onClick={() => setTimes(times.filter((_, j) => j !== i))}
                className="text-muted-foreground hover:text-destructive"
                aria-label={t("Remove time")}
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          ))}
          {times.length < 6 && (
            <button
              type="button"
              onClick={() => setTimes([...times, "12:00"])}
              className="text-xs text-primary flex items-center gap-1"
            >
              <Plus className="w-3 h-3" /> {t("Add time")}
            </button>
          )}
          <Button
            size="sm"
            variant="outline"
            className="h-7"
            disabled={savingReminder}
            onClick={() => saveReminder(enabled, times)}
          >
            {savingReminder && <Loader2 className="w-3 h-3 animate-spin mr-1" />}
            {t("Save Reminder Times")}
          </Button>
        </div>
      )}
      {isPRN && (
        <p className="text-xs text-muted-foreground">
          {t("As-needed medication — reminders do not apply.")}
        </p>
      )}

      {/* Log today's doses — patient-reported, separate from dispensing */}
      <div>
        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1.5">
          {t("Log Today's Dose")}
        </p>
        {!isPRN && scheduledSlots.length > 0 ? (
          <div className="space-y-1.5">
            {scheduledSlots.map((slot) => {
              const logged = loggedSlots.has(slot);
              return (
                <div key={slot} className="flex items-center justify-between gap-2">
                  <span className="text-xs font-medium">{slot}</span>
                  {logged ? (
                    <span className="text-xs text-emerald-700 flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5" /> {t("Logged")}
                    </span>
                  ) : (
                    <div className="flex gap-1.5">
                      <Button size="sm" variant="outline" className="h-7 text-xs" disabled={!!logging} onClick={() => logDose("taken", slot)}>
                        {logging === "taken" + slot && <Loader2 className="w-3 h-3 animate-spin mr-1" />}
                        {t("Taken")}
                      </Button>
                      <Button size="sm" variant="outline" className="h-7 text-xs" disabled={!!logging} onClick={() => logDose("missed", slot)}>
                        {t("Missed")}
                      </Button>
                      <Button size="sm" variant="ghost" className="h-7 text-xs" disabled={!!logging} onClick={() => logDose("skipped", slot)}>
                        {t("Skipped")}
                      </Button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        ) : (
          <div className="flex gap-1.5">
            <Button size="sm" variant="outline" className="h-7 text-xs" disabled={!!logging} onClick={() => logDose("taken", "")}>
              {logging === "taken" && <Loader2 className="w-3 h-3 animate-spin mr-1" />}
              {t("I took it")}
            </Button>
            <Button size="sm" variant="outline" className="h-7 text-xs" disabled={!!logging} onClick={() => logDose("missed", "")}>
              {t("I missed it")}
            </Button>
          </div>
        )}
        {!isPRN && scheduledSlots.length === 0 && (
          <p className="text-xs text-muted-foreground mt-1">
            {t("Add reminder times above to log doses against a schedule.")}
          </p>
        )}
      </div>

      {/* Report a problem / treatment change */}
      <div className="pt-1">
        <MedicationFeedbackDialog med={med} onDone={onChanged} />
      </div>

      {/* Missed-dose guidance — medication-specific, never an extra dose */}
      {guidance && (
        <div className="rounded-lg border border-amber-300 bg-amber-50 p-3 text-xs text-amber-900 flex items-start gap-2">
          <CircleAlert className="w-4 h-4 shrink-0 mt-0.5" />
          <div>
            <p className="font-semibold">{t("Missed dose guidance")}</p>
            <p className="mt-0.5">{t(guidance)}</p>
            <button type="button" onClick={() => setGuidance(null)} className="underline mt-1">
              {t("Dismiss")}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}