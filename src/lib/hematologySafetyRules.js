// Haematology patient-safety prompts.
//
// WHAT A PROMPT IS — AND IS NOT
// A prompt appears only when this encounter documented something that raises it:
// a recorded result that crosses a stated threshold, a structured finding the
// clinician entered, an emergency presentation selected in the condition block,
// or a concern the clinician ticked. Nothing is inferred from an unanswered
// field, and an empty panel states that it is not reassurance.
//
// A prompt never diagnoses, prescribes, starts anticoagulation, orders blood or
// changes treatment. It records what was documented, the threshold that was
// crossed, the escalation the cited source defines, and the action the clinician
// actually took. Treatment begins with the treating team, not with this note.
//
// THRESHOLDS are declared once, here, with their source. They are configurable
// per encounter: the value in use is stored with the note and printed beside the
// prompt, so a local protocol can differ from the default without the stored
// record becoming ambiguous. Where a threshold is not defined by a published
// guideline it is labelled a LOCAL DECISION and requires Haematology approval.
//
// ATTRIBUTION: an ASH guideline is cited only where one covers the question. The
// rest are labelled with the complementary body that actually publishes them —
// AABB, IDSA/ASCO-ESMO, ISTH, BSH — and never as ASH.

import { HEMA_ASH_GAPS } from "@/lib/hematologyAshGuidelines";

export const HEMA_SAFETY_PROVENANCE = {
  ash_guideline: "ASH guideline",
  complementary: "Complementary guideline — ASH publishes none for this question",
  local: "AMedix local decision — requires Haematology approval",
};

const gapSource = (key) => {
  const gap = HEMA_ASH_GAPS.find((g) => g.key === key);
  if (!gap) return null;
  return {
    organization: gap.complementary.organization,
    title: gap.complementary.title,
    edition: gap.complementary.edition,
    url: gap.complementary.url,
  };
};

// ---------------------------------------------------------------------------
// Thresholds
// ---------------------------------------------------------------------------
export const HEMA_SAFETY_THRESHOLDS = [
  {
    key: "critical_hb",
    label: "Critical anaemia",
    value: 70,
    unit: "g/L",
    basis: "Restrictive red-cell transfusion threshold for the haemodynamically stable adult inpatient",
    provenance: "complementary",
    source: gapSource("gap_rbc_threshold"),
  },
  {
    key: "critical_hb_cardiac",
    label: "Critical anaemia with documented cardiac ischaemia or cardiac surgery",
    value: 80,
    unit: "g/L",
    basis: "Higher threshold where the AABB guideline documents cardiac surgery or pre-existing cardiovascular disease",
    provenance: "complementary",
    source: gapSource("gap_rbc_threshold"),
  },
  {
    key: "severe_plt",
    label: "Severe thrombocytopenia",
    value: 20,
    unit: "×10⁹/L",
    basis: "Local threshold for flagging severe thrombocytopenia; the treatment threshold in ITP is a clinical decision",
    provenance: "local",
    source: null,
  },
  {
    key: "severe_plt_procedure",
    label: "Thrombocytopenia before an invasive procedure",
    value: 50,
    unit: "×10⁹/L",
    basis: "Local pre-procedure threshold; the target for a specific procedure follows the local protocol",
    provenance: "local",
    source: null,
  },
  {
    key: "febrile_neutropenia_anc",
    label: "Neutrophil count defining neutropenia",
    value: 0.5,
    unit: "×10⁹/L",
    basis: "Absolute neutrophil count used in the febrile neutropenia definition",
    provenance: "complementary",
    source: gapSource("gap_febrile_neutropenia"),
  },
  {
    key: "fever_threshold",
    label: "Temperature defining fever in neutropenia",
    value: 38,
    unit: "°C",
    basis: "Single oral temperature used in the febrile neutropenia definition",
    provenance: "complementary",
    source: gapSource("gap_febrile_neutropenia"),
  },
  {
    key: "haemolysis_haptoglobin",
    label: "Haptoglobin suggesting haemolysis",
    value: 0.3,
    unit: "g/L",
    basis: "Lower limit of the customary adult haematology reference interval used in this catalogue",
    provenance: "local",
    source: null,
  },
];

export const HEMA_SAFETY_THRESHOLD_MAP = HEMA_SAFETY_THRESHOLDS.reduce((acc, t) => {
  acc[t.key] = t.value;
  return acc;
}, {});

