import React, { useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { EMERGENCY_WORKFLOW } from "@/lib/specialtyDocuments";
import { ArrowRight, ChevronDown } from "lucide-react";
import MedicalDictationButton from "@/components/doctor/dictation/MedicalDictationButton";
import SelectExamination from "@/components/doctor/notes/SelectExamination";
import VitalSignsField from "@/components/doctor/notes/VitalSignsField";
import Icd11DiagnosisField from "@/components/doctor/notes/Icd11DiagnosisField";
import RheumInvestigationPanels from "@/components/doctor/notes/RheumInvestigationPanels";
import RenalLabsField from "@/components/doctor/notes/RenalLabsField";
import KdigoRenalField from "@/components/doctor/notes/KdigoRenalField";
import NephrologyAlertsField from "@/components/doctor/notes/NephrologyAlertsField";
import EntSafetyPromptsField from "@/components/doctor/notes/EntSafetyPromptsField";
import EndocrineSafetyPromptsField from "@/components/doctor/notes/EndocrineSafetyPromptsField";
import ObgynSafetyPromptsField from "@/components/doctor/notes/ObgynSafetyPromptsField";
import EmergencySafetyPromptsField from "@/components/doctor/notes/EmergencySafetyPromptsField";
import CardiologySafetyPromptsField from "@/components/doctor/notes/CardiologySafetyPromptsField";
import CardiologyScoresField from "@/components/doctor/notes/CardiologyScoresField";
import CardiologyStructuredField from "@/components/doctor/notes/CardiologyStructuredField";
import CardiologyMedicationSafetyField from "@/components/doctor/notes/CardiologyMedicationSafetyField";
import CardiologyEscalationField from "@/components/doctor/notes/CardiologyEscalationField";
import NeurosurgeryGuidanceField from "@/components/doctor/notes/NeurosurgeryGuidanceField";
import NeurosurgicalExamField from "@/components/doctor/notes/NeurosurgicalExamField";
import IsncsiAssessmentField from "@/components/doctor/notes/IsncsiAssessmentField";
import NeurosurgeryScoresField from "@/components/doctor/notes/NeurosurgeryScoresField";
import EmergencyPathwayField from "@/components/doctor/notes/EmergencyPathwayField";
import OperativeRecordField from "@/components/doctor/notes/OperativeRecordField";
import PostopMonitoringField from "@/components/doctor/notes/PostopMonitoringField";
import GcsScoreField from "@/components/doctor/notes/GcsScoreField";
import EmergencyResuscitationField from "@/components/doctor/notes/EmergencyResuscitationField";
import DecisionRuleField from "@/components/doctor/notes/DecisionRuleField";
import NephMedicationsField from "@/components/doctor/notes/NephMedicationsField";
import ActivityInstrumentsField from "@/components/doctor/notes/ActivityInstrumentsField";
import RheumTreatmentField from "@/components/doctor/notes/RheumTreatmentField";
import RheumComparisonField from "@/components/doctor/notes/RheumComparisonField";
import RheumReferralsField from "@/components/doctor/notes/RheumReferralsField";
import RheumEducationField from "@/components/doctor/notes/RheumEducationField";
import GastroBlockField from "@/components/doctor/notes/GastroBlockField";
import GastroScoresField from "@/components/doctor/notes/GastroScoresField";
import GastroSafetyPromptsField from "@/components/doctor/notes/GastroSafetyPromptsField";
import GastroGuidanceField from "@/components/doctor/notes/GastroGuidanceField";
import OphthalmologyBlockField from "@/components/doctor/notes/OphthalmologyBlockField";
import OphthalmologyScoresField from "@/components/doctor/notes/OphthalmologyScoresField";
import OphthalmologySafetyPromptsField from "@/components/doctor/notes/OphthalmologySafetyPromptsField";
import OphthalmologyGuidanceField from "@/components/doctor/notes/OphthalmologyGuidanceField";
import OphthalmologyInvestigationsField from "@/components/doctor/notes/OphthalmologyInvestigationsField";
import HematologyBlockField from "@/components/doctor/notes/HematologyBlockField";
import HematologyLabsField from "@/components/doctor/notes/HematologyLabsField";
import HematologyScoresField from "@/components/doctor/notes/HematologyScoresField";
import HematologySafetyPromptsField from "@/components/doctor/notes/HematologySafetyPromptsField";
import AllergyBlockField from "@/components/doctor/notes/AllergyBlockField";
import AllergyTestsField from "@/components/doctor/notes/AllergyTestsField";
import AllergySafetyPromptsField from "@/components/doctor/notes/AllergySafetyPromptsField";
import AllergyGuidanceField from "@/components/doctor/notes/AllergyGuidanceField";
import AllergyTreatmentField from "@/components/doctor/notes/AllergyTreatmentField";
import OrthopedicsSafetyPromptsField from "@/components/doctor/notes/OrthopedicsSafetyPromptsField";
import OrthopedicsTraumaField from "@/components/doctor/notes/OrthopedicsTraumaField";
import OrthopedicsHealingField from "@/components/doctor/notes/OrthopedicsHealingField";
import NeurologyBlockField from "@/components/doctor/notes/NeurologyBlockField";
import NeurologyScoresField from "@/components/doctor/notes/NeurologyScoresField";
import NeurologyEmergencyField from "@/components/doctor/notes/NeurologyEmergencyField";
import NeurologySafetyPromptsField from "@/components/doctor/notes/NeurologySafetyPromptsField";
import PedsBlockField from "@/components/doctor/notes/PedsBlockField";
import PedsSafetyPromptsField from "@/components/doctor/notes/PedsSafetyPromptsField";
import PedsGuidanceField from "@/components/doctor/notes/PedsGuidanceField";
import NeurologyGuidanceField from "@/components/doctor/notes/NeurologyGuidanceField";
import NeurologyMedicationField from "@/components/doctor/notes/NeurologyMedicationField";
import NeurologyEscalationField from "@/components/doctor/notes/NeurologyEscalationField";

// Renders the structured fields of a specialty clinical document type
// (single-line inputs, numbers, multi-line notes and fixed-option selects),
// plus the emergency workflow strip for Emergency Medicine documents.
// Fields that carry a `section` label are grouped under that heading inside
// the same form; document types without sections render exactly as before.
export function EmergencyWorkflowStrip() {
  return (
    <div className="rounded-lg bg-primary/5 border border-primary/20 p-3">
      <p className="text-xs font-semibold text-primary uppercase tracking-wide mb-2">Emergency Workflow</p>
      <div className="flex flex-wrap items-center gap-1.5 text-xs">
        {EMERGENCY_WORKFLOW.map((stage, i) => (
          <span key={stage} className="flex items-center gap-1.5">
            <span className="px-2 py-1 rounded-md bg-card border border-border font-medium">{stage}</span>
            {i < EMERGENCY_WORKFLOW.length - 1 && <ArrowRight className="w-3 h-3 text-muted-foreground" />}
          </span>
        ))}
      </div>
    </div>
  );
}

function FieldRow({ f, values, onChange, specialty, patientId }) {
  // Numeric safeguards — a field that declares min/max/unit is warned about
  // when the entry falls outside the expected range, so a dose, weight or score
  // recorded in the wrong unit is caught before the note is signed. The value
  // is never silently corrected.
  const rawNumber = values[f.key];
  const parsedNumber = parseFloat(rawNumber);
  const numberOutOfRange =
    f.type === "number" &&
    rawNumber !== "" &&
    rawNumber !== undefined &&
    rawNumber !== null &&
    !Number.isNaN(parsedNumber) &&
    ((typeof f.min === "number" && parsedNumber < f.min) ||
      (typeof f.max === "number" && parsedNumber > f.max));
  return (
    <div className="space-y-1.5">
      <Label>
        {f.safetyCritical && (
          <span className="mr-1.5 text-[10px] uppercase tracking-wide font-semibold text-amber-700 dark:text-amber-400 border border-amber-400/60 dark:border-amber-600/60 rounded px-1 py-0.5 align-middle">
            Safety-critical
          </span>
        )}
        {f.label}
        {f.required && <span className="text-destructive font-semibold"> · Required</span>}
      </Label>
      {f.type === "textarea" && (
        <>
          <Textarea rows={2} value={values[f.key] ?? ""} onChange={(e) => onChange(f.key, e.target.value)} />
          <MedicalDictationButton
            value={values[f.key] ?? ""}
            onChange={(v) => onChange(f.key, v)}
            specialty={specialty}
            contextLabel={f.label}
          />
        </>
      )}
      {f.type === "input" && (
        <>
          <Input value={values[f.key] ?? ""} onChange={(e) => onChange(f.key, e.target.value)} />
          <MedicalDictationButton
            value={values[f.key] ?? ""}
            onChange={(v) => onChange(f.key, v)}
            specialty={specialty}
            contextLabel={f.label}
          />
        </>
      )}
      {f.type === "number" && (
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <Input
              type="number"
              value={values[f.key] ?? ""}
              min={f.min}
              max={f.max}
              step={f.step || "any"}
              onChange={(e) => onChange(f.key, e.target.value)}
              className={numberOutOfRange ? "border-destructive" : ""}
            />
            {f.unit && <span className="text-xs text-muted-foreground shrink-0">{f.unit}</span>}
          </div>
          {numberOutOfRange && (
            <p className="text-[11px] text-destructive">
              Outside the expected range
              {typeof f.min === "number" && typeof f.max === "number"
                ? ` (${f.min}–${f.max}${f.unit ? ` ${f.unit}` : ""})`
                : ""}
              {" "}— check the value and the unit before signing.
            </p>
          )}
        </div>
      )}
      {f.type === "vitals" && (
        <VitalSignsField value={values[f.key]} onChange={(v) => onChange(f.key, v)} />
      )}
      {f.type === "examinations" && (
        <SelectExamination
          value={values[f.key]}
          onChange={(v) => onChange(f.key, v)}
          types={f.examinationTypes}
          specialtyKey={f.specialty}
        />
      )}
      {f.type === "icd11_diagnoses" && (
        <Icd11DiagnosisField
          value={values[f.key]}
          onChange={(v) => onChange(f.key, v)}
          catalog={f.catalog}
          searchPlaceholder={f.searchPlaceholder}
          catalogRelease={f.catalogRelease}
          catalogNote={f.catalogNote}
          statuses={f.statuses}
          roles={f.roles}
          showCategory={f.showCategory}
          categories={f.categories}
          clusterEnabled={f.clusterEnabled}
          clusterNote={f.clusterNote}
          requireConfirmation={f.requireConfirmation}
          extraFields={f.extraFields}
          unspecifiedJustification={f.unspecifiedJustification}
        />
      )}
      {f.type === "gcs_score" && (
        <GcsScoreField value={values[f.key]} onChange={(v) => onChange(f.key, v)} />
      )}
      {f.type === "nsg_exam" && (
        <NeurosurgicalExamField value={values[f.key]} onChange={(v) => onChange(f.key, v)} />
      )}
      {f.type === "nsg_isncsci" && (
        <IsncsiAssessmentField value={values[f.key]} onChange={(v) => onChange(f.key, v)} />
      )}
      {f.type === "nsg_scores" && (
        <NeurosurgeryScoresField value={values[f.key]} values={values} onChange={(v) => onChange(f.key, v)} />
      )}
      {f.type === "nsg_emergency" && (
        <EmergencyPathwayField value={values[f.key]} onChange={(v) => onChange(f.key, v)} />
      )}
      {f.type === "nsg_operative" && (
        <OperativeRecordField value={values[f.key]} onChange={(v) => onChange(f.key, v)} />
      )}
      {f.type === "nsg_postop" && (
        <PostopMonitoringField
          value={values[f.key]}
          variant={f.variant}
          onChange={(v) => onChange(f.key, v)}
        />
      )}
      {f.type === "emergency_resuscitation" && (
        <EmergencyResuscitationField value={values[f.key]} onChange={(v) => onChange(f.key, v)} />
      )}
      {f.type === "decision_rule" && (
        <DecisionRuleField value={values[f.key]} onChange={(v) => onChange(f.key, v)} ruleOptions={f.ruleOptions} />
      )}
      {f.type === "investigation_panels" && (
        <RheumInvestigationPanels value={values[f.key]} onChange={(v) => onChange(f.key, v)} />
      )}
      {f.type === "renal_labs" && (
        <RenalLabsField value={values[f.key]} onChange={(v) => onChange(f.key, v)} panels={f.panels} />
      )}
      {f.type === "kdigo_renal" && (
        <KdigoRenalField value={values[f.key]} onChange={(v) => onChange(f.key, v)} />
      )}
      {f.type === "neph_alerts" && (
        <NephrologyAlertsField
          value={values[f.key]}
          values={values}
          onChange={(v) => onChange(f.key, v)}
        />
      )}
      {f.type === "ent_safety" && (
        <EntSafetyPromptsField value={values[f.key]} values={values} onChange={(v) => onChange(f.key, v)} />
      )}
      {f.type === "endocrine_safety" && (
        <EndocrineSafetyPromptsField value={values[f.key]} values={values} onChange={(v) => onChange(f.key, v)} />
      )}
      {f.type === "obgyn_safety" && (
        <ObgynSafetyPromptsField value={values[f.key]} values={values} onChange={(v) => onChange(f.key, v)} />
      )}
      {f.type === "cardio_safety" && (
        <CardiologySafetyPromptsField value={values[f.key]} values={values} onChange={(v) => onChange(f.key, v)} />
      )}
      {f.type === "cardio_scores" && (
        <CardiologyScoresField value={values[f.key]} values={values} onChange={(v) => onChange(f.key, v)} />
      )}
      {f.type === "cardio_medication_safety" && (
        <CardiologyMedicationSafetyField value={values[f.key]} onChange={(v) => onChange(f.key, v)} />
      )}
      {f.type === "cardio_escalation" && (
        <CardiologyEscalationField value={values[f.key]} onChange={(v) => onChange(f.key, v)} />
      )}
      {f.type === "nsg_guidance" && (
        <NeurosurgeryGuidanceField
          value={values[f.key]}
          values={values}
          noteKey={f.noteKey}
          onChange={(v) => onChange(f.key, v)}
        />
      )}
      {(f.type === "cardio_ecg" || f.type === "cardio_echo" || f.type === "cardio_labs") && (
        <CardiologyStructuredField
          type={f.type}
          omit={f.omit}
          value={values[f.key]}
          onChange={(v) => onChange(f.key, v)}
        />
      )}
      {f.type === "emergency_safety" && (
        <EmergencySafetyPromptsField
          value={values[f.key]}
          values={values}
          capabilities={f.capabilities}
          onChange={(v) => onChange(f.key, v)}
        />
      )}
      {f.type === "neph_medications" && (
        <NephMedicationsField value={values[f.key]} onChange={(v) => onChange(f.key, v)} />
      )}
      {f.type === "disease_activity" && (
        <ActivityInstrumentsField
          value={values[f.key]}
          onChange={(v) => onChange(f.key, v)}
          instruments={f.instruments}
          patientId={patientId}
        />
      )}
      {f.type === "rheum_treatment" && (
        <RheumTreatmentField value={values[f.key]} onChange={(v) => onChange(f.key, v)} patientId={patientId} />
      )}
      {f.type === "rheum_comparison" && (
        <RheumComparisonField value={values[f.key]} onChange={(v) => onChange(f.key, v)} />
      )}
      {f.type === "rheum_referrals" && (
        <RheumReferralsField value={values[f.key]} onChange={(v) => onChange(f.key, v)} />
      )}
      {f.type === "rheum_education" && (
        <RheumEducationField value={values[f.key]} onChange={(v) => onChange(f.key, v)} />
      )}
      {f.type === "gi_modules" && (
        <GastroBlockField fieldKey={f.key} value={values[f.key]} onChange={(v) => onChange(f.key, v)} />
      )}
      {f.type === "gi_scores" && (
        <GastroScoresField value={values[f.key]} scores={f.scores} onChange={(v) => onChange(f.key, v)} />
      )}
      {f.type === "gi_safety" && (
        <GastroSafetyPromptsField value={values[f.key]} values={values} onChange={(v) => onChange(f.key, v)} />
      )}
      {f.type === "gi_guidance" && (
        <GastroGuidanceField
          noteKey={f.noteKey}
          value={values[f.key]}
          onChange={(v) => onChange(f.key, v)}
        />
      )}
      {f.type === "ophth_modules" && (
        <OphthalmologyBlockField fieldKey={f.key} value={values[f.key]} onChange={(v) => onChange(f.key, v)} />
      )}
      {f.type === "ophth_investigations" && (
        <OphthalmologyInvestigationsField value={values[f.key]} onChange={(v) => onChange(f.key, v)} />
      )}
      {f.type === "ophth_scores" && (
        <OphthalmologyScoresField value={values[f.key]} scores={f.scores} onChange={(v) => onChange(f.key, v)} />
      )}
      {f.type === "ophth_safety" && (
        <OphthalmologySafetyPromptsField value={values[f.key]} values={values} onChange={(v) => onChange(f.key, v)} />
      )}
      {f.type === "ophth_guidance" && (
        <OphthalmologyGuidanceField
          noteKey={f.noteKey}
          value={values[f.key]}
          onChange={(v) => onChange(f.key, v)}
        />
      )}
      {f.type === "allergy_modules" && (
        <AllergyBlockField fieldKey={f.key} value={values[f.key]} onChange={(v) => onChange(f.key, v)} />
      )}
      {f.type === "allergy_tests" && (
        <AllergyTestsField value={values[f.key]} onChange={(v) => onChange(f.key, v)} />
      )}
      {f.type === "allergy_safety" && (
        <AllergySafetyPromptsField value={values[f.key]} values={values} onChange={(v) => onChange(f.key, v)} />
      )}
      {f.type === "allergy_guidance" && (
        <AllergyGuidanceField noteKey={f.noteKey} value={values[f.key]} onChange={(v) => onChange(f.key, v)} />
      )}
      {f.type === "allergy_treatment" && (
        <AllergyTreatmentField value={values[f.key]} onChange={(v) => onChange(f.key, v)} />
      )}
      {f.type === "hema_modules" && (
        <HematologyBlockField fieldKey={f.key} value={values[f.key]} onChange={(v) => onChange(f.key, v)} />
      )}
      {f.type === "hema_labs" && (
        <HematologyLabsField value={values[f.key]} panels={f.panels} onChange={(v) => onChange(f.key, v)} />
      )}
      {f.type === "hema_scores" && (
        <HematologyScoresField value={values[f.key]} onChange={(v) => onChange(f.key, v)} />
      )}
      {f.type === "hema_safety" && (
        <HematologySafetyPromptsField value={values[f.key]} values={values} onChange={(v) => onChange(f.key, v)} />
      )}
      {f.type === "ortho_safety" && (
        <OrthopedicsSafetyPromptsField value={values[f.key]} values={values} onChange={(v) => onChange(f.key, v)} />
      )}
      {f.type === "ortho_trauma" && (
        <OrthopedicsTraumaField value={values[f.key]} onChange={(v) => onChange(f.key, v)} />
      )}
      {f.type === "ortho_healing" && (
        <OrthopedicsHealingField value={values[f.key]} onChange={(v) => onChange(f.key, v)} />
      )}
      {f.type === "neuro_modules" && (
        <NeurologyBlockField fieldKey={f.key} value={values[f.key]} onChange={(v) => onChange(f.key, v)} />
      )}
      {f.type === "neuro_scores" && (
        <NeurologyScoresField value={values[f.key]} scores={f.scores} onChange={(v) => onChange(f.key, v)} />
      )}
      {f.type === "neuro_safety" && (
        <NeurologySafetyPromptsField value={values[f.key]} values={values} onChange={(v) => onChange(f.key, v)} />
      )}
      {f.type === "neuro_emergency" && (
        <NeurologyEmergencyField value={values[f.key]} onChange={(v) => onChange(f.key, v)} />
      )}
      {f.type === "neuro_medications" && (
        <NeurologyMedicationField value={values[f.key]} onChange={(v) => onChange(f.key, v)} />
      )}
      {f.type === "neuro_escalation" && (
        <NeurologyEscalationField value={values[f.key]} onChange={(v) => onChange(f.key, v)} />
      )}
      {f.type === "neuro_guidance" && (
        <NeurologyGuidanceField noteKey={f.noteKey} value={values[f.key]} onChange={(v) => onChange(f.key, v)} />
      )}
      {f.type === "peds_modules" && (
        <PedsBlockField fieldKey={f.key} value={values[f.key]} onChange={(v) => onChange(f.key, v)} />
      )}
      {f.type === "peds_safety" && (
        <PedsSafetyPromptsField value={values[f.key]} values={values} onChange={(v) => onChange(f.key, v)} />
      )}
      {f.type === "peds_guidance" && (
        <PedsGuidanceField noteKey={f.noteKey} value={values[f.key]} onChange={(v) => onChange(f.key, v)} />
      )}
      {f.type === "select" && (
        <Select value={values[f.key] || undefined} onValueChange={(v) => onChange(f.key, v)}>
          <SelectTrigger className="w-full"><SelectValue placeholder="Select..." /></SelectTrigger>
          <SelectContent>
            {f.options.map((o) => (
              <SelectItem key={o} value={o}>{o}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      )}
    </div>
  );
}

// Conditional documentation — a field that declares `showIf` appears only when
// its controlling answer matches, so clinically relevant follow-up questions
// are asked without showing an unrelated wall of inputs.
export function isFieldVisible(f = {}, values = {}) {
  if (!f.showIf) return true;
  const controlling = values[f.showIf.key];
  if (Array.isArray(f.showIf.in)) return f.showIf.in.includes(controlling);
  return controlling === f.showIf.equals;
}

// A section of the note. Expandable so a long rheumatology note stays
// navigable, with the number of required questions still unanswered in that
// section, and a clear marker when the section records earlier events rather
// than today's findings.
function SectionGroup({ section, fields, values, onChange, specialty, patientId }) {
  const [open, setOpen] = useState(false);
  const unanswered = fields.filter((f) => f.required && String(values[f.key] ?? "").trim() === "").length;
  const historical = /^(past|previous|prior|interval)/i.test(section);
  return (
    <div className="rounded-lg border border-border overflow-hidden">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        className="w-full flex items-center justify-between gap-2 px-3 py-2 text-left bg-muted/40 hover:bg-muted/60 transition-colors"
      >
        <span className="flex items-center gap-2 min-w-0">
          <ChevronDown className={`w-3.5 h-3.5 shrink-0 text-muted-foreground transition-transform ${open ? "" : "-rotate-90"}`} />
          <span className="text-xs font-semibold text-primary uppercase tracking-wide truncate">{section}</span>
          {historical && (
            <span className="shrink-0 text-[10px] px-1.5 py-0.5 rounded bg-background border border-border text-muted-foreground">
              Earlier record
            </span>
          )}
        </span>
        {unanswered > 0 && (
          <span className="shrink-0 text-[10px] font-semibold text-destructive">
            {unanswered} required unanswered
          </span>
        )}
      </button>
      {open && (
        <div className="space-y-4 px-3 pb-3 pt-3">
          {fields.map((f) => (
            <FieldRow key={f.key} f={f} values={values} onChange={onChange} specialty={specialty} patientId={patientId} />
          ))}
        </div>
      )}
    </div>
  );
}

// Consecutive fields sharing the same section heading form one group.
function groupFields(defs) {
  const groups = [];
  defs.forEach((f) => {
    const section = f.section || "";
    const last = groups[groups.length - 1];
    if (last && last.section === section) last.fields.push(f);
    else groups.push({ section, fields: [f] });
  });
  return groups;
}

export default function DocumentFields({ defs = [], values = {}, onChange, specialty = "", notice = "", patientId = "" }) {
  const visible = defs.filter((f) => isFieldVisible(f, values));
  if (!visible.some((f) => f.section)) {
    return (
      <div className="space-y-4">
        {notice && <p className="text-xs text-muted-foreground rounded-md bg-muted/50 border border-border p-2.5">{notice}</p>}
        {visible.map((f) => (
          <FieldRow key={f.key} f={f} values={values} onChange={onChange} specialty={specialty} patientId={patientId} />
        ))}
      </div>
    );
  }

  const groups = groupFields(visible);
  const unansweredRequired = visible.filter((f) => f.required && String(values[f.key] ?? "").trim() === "").length;

  return (
    <div className="space-y-4">
      {notice && <p className="text-xs text-muted-foreground rounded-md bg-muted/50 border border-border p-2.5">{notice}</p>}
      {unansweredRequired > 0 && (
        <p className="text-xs rounded-md bg-destructive/5 border border-destructive/25 text-destructive px-2.5 py-2">
          {unansweredRequired} required {unansweredRequired === 1 ? "question is" : "questions are"} still unanswered. The note cannot be saved until they are completed.
        </p>
      )}
      {groups.map((g, gi) => (
        <div key={g.section || `section-${gi}`} className="space-y-3">
          {g.section ? (
            <SectionGroup
              section={g.section}
              fields={g.fields}
              values={values}
              onChange={onChange}
              specialty={specialty}
              patientId={patientId}
            />
          ) : (
            <div className="space-y-4">
              {g.fields.map((f) => (
                <FieldRow key={f.key} f={f} values={values} onChange={onChange} specialty={specialty} patientId={patientId} />
              ))}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}