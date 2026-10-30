// Serializes the structured Rheumatology fields into the readable text stored
// with a clinical note or document, so the diagnosis and investigation detail
// is preserved in the longitudinal record and in exports.
import { formatInstrumentEntry } from "@/lib/rheumInstruments";
import { formatTreatmentPlan } from "@/lib/rheumTreatmentSafety";
import { formatReferrals } from "@/lib/rheumReferrals";
import { formatEducation } from "@/lib/rheumEducation";
import { formatComparison } from "@/lib/rheumFollowup";
import { formatRenalLabRows } from "@/lib/renalLabs";
import { formatNephAlerts } from "@/lib/nephAlerts";
import { formatEntSafety } from "@/lib/entSafetyRules";
import { formatEndocrineSafety } from "@/lib/endocrineSafetyRules";
import { formatObgynSafety } from "@/lib/obgynSafetyRules";
import { formatEmergencySafety } from "@/lib/emergencySafetyRules";
import { formatCardiologySafety } from "@/lib/cardiologySafetyRules";
import { formatCardiologyScores } from "@/lib/cardiologyScores";
import { formatCardiologyStructured } from "@/lib/cardiologyInvestigationSpecs";
import { formatMedicationSafety } from "@/lib/cardiologyMedicationSafety";
import { formatEscalation } from "@/lib/cardiologyEscalation";
import { auditCodedDiagnoses } from "@/lib/cardiologyCodingGuidance";
import { formatNeurosurgeryGuidance } from "@/lib/neurosurgeryCoding";
import { formatNeurosurgicalExam } from "@/lib/neurosurgeryExam";
import { formatIsncsci } from "@/lib/neurosurgeryIsncsci";
import { formatNeurosurgeryScores } from "@/lib/neurosurgeryScores";
import { formatEmergencyPathway } from "@/lib/neurosurgeryEmergency";
import { formatOperativeRecord } from "@/lib/neurosurgeryOperative";
import { formatPostopMonitoring } from "@/lib/neurosurgeryPostop";
import { formatNephMedications } from "@/lib/nephMedications";
import { formatGastroBlock } from "@/lib/gastroenterologyModules";
import { formatGastroScores } from "@/lib/gastroenterologyScores";
import { formatGastroSafety } from "@/lib/gastroenterologySafetyRules";
import { formatOphthBlock } from "@/lib/ophthalmologyBlocks";
import { formatOphthInvestigations } from "@/lib/ophthalmologyInvestigation";
import { formatOphthScores } from "@/lib/ophthalmologyScores";
import { formatOphthSafety } from "@/lib/ophthalmologySafetyRules";
import { formatHemaBlock } from "@/lib/hematologyBlocks";
import { formatHemaLabs } from "@/lib/hematologyLabCatalogue";
import { formatHemaScores } from "@/lib/hematologyScores";
import { formatHemaSafety } from "@/lib/hematologySafetyRules";
import {
  akiStaging,
  albuminuriaCategoryFor,
  ckdCga,
  ckdRiskCategory,
  classifyKidneySyndrome,
  egfrCkdEpi2021,
  kfre4,
} from "@/lib/renalKdigo";

// The KDIGO panel stores the documented inputs; its calculated lines are
// rebuilt at read time from the same engine the form used, so the saved note,
// the screen and the PDF can never disagree.
function formatKdigoRenal(v) {
  if (!v || typeof v !== "object" || Array.isArray(v)) return String(v ?? "");
  const documented = v.egfr === "" || v.egfr === undefined ? null : Number(v.egfr);
  const calc = egfrCkdEpi2021({ creatinineUmol: v.current_creatinine, age: v.age, sex: v.sex });
  const egfr = Number.isFinite(documented) && documented > 0 ? documented : calc.value;
  const markers = Array.isArray(v.chronicity) ? v.chronicity : [];
  const cga = ckdCga({ egfr, uacrMgMmol: v.uacr, markers, durationDocumented: v.duration, cause: v.cause });
  const a = albuminuriaCategoryFor(v.uacr);
  const risk = cga.g && a ? ckdRiskCategory(cga.g.key, a.key) : null;
  const aki = akiStaging({
    baselineCreatinineUmol: v.baseline_creatinine,
    currentCreatinineUmol: v.current_creatinine,
    baselineHours: v.baseline_hours,
    urineOutputMl: v.urine_output_ml,
    urineHours: v.urine_hours,
    weightKg: v.weight_kg,
    rrtInitiated: v.rrt_initiated === "Yes",
  });
  const syndrome = classifyKidneySyndrome({
    akiStage: aki.stage,
    ckdEstablished: cga.established,
    chronicityDocumented: markers.length > 0,
  });
  const kfre = kfre4({ age: v.age, sex: v.sex, egfr, uacrMgMmol: v.uacr });

  const lines = [
    `Age ${v.age || "—"} · ${v.sex || "sex not documented"}`,
    `Current creatinine ${v.current_creatinine || "—"} µmol/L (${v.current_date || "date not documented"})`,
    `Baseline creatinine ${v.baseline_creatinine || "—"} µmol/L (${v.baseline_date || "date not documented"})`,
    `eGFR ${egfr ? `${egfr} mL/min/1.73 m² (${Number.isFinite(documented) && documented > 0 ? "laboratory-reported" : "calculated, CKD-EPI 2021"})` : "not available"}`,
    `UACR ${v.uacr || "—"} mg/mmol → albuminuria ${a ? a.key : "not classified"}`,
    `CKD: ${cga.established ? `CGA ${cga.cga || `${cga.cause || "cause not documented"} · ${cga.g?.key || "G?"} · ${a?.key || "A?"}`}` : "not established — chronicity not documented"}${risk ? ` · ${risk.label}` : ""}`,
    `Chronicity basis: ${cga.chronicityBasis.length ? cga.chronicityBasis.join("; ") : "none documented"}`,
    `AKI: ${aki.stage === null ? "not classifiable (baseline and current creatinine required)" : aki.label}${aki.criteria.length ? ` — ${aki.criteria.join("; ")}` : ""}`,
    `Syndrome: ${syndrome.label}`,
    `Kidney failure risk (KFRE 4-variable): ${kfre.missing.length ? `not calculated — missing ${kfre.missing.join(", ")}` : `2-year ${kfre.risk2y}% · 5-year ${kfre.risk5y}% — estimate only, see method and limitations`}`,
  ];
  if (v.interpretation) lines.push(`Clinician interpretation: ${v.interpretation}`);
  return lines.join("\n");
}

