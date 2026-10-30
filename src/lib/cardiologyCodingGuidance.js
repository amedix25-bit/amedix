// Cardiology ICD-11 coding guidance, diagnosis-status semantics and a
// consistency audit for the coded diagnoses of one note.
//
// HONESTY CONTRACT — what this module does and does NOT assert:
//  * It never adds a code. Codes come from src/lib/cardiologyIcd11.js, which was
//    read from the WHO ICD-11 MMS tabulation, or from the clinician typing a code
//    from the WHO browser (stored as REVIEW REQUIRED).
//  * It does not reproduce WHO's inclusion and exclusion wording. Those notes are
//    not stored here, and inventing them would be worse than omitting them, so
//    every entry states that the inclusions and exclusions shown in the WHO
//    browser are the authority and must be confirmed there.
//  * What it does add are coding RULES that follow from the structure of the
//    tabulation itself (which entry is chronic, which two subcategories describe
//    one event, which categories are coded in addition to another). Each is
//    marked as an AMedix coding rule, not as WHO text.
//  * Postcoordination axes are described structurally: ICD-11 MMS carries detail
//    the stem code cannot, and that detail belongs in the note's structured
//    fields. No postcoordinated cluster is ever generated automatically.

export const CODING_GUIDANCE_STATE = {
  RULE: "amdex_coding_rule",
  NOT_RECORDED: "not_recorded",
};

export const CODING_GUIDANCE_STATE_LABEL = {
  amdex_coding_rule:
    "AMedix coding rule — WHO inclusion and exclusion wording is confirmed in the WHO browser, not transcribed here",
  not_recorded:
    "No AMedix coding rule recorded for this entry — read the inclusions and exclusions in the WHO browser before relying on it",
};

const CONFIRM =
  "Confirm the inclusions, exclusions and coding notes shown for this category in the WHO ICD-11 browser before relying on it, especially for a residual (…Y / …Z) code.";

const POSTCOORDINATION =
  "ICD-11 MMS carries detail the stem code cannot (anatomical site, causative agent, temporal qualifier) through postcoordination. Record that detail in this note's structured fields; postcoordinate in the WHO coding tool only when the code is submitted for statistical use. No cluster is generated automatically.";

