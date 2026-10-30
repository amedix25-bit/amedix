// Contextual safety alerts and the readable record for the rheumatology
// treatment plan. Decision support only: every alert explains itself, names
// the action a clinician must take, and cites its source. Nothing here
// prescribes, changes a dose, or stops a treatment.
import { SOURCES, getDrug, classLabel, evaluateMonitoring, detectInteractions, allergyConflicts, monitoringRequirements } from "./rheumTreatment.js";

const iso = (d) => d.toISOString().slice(0, 10);
const line = (label, value) => (value ? `${label}: ${String(value).trim()}` : "");

export function buildSafetyAlerts({
  entries = [],
  medications = [],
  allergies = [],
  triggers = {},
  lastAssessmentDate = "",
  plannedReviewDate = "",
  diseaseLabel = "",
  patient = null,
}, today = new Date()) {
  const alerts = [];
  const documented = (entries || []).map((e) => e.drug_key || e.drug).filter(Boolean);
  const existing = (medications || []).map((m) => m.name).filter(Boolean);
  const allNames = [...new Set([...documented, ...existing])];
  const drugs = documented.map(getDrug).filter(Boolean);
  const immunosuppressed = drugs.some((d) => d.immunosuppressant)
    || (medications || []).some((m) => {
      const n = String(m.name || "").toLowerCase();
      return ["methotrexate", "azathioprine", "mycophenolate", "ciclosporin", "tacrolimus", "prednisolone"].some((k) => n.indexOf(k) !== -1);
    });

  detectInteractions(allNames).forEach((i) => alerts.push({
    level: i.level, title: i.title, detail: i.detail, action: i.action, reference: i.reference,
  }));

  allergyConflicts(documented, allergies).forEach((a) => alerts.push(a));

  const monitoring = evaluateMonitoring(entries, today);
  const abnormal = monitoring.filter((m) => m.status === "abnormal");
  const overdue = monitoring.filter((m) => m.status === "overdue");
  const missing = monitoring.filter((m) => m.status === "not_documented");

  if (abnormal.length) alerts.push({
    level: "high",
    title: "Clinically significant monitoring abnormality recorded",
    detail: abnormal.map((m) => `${m.drugName} — ${m.label}${m.result ? `: ${m.result}` : ""}`).join("; "),
    action: "Review the result against the therapy's monitoring requirements and document the decision before the next dose.",
    reference: abnormal[0].reference,
  });
  if (overdue.length) alerts.push({
    level: "moderate",
    title: "Monitoring is overdue",
    detail: overdue.map((m) => `${m.drugName} — ${m.label} (due ${m.next_due || "now"})`).join("; "),
    action: "Arrange the overdue tests and document the review; the requirement is not complete until the result has been seen.",
    reference: overdue[0].reference,
  });
  if (missing.length) alerts.push({
    level: "moderate",
    title: "Baseline / monitoring results are not documented",
    detail: missing.slice(0, 6).map((m) => `${m.drugName} — ${m.label}`).join("; ") + (missing.length > 6 ? `; and ${missing.length - 6} more` : ""),
    action: "Record the baseline requirement or the result, or document why it is not indicated.",
    reference: missing[0].reference,
  });

  if (triggers.infection) alerts.push({
    level: "high",
    title: immunosuppressed ? "Suspected infection on immunosuppressive therapy" : "Suspected infection",
    detail: "Immunosuppressed patients may present without fever or with blunted inflammatory markers. Holding immunosuppressive therapy during a serious infection is a clinical decision, not an automatic one.",
    action: "Assess for sepsis, take cultures and imaging as indicated, and document whether therapy is held and who made that decision.",
    reference: `${SOURCES.ra2021} — infection section; product information for the individual agent`,
  });
  if (triggers.toxicity) alerts.push({
    level: "high",
    title: "Possible medication toxicity",
    detail: "The documented features may represent drug toxicity rather than disease activity. Toxicity is confirmed by the drug-specific tests and by the timing of symptoms relative to the dose.",
    action: "Check the drug-specific monitoring, review interacting medicines, and document the decision and any dose change.",
    reference: drugs[0] ? drugs[0].ref : SOURCES.smpc,
  });
  if (triggers.organThreatening) alerts.push({
    level: "high",
    title: `Possible organ-threatening ${diseaseLabel || "rheumatic disease"}`,
    detail: "Organ-threatening manifestations need urgent specialist assessment and, where indicated, high-intensity immunosuppression. The assessment is recorded, never inferred by the system.",
    action: "Arrange urgent specialist review, document the organ assessment and treatment decision, and give safety-net advice.",
    reference: /lupus|SLE/i.test(diseaseLabel) ? SOURCES.sle2023 : SOURCES.aav2021,
  });

  const glucocorticoid = drugs.find((d) => d.cls === "glucocorticoid");
  if (glucocorticoid) alerts.push({
    level: "info",
    title: "Glucocorticoid complications require ongoing prevention",
    detail: "Bone protection, blood pressure, glucose, weight, ocular and infection surveillance continue for as long as glucocorticoid exposure lasts, including during tapering.",
    action: "Confirm that bone protection and the metabolic surveillance are documented with the plan.",
    reference: SOURCES.giop2017,
  });

  if (immunosuppressed) alerts.push({
    level: "info",
    title: "Vaccination review on immunosuppression",
    detail: "Inactivated vaccines are safe and recommended; live vaccines are avoided during significant immunosuppression, and vaccine response may be reduced.",
    action: "Review the vaccination record and document the plan, including household vaccination where relevant.",
    reference: SOURCES.vacc2019,
  });

  const teratogenic = drugs.find((d) => d.teratogenic);
  if (teratogenic && patient && patient.gender === "female" && patient.date_of_birth) {
    const age = Math.floor((today - new Date(patient.date_of_birth)) / (365.25 * 86400000));
    if (age >= 12 && age <= 55) alerts.push({
      level: "high",
      title: `Teratogenic therapy in a patient of childbearing potential — ${teratogenic.name}`,
      detail: "Pregnancy status, contraception and a documented pregnancy-prevention plan are required before and during this therapy.",
      action: "Document the pregnancy test, the contraception plan and the counselling given.",
      reference: teratogenic.ref,
    });
  }

  const last = lastAssessmentDate ? new Date(lastAssessmentDate) : null;
  const review = plannedReviewDate ? new Date(plannedReviewDate) : null;
  if (last && review && review < today) alerts.push({
    level: "moderate",
    title: "Disease assessment is overdue against the planned review date",
    detail: `The last rheumatology assessment was ${iso(last)} and the planned review was ${iso(review)}.`,
    action: "Record the current disease-activity assessment and review the treat-to-target decision.",
    reference: SOURCES.eularRa2022,
  });
  if (last && !review && (today - last) / 86400000 > 182) alerts.push({
    level: "moderate",
    title: "No disease-activity assessment documented in the last 6 months",
    detail: `The last rheumatology assessment was ${iso(last)}. Treat-to-target decisions depend on a current activity measure.`,
    action: "Record a validated activity measure before adjusting therapy.",
    reference: SOURCES.eularRa2022,
  });

  const rank = { high: 0, moderate: 1, info: 2 };
  return alerts.sort((a, b) => rank[a.level] - rank[b.level]);
}

