import React from "react";
import { Info } from "lucide-react";
import useRheumPatientContext from "@/hooks/useRheumPatientContext";
import RheumTreatmentPlanEditor from "@/components/doctor/notes/RheumTreatmentPlanEditor";
import RheumMonitoringPanel from "@/components/doctor/notes/RheumMonitoringPanel";
import RheumAlertPanel from "@/components/doctor/notes/RheumAlertPanel";
import { buildSafetyAlerts } from "@/lib/rheumTreatmentSafety";

// ACR/EULAR-aligned structured treatment plan with monitoring and safety
// decision support. It documents a clinical decision; it never prescribes,
// calculates a patient-specific regimen, or stops a treatment. Prescribing
// itself stays in the AMedix prescription module, which runs its own review.
export default function RheumTreatmentField({ value, onChange, patientId }) {
  const safe = value && typeof value === "object" && !Array.isArray(value) ? value : { plan: [], triggers: {} };
  const plan = Array.isArray(safe.plan) ? safe.plan : [];
  const triggers = safe.triggers || {};
  const { medications, allergies, prescriptions, patient, lastAssessment, loading } = useRheumPatientContext(patientId);

  const medicationNames = [
    ...medications.map((m) => ({ name: m.name })),
    ...prescriptions.map((p) => ({ name: p.medication_name })),
  ];
  const plannedReviewDate = plan.map((e) => e.planned_review).filter(Boolean).sort()[0] || "";

  const alerts = buildSafetyAlerts({
    entries: plan,
    medications: medicationNames,
    allergies,
    triggers,
    lastAssessmentDate: lastAssessment,
    plannedReviewDate,
    patient,
  });

  const update = (patch) => onChange({ ...safe, ...patch });

  return (
    <div className="space-y-3">
      <div className="rounded-lg border border-primary/20 bg-primary/5 p-2.5">
        <p className="text-xs font-medium flex items-center gap-1.5 text-primary">
          <Info className="w-3.5 h-3.5" /> Decision support — not a prescription
        </p>
        <p className="text-[11px] text-muted-foreground mt-0.5">
          This plan records the treatment decision taken by the clinician, with its monitoring and safety requirements.
          It does not prescribe, adjust a dose or stop a therapy. Prescribe through the AMedix prescription module, which
          re-checks the patient's medication list and allergies.
        </p>
      </div>

      <RheumTreatmentPlanEditor entries={plan} onChange={(entries) => update({ plan: entries })} />

      {plan.length > 0 && (
        <>
          <RheumMonitoringPanel entries={plan} onChange={(entries) => update({ plan: entries })} />
          <RheumAlertPanel
            alerts={alerts}
            triggers={triggers}
            onTriggers={(t) => update({ triggers: t })}
            nextAssessment={safe.next_assessment || ""}
            onNextAssessment={(v) => update({ next_assessment: v })}
            medications={medications}
            allergies={allergies}
            prescriptions={prescriptions}
            loading={loading}
          />
        </>
      )}
    </div>
  );
}