export function formatFieldValue(type, value) {
  if (value === undefined || value === null) return "";

  if (type === "disease_activity" && Array.isArray(value)) {
    return value
      .map((e) => formatInstrumentEntry(e) + (e.inputs ? "" : ""))
      .join("\n");
  }

  if (type === "icd11_diagnoses" && Array.isArray(value)) {
    const lines = value
      .map((d) => {
        // The printed note never presents an unverified or absent code as a
        // verified ICD-11 code: the mapping state is stated in the text.
        const head = `${d.code || "No ICD-11 code"}${d.display ? ` ${d.display}` : ""}`.trim();
        const meta = [d.role, d.status, d.version].filter(Boolean).join(" · ");
        const mapping =
          d.mapping_state === "unresolved"
            ? "Unresolved mapping — no code assigned, coding review required"
            : d.mapping_state === "review_required"
              ? "Mapping review required — code not verified against the catalogue"
              : "Code verified against the ICD-11 catalogue";
        return (
          `${head}${meta ? ` — ${meta}` : ""}${d.category ? ` — Concept: ${d.category}` : ""} — ${mapping}` +
          (d.cluster ? ` — Postcoordinated cluster (as documented): ${String(d.cluster).trim()}` : "") +
          (d.clinician_confirmed ? " — Code independently checked by the clinician" : "") +
          (d.source ? ` — Verified against: ${String(d.source).trim()}` : "") +
          (d.coding_note ? ` — Coding instruction: ${String(d.coding_note).trim()}` : "") +
          (d.specificity_hint ? ` — ${d.specificity_hint}` : "") +
          (d.basis ? ` — Basis: ${String(d.basis).trim()}` : "") +
          (d.follow_up ? ` — Follow-up: ${String(d.follow_up).trim()}` : "")
        );
      })
      .join("\n");
    // Coding-consistency prompts travel with the printed note so a reviewer sees
    // them. They never alter, remove or add a clinician's diagnosis.
    const issues = auditCodedDiagnoses(value);
    const audit = issues.length
      ? `\nCoding review prompts (advisory — the clinician's documented diagnosis stands):\n${issues
          .map((i) => `   · ${i.message}`)
          .join("\n")}`
      : "";
    return `${lines}${audit}`;
  }

  // Glasgow Coma Scale — the components as examined and their sum. No severity
  // band is written into the record, because the band is an interpretation the
  // clinician makes, not something the app derives from a total.
  if (type === "gcs_score") {
    const v = value && typeof value === "object" && !Array.isArray(value) ? value : {};
    const part = (label, raw) => {
      const n = parseInt(String(raw || "").split(" — ")[0], 10);
      return Number.isFinite(n) ? `${label}${n}` : raw ? `${label} ${raw}` : `${label} not documented`;
    };
    const nums = [v.eye, v.verbal, v.motor].map((x) => parseInt(String(x || "").split(" — ")[0], 10));
    const total = nums.every((n) => Number.isFinite(n)) ? `GCS ${nums.reduce((a, b) => a + b, 0)}` : "GCS not calculable";
    return [`${part("E", v.eye)}, ${part("V", v.verbal)}, ${part("M", v.motor)}`, `${total} — sum of the documented components only`].join("\n");
  }

  // Resuscitation log — every event with the time as recorded, in order.
  if (type === "emergency_resuscitation" && Array.isArray(value)) {
    if (!value.length) return "No resuscitation events recorded.";
    return value
      .map((r) => `${r.time || "time not documented"} — ${r.event || "event not documented"}${r.detail ? `: ${String(r.detail).trim()}` : ""}`)
      .join("\n");
  }

  // A validated decision rule, recorded as applied or considered — with its
  // eligibility, exclusions, missing variables and the result as documented.
  if (type === "decision_rule") {
    const v = value && typeof value === "object" && !Array.isArray(value) ? value : {};
    if (!v.rule) return "";
    return [
      `Rule: ${v.rule}`,
      `Use: ${v.applied || "not documented"}`,
      v.eligibility ? `Exclusions: ${v.eligibility}` : "",
      v.eligibility_detail ? `Eligibility: ${String(v.eligibility_detail).trim()}` : "",
      v.variables ? `Required variables: ${v.variables}` : "",
      v.result ? `Result as documented: ${String(v.result).trim()}` : "",
      v.limitations ? `Limitations: ${String(v.limitations).trim()}` : "",
      "No score was calculated or interpreted by AMedix; the rule is decision support only.",
    ]
      .filter(Boolean)
      .join("\n");
  }

  if (type === "investigation_panels" && Array.isArray(value)) {
    return value
      .map((i) => {
        const detail = [
          i.indication ? `Indication: ${String(i.indication).trim()}` : "",
          i.result ? `Result: ${String(i.result).trim()}${i.units ? ` ${i.units}` : ""}` : "",
          i.reference_range ? `Reference: ${String(i.reference_range).trim()}` : "",
          i.interpretation ? `Interpretation: ${i.interpretation}` : "",
          i.follow_up ? `Action: ${String(i.follow_up).trim()}` : "",
        ]
          .filter(Boolean)
          .join("; ");
        return `${i.name}${i.panel ? ` [${i.panel}]` : ""}${i.status ? ` — ${i.status}` : ""}${detail ? ` — ${detail}` : ""}`;
      })
      .join("\n");
  }

  if (type === "renal_labs" && Array.isArray(value)) return formatRenalLabRows(value);
  if (type === "kdigo_renal") return formatKdigoRenal(value);
  if (type === "neph_alerts") return formatNephAlerts(value);
  if (type === "ent_safety") return formatEntSafety(value);
  if (type === "endocrine_safety") return formatEndocrineSafety(value);
  if (type === "obgyn_safety") return formatObgynSafety(value);
  if (type === "emergency_safety") return formatEmergencySafety(value);
  if (type === "cardio_safety") return formatCardiologySafety(value);
  if (type === "cardio_scores") return formatCardiologyScores(value);
  if (type === "cardio_medication_safety") return formatMedicationSafety(value);
  if (type === "cardio_escalation") return formatEscalation(value);
  if (type === "cardio_ecg" || type === "cardio_echo" || type === "cardio_labs")
    return formatCardiologyStructured(type, value);
  if (type === "neph_medications") return formatNephMedications(value);
  if (type === "nsg_guidance") return formatNeurosurgeryGuidance(value);
  if (type === "nsg_exam") return formatNeurosurgicalExam(value);
  if (type === "nsg_isncsci") return formatIsncsci(value);
  if (type === "nsg_scores") return formatNeurosurgeryScores(value);
  if (type === "nsg_emergency") return formatEmergencyPathway(value);
  if (type === "nsg_operative") return formatOperativeRecord(value);
  if (type === "nsg_postop") return formatPostopMonitoring(value);
  if (type === "gi_modules") return formatGastroBlock(value);
  if (type === "gi_scores") return formatGastroScores(value);
  if (type === "gi_safety") return formatGastroSafety(value);
  if (type === "gi_guidance") return value && typeof value === "object" ? String(value.text || "") : String(value || "");
  if (type === "ophth_modules") return formatOphthBlock(value);
  if (type === "ophth_investigations") return formatOphthInvestigations(value);
  if (type === "ophth_scores") return formatOphthScores(value);
  if (type === "ophth_safety") return formatOphthSafety(value);
  if (type === "ophth_guidance") return value && typeof value === "object" ? String(value.text || "") : String(value || "");
  if (type === "hema_modules") return formatHemaBlock(value);
  if (type === "hema_labs") return formatHemaLabs(value);
  if (type === "hema_scores") return formatHemaScores(value);
  if (type === "hema_safety") return formatHemaSafety(value);

  if (type === "rheum_treatment") return formatTreatmentPlan(value);
  if (type === "rheum_comparison") return formatComparison(value);
  if (type === "rheum_referrals") return formatReferrals(value);
  if (type === "rheum_education") return formatEducation(value);

  return String(value);
}