// Neurology — the audit payload written with a saved note.
//
// A neurology note's structured panel values are printed into the note text, which
// is what the record keeps. That is not enough for the audit trail: a critical
// finding, a medication alert and an escalation must be queryable events, not only
// sentences. This module builds a small, bounded summary from the form values at save
// time; the backend writes it to the clinical audit log with the note's patient,
// encounter, doctor and document, and never stores it as a note field.
//
// Nothing is invented: every entry is derived from a value the clinician documented.
// The summary is bounded so a long note cannot flood the audit log.

import { asObject, str } from "@/lib/neurologyFieldKit";
import { neurologyMedicationAlerts } from "@/lib/neurologyMedications";
import { neuroCriticalFinding, neurologyEscalationIssues, neurologyEscalationState } from "@/lib/neurologyEscalation";
import {
  NEURO_EMERGENCY_MAP,
  neurologyEmergencyState,
  selectedNeuroEmergencies,
} from "@/lib/neurologyEmergencies";

export const NEURO_AUDIT_VERSION = "neurology-audit-1";

export const buildNeurologyAuditPayload = (values) => {
  const v = asObject(values);
  const medications = v.neuro_medications && typeof v.neuro_medications === "object" ? v.neuro_medications : null;
  const escalation = v.neuro_escalation && typeof v.neuro_escalation === "object" ? v.neuro_escalation : null;
  const emergency = v.neuro_emergency && typeof v.neuro_emergency === "object" ? v.neuro_emergency : null;
  if (!medications && !escalation && !emergency) return null;

  // Only the alerts the panel actually raised are logged: a documentation gap
  // ("no medication statement recorded") is not a medication alert and must not
  // read as one in the audit trail.
  const medAlerts = medications
    ? neurologyMedicationAlerts(medications)
        .slice(0, 20)
        .map((i) => ({ key: i.key, level: i.level, kind: i.kind || "alert", message: String(i.message || "").slice(0, 400) }))
    : [];

  const escalationState = neurologyEscalationState(escalation);
  const escalations = escalationState.events.slice(0, 15).map((event) => {
    const spec = neuroCriticalFinding(event.finding_key);
    const owed = neurologyEscalationIssues({ events: [event] })
      .filter((i) => i.level !== "advisory")
      .map((i) => i.key);
    return {
      finding: spec ? spec.label : str(event.finding_key) || "critical finding — not named",
      level: spec ? spec.level : "urgent",
      time_identified: str(event.time_identified),
      who_informed: str(event.who_informed),
      time_informed: str(event.time_informed),
      acknowledged_by: str(event.acknowledged_by),
      decision_by: str(event.decision_by),
      destination: str(event.destination),
      owed,
    };
  });

  const emergencyState = neurologyEmergencyState(emergency);
  const emergencies = selectedNeuroEmergencies(emergency)
    .slice(0, 15)
    .map((key) => {
      const spec = NEURO_EMERGENCY_MAP[key];
      const pathway = asObject(asObject(emergencyState.blocks[key]).pathway);
      return {
        presentation: spec.label,
        level: spec.level,
        who_informed: str(pathway.who_informed),
        time_informed: str(pathway.time_informed),
        destination: str(pathway.destination),
      };
    });

  return {
    version: NEURO_AUDIT_VERSION,
    generated_datetime: new Date().toISOString(),
    medications: medAlerts,
    escalations,
    emergencies,
    counts: {
      medication_alerts: medAlerts.length,
      escalations: escalations.length,
      emergencies: emergencies.length,
      escalation_owed: escalationState.events.slice(0, 15).reduce((n, e) => n + (neurologyEscalationIssues({ events: [e] }).filter((i) => i.level !== "advisory").length), 0),
    },
  };
};