const mergeThresholds = (override) => {
  const out = { ...HEMA_SAFETY_THRESHOLD_MAP };
  if (override && typeof override === "object") {
    Object.entries(override).forEach(([key, raw]) => {
      const n = Number(String(raw ?? "").trim());
      if (key in out && String(raw ?? "").trim() !== "" && Number.isFinite(n)) out[key] = n;
    });
  }
  return out;
};

// ---------------------------------------------------------------------------
// Prompts
// ---------------------------------------------------------------------------
const LEVEL_ORDER = { immediate: 0, same_day: 1, documented: 2 };

export const HEMA_SAFETY_CONCERNS = [
  { key: "critical_anaemia", label: "Critical anaemia — symptomatic or below threshold", level: "immediate" },
  { key: "severe_thrombocytopenia", label: "Severe thrombocytopenia", level: "same_day" },
  { key: "active_major_bleeding", label: "Active major bleeding", level: "immediate" },
  { key: "suspected_acute_leukaemia", label: "Suspected acute leukaemia or blast crisis", level: "same_day" },
  { key: "febrile_neutropenia", label: "Febrile neutropenia or suspected neutropenic sepsis", level: "immediate" },
  { key: "acute_thromboembolism", label: "Acute thromboembolism", level: "immediate" },
  { key: "severe_haemolysis", label: "Severe haemolysis or suspected thrombotic microangiopathy", level: "same_day" },
  { key: "sickle_emergency", label: "Sickle cell emergency", level: "immediate" },
  { key: "suspected_dic", label: "Suspected disseminated intravascular coagulation", level: "immediate" },
  { key: "acute_transfusion_reaction", label: "Acute transfusion reaction", level: "immediate" },
];