// Coding rules keyed by code, or by stem for every subcategory beneath it.
const RULES = {
  BA41: {
    exclusions: ["Old myocardial infarction (BA50) — a previous event, not the acute one"],
    coding_note:
      "Codes the acute event. A previous infarction is recorded as Old myocardial infarction (BA50); a new infarction after an index event as Subsequent myocardial infarction (BA42), with the index event documented separately.",
    postcoordination: [POSTCOORDINATION],
  },
  "BA41.0": {
    exclusions: ["Non-ST elevation myocardial infarction (BA41.1) — the same event is not recorded under both"],
    coding_note:
      "ST-elevation and non-ST elevation myocardial infarction describe one event. Record the single category that matches the ECG and biomarker picture, and record the culprit vessel and territory in the structured fields rather than as an invented code.",
    postcoordination: [POSTCOORDINATION],
  },
  "BA41.1": {
    exclusions: ["ST elevation myocardial infarction (BA41.0) — the same event is not recorded under both"],
    coding_note:
      "Record one category per event. A type 2 infarction or myocardial injury from another cause is documented in the note and is not silently mapped to this code.",
    postcoordination: [POSTCOORDINATION],
  },
  BA42: {
    coding_note:
      "Reinfarction after an index event. Document the index event and its date in the note so the two events are distinguishable.",
  },
  BA50: {
    coding_note:
      "Chronic entry describing a previous infarction. Record it as Historical unless the current encounter is an acute coronary syndrome, which is coded in BA41.",
  },
  BA00: {
    exclusions: [
      "Hypertensive heart disease (BA01), hypertensive renal disease (BA02) and hypertensive crisis (BA03) are separate categories, coded in addition when documented",
    ],
    coding_note:
      "Essential hypertension does not by itself describe organ damage. Document the organ involvement found and code the corresponding hypertensive category alongside it.",
  },
  BA03: {
    coding_note:
      "Hypertensive crisis describes acute target-organ involvement. Severe blood-pressure elevation without acute organ damage is documented as such and is not coded here.",
  },
  BD11: {
    coding_note:
      "The ejection-fraction subcategories are mutually exclusive for one assessment: use the one that matches the documented LVEF, and record the measurement itself in the echocardiography fields.",
    postcoordination: [POSTCOORDINATION],
  },
  "BD11.0": {
    coding_note: "Use for the admission where the documented LVEF is in the preserved range; re-code if the assessment changes.",
  },
  "BD11.1": {
    coding_note: "Use for the admission where the documented LVEF is in the mid-range band.",
  },
  "BD11.2": {
    coding_note:
      "Use where the documented LVEF is reduced. The four treatment pillars are recorded in the management fields, not inferred from the code.",
  },
  BC81: {
    coding_note:
      "Atrial fibrillation (BC81.3) is the category used in cardiology notes. The AF pattern — paroxysmal, persistent or permanent — is recorded in the note's rhythm fields; it is not a tabulation subcategory, so no code is invented for it.",
  },
  "BC81.3": {
    coding_note:
      "Document the pattern, the thromboembolic risk score and the anticoagulation decision in the note's own fields. Do not encode severity by choosing an unrelated code.",
  },
  BC71: {
    coding_note:
      "Distinguish ventricular tachycardia (BC71.0) from ventricular fibrillation (BC71.1). When a cardiac arrest occurred, record Cardiac arrest (MC82) in addition.",
  },
  "BC71.1": {
    coding_note: "Ventricular fibrillation is coded together with Cardiac arrest (MC82) where an arrest occurred.",
  },
  MC82: {
    coding_note:
      "Codes the arrest itself and is recorded in addition to the underlying rhythm or ischaemic category, never instead of it.",
  },
  BC63: {
    coding_note:
      "Conduction disorders are coded by degree or by bundle. Record the ECG finding in the ECG fields; a first-degree block and a complete block are different categories and are not interchangeable.",
  },
  BC01: {
    coding_note:
      "Prosthetic valve disease. Record the valve, the prosthesis type, the dysfunction mechanism and the anticoagulation plan in the structured fields.",
  },
  BB40: {
    coding_note:
      "Infective endocarditis. Record the organism, the valve involved and the cultures taken in the note; the causative agent is a postcoordination axis and is never guessed into the code.",
    postcoordination: [POSTCOORDINATION],
  },
  BB00: {
    coding_note:
      "Pulmonary thromboembolism. Record the diagnostic pathway and the anticoagulation decision; a deep vein thrombosis documented as the source is coded separately (BD71).",
  },
  BD50: {
    coding_note: "Aortic aneurysm or dissection. Record the segment, the type and the management decision in the note.",
    postcoordination: [POSTCOORDINATION],
  },
};

const guidanceFor = (code) => {
  if (!code) return null;
  if (RULES[code]) return RULES[code];
  const stem = code.split(".")[0];
  return RULES[stem] || null;
};

// Adds the coding guidance to each catalogue entry and folds it into the text
// the note already stores (`definition` and `coding_note`), so the saved record
// and its PDF carry the instruction without any change to the field component.
export const withCodingGuidance = (catalog = []) =>
  catalog.map((item) => {
    const rule = guidanceFor(item.code);
    const inclusions = rule?.inclusions || [];
    const exclusions = rule?.exclusions || [];
    const postcoordination = rule?.postcoordination || [];

    const lines = [
      item.definition,
      inclusions.length ? `Inclusions recorded: ${inclusions.join("; ")}.` : "",
      exclusions.length ? `Exclusions recorded: ${exclusions.join("; ")}.` : "",
      rule?.coding_note ? `Coding instruction: ${rule.coding_note}` : "",
      postcoordination.length ? `Postcoordination: ${postcoordination.join(" ")}` : "",
      CONFIRM,
    ].filter(Boolean);

    return {
      ...item,
      coding_guidance: {
        state: rule ? CODING_GUIDANCE_STATE.RULE : CODING_GUIDANCE_STATE.NOT_RECORDED,
        inclusions,
        exclusions,
        coding_note: rule?.coding_note || "",
        postcoordination,
        confirm_in_browser: CONFIRM,
      },
      definition: lines.join(" "),
      coding_note:
        [item.primary === false ? "WHO carries this as a NON-primary tabulation entry — document it together with the underlying condition, never instead of it." : "", rule?.coding_note || ""]
          .filter(Boolean)
          .join(" ") || item.coding_note || "",
    };
  });

