// Structured neurosurgical neurological examination.
//
// WHY THIS EXISTS SEPARATELY FROM THE SHARED EXAMINATION
//   The shared neurological examination records the standard system findings in
//   free text. Neurosurgery needs the same examination recorded in a form that
//   can be compared between observations, handed over, and used by the decision
//   support: the conscious level and its trend, orientation, each pupil with its
//   size and reactivity, the cranial nerves, MRC power per limb, sensory level
//   and modality, reflexes with plantar responses and clonus, coordination and
//   cerebellar signs, gait, meningeal signs, and the spinal column with its
//   dermatomal and myotomal level.
//
// RULES
//   - Nothing is inferred. A component that was not examined stays "Not
//     documented" and is never printed as normal.
//   - The app does not grade severity from these fields. It records what was
//     examined; the interpretation belongs to the clinician.
//   - MRC grades are recorded as examined, with the scale definition beside
//     each grade so a grade 4 can never be read against a different scale.

const NOT = "Not documented";

export const NSG_CONSCIOUSNESS = [
  "Alert",
  "Drowsy — rousable",
  "Responds to voice",
  "Responds to pain",
  "Unresponsive",
  "Sedated or paralysed — unable to assess",
];

export const NSG_ORIENTATION = [
  "Oriented — person, place and time",
  "Not oriented to time only",
  "Not oriented to place",
  "Not oriented to person",
  "Not oriented to more than one domain",
  "Unable to assess",
];

export const NSG_PUPIL_SIZE = ["1 mm", "2 mm", "3 mm", "4 mm", "5 mm", "6 mm", "7 mm", "8 mm", "9 mm", NOT];

export const NSG_PUPIL_REACTIVITY = ["Brisk", "Sluggish", "Fixed", "Unable to assess", NOT];

export const NSG_MRC = [
  "5 — Normal power",
  "4 — Movement against resistance",
  "3 — Movement against gravity only",
  "2 — Movement with gravity eliminated",
  "1 — Flicker only",
  "0 — No contraction",
  "Unable to assess",
];

export const NSG_REFLEX = [
  "2+ — Normal, symmetrical",
  "3+ — Brisk, symmetrical",
  "1+ — Reduced, symmetrical",
  "Absent",
  "Asymmetrical — right brisker",
  "Asymmetrical — left brisker",
  "Unable to assess",
  NOT,
];

export const NSG_PLANTAR = [
  "Flexor — both",
  "Extensor — right",
  "Extensor — left",
  "Extensor — bilateral",
  "Unable to assess",
  NOT,
];

export const NSG_CLONUS = ["Absent", "Sustained — right", "Sustained — left", "Sustained — bilateral", "Unable to assess", NOT];

export const NSG_GAIT = [
  "Normal",
  "Antalgic",
  "Hemiparetic",
  "Spastic",
  "Ataxic / wide-based",
  "Steppage",
  "Unable to walk",
  "Not assessed",
];

export const NSG_COORDINATION = ["Normal", "Impaired — right", "Impaired — left", "Impaired — bilateral", "Unable to assess", NOT];

export const NSG_MENINGEAL = ["Absent", "Present", "Unable to assess", NOT];

export const NSG_CN_STATUS = ["No abnormality documented", "Abnormality documented below", "Unable to assess"];

export const NSG_SENSORY_SIDE = ["Right", "Left", "Bilateral", "Not lateralised", NOT];

export const NSG_SPINE_TENDERNESS = ["None", "Cervical", "Thoracic", "Lumbar", "Multiple levels", "Unable to assess", NOT];

const mm = (v) => {
  const n = parseInt(String(v || "").replace(/[^0-9]/g, ""), 10);
  return Number.isFinite(n) ? n : null;
};

const filled = (v) => String(v ?? "").trim() !== "" && !/^Not documented$/i.test(String(v ?? "").trim());

// Findings that change urgency, read from the structured examination only.
// They feed the conditional decision support — they never grade or diagnose.
export const nsgExamFlags = (exam) => {
  const e = exam && typeof exam === "object" && !Array.isArray(exam) ? exam : {};
  const p = e.pupils || {};
  const rightSize = mm(p.right_size);
  const leftSize = mm(p.left_size);
  const fixed = p.right_reactivity === "Fixed" || p.left_reactivity === "Fixed";
  const asymmetry = rightSize !== null && leftSize !== null && Math.abs(rightSize - leftSize) >= 1;
  const m = e.motor || {};
  const weakness = ["right_arm", "left_arm", "right_leg", "left_leg"]
    .map((k) => String(m[k] || ""))
    .filter((v) => /^[0-3]\b/.test(v));
  return {
    fixed_pupil: fixed,
    pupil_asymmetry: asymmetry,
    extensor_plantar: /Extensor/.test(String(e.reflexes?.plantar || "")),
    clonus: /Sustained/.test(String(e.reflexes?.clonus || "")),
    meningism:
      e.meningeal?.neck === "Present" || e.meningeal?.kernig === "Present" || e.meningeal?.brudzinski === "Present",
    cranial_nerve_deficit: e.cranial_nerves?.status === "Abnormality documented below",
    weakness_recorded: weakness.length > 0,
    unassessable: e.consciousness === "Sedated or paralysed — unable to assess",
  };
};

