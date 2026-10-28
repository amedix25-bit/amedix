// Serializes the structured Rheumatology fields into the readable text stored
// with a clinical note or document, so the diagnosis and investigation detail
// is preserved in the longitudinal record and in exports.
import { formatInstrumentEntry } from "@/lib/rheumInstruments";
import { formatTreatmentPlan } from "@/lib/rheumTreatmentSafety";
import { formatReferrals } from "@/lib/rheumReferrals";
import { formatEducation } from "@/lib/rheumEducation";
import { formatComparison } from "@/lib/rheumFollowup";
import { formatRenalLabRows } from "@/lib/renalLabs";
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
    return value
      .map((d) => {
        const head = `${d.code || ""} ${d.display || ""}`.trim();
        const meta = [d.role, d.status, d.version].filter(Boolean).join(" · ");
        return (
          `${head}${meta ? ` — ${meta}` : ""}` +
          (d.basis ? ` — Basis: ${String(d.basis).trim()}` : "") +
          (d.follow_up ? ` — Follow-up: ${String(d.follow_up).trim()}` : "") +
          (d.manual ? " — code entered from the WHO browser" : "")
        );
      })
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

  if (type === "rheum_treatment") return formatTreatmentPlan(value);
  if (type === "rheum_comparison") return formatComparison(value);
  if (type === "rheum_referrals") return formatReferrals(value);
  if (type === "rheum_education") return formatEducation(value);

  return String(value);
}