// ---- Diagnosis-status semantics -------------------------------------------
// A code is never a diagnosis. The clinician's own status decides what the
// record means, and the differences are enforced, not decorative.
export const DIAGNOSIS_STATUS_MEANING = {
  Confirmed: "Confirmed by the clinician for this encounter — requires a documented basis.",
  Suspected: "Suspected, not confirmed — must not be read as an active confirmed problem.",
  Provisional: "Working diagnosis pending confirmation — requires the outstanding workup to be documented.",
  Differential: "Considered as a differential — explicitly NOT established.",
  Historical: "A past condition, not the reason for this encounter.",
  Resolved: "Resolved — no longer active; requires the basis for resolution.",
  "In remission": "In remission — inactive but monitored; requires the basis.",
};

const REQUIRES_BASIS = ["Confirmed", "Resolved", "In remission"];
const NOT_CONFIRMED = ["Suspected", "Provisional", "Differential"];
const ACUTE_CODES = ["BA41", "BA42", "BA4Z", "MC82", "BB40", "BA03"];

const isAcuteCode = (code) => ACUTE_CODES.some((c) => String(code || "").startsWith(c));

// Consistency audit for the coded diagnoses of one note. It reports; it never
// rewrites a clinician's entry and never removes a code.
export const auditCodedDiagnoses = (entries = []) => {
  const list = Array.isArray(entries) ? entries.filter(Boolean) : [];
  const issues = [];
  const push = (level, code, message) => issues.push({ level, code, message });
  const codes = list.map((e) => String(e.code || ""));
  const has = (prefix) => codes.some((c) => c.startsWith(prefix));

  list.forEach((e) => {
    const code = String(e.code || "");
    const status = e.status || "";
    const role = e.role || "";

    if (e.mapping_state === "unresolved" && code) {
      push("error", code, "An unresolved diagnosis must not carry a code — clear the code or verify it.");
    }
    if (e.mapping_state === "verified" && !String(e.verified_date || "").trim()) {
      push("warning", code || e.display, "Verified entry has no verification date — the release it was checked against is not recorded.");
    }
    if (REQUIRES_BASIS.includes(status) && !String(e.basis || "").trim()) {
      push("error", code || e.display, `A ${status.toLowerCase()} diagnosis needs the clinical basis documented before it is signed.`);
    }
    if (role === "Differential" && status === "Confirmed") {
      push("error", code || e.display, "A differential diagnosis cannot also be recorded as confirmed — choose one.");
    }
    if (NOT_CONFIRMED.includes(status) && e.clinician_confirmed) {
      push("error", code || e.display, `${status} contradicts the recorded clinician confirmation.`);
    }
    if (status === "Historical" && isAcuteCode(code)) {
      push("warning", code, "This is an acute category recorded as historical — a past event is coded in its chronic entry (for example Old myocardial infarction, BA50).");
    }
    if (status === "Suspected" && isAcuteCode(code)) {
      push("note", code, "An acute category recorded as suspected: state whether treatment was started on the working diagnosis.");
    }
    if (e.primary === false && list.length === 1) {
      push("warning", code, "A non-primary tabulation entry is the only diagnosis on this note — document the underlying condition it belongs to.");
    }
    if (String(e.coding_note || "").includes("NON-primary") && !list.some((o) => o !== e && o.primary !== false)) {
      push("warning", code, "A non-primary entry must be recorded together with the underlying condition.");
    }
  });

  if (has("BA41.0") && has("BA41.1")) {
    push("error", "BA41.0 / BA41.1", "ST-elevation and non-ST elevation infarction both recorded: a single event is coded once. If there were two separate events, document each with its date.");
  }
  if (has("BA42") && !has("BA41") && !has("BA50")) {
    push("warning", "BA42", "Subsequent myocardial infarction recorded without the index infarction — document and code the index event as well.");
  }
  if (has("BA41") && !has("BA50") && list.some((e) => e.status === "Historical")) {
    push("note", "BA50", "An acute infarction with a historical cardiac diagnosis: record a previous infarction as Old myocardial infarction (BA50) so the two events stay distinct.");
  }

  const seen = new Map();
  list.forEach((e) => {
    const key = `${String(e.code || e.display)}|${e.role || ""}`;
    if (seen.has(key)) push("warning", e.code || e.display, "The same code is recorded twice with the same role.");
    seen.set(key, true);
  });

  return issues;
};

// Confirmation is a clinician act. Nothing here ever sets it automatically.
export const isConfirmedDiagnosis = (entry) =>
  Boolean(entry) &&
  entry.status === "Confirmed" &&
  entry.clinician_confirmed === true &&
  entry.role !== "Differential";