const SPECS = {
  critical_anaemia: {
    title: "Haemoglobin at or below the critical-anaemia threshold documented in this note",
    basis:
      "A haemoglobin at or below the transfusion threshold in a haemodynamically stable adult is the point at which the AABB international guideline supports considering red-cell transfusion rather than waiting. Cardiac surgery or documented cardiovascular disease raises the threshold. ASH publishes no red-cell threshold guideline outside sickle cell disease, so this threshold is cited to AABB, not to ASH.",
    action:
      "Record the repeat sample, whether the patient is symptomatic or bleeding, the cardiac history, and the decision taken — transfuse, treat the cause, or observe with a review interval. Transfusion is ordered only by the authorised prescriber; this prompt does not order it.",
    provenance: "complementary",
    source: gapSource("gap_rbc_threshold"),
  },
  severe_thrombocytopenia: {
    title: "Platelet count below the severe-thrombocytopenia threshold",
    basis:
      "A platelet count below 20 ×10⁹/L is the locally configured severe-thrombocytopenia threshold. In primary ITP the decision to treat is clinical and is not defined by the count alone, and the ASH ITP guideline addresses treatment thresholds and choices for ITP specifically — not thrombocytopenia of other causes.",
    action:
      "Record whether there is bleeding, the film and whether clumping or pseudothrombocytopenia was excluded, any drug cause, and the management decision with the review interval. Do not give intramuscular injections; record any procedure planned and its platelet target.",
    provenance: "local",
    source: null,
  },
  active_major_bleeding: {
    title: "Active major bleeding documented in this encounter",
    basis:
      "Active major bleeding is time-critical. In von Willebrand disease the ASH/ISTH/NHF/WFH guideline sets out haemostatic treatment, and in anticoagulated bleeding the reversal pathway is a local protocol decision. The site, the rate and the haemodynamic effect drive urgency, not the laboratory result alone.",
    action:
      "Record the bleeding site and rate, the haemodynamic state, whether anticoagulation or an antiplatelet agent is in use and what reversal was given, the haemostatic product given and the time, and who was escalated to. Escalate to the senior haematologist and the relevant surgical or endoscopic team now.",
    provenance: "ash_guideline",
    source: {
      organization: "ASH/ISTH/NHF/WFH",
      title: "Guidelines on the Diagnosis and Management of von Willebrand Disease",
      edition: "2021",
      url: "https://www.hematology.org/Resources/Clinical-Practice-Guidelines/Von-Willebrand-Disease-Guidelines",
    },
  },
  suspected_acute_leukaemia: {
    title: "Blasts or a leucoerythroblastic picture documented — acute leukaemia must be excluded",
    basis:
      "Blasts on the differential, unexplained cytopenias with blasts on the film, or a leucoerythroblastic picture require urgent morphological and immunophenotypic assessment. ASH has not published a diagnostic guideline for acute leukaemia in unselected adults, so no ASH statement is claimed here.",
    action:
      "Record the urgent blood-film and immunophenotyping request with the time it was made, the marrow request, the discussion with the on-call haematologist, and whether tumour lysis prophylaxis and neutropenic precautions have been started by the treating team. Same-day haematology review.",
    provenance: "local",
    source: null,
  },
  febrile_neutropenia: {
    title: "Fever with neutropenia documented — treat as an emergency",
    basis:
      "Fever with an absolute neutrophil count below 0.5 ×10⁹/L defines febrile neutropenia and requires empirical antibiotics without waiting for results. ASH publishes no febrile neutropenia guideline; the definition and pathway come from IDSA and ASCO/ESMO guidance.",
    action:
      "Record the temperature and time, the neutrophil count, the cultures taken before antibiotics, the empirical antibiotic and the time it was given, the risk stratification used, and the disposition. Escalate to the on-call haematologist or oncology team immediately.",
    provenance: "complementary",
    source: gapSource("gap_febrile_neutropenia"),
  },
  acute_thromboembolism: {
    title: "Thrombosis documented or suspected in this encounter",
    basis:
      "The ASH VTE guidelines define the diagnostic pathway after a clinical suspicion and the anticoagulation decision and duration that follow. Diagnosis and treatment are separated, and the choice of agent depends on the provoking factor, bleeding risk and comorbidity.",
    action:
      "Record the diagnostic pathway chosen and its result, the anticoagulation decision with the time it was made and by whom, the bleeding risk documented, and the planned duration. Anticoagulation is started only by the authorised prescriber.",
    provenance: "ash_guideline",
    source: {
      organization: "ASH",
      title: "ASH Clinical Practice Guidelines on Venous Thromboembolism",
      edition: "Topic series — snapshot set 2023",
      url: "https://www.hematology.org/Resources/Clinical-Practice-Guidelines/Venous-Thromboembolism-Guidelines",
    },
  },
  severe_haemolysis: {
    title: "Evidence of severe haemolysis documented in this note",
    basis:
      "A falling haemoglobin with a raised LDH, a low haptoglobin, a raised unconjugated bilirubin or a positive direct antiglobulin test requires the cause to be established, because immune haemolysis, a microangiopathy and a transfusion reaction have different and time-critical treatments. TTP is covered by ISTH guidance, not by ASH.",
    action:
      "Record the haemolysis markers with their dates, the DAT result, whether a microangiopathic picture is present (schistocytes, thrombocytopenia, renal injury, neurology), the ADAMTS13 request if TMA is suspected, and the treatment decision. Urgent haematology review for a suspected TMA.",
    provenance: "complementary",
    source: gapSource("gap_ttp"),
  },
  sickle_emergency: {
    title: "Sickle cell emergency documented in this encounter",
    basis:
      "Acute chest syndrome, stroke, priapism, splenic sequestration and severe vaso-occlusive crisis are time-critical. The ASH sickle cell disease guidelines cover cerebrovascular disease, cardiopulmonary and kidney disease, hydroxyurea dosing, pain management and transfusion support.",
    action:
      "Record the presenting emergency, the time it was recognised, the oxygen and analgesia given, the transfusion or exchange decision and the time it was made, and the escalation to the sickle cell team. Exchange transfusion decisions belong to the treating haematologist.",
    provenance: "ash_guideline",
    source: {
      organization: "ASH",
      title: "ASH Clinical Practice Guidelines on Sickle Cell Disease",
      edition: "Topic series (2019–2021 as published)",
      url: "https://www.hematology.org/Resources/Clinical-Practice-Guidelines/Sickle-Cell-Disease-Guidelines",
    },
  },
  suspected_dic: {
    title: "Disseminated intravascular coagulation suspected",
    basis:
      "DIC is diagnosed from a combination of the underlying condition, the platelet count, a fibrin-related marker, the prothrombin time and fibrinogen. The ISTH overt DIC score and its treatment guidance are the reference; ASH publishes no DIC guideline.",
    action:
      "Record the underlying cause, the ISTH score inputs, whether the score was calculated, the factor or plasma support given and why, and the escalation. A low score does not exclude DIC — repeat it if the picture is evolving.",
    provenance: "complementary",
    source: gapSource("gap_dic"),
  },
  acute_transfusion_reaction: {
    title: "Transfusion reaction documented — stop and investigate",
    basis:
      "A suspected acute transfusion reaction is managed by stopping the transfusion, maintaining the line, and reporting to the blood bank with the samples and observations the investigation requires. BSH and the national haemovigilance scheme publish this pathway; ASH publishes no acute transfusion reaction guideline.",
    action:
      "Record the time the transfusion was stopped, the observations and their timing, the samples and cultures taken, whether the blood bank was informed, the haemovigilance report filed, and the outcome for the patient.",
    provenance: "complementary",
    source: gapSource("gap_transfusion_reaction"),
  },
};

const basePrompt = (key, overrides = {}) => {
  const spec = SPECS[key];
  const concern = HEMA_SAFETY_CONCERNS.find((c) => c.key === key);
  if (!spec) return null;
  return {
    key,
    level: overrides.level || (concern ? concern.level : "documented"),
    title: overrides.title || spec.title,
    basis: spec.basis,
    action: spec.action,
    provenance: spec.provenance,
    source: spec.source,
    ...overrides,
  };
};

// ---------------------------------------------------------------------------
// Reading the recorded encounter
// ---------------------------------------------------------------------------
const str = (v) => String(v ?? "").trim();
const block = (values, key) => (values && typeof values[key] === "object" && !Array.isArray(values[key]) ? values[key] : {});
const has = (value, needle) => (Array.isArray(value) ? value.some((x) => str(x) === needle) : str(value) === needle);

const labRows = (values) =>
  Object.values(values || {})
    .filter(Array.isArray)
    .flat()
    .filter((row) => row && typeof row === "object" && "analyte" in row);

const labNumber = (rows, analyte) => {
  const row = rows.find((r) => r.analyte === analyte && str(r.value) !== "");
  if (!row) return null;
  const match = str(row.value).match(/-?\d+(?:\.\d+)?/);
  if (!match) return null;
  const value = Number(match[0]);
  if (!Number.isFinite(value)) return null;
  return { value, unit: str(row.unit), date: str(row.date) };
};

const describe = (found, label, unit) =>
  `${label} ${found.value}${found.unit || (unit ? ` ${unit}` : "")}${found.date ? ` (${found.date})` : " (date not recorded)"}`;

// Every rule reads only what this note records. A rule that cannot read a value
// stays silent rather than assuming a normal result.
const RULES = [
  (values, rows, t) => {
    const hb = labNumber(rows, "hb");
    if (!hb) return null;
    const cardiac =
      /cardiac|ischaemic|coronary|heart failure/i.test(str(block(values, "hema_presentation").presenting_problems)) ||
      /myocardial|cardiac/i.test(str(block(values, "hema_thrombosis_history").thrombosis_sites));
    const threshold = cardiac ? t.critical_hb_cardiac : t.critical_hb;
    if (hb.value > threshold) return null;
    return {
      key: "critical_anaemia",
      evidence: `${describe(hb, "Haemoglobin", "g/L")} — at or below the ${threshold} g/L threshold${cardiac ? " (documented cardiac disease)" : ""}`,
      title: `Haemoglobin ${hb.value}${hb.unit || " g/L"} — at or below the critical-anaemia threshold of ${threshold} g/L`,
    };
  },
  (values, rows, t) => {
    const plt = labNumber(rows, "plt");
    if (!plt || plt.value >= t.severe_plt) return null;
    return {
      key: "severe_thrombocytopenia",
      evidence: `${describe(plt, "Platelet count", "×10⁹/L")} — below the ${t.severe_plt} ×10⁹/L threshold`,
      title: `Platelet count ${plt.value}${plt.unit || " ×10⁹/L"} — below the severe-thrombocytopenia threshold`,
    };
  },
  (values) => {
    const exam = block(values, "hema_exam");
    if (!has(exam.active_bleeding, "Present")) return null;
    return { key: "active_major_bleeding", evidence: `Active bleeding documented: ${str(exam.bleeding_site) || "site not recorded"}` };
  },
  (values) => {
    const emergency = block(values, "hema_emergency");
    if (!has(emergency.presentation, "Major haemorrhage on anticoagulation")) return null;
    return { key: "active_major_bleeding", evidence: `Emergency presentation: ${str(emergency.presentation)}` };
  },
  (values) => {
    const emergency = block(values, "hema_emergency");
    if (!has(emergency.presentation, "Severe thrombocytopenia with bleeding")) return null;
    return { key: "active_major_bleeding", evidence: `Emergency presentation: ${str(emergency.presentation)}` };
  },
  (values, rows) => {
    const blasts = labNumber(rows, "blasts");
    if (blasts && blasts.value > 0) {
      return { key: "suspected_acute_leukaemia", evidence: `Blasts on the differential: ${blasts.value}%` };
    }
    const film = block(values, "hema_film");
    if (has(film.wbc_morphology, "Blast cells present")) {
      return { key: "suspected_acute_leukaemia", evidence: "Film: blast cells present" };
    }
    if (has(film.wbc_morphology, "Leucoerythroblastic picture")) {
      return { key: "suspected_acute_leukaemia", evidence: "Film: leucoerythroblastic picture" };
    }
    return null;
  },
  (values, rows, t) => {
    const neut = labNumber(rows, "neut");
    const fever = block(values, "hema_presentation").fever;
    const febrile = has(fever, "Documented fever ≥38 °C") || has(fever, "Febrile neutropenia") || has(fever, "Severe or unusual infection");
    const emergency = has(block(values, "hema_emergency").presentation, "Febrile neutropenia") ||
      has(block(values, "hema_emergency").presentation, "Suspected neutropenic sepsis");
    if (!neut || neut.value >= t.febrile_neutropenia_anc) {
      if (emergency) return { key: "febrile_neutropenia", evidence: "Emergency presentation: febrile neutropenia / suspected neutropenic sepsis" };
      return null;
    }
    // Neutropenia without a recorded fever raises no prompt of its own: fever is
    // what makes it an emergency, and a document-only prompt here would name the
    // wrong problem. The count is already visible in the recorded results.
    if (!febrile && !emergency) return null;
    return {
      key: "febrile_neutropenia",
      evidence: `Neutrophils ${neut.value}${neut.unit || " ×10⁹/L"} with fever documented (${str(fever)})`,
    };
  },
  (values) => {
    const exam = block(values, "hema_exam");
    if (!has(exam.thrombosis_signs, "Present")) return null;
    const findings = Array.isArray(exam.thrombosis_findings) ? exam.thrombosis_findings.join("; ") : "";
    return { key: "acute_thromboembolism", evidence: `Signs of thrombosis documented${findings ? `: ${findings}` : ""}` };
  },
  (values) => {
    const emergency = block(values, "hema_emergency");
    if (!has(emergency.presentation, "Hyperviscosity") && !has(emergency.presentation, "Hyperleucocytosis")) return null;
    return { key: "acute_thromboembolism", evidence: `Emergency presentation: ${str(emergency.presentation)}` };
  },
  (values, rows, t) => {
    const hapto = labNumber(rows, "haptoglobin");
    const ldh = labNumber(rows, "ldh");
    const emergency = block(values, "hema_emergency").presentation;
    const tma = has(emergency, "Suspected thrombotic microangiopathy") || has(emergency, "Severe autoimmune haemolysis");
    if (tma) return { key: "severe_haemolysis", evidence: `Emergency presentation: ${str(emergency)}` };
    const lowHapto = hapto && hapto.value < t.haemolysis_haptoglobin;
    const highLdh = ldh && ldh.value > 250;
    if (!lowHapto && !highLdh) return null;
    return {
      key: "severe_haemolysis",
      evidence: [
        hapto ? describe(hapto, "Haptoglobin", "g/L") : "Haptoglobin not recorded",
        ldh ? describe(ldh, "LDH", "U/L") : "LDH not recorded",
      ].join("; "),
    };
  },
  (values) => {
    const emergency = block(values, "hema_emergency");
    if (!has(emergency.presentation, "Sickle cell acute chest syndrome")) return null;
    return { key: "sickle_emergency", evidence: `Emergency presentation: ${str(emergency.presentation)}` };
  },
  (values) => {
    const emergency = block(values, "hema_emergency");
    if (!has(emergency.presentation, "Disseminated intravascular coagulation")) return null;
    return { key: "suspected_dic", evidence: `Emergency presentation: ${str(emergency.presentation)}` };
  },
  (values, rows) => {
    const plt = labNumber(rows, "plt");
    const inr = labNumber(rows, "inr");
    const fibrinogen = labNumber(rows, "fibrinogen");
    const ddimer = labNumber(rows, "ddimer");
    const abnormal = [plt && plt.value < 100, inr && inr.value > 1.5, fibrinogen && fibrinogen.value < 1.5, ddimer && ddimer.value > 0.5].filter(Boolean).length;
    if (abnormal < 2) return null;
    return {
      key: "suspected_dic",
      evidence: [
        plt ? describe(plt, "Platelets", "×10⁹/L") : "",
        inr ? describe(inr, "INR", "") : "",
        fibrinogen ? describe(fibrinogen, "Fibrinogen", "g/L") : "",
        ddimer ? describe(ddimer, "D-dimer", "mg/L FEU") : "",
      ]
        .filter(Boolean)
        .join("; "),
    };
  },
  (values) => {
    const assessment = block(values, "hema_transfusion_assessment");
    const reaction = str(assessment.reaction);
    if (!reaction || /^(none observed|not documented|)$/i.test(reaction)) return null;
    return {
      key: "acute_transfusion_reaction",
      evidence: `Reaction documented: ${reaction}${str(assessment.reaction_onset) ? ` — onset ${str(assessment.reaction_onset)}` : ""}`,
    };
  },
];

export function buildHemaSafetyPrompts({ concerns = [], values = {}, thresholds } = {}) {
  const t = mergeThresholds(thresholds);
  const rows = labRows(values);
  const map = new Map();
  const push = (prompt, evidence) => {
    if (!prompt) return;
    const existing = map.get(prompt.key);
    if (existing) {
      if (evidence && !existing.evidence.includes(evidence)) existing.evidence.push(evidence);
      return;
    }
    map.set(prompt.key, { ...prompt, evidence: evidence ? [evidence] : [] });
  };

  (concerns || []).forEach((key) => push(basePrompt(key), "Selected as a concern in this encounter"));
  RULES.forEach((rule) => {
    const found = rule(values || {}, rows, t);
    if (!found) return;
    push(basePrompt(found.key, { level: found.level, title: found.title }), found.evidence);
  });

  return [...map.values()].sort((a, b) => (LEVEL_ORDER[a.level] ?? 9) - (LEVEL_ORDER[b.level] ?? 9));
}

// ---------------------------------------------------------------------------
// Stored record
// ---------------------------------------------------------------------------
export const HEMA_SAFETY_LEVEL_LABEL = { immediate: "Act now", same_day: "Same day", documented: "Document" };

export const HEMA_SAFETY_CONFIRMATION = [
  "Reviewed — no change to the documented plan",
  "Reviewed — plan modified, documented in management",
  "Reviewed — patient escalated",
  "Not yet reviewed",
];

export const formatHemaSafety = (value) => {
  if (!value || typeof value !== "object") return "";
  const stored = Array.isArray(value.resolved) ? value.resolved : [];
  const actions = value.actions || {};
  const reasons = value.not_applicable || {};
  const overrides = value.thresholds || {};
  const lines = [];

  const custom = Object.entries(overrides).filter(([, v]) => str(v) !== "");
  if (custom.length) {
    lines.push(
      `Thresholds in use in this encounter: ${custom
        .map(([k, v]) => `${k} = ${v}`)
        .join("; ")}`
    );
  }

  if (stored.length === 0 && !str(value.other_concern)) {
    lines.push(
      "No haematology safety prompt was triggered by the findings and results recorded in this note — this is not a statement that no urgent problem exists."
    );
  } else {
    lines.push(`Haematology safety prompts recorded in this note (${stored.length}):`);
    stored.forEach((p) => {
      const action = str(actions[p.key]);
      const reason = str(reasons[p.key]);
      lines.push(`[${(HEMA_SAFETY_LEVEL_LABEL[p.level] || "DOCUMENT").toUpperCase()}] ${p.title}`);
      if (p.evidence && p.evidence.length) lines.push(`   Documented: ${p.evidence.join("; ")}`);
      lines.push(`   Basis: ${p.basis}`);
      if (p.source) lines.push(`   Source: ${p.source.organization} — ${p.source.title}, ${p.source.edition} (${p.source.url})`);
      if (p.provenanceLabel) lines.push(`   Rule type: ${p.provenanceLabel}`);
      lines.push(`   Action taken: ${action || (reason ? `Not applicable — ${reason}` : "NOT DOCUMENTED")}`);
    });
  }

  if (str(value.other_concern)) lines.push(`Other safety concern: ${str(value.other_concern)}`);
  if (str(value.escalation)) lines.push(`Escalation and documented action: ${str(value.escalation)}`);
  if (str(value.clinician_review)) lines.push(`Clinician review: ${str(value.clinician_review)}`);
  lines.push(
    "Clinical judgement remains with the treating clinician. These prompts do not diagnose, prescribe, order blood or change treatment."
  );
  return lines.join("\n");
};

export const HEMA_SAFETY_PROMPT_COUNT = Object.keys(SPECS).length;