export function formatTreatmentPlan(value) {
  if (!value || typeof value !== "object") return "";
  const entries = Array.isArray(value.plan) ? value.plan : [];
  const triggers = value.triggers || {};
  const parts = [];

  entries.forEach((e) => {
    const drug = getDrug(e.drug_key || e.drug);
    const head = `${e.drug || "Treatment"}${drug ? ` (${classLabel(drug.cls)})` : ""}`;
    const fields = [
      line("Indication", e.indication),
      line("Dose", e.dose),
      line("Route", e.route),
      line("Frequency", e.frequency),
      line("Start", e.start_date),
      line("Duration", e.duration),
      line("Treatment target", e.target),
      line("Expected response", e.expected_response),
      line("Contraindications", e.contraindications),
      line("Counselling", e.counselling),
      line("Adverse effects", e.adverse_effects),
      line("Adherence", e.adherence),
      line("Planned review", e.planned_review),
    ].filter(Boolean);
    const monitoring = (Array.isArray(e.monitoring) ? e.monitoring : [])
      .filter((m) => m.last_date || m.result)
      .map((m) => {
        const req = (monitoringRequirements(e.drug_key || e.drug) || []).find((r) => r.test === m.test) || {};
        return `${req.label || m.test}: last ${m.last_date || "not recorded"}${m.result ? ` — ${m.result}` : ""}`;
      });
    parts.push(`• ${head}${fields.length ? ` — ${fields.join("; ")}` : ""}${monitoring.length ? `\n  Monitoring: ${monitoring.join("; ")}` : ""}`);
  });

  if (entries.length) parts.unshift("Treatment plan");
  const flags = [
    triggers.infection ? "suspected infection" : "",
    triggers.toxicity ? "possible medication toxicity" : "",
    triggers.organThreatening ? "possible organ-threatening manifestation" : "",
  ].filter(Boolean);
  if (flags.length) parts.push(`Clinical alerts documented at this assessment: ${flags.join(", ")}`);
  if (value.next_assessment) parts.push(`Next disease-activity assessment planned: ${value.next_assessment}`);
  return parts.join("\n");
}