// The examination as it is written into the saved note, the record and the PDF.
export const formatNeurosurgicalExam = (value) => {
  if (!value || typeof value !== "object" || Array.isArray(value)) return String(value || "");
  const e = value;
  const lines = [];

  const push = (label, v) => {
    if (filled(v)) lines.push(`${label}: ${v}`);
  };

  push("Conscious level", e.consciousness);
  push("Orientation", e.orientation);

  const p = e.pupils || {};
  const pupilParts = [];
  if (filled(p.right_size) || filled(p.right_reactivity)) {
    pupilParts.push(`right ${filled(p.right_size) ? p.right_size : "size not documented"}${
      filled(p.right_reactivity) ? `, ${p.right_reactivity.toLowerCase()}` : ", reactivity not documented"
    }`);
  }
  if (filled(p.left_size) || filled(p.left_reactivity)) {
    pupilParts.push(`left ${filled(p.left_size) ? p.left_size : "size not documented"}${
      filled(p.left_reactivity) ? `, ${p.left_reactivity.toLowerCase()}` : ", reactivity not documented"
    }`);
  }
  if (pupilParts.length) {
    const r = mm(p.right_size);
    const l = mm(p.left_size);
    const diff = r !== null && l !== null ? Math.abs(r - l) : null;
    lines.push(
      `Pupils: ${pupilParts.join("; ")}${diff !== null && diff >= 1 ? ` — asymmetry of ${diff} mm recorded` : ""}`
    );
  }

  const cn = e.cranial_nerves || {};
  if (filled(cn.status)) {
    lines.push(
      `Cranial nerves: ${cn.status}${filled(cn.detail) ? ` — ${String(cn.detail).trim()}` : ""}`
    );
  } else if (filled(cn.detail)) {
    lines.push(`Cranial nerves: ${String(cn.detail).trim()}`);
  }

  const m = e.motor || {};
  const motorParts = [
    ["right arm", m.right_arm],
    ["left arm", m.left_arm],
    ["right leg", m.right_leg],
    ["left leg", m.left_leg],
  ]
    .filter(([, v]) => filled(v))
    .map(([k, v]) => `${k} MRC ${String(v).trim()}`);
  if (motorParts.length || filled(m.other)) {
    lines.push(`Motor: ${motorParts.join("; ") || "limb power not documented"}${filled(m.other) ? ` — ${String(m.other).trim()}` : ""}`);
  }

  const s = e.sensory || {};
  const sensoryBits = [
    filled(s.level) ? `level ${String(s.level).trim()}` : "",
    filled(s.modality) ? String(s.modality).trim() : "",
    filled(s.side) ? String(s.side).trim() : "",
  ].filter(Boolean);
  if (sensoryBits.length || filled(s.detail)) {
    lines.push(`Sensory: ${sensoryBits.join(" · ") || "distribution not documented"}${filled(s.detail) ? ` — ${String(s.detail).trim()}` : ""}`);
  }

  const r = e.reflexes || {};
  const reflexParts = [
    ["biceps", r.biceps],
    ["supinator", r.supinator],
    ["triceps", r.triceps],
    ["knee", r.knee],
    ["ankle", r.ankle],
  ]
    .filter(([, v]) => filled(v))
    .map(([k, v]) => `${k} ${String(v).trim()}`);
  if (reflexParts.length || filled(r.plantar) || filled(r.clonus)) {
    lines.push(
      `Reflexes: ${reflexParts.join("; ") || "deep tendon reflexes not documented"}${
        filled(r.plantar) ? ` · plantar ${String(r.plantar).trim().toLowerCase()}` : ""
      }${filled(r.clonus) ? ` · clonus ${String(r.clonus).trim().toLowerCase()}` : ""}`
    );
  }

  const c = e.coordination || {};
  if (filled(c.finding) || filled(c.detail)) {
    lines.push(
      `Coordination and cerebellar signs: ${filled(c.finding) ? c.finding : "not documented"}${
        filled(c.detail) ? ` — ${String(c.detail).trim()}` : ""
      }`
    );
  }

  push("Gait", e.gait);

  const men = e.meningeal || {};
  const menParts = [
    ["neck stiffness", men.neck],
    ["Kernig", men.kernig],
    ["Brudzinski", men.brudzinski],
  ]
    .filter(([, v]) => filled(v))
    .map(([k, v]) => `${k} ${String(v).trim().toLowerCase()}`);
  if (menParts.length) lines.push(`Meningeal signs: ${menParts.join("; ")}`);

  const sp = e.spine || {};
  const spineBits = [
    filled(sp.tenderness) ? `tenderness ${String(sp.tenderness).trim().toLowerCase()}` : "",
    filled(sp.deformity) ? `deformity: ${String(sp.deformity).trim()}` : "",
  ].filter(Boolean);
  if (spineBits.length || filled(sp.detail)) {
    lines.push(`Spine: ${spineBits.join("; ") || "column findings as below"}${filled(sp.detail) ? ` — ${String(sp.detail).trim()}` : ""}`);
  }
  push("Dermatomal level", sp.dermatome);
  push("Myotomal level", sp.myotome);

  if (!lines.length) return "Neurological examination not documented in this note.";
  return lines.join("\n");
};