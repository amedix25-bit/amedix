// Neurology decision-support audit trail.
//
// A neurology note carries three things the audit log must keep as events, not only
// as sentences in the note text: the medication safety alerts the record raised, the
// critical findings and escalations that occurred, and the neurological emergencies
// documented. The browser sends a bounded summary built from the values the clinician
// documented; this module writes each entry with the same patient, encounter, doctor
// and document context as every other clinical audit record.
//
// It never invents an entry: anything absent from the payload writes nothing. A
// logging failure is swallowed by logClinicalAudit on purpose — the clinical write has
// already succeeded and must never be lost because the audit log failed.

import { logClinicalAudit } from "./clinicalAudit.ts";

const MAX_PER_KIND = 10;

const trim = (v: unknown, n = 300) => String(v ?? "").slice(0, n);

export async function logNeurologyAudit(base44: any, payload: any, context: any) {
  if (!payload || typeof payload !== "object") return;
  const ctx = context || {};
  const base = {
    actor_user_id: ctx.actor_user_id || "",
    actor_name: ctx.actor_name || "",
    actor_role: "doctor",
    patient_id: ctx.patient_id || "",
    patient_user_id: ctx.patient_user_id || "",
    patient_cin: ctx.patient_cin || "",
    patient_name: ctx.patient_name || "",
    encounter_id: ctx.encounter_id || "",
    document_id: ctx.document_id || "",
    hospital: ctx.hospital || "",
    department: ctx.department || "",
  };

  const medications = Array.isArray(payload.medications) ? payload.medications.slice(0, MAX_PER_KIND) : [];
  const escalations = Array.isArray(payload.escalations) ? payload.escalations.slice(0, MAX_PER_KIND) : [];
  const emergencies = Array.isArray(payload.emergencies) ? payload.emergencies.slice(0, MAX_PER_KIND) : [];

  if (!medications.length && !escalations.length && !emergencies.length) return;

  await logClinicalAudit(base44, {
    ...base,
    action: "neurology_decision_support_recorded",
    action_label:
      `saved a neurology note with ${medications.length} medication safety alert(s), ` +
      `${escalations.length} escalation record(s) and ${emergencies.length} emergency record(s)`,
  });

  for (const m of medications) {
    await logClinicalAudit(base44, {
      ...base,
      action: "neurology_medication_alert",
      action_label: `[${trim(m.level || "alert", 20)}] ${trim(m.kind || "alert", 40)}: ${trim(m.message)}`,
    });
  }

  for (const e of escalations) {
    const owed = Array.isArray(e.owed) && e.owed.length ? ` — record owes: ${e.owed.slice(0, 6).join(", ")}` : "";
    await logClinicalAudit(base44, {
      ...base,
      action: "neurology_critical_finding_escalation",
      action_label:
        `[${trim(e.level || "urgent", 20)}] ${trim(e.finding || "critical finding", 160)} — ` +
        `identified ${trim(e.time_identified) || "time not recorded"}, informed ${trim(e.who_informed) || "not recorded"} ` +
        `at ${trim(e.time_informed) || "not recorded"}, acknowledged by ${trim(e.acknowledged_by) || "not recorded"}, ` +
        `decision by ${trim(e.decision_by) || "not recorded"}${owed}`,
    });
  }

  for (const em of emergencies) {
    await logClinicalAudit(base44, {
      ...base,
      action: "neurology_emergency_recorded",
      action_label:
        `[${trim(em.level || "urgent", 20)}] ${trim(em.presentation || "emergency")} — ` +
        `informed ${trim(em.who_informed) || "not recorded"} at ${trim(em.time_informed) || "not recorded"}`,
    